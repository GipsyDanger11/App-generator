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

const SYSTEM_PROMPT = `You are an expert AI application architect that generates complete, fully-functional app configurations as JSON.

Output ONLY a single JSON object — no prose, no markdown fences, no code blocks, no comments.

REQUIRED JSON SHAPE:
{
  "name": "string",
  "description": "string",
  "theme": { "primary": "#hex", "accent": "#hex", "logoText": "string" },
  "entities": [
    {
      "name": "Customer", "label": "Customer", "labelPlural": "Customers",
      "fields": [
        { "name": "name", "type": "string", "label": "Name", "required": true, "showInList": true },
        { "name": "email", "type": "email", "label": "Email", "showInList": true },
        { "name": "status", "type": "select", "label": "Status", "options": [
          { "value": "active", "label": "Active" }, { "value": "inactive", "label": "Inactive" }
        ], "showInList": true }
      ]
    }
  ],
  "pages": [
    { "id": "home",          "route": "/",              "title": "Home",         "root": { "kind": "hero",  "props": { "title": "...", "subtitle": "..." } } },
    { "id": "home-stats",    "route": "/",              "title": "Dashboard",    "root": { "kind": "stats", "props": { "items": [{ "label": "Total Customers", "source": { "entity": "Customer", "op": "count" } }] } } },
    { "id": "customers",     "route": "/customers",     "title": "Customers",    "entity": "Customer", "root": { "kind": "table", "props": { "entity": "Customer", "pageSize": 20 } } },
    { "id": "customers-new", "route": "/customers/new", "title": "New Customer", "entity": "Customer", "root": { "kind": "form",  "props": { "entity": "Customer", "mode": "create", "successRoute": "/customers" } } }
  ]
}

MANDATORY RULES — VIOLATING ANY WILL BREAK THE APP:
1. EVERY app MUST have ALL of these pages:
   a) ONE hero page on route "/" (kind: "hero")
   b) ONE stats page on route "/" (kind: "stats") — entity counts
   c) ONE table page PER entity (kind: "table", route: "/{slug}s")
   d) ONE form page PER entity  (kind: "form",  route: "/{slug}s/new", mode: "create")
2. With 2 entities → minimum 6 pages. With 3 entities → minimum 8 pages.
3. table/form page props.entity MUST exactly match entities[].name (case-sensitive).
4. Stats source: { "entity": "EntityName", "op": "count" | "sum" | "avg" }
5. Select fields MUST have options: [{ "value": "...", "label": "..." }]
6. Field types: string | text | number | boolean | date | datetime | email | select | multiselect | relation | json
7. Design 2-4 entities with 4-8 meaningful fields each.
8. SELF-CHECK: Before outputting, count entities. Verify every entity has BOTH a table AND a form page.`;


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

async function tryProvider(provider: Provider, prompt: string, logger?: Logger): Promise<AppConfig | null> {
  const apiKey = getApiKey(provider);
  const model = provider === 'groq' ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
    : provider === 'mistral' ? (process.env.MISTRAL_MODEL || 'mistral-large-latest')
    : provider === 'openai' ? (process.env.OPENAI_MODEL || 'gpt-4o-mini')
    : (process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest');

  // Log provider attempt start
  logger?.info('provider', 'provider_attempt_start', {
    provider,
    model,
    apiKeyPresent: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.slice(0, 4) : undefined,
  });

  if (!apiKey) {
    logger?.warn('provider', 'provider_skipped', {
      provider,
      reason: 'No API key configured',
    });
    return null;
  }

  const startTime = Date.now();
  
  try {
    let raw: unknown | null = null;
    
    // Log prompt being sent (debug level for full details)
    logger?.debug('provider', 'sending_prompt', {
      provider,
      prompt: prompt.substring(0, 200), // First 200 chars
      systemPromptLength: SYSTEM_PROMPT.length,
    });

    switch (provider) {
      case 'groq': raw = await callGroq(apiKey, prompt); break;
      case 'mistral': raw = await callMistral(apiKey, prompt); break;
      case 'openai': raw = await callOpenAI(apiKey, prompt); break;
      case 'anthropic': raw = await callAnthropic(apiKey, prompt); break;
    }

    const responseTime = Date.now() - startTime;

    if (!raw) {
      logger?.error('provider', 'provider_failed', new Error('Provider returned null or failed to parse JSON'), {
        provider,
        responseTime,
      });
      return null;
    }

    // Parse and validate the config
    const cfg = ensureCompleteApp(parseConfig(raw, logger), logger);

    // Log raw response structure
    logger?.info('provider', 'provider_response', {
      provider,
      responseTime,
      entityCount: cfg.entities.length,
      pageCount: cfg.pages.length,
      pageKinds: cfg.pages.map(p => p.root?.kind),
      entities: cfg.entities.map(e => e.name),
    });

    // Validate with isUsableConfig
    if (!isUsableConfig(cfg, logger)) {
      logger?.warn('provider', 'config_rejected', {
        provider,
        reason: 'Config validation failed - missing required pages',
        entityCount: cfg.entities.length,
        pageCount: cfg.pages.length,
      });
      return null;
    }

    // Success
    logger?.info('provider', 'provider_success', {
      provider,
      responseTime,
      entityCount: cfg.entities.length,
      pageCount: cfg.pages.length,
    });

    return cfg;
  } catch (e) {
    const responseTime = Date.now() - startTime;
    logger?.error('provider', 'provider_error', e, {
      provider,
      responseTime,
      errorType: e instanceof Error ? e.constructor.name : typeof e,
    });
    return null;
  }
}

export async function generateConfigFromPrompt(prompt: string, logger?: Logger): Promise<AppConfig> {
  const primaryProvider = getProvider();
  const isTestMode = process.env.AI_TEST_MODE === 'true';

  // Build a fallback chain: primary first, then any other provider that has a key.
  const allProviders: Provider[] = ['groq', 'mistral', 'openai', 'anthropic'];
  const chain: Provider[] = [
    primaryProvider,
    ...allProviders.filter((p) => p !== primaryProvider && getApiKey(p)),
  ];

  // Log generation start with provider chain order
  logger?.info('provider', 'generation_start', {
    prompt: prompt.substring(0, 200), // First 200 chars
    primaryProvider,
    providerChain: chain,
    chainLength: chain.length,
    testMode: isTestMode,
  });

  // Check for test mode - skip external API calls
  if (isTestMode) {
    const template = fallbackForPrompt(prompt);
    const templateId = TEMPLATES.find(t => t.config === template)?.id || 'unknown';
    
    logger?.info('provider', 'test_mode_active', {
      reason: 'AI_TEST_MODE environment variable is true',
      action: 'Skipping external API calls',
      templateId,
      prompt: prompt.substring(0, 100),
    });

    logger?.info('provider', 'test_mode_config', {
      templateId,
      rawTemplate: {
        name: template.name,
        description: template.description,
        entityCount: template.entities.length,
        pageCount: template.pages.length,
        entities: template.entities.map(e => ({
          name: e.name,
          fieldCount: e.fields.length,
        })),
        pages: template.pages.map(p => ({
          id: p.id,
          route: p.route,
          kind: p.root?.kind,
          entity: p.entity,
        })),
      },
    });

    const finalConfig = ensureCompleteApp(parseConfig(template, logger), logger);

    logger?.info('provider', 'generation_complete', {
      source: 'template',
      templateId,
      testMode: true,
      entityCount: finalConfig.entities.length,
      pageCount: finalConfig.pages.length,
      hasTheme: !!finalConfig.theme,
      finalStructure: {
        entities: finalConfig.entities.map(e => e.name),
        pageRoutes: finalConfig.pages.map(p => p.route),
        pageKinds: finalConfig.pages.map(p => p.root?.kind),
        theme: finalConfig.theme,
      },
    });

    return finalConfig;
  }

  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    
    // Log each provider attempt in sequence
    logger?.info('provider', 'trying_provider', {
      provider,
      attemptNumber: i + 1,
      totalProviders: chain.length,
    });

    const result = await tryProvider(provider, prompt, logger);
    
    if (result) {
      logger?.info('provider', 'generation_success', {
        provider,
        attemptNumber: i + 1,
        entityCount: result.entities.length,
        pageCount: result.pages.length,
        entities: result.entities.map(e => e.name),
        hasTheme: !!result.theme,
      });
      return result;
    }

    // Log fallback transition if not the last provider
    if (i < chain.length - 1) {
      logger?.warn('provider', 'fallback_to_next', {
        from: provider,
        to: chain[i + 1],
        reason: 'Provider failed or returned unusable config',
      });
    }
  }

  // All providers failed — use keyword-matched template fallback
  const template = fallbackForPrompt(prompt);
  const templateId = TEMPLATES.find(t => t.config === template)?.id || 'unknown';
  
  logger?.warn('provider', 'template_fallback', {
    reason: 'All AI providers failed',
    providersTried: chain,
    templateId,
    prompt: prompt.substring(0, 100),
  });

  const finalConfig = ensureCompleteApp(parseConfig(template, logger), logger);

  // Log final config summary
  logger?.info('provider', 'generation_complete', {
    source: 'template',
    templateId,
    entityCount: finalConfig.entities.length,
    pageCount: finalConfig.pages.length,
    hasTheme: !!finalConfig.theme,
  });

  return finalConfig;
}

export { findTemplate, TEMPLATES };
