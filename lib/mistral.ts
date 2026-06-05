// Mistral AI integration. Given a user prompt describing an app, returns
// a valid AppConfig JSON. Falls back to a curated template on any failure.

import type { AppConfig } from './config/types';
import { parseConfig } from './config/parser';
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
3. ALWAYS include: a home page on "/", a table page for every main entity, and a form page for every main entity.
4. ALWAYS include 2-3 stats items on the home page (or its own stats page) with valid "source.entity" matching an entity.
5. Field "type" MUST be one of: string, text, number, boolean, date, datetime, email, select, multiselect, relation, json.
6. Use "select" with an "options" array (each option has "value" and "label").
7. Keep apps focused: 2-3 entities, 4-6 pages.

For a habit tracker specifically:
- Entity "Habit" with fields: name (string, required), description (text), icon (string), frequency (select: daily/weekly/weekdays), streak (number), bestStreak (number), lastCompleted (date), color (string).
- Entity "Entry" with fields: habit (relation to Habit), date (date, required), completed (boolean), note (text).
- Pages: "/" (hero + stats), "/habits" (table), "/habits/new" (form), "/entries" (table), "/entries/new" (form), "/progress" (chart).`;

// Heuristic to pick a template if Mistral is unavailable or returns junk.
function fallbackForPrompt(prompt: string): AppConfig {
  const p = prompt.toLowerCase();
  if (p.includes('habit')) return TEMPLATES.find((t) => t.id === 'habit-tracker')!.config;
  if (p.includes('crm') || p.includes('customer') || p.includes('deal')) return TEMPLATES.find((t) => t.id === 'crm')!.config;
  if (p.includes('invent') || p.includes('stock') || p.includes('product')) return TEMPLATES.find((t) => t.id === 'inventory')!.config;
  return TEMPLATES.find((t) => t.id === 'habit-tracker')!.config;
}

function extractJson(content: unknown): unknown | null {
  if (typeof content === 'string') {
    const trimmed = content.trim();
    // Try parsing the whole string first.
    try { return JSON.parse(trimmed); } catch {}
    // Try to find a JSON block inside prose.
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
  return content ?? null;
}

export async function generateConfigFromPrompt(prompt: string): Promise<AppConfig> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return parseConfig(fallbackForPrompt(prompt));
  }
  const model = process.env.MISTRAL_MODEL || 'mistral-large-latest';
  try {
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
      return parseConfig(fallbackForPrompt(prompt));
    }
    const json: any = await res.json();
    const content = json.choices?.[0]?.message?.content;
    const parsed = extractJson(content);
    if (!parsed) {
      console.error('[mistral] returned unparseable JSON, using template fallback');
      return parseConfig(fallbackForPrompt(prompt));
    }
    const safe = parseConfig(parsed);
    // Final safety net: if the AI returned something with zero entities AND
    // zero pages, treat it as a failure and use the template.
    if (safe.entities.length === 0 && safe.pages.length <= 1) {
      return parseConfig(fallbackForPrompt(prompt));
    }
    return safe;
  } catch (e) {
    console.error('[mistral] failed', e);
    return parseConfig(fallbackForPrompt(prompt));
  }
}

export { findTemplate, TEMPLATES };
