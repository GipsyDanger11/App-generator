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
import type { Logger } from './logger';
import type { Logger } from './logger';

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
    { "id": "home-stats", "route": "/", "title": "Home", "root": { "kind": "stats", "props": { "items": [{ "label": "Total customers", "source": { "entity": "Customer", "op": "count" } }] } } },
    { "id": "customers", "route": "/customers", "title": "Customers", "entity": "Customer", "root": { "kind": "table", "props": { "entity": "Customer", "pageSize": 20 } } },
    { "id": "customers-new", "route": "/customers/new", "title": "New Customer", "entity": "Customer", "root": { "kind": "form", "props": { "entity": "Customer", "mode": "create", "successRoute": "/customers" } } }
  ]
}

HARD RULES (the runtime will break if you don't follow them):
1. Every page root "kind" MUST be one of: hero, heading, text, stats, table, form, chart, card, button, list, iframe, divider, spacer.
2. Every page "root.props.entity" MUST exactly match an "entities[].name" (case-sensitive).
3. ALWAYS include ALL of these pages for a working app:
   - A home page on route "/" with kind "hero"
   - A stats page also on route "/" with kind "stats" showing entity counts
   - A table page for EVERY entity (e.g. route "/customers", kind "table")
   - A form page for EVERY entity (e.g. route "/customers/new", kind "form" with mode "create")
4. Stats items MUST have a "source" object with "entity" matching a real entity name and "op" of "count", "sum", or "avg".
5. Field "type" MUST be one of: string, text, number, boolean, date, datetime, email, select, multiselect, relation, json.
6. "select" fields MUST have an "options" array where each option has "value" and "label" strings.
7. Keep apps focused: 2-3 entities, 5-8 pages total. The user wants a REAL working CRUD app, not a landing page.
8. NEVER output only a hero page. ALWAYS include table and form pages for every entity.`;

// Heuristic to pick a template if no AI is configured or the call fails.
function fallbackForPrompt(prompt: string): AppConfig {
  const p = prompt.toLowerCase();
  if (p.includes('habit')) return TEMPLATES.find((t) => t.id === 'habit-tracker')!.config;
  if (p.includes('crm') || p.includes('customer') || p.includes('deal') || p.includes('sales'))
    return TEMPLATES.find((t) => t.id === 'crm')!.config;
  if (p.includes('invent') || p.includes('stock') || p.includes('product') || p.includes('warehouse'))
    return TEMPLATES.find((t) => t.id === 'inventory')!.config;
  if (p.includes('task') || p.includes('todo') || p.includes('project') || p.includes('management'))
    return TEMPLATES.find((t) => t.id === 'tasks')!.config;
  if (p.includes('book') || p.includes('recipe') || p.includes('movie') || p.includes('collection'))
    return TEMPLATES.find((t) => t.id === 'library')!.config;
  if (p.includes('expense') || p.includes('budget') || p.includes('finance') || p.includes('money'))
    return TEMPLATES.find((t) => t.id === 'expenses')!.config;
  // Generic fallback — use tasks template (most universally useful)
  return TEMPLATES.find((t) => t.id === 'tasks')!.config;
}

function extractJson(content: unknown): unknown | null {
  if (typeof content === 'string') {
    const trimmed = content.trim();
    // Strip markdown fences if present
    const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    try { return JSON.parse(stripped); } catch {}
    try { return JSON.parse(trimmed); } catch {}
    // Extract first {...} block
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
  return content ?? null;
}

/**
 * Validate that an AppConfig is actually useful — has entities and non-hero pages.
 * Returns true if the config looks like a real multi-page app.
 */
function isUsableConfig(cfg: AppConfig, logger?: Logger): boolean {
  // Log validation start with config structure
  logger?.info('validator', 'validation_start', {
    entityCount: cfg.entities.length,
    pageCount: cfg.pages.length,
    pageKinds: cfg.pages.map(p => p.root?.kind).filter(Boolean)
  });

  // Check for at least one entity
  if (cfg.entities.length === 0) {
    logger?.info('validator', 'validation_failed', {
      reason: 'No entities defined',
      entityCount: 0,
      pageCount: cfg.pages.length
    });
    return false;
  }

  // Check for at least one table page
  const tablePages = cfg.pages.filter((p) => p.root?.kind === 'table');
  const hasTable = tablePages.length > 0;
  
  if (!hasTable) {
    logger?.info('validator', 'validation_failed', {
      reason: 'No table pages found',
      entityCount: cfg.entities.length,
      pageCount: cfg.pages.length,
      tablePageCount: 0
    });
    return false;
  }

  // Check for at least one form page
  const formPages = cfg.pages.filter((p) => p.root?.kind === 'form');
  const hasForm = formPages.length > 0;
  
  if (!hasForm) {
    logger?.info('validator', 'validation_failed', {
      reason: 'No form pages found',
      entityCount: cfg.entities.length,
      pageCount: cfg.pages.length,
      tablePageCount: tablePages.length,
      formPageCount: 0
    });
    return false;
  }

  // Validation passed
  logger?.info('validator', 'validation_passed', {
    entityCount: cfg.entities.length,
    pageCount: cfg.pages.length,
    tablePageCount: tablePages.length,
    formPageCount: formPages.length,
    entities: cfg.entities.map(e => e.name)
  });

  return true;
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
    case 'groq': return process.env.GROQ_API_KEY;
    case 'openai': return process.env.OPENAI_API_KEY;
    case 'anthropic': return process.env.ANTHROPIC_API_KEY;
    case 'mistral': return process.env.MISTRAL_API_KEY;
  }
}

async function callGroq(apiKey: string, prompt: string): Promise<unknown | null> {
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Build a complete CRUD app for: ${prompt}\n\nRemember: include entities, a hero page, a stats page, a table page and a form page for EVERY entity. Return ONLY a JSON object.` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    console.error('[groq] HTTP', res.status, await res.text().catch(() => ''));
    return null;
  }
  const json: any = await res.json();
  return extractJson(json.choices?.[0]?.message?.content);
}

async function callMistral(apiKey: string, prompt: string): Promise<unknown | null> {
  const model = process.env.MISTRAL_MODEL || 'mistral-large-latest';
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Build a complete CRUD app for: ${prompt}\n\nRemember: include entities, a hero page, a stats page, a table page and a form page for EVERY entity. Return ONLY a JSON object.` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    console.error('[mistral] HTTP', res.status, await res.text().catch(() => ''));
    return null;
  }
  const json: any = await res.json();
  return extractJson(json.choices?.[0]?.message?.content);
}

async function callOpenAI(apiKey: string, prompt: string): Promise<unknown | null> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Build a complete CRUD app for: ${prompt}\n\nReturn ONLY a JSON object.` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    console.error('[openai] HTTP', res.status, await res.text().catch(() => ''));
    return null;
  }
  const json: any = await res.json();
  return extractJson(json.choices?.[0]?.message?.content);
}

async function callAnthropic(apiKey: string, prompt: string): Promise<unknown | null> {
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Build a complete CRUD app for: ${prompt}\n\nReturn ONLY a JSON object. No prose, no markdown fences.` }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    console.error('[anthropic] HTTP', res.status, await res.text().catch(() => ''));
    return null;
  }
  const json: any = await res.json();
  return extractJson(json.content?.[0]?.text ?? '');
}

async function tryProvider(provider: Provider, prompt: string, logger?: { info: (component: string, event: string, data?: Record<string, unknown>) => void }): Promise<AppConfig | null> {
  const apiKey = getApiKey(provider);
  if (!apiKey) return null;
  try {
    let raw: unknown | null = null;
    switch (provider) {
      case 'groq': raw = await callGroq(apiKey, prompt); break;
      case 'mistral': raw = await callMistral(apiKey, prompt); break;
      case 'openai': raw = await callOpenAI(apiKey, prompt); break;
      case 'anthropic': raw = await callAnthropic(apiKey, prompt); break;
    }
    if (!raw) return null;
    const cfg = ensureCompleteApp(parseConfig(raw));
    if (!isUsableConfig(cfg, logger)) {
      console.warn(`[ai] ${provider} returned a config without table/form pages — rejecting`);
      return null;
    }
    return cfg;
  } catch (e) {
    console.error(`[ai] ${provider} threw:`, e);
    return null;
  }
}

export async function generateConfigFromPrompt(prompt: string, logger?: { info: (component: string, event: string, data?: Record<string, unknown>) => void }): Promise<AppConfig> {
  const primaryProvider = getProvider();

  // Build a fallback chain: primary first, then any other provider that has a key.
  const allProviders: Provider[] = ['groq', 'mistral', 'openai', 'anthropic'];
  const chain: Provider[] = [
    primaryProvider,
    ...allProviders.filter((p) => p !== primaryProvider && getApiKey(p)),
  ];

  for (const provider of chain) {
    const result = await tryProvider(provider, prompt, logger);
    if (result) {
      console.log(`[ai] generated via ${provider}: ${result.entities.length} entities, ${result.pages.length} pages`);
      return result;
    }
  }

  // All providers failed — use keyword-matched template fallback.
  console.warn('[ai] all providers failed, using template fallback');
  return ensureCompleteApp(parseConfig(fallbackForPrompt(prompt)));
}

export { findTemplate, TEMPLATES };
