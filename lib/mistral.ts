// Mistral AI integration. Given a user prompt describing an app, returns
// a valid AppConfig JSON. Falls back to a minimal config on any failure.

import type { AppConfig } from './config/types';
import { parseConfig } from './config/parser';

const SYSTEM_PROMPT = `You are an AI that designs app configurations in JSON.
Output ONLY a single JSON object matching this shape — no prose, no markdown fences:

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
        { "name": "name", "type": "string", "label": "Name", "required": true, "showInList": true },
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
    { "id": "list", "route": "/customers", "title": "Customers", "entity": "Customer", "layout": "default", "root": { "kind": "table", "props": { "entity": "Customer" } } }
  ],
  "i18n": { "en": { "key": "value" }, "es": { "key": "valor" } }
}

Allowed component kinds: hero, heading, text, stats, table, form, chart, card, button, list, iframe, divider, spacer.
Allowed field types: string, text, number, boolean, date, datetime, email, select, multiselect, relation, json.
Pages should include a list page (with "table") and a create page (with "form") for each main entity. The form component takes "entity" and "mode" props.
Always include at least a hero/landing page on "/".
Design clean, focused apps.`;

export async function generateConfigFromPrompt(prompt: string): Promise<AppConfig> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return parseConfig({
      name: 'Demo CRM',
      description: 'Add MISTRAL_API_KEY to enable AI generation.',
      entities: [
        { name: 'Customer', fields: [
          { name: 'name', type: 'string', label: 'Name', required: true, showInList: true },
          { name: 'email', type: 'email', label: 'Email' },
          { name: 'status', type: 'select', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        ] },
      ],
      pages: [
        { id: 'home', route: '/', title: 'Home', root: { kind: 'hero', props: { title: 'Demo CRM', subtitle: 'Built by the App Generator.' } } },
        { id: 'list', route: '/customers', title: 'Customers', entity: 'Customer', root: { kind: 'table', props: { entity: 'Customer' } } },
        { id: 'new', route: '/customers/new', title: 'New Customer', entity: 'Customer', root: { kind: 'form', props: { entity: 'Customer', mode: 'create', successRoute: '/customers' } } },
      ],
    });
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
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      console.error('[mistral] HTTP', res.status, await res.text());
      throw new Error(`Mistral HTTP ${res.status}`);
    }
    const json: any = await res.json();
    const content = json.choices?.[0]?.message?.content;
    let parsed: unknown;
    try { parsed = typeof content === 'string' ? JSON.parse(content) : content; } catch { parsed = null; }
    if (!parsed) throw new Error('Mistral returned invalid JSON');
    return parseConfig(parsed);
  } catch (e) {
    console.error('[mistral] failed', e);
    return parseConfig({ name: 'My App', description: 'AI generation failed — using fallback.', pages: [] });
  }
}
