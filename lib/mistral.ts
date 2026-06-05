// Multi-provider AI integration. Supports:
//   - Groq      (free tier, fastest, llama-3.3-70b) — DEFAULT
//   - OpenAI    (gpt-4o-mini)
//   - Anthropic (claude-3-5-sonnet / haiku)
//   - Mistral   (mistral-large-latest) — kept for back-compat
// Switch with AI_PROVIDER env var: "groq" | "openai" | "anthropic" | "mistral".
// Falls back to curated templates on any failure.

import type { AppConfig } from './config/types';
import { parseConfig, ensureCompleteApp } from './config/parser';
import { findTemplate, TEMPLATES } from './config/templates';

const SYSTEM_PROMPT = `You are an AI that designs app configurations in JSON for a metadata-driven app runtime.
Output ONLY a single JSON object — no prose, no markdown fences, no comments.

The runtime supports these shapes EXACTLY:

{
  "name": "string",
  "description": "string",
  "theme": { "primary": "#hex", "accent": "#hex", "logoText": "string" },
  "entities": [
    {
      "name": "Customer",
      "label": "Customer",
      "labelPlural": "Customers",
      "fields": [
        { "name": "name", "type": "string", "label": "Name", "required": true, "showInList": true, "searchable": true },
        { "name": "email", "type": "email", "label": "Email" },
        { "name": "status", "type": "select", "label": "Status", "options": [
          { "value": "active", "label": "Active" },
          { "value": "inactive", "label": "Inactive" }
        ]}
      ]
    }
  ],
  "pages": [
    { "id": "home", "route": "/", "title": "Home", "root": { "kind": "hero", "props": { "title": "...", "subtitle": "..." } } },
    { "id": "list", "route": "/things", "title": "Things", "entity": "Thing", "root": { "kind": "table", "props": { "entity": "Thing" } } },
    { "id": "new", "route": "/things/new", "title": "New thing", "entity": "Thing", "root": { "kind": "form", "props": { "entity": "Thing", "mode": "create", "successRoute": "/things" } } }
  ]
}

HARD RULES (the runtime will break if you don't follow them):
1. Every page's "root.kind" MUST be one of: hero, heading, text, stats, table, form, chart, card, button, list, iframe, divider, spacer.
2. Every page's "root.props.entity" (if it has one) MUST exactly match an "entities[].name".
3. ALWAYS include: a home page on "/", a table page for every main entity, and a form page for every main entity. The app will be unusable otherwise.
4. ALWAYS include 2-3 stats items on the home page (or its own stats page) with valid "source.entity" matching an entity.
5. Field "type" MUST be one of: string, text, number, boolean, date, datetime, email, select, multiselect, relation, json.
6. Use "select" with an "options" array (each option has "value" and "label").
7. Keep apps focused: 2-3 entities, 4-6 pages. The user wants a real, working app — not a landing page.

For a habit tracker specifically:
- Entity "Habit" with fields: name (string, required), description (text), icon (string), frequency (select: daily/weekly/weekdays), streak (number), bestStreak (number), lastCompleted (date), color (string).
- Entity "Entry" with fields: habit (relation to Habit), date (date, required), completed (boolean), note (text).
- Pages: "/" (hero + stats), "/habits" (table), "/habits/new" (form), "/entries" (table), "/entries/new" (form), "/progress" (chart).`;

// Heuristic to pick a template if no AI is configured or the call fails.
function fallbackForPrompt(prompt: string): AppConfig {
  const p = prompt.toLowerCase();
  if (p.includes('habit')) return TEMPLATES.find((t) => t.id === 'habit-tracker')!.config;
  if (p.includes('crm') || p.includes('customer') || p.includes('deal')) return TEMPLATES.find((t) => t.id === 'crm')!.config;
  if (p.includes('invent') || p.includes('stock') || p.includes('product') || p.includes('warehouse')) return TEMPLATES.find((t) => t.id === 'inventory')!.config;
  if (p.includes('task') || p.includes('todo') || p.includes('project')) return TEMPLATES.find((t) => t.id === 'tasks')!.config;
  if (p.includes('book') || p.includes('recipe') || p.includes('movie') || p.includes('collection')) return TEMPLATES.find((t) => t.id === 'library')!.config;
  if (p.includes('expense') || p.includes('budget') || p.includes('finance') || p.includes('money')) return TEMPLATES.find((t) => t.id === 'expenses')!.config;
  return TEMPLATES.find((t) => t.id === 'blank')!.config;
}

function extractJson(content: unknown): unknown | null {
  if (typeof content === 'string') {
    const trimmed = content.trim();
    try { return JSON.parse(trimmed); } catch {}
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
  return content ?? null;
}

// Provider-specific config
type Provider = 'groq' | 'openai' | 'anthropic' | 'mistral';

function getProvider(): Provider {
  const p = (process.env.AI_PROVIDER ?? 'groq').toLowerCase();
  if (p === 'groq' || p === 'openai' || p === 'anthropic' || p === 'mistral') return p;
  return 'groq';
}

function getApiKey(provider: Provider): string | undefined {
  switch (provider) {
    case 'groq': return process.env.GROQ_API_KEY || process.env.MISTRAL_API_KEY;
    case 'openai': return process.env.OPENAI_API_KEY;
    case 'anthropic': return process.env.ANTHROPIC_API_KEY;
    case 'mistral': return process.env.MISTRAL_API_KEY;
  }
}

async function callProvider(provider: Provider, apiKey: string, prompt: string): Promise<unknown | null> {
  if (provider === 'groq') {
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Build an app for: ${prompt}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      console.error('[groq] HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json: any = await res.json();
    return extractJson(json.choices?.[0]?.message?.content);
  }

  if (provider === 'openai') {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Build an app for: ${prompt}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      console.error('[openai] HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json: any = await res.json();
    return extractJson(json.choices?.[0]?.message?.content);
  }

  if (provider === 'anthropic') {
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Build an app for: ${prompt}\n\nReturn ONLY a JSON object. No prose, no markdown fences.` }],
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      console.error('[anthropic] HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json: any = await res.json();
    const text = json.content?.[0]?.text ?? '';
    return extractJson(text);
  }

  if (provider === 'mistral') {
    const model = process.env.MISTRAL_MODEL || 'mistral-large-latest';
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Build an app for: ${prompt}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      console.error('[mistral] HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json: any = await res.json();
    return extractJson(json.choices?.[0]?.message?.content);
  }

  return null;
}

export async function generateConfigFromPrompt(prompt: string): Promise<AppConfig> {
  const provider = getProvider();
  const apiKey = getApiKey(provider);
  if (!apiKey) {
    console.warn(`[ai] no API key for provider ${provider}, using template fallback`);
    return ensureCompleteApp(parseConfig(fallbackForPrompt(prompt)));
  }
  try {
    const parsed = await callProvider(provider, apiKey, prompt);
    if (!parsed) {
      console.warn(`[ai] ${provider} returned unparseable output, using template fallback`);
      return ensureCompleteApp(parseConfig(fallbackForPrompt(prompt)));
    }
    const safe = parseConfig(parsed);
    // ALWAYS run the completeness pass — even if the AI returned something
    // that *looks* valid, we make sure every entity has list+form pages.
    return ensureCompleteApp(safe);
  } catch (e) {
    console.error(`[ai] ${provider} failed`, e);
    return ensureCompleteApp(parseConfig(fallbackForPrompt(prompt)));
  }
}

export { findTemplate, TEMPLATES };
