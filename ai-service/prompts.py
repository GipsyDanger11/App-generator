"""
Prompt templates for the AI generation pipeline.

The SYSTEM_PROMPT instructs the AI to produce a valid AppConfig JSON.
The USER_PROMPT_TEMPLATE is filled with the user's description.

Separating prompts into their own module makes it easy to iterate on
prompt engineering without touching generation logic.
"""

SYSTEM_PROMPT = """\
You are an expert AI application architect. You design complete, production-ready
app configurations in JSON for a metadata-driven app runtime.

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
1. Every page root "kind" MUST be one of: hero, heading, text, stats, table, form, chart, card, button, list, iframe, divider, spacer, kanban, timeline.
2. Every page "root.props.entity" MUST exactly match an "entities[].name" (case-sensitive).
3. ALWAYS include ALL of these pages for a working app:
   - A home page on route "/" with kind "hero"
   - A stats page also on route "/" with kind "stats" showing entity counts
   - A table page for EVERY entity (e.g. route "/customers", kind "table")
   - A form page for EVERY entity (e.g. route "/customers/new", kind "form" with mode "create")
4. Stats items MUST have a "source" object with "entity" matching a real entity name and "op" of "count", "sum", or "avg".
5. Field "type" MUST be one of: string, text, number, boolean, date, datetime, email, select, multiselect, relation, json.
6. "select" fields MUST have an "options" array where each option has "value" and "label" strings.
7. Keep apps focused: 2-4 entities, 5-12 pages total. The user wants a REAL working CRUD app, not a landing page.
8. NEVER output only a hero page. ALWAYS include table and form pages for every entity.
9. Include meaningful field definitions for each entity — at least 3-6 fields per entity.
10. Choose a beautiful theme with harmonious primary and accent hex colors.
"""

USER_PROMPT_TEMPLATE = """\
Build a complete CRUD app for: {prompt}

Requirements:
- Design 2-4 entities with realistic fields (names, types, options).
- Include a home hero page, a stats page, a table page AND a form page for EVERY entity.
- Choose a beautiful color theme.
- Return ONLY a JSON object. No prose, no markdown.
"""

REFINEMENT_PROMPT = """\
The previous JSON config was incomplete or invalid. Here are the issues:
{issues}

Please fix these issues and return the COMPLETE corrected JSON. Remember:
- Every entity MUST have a table page and a form page.
- Stats items MUST reference real entity names.
- Return ONLY a JSON object.
"""
