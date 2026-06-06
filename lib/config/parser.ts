// Safe parser: takes ANY input (object, string, null) and always returns a
// valid AppConfig. Missing fields are filled in, invalid values are coerced
// or dropped, unknown things are ignored. We never throw.

import type { AppConfig, ComponentNode, EntityDef, FieldDef, PageDef } from './types';
import type { Logger } from '../logger';

const SAFE_EMPTY: AppConfig = {
  name: 'Untitled app',
  description: '',
  entities: [],
  pages: [],
};

function asString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (v == null) return fallback;
  try { return String(v); } catch { return fallback; }
}

function asBool(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function safeField(raw: unknown, idx: number): FieldDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name).trim();
  if (!name) return null;
  const type = asString(r.type, 'string') as FieldDef['type'];
  const allowed: FieldDef['type'][] = [
    'string','text','number','boolean','date','datetime','email',
    'select','multiselect','relation','json',
  ];
  return {
    name,
    type: allowed.includes(type) ? type : 'string',
    label: asString(r.label, name),
    required: asBool(r.required),
    unique: asBool(r.unique),
    default: r.default,
    options: asArray(r.options)
      .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
      .map((o) => ({ value: asString(o.value), label: asString(o.label, asString(o.value)) })),
    entity: typeof r.entity === 'string' ? r.entity : undefined,
    placeholder: asString(r.placeholder, ''),
    helpText: asString(r.helpText, ''),
    showInList: r.showInList === undefined ? true : asBool(r.showInList),
    sortable: r.sortable === undefined ? true : asBool(r.sortable),
    searchable: r.searchable === undefined ? true : asBool(r.searchable),
  };
}

function safeEntity(raw: unknown): EntityDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name).trim();
  if (!name) return null;
  const fields = asArray(r.fields).map(safeField).filter((f): f is FieldDef => !!f);
  return {
    name,
    label: asString(r.label, name),
    labelPlural: asString(r.labelPlural, `${name}s`),
    fields,
    defaultPage: typeof r.defaultPage === 'string' ? r.defaultPage : undefined,
  };
}

const ALLOWED_KINDS = new Set([
  'hero','heading','text','stats','table','form','chart',
  'card','button','list','iframe','divider','spacer',
  'kanban','timeline',
]);

function safeNode(raw: unknown): ComponentNode | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const kind = asString(r.kind);
  if (!ALLOWED_KINDS.has(kind)) return null; // unknown -> drop the whole node
  const children = asArray(r.children).map(safeNode).filter((n): n is ComponentNode => !!n);
  return {
    id: typeof r.id === 'string' ? r.id : undefined,
    kind: kind as ComponentNode['kind'],
    props: r.props && typeof r.props === 'object' ? (r.props as Record<string, unknown>) : {},
    children,
  };
}

function safePage(raw: unknown, idx: number): PageDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const route = asString(r.route, '/');
  const id = asString(r.id, `page-${idx}`);
  const root = safeNode(r.root) ?? { kind: 'heading', props: { text: asString(r.title, 'Page') } };
  return {
    id,
    route: route.startsWith('/') ? route : `/${route}`,
    title: asString(r.title, 'Page'),
    entity: typeof r.entity === 'string' ? r.entity : undefined,
    layout: ['default','full','sidebar'].includes(asString(r.layout)) ? (r.layout as PageDef['layout']) : 'default',
    root,
  };
}

function safeI18n(raw: unknown): Record<string, Record<string, string>> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, Record<string, string>> = {};
  for (const [locale, entries] of Object.entries(raw as Record<string, unknown>)) {
    if (!entries || typeof entries !== 'object') continue;
    const map: Record<string, string> = {};
    for (const [k, v] of Object.entries(entries as Record<string, unknown>)) {
      if (typeof v === 'string') map[k] = v;
    }
    if (Object.keys(map).length > 0) out[locale] = map;
  }
  return Object.keys(out).length ? out : undefined;
}

export function parseConfig(input: unknown, logger?: Logger): AppConfig {
  // Log parse start
  if (logger) {
    const inputType = typeof input;
    const inputSize = typeof input === 'string' ? input.length : undefined;
    logger.info('parser', 'parse_start', {
      inputType,
      inputSize,
    });
  }

  // 1) Accept string by attempting JSON.parse, otherwise return safe empty.
  let jsonParseSuccess = false;
  if (typeof input === 'string') {
    try { 
      input = JSON.parse(input);
      jsonParseSuccess = true;
      if (logger) {
        logger.info('parser', 'json_parse_success', {});
      }
    } catch (error) {
      if (logger) {
        logger.warn('parser', 'json_parse_failure', { error: String(error) });
      }
      return { ...SAFE_EMPTY };
    }
  }
  if (!input || typeof input !== 'object') {
    if (logger) {
      logger.warn('parser', 'invalid_input_type', { 
        actualType: typeof input,
        expected: 'object' 
      });
    }
    return { ...SAFE_EMPTY };
  }

  const r = input as Record<string, unknown>;
  
  // Track corrections for logging
  const corrections: string[] = [];
  
  const entities = asArray(r.entities).map(safeEntity).filter((e): e is EntityDef => !!e);
  const pages = asArray(r.pages).map(safePage).filter((p): p is PageDef => !!p);

  // If the config has no pages, synthesize a welcome page.
  const finalPages: PageDef[] = pages.length
    ? pages
    : [
        {
          id: 'welcome',
          route: '/',
          title: asString(r.name, 'Welcome'),
          root: {
            kind: 'hero',
            props: {
              title: asString(r.name, 'Welcome'),
              subtitle: asString(r.description, 'Your app is ready.'),
            },
          },
        },
      ];

  if (!pages.length) {
    corrections.push('Added welcome page (no pages provided)');
  }

  // Track name correction
  const name = asString(r.name, 'Untitled app');
  if (!r.name || r.name === '') {
    corrections.push('Missing name field, filled with "Untitled app"');
  }

  // Track description correction
  const description = typeof r.description === 'string' ? r.description : '';
  if (r.description !== undefined && typeof r.description !== 'string') {
    corrections.push('Invalid description type, coerced to empty string');
  }

  const finalConfig: AppConfig = {
    name,
    description,
    theme: r.theme && typeof r.theme === 'object'
      ? {
          primary: typeof (r.theme as Record<string, unknown>).primary === 'string'
            ? ((r.theme as Record<string, unknown>).primary as string) : undefined,
          accent: typeof (r.theme as Record<string, unknown>).accent === 'string'
            ? ((r.theme as Record<string, unknown>).accent as string) : undefined,
          logoText: typeof (r.theme as Record<string, unknown>).logoText === 'string'
            ? ((r.theme as Record<string, unknown>).logoText as string) : undefined,
          faviconEmoji: typeof (r.theme as Record<string, unknown>).faviconEmoji === 'string'
            ? ((r.theme as Record<string, unknown>).faviconEmoji as string) : undefined,
        }
      : undefined,
    entities,
    pages: finalPages,
    workflows: undefined, // parsed on demand
    i18n: safeI18n(r.i18n),
  };

  // Log corrections applied and final structure
  if (logger) {
    logger.info('parser', 'parse_complete', {
      correctionsApplied: corrections,
      entityCount: entities.length,
      pageCount: finalPages.length,
    });
  }

  return finalConfig;
}

// Given an AppConfig, ensure every entity has a usable list (table) and
// new-record (form) page. If the AI returned entities but only a hero home
// page, this fills in the missing CRUD pages so the app is actually usable.
// Returns a new AppConfig (does not mutate).
export function ensureCompleteApp(cfg: AppConfig, logger?: Logger): AppConfig {
  const entityNames = cfg.entities.map((e) => e.name);
  
  // Log augmentation start with input state
  logger?.info('augmenter', 'augmentation_start', {
    entityCount: cfg.entities.length,
    pageCount: cfg.pages.length,
    existingRoutes: cfg.pages.map(p => p.route),
    hasTheme: !!cfg.theme?.primary,
  });
  
  if (entityNames.length === 0) {
    logger?.info('augmenter', 'augmentation_skipped', {
      reason: 'No entities defined',
    });
    return cfg;
  }

  const slugFor = (name: string) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    // Naive pluralizer: append "s" unless it already ends in "s".
    return base.endsWith('s') ? base : base + 's';
  };

  const augmented: PageDef[] = [...cfg.pages];
  let pagesAdded = 0;

  // Helper: recompute routes from the CURRENT augmented array (not original)
  const hasRoute = (route: string) => augmented.some((p) => p.route.toLowerCase() === route.toLowerCase());
  const hasTableForEntity = (entityName: string) =>
    augmented.some((p) => p.root?.kind === 'table' && (
      (p.root.props?.entity as string | undefined)?.toLowerCase() === entityName.toLowerCase() ||
      p.entity?.toLowerCase() === entityName.toLowerCase()
    ));
  const hasFormForEntity = (entityName: string) =>
    augmented.some((p) => p.root?.kind === 'form' && (
      (p.root.props?.entity as string | undefined)?.toLowerCase() === entityName.toLowerCase() ||
      p.entity?.toLowerCase() === entityName.toLowerCase()
    ));

  // 1. Make sure there is a home page.
  const homeExists = hasRoute('/');
  if (!homeExists) {
    augmented.unshift({
      id: 'home',
      route: '/',
      title: cfg.name,
      root: {
        kind: 'hero',
        props: {
          title: cfg.name,
          subtitle: cfg.description || `Manage your data with ${cfg.name}.`,
        },
      },
    });
    pagesAdded++;
    logger?.info('augmenter', 'home_page_added', {
      route: '/',
      reason: 'No home page found',
    });
  } else {
    logger?.info('augmenter', 'home_page_exists', {
      route: '/',
    });
  }

  // 2. Make sure home has a stats section.
  const hasStats = augmented.some((p) => p.root?.kind === 'stats' || p.root?.children?.some((c) => c.kind === 'stats'));
  if (!hasStats && entityNames.length > 0) {
    augmented.push({
      id: 'home-stats',
      route: '/',
      title: 'Dashboard',
      root: {
        kind: 'stats',
        props: {
          items: entityNames.slice(0, 4).map((name) => ({
            label: `Total ${(cfg.entities.find(e => e.name === name)?.labelPlural ?? `${name}s`)}`,
            source: { entity: name, op: 'count' },
          })),
        },
      },
    });
    pagesAdded++;
    logger?.info('augmenter', 'stats_page_added', {
      route: '/',
      entityCount: Math.min(4, entityNames.length),
    });
  } else if (hasStats) {
    logger?.info('augmenter', 'stats_page_exists', {
      status: 'Stats section already present',
    });
  }

  // 3. For each entity, make sure a table page and a form page exist.
  for (const e of cfg.entities) {
    const slug = slugFor(e.name);
    const listRoute = `/${slug}`;
    const newRoute = `/${slug}/new`;
    
    const existingTablePages = augmented.filter(p => p.entity === e.name && p.root?.kind === 'table').length;
    const existingFormPages = augmented.filter(p => p.entity === e.name && p.root?.kind === 'form').length;

    logger?.info('augmenter', 'entity_processing', {
      entityName: e.name,
      existingTablePages,
      existingFormPages,
    });

    if (!hasTableForEntity(e.name)) {
      augmented.push({
        id: `${slug}-list`,
        route: listRoute,
        title: e.labelPlural ?? `${e.name}s`,
        entity: e.name,
        root: { kind: 'table', props: { entity: e.name, pageSize: 20 } },
      });
      pagesAdded++;
      logger?.info('augmenter', 'table_page_added', {
        entityName: e.name,
        route: listRoute,
      });
    } else {
      logger?.info('augmenter', 'table_page_exists', {
        entityName: e.name,
      });
    }

    if (!hasFormForEntity(e.name)) {
      augmented.push({
        id: `${slug}-new`,
        route: newRoute,
        title: `New ${e.label ?? e.name}`,
        entity: e.name,
        root: { kind: 'form', props: { entity: e.name, mode: 'create', successRoute: listRoute } },
      });
      pagesAdded++;
      logger?.info('augmenter', 'form_page_added', {
        entityName: e.name,
        route: newRoute,
      });
    } else {
      logger?.info('augmenter', 'form_page_exists', {
        entityName: e.name,
      });
    }
  }

  // 4. Ensure the theme has a primary color — generate one deterministically
  //    from the app name if the AI didn't provide one.
  const THEME_PALETTE = [
    { primary: '#7c3aed', accent: '#a855f7' }, // purple
    { primary: '#2563eb', accent: '#60a5fa' }, // blue
    { primary: '#059669', accent: '#34d399' }, // green
    { primary: '#dc2626', accent: '#f87171' }, // red
    { primary: '#d97706', accent: '#fbbf24' }, // amber
    { primary: '#0891b2', accent: '#22d3ee' }, // cyan
    { primary: '#be185d', accent: '#f472b6' }, // pink
    { primary: '#7c3aed', accent: '#818cf8' }, // indigo
  ];
  const themeIdx = cfg.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % THEME_PALETTE.length;
  const defaultTheme = THEME_PALETTE[themeIdx];

  const aiProvidedTheme = !!(cfg.theme?.primary && cfg.theme?.accent);
  const theme = {
    primary: cfg.theme?.primary ?? defaultTheme.primary,
    accent: cfg.theme?.accent ?? defaultTheme.accent,
    logoText: cfg.theme?.logoText ?? cfg.name,
    faviconEmoji: cfg.theme?.faviconEmoji,
  };

  logger?.info('augmenter', 'theme_colors', {
    source: aiProvidedTheme ? 'AI-provided' : 'generated',
    primary: theme.primary,
    accent: theme.accent,
  });

  // Log augmentation summary
  logger?.info('augmenter', 'augmentation_complete', {
    pagesAdded,
    finalPageCount: augmented.length,
    entitiesProcessed: cfg.entities.length,
  });

  return { ...cfg, pages: augmented, theme };
}

// Helper used by API runtime to validate a record payload against an entity.
export function buildEntityZodSchema(entity: EntityDef) {
  // Lightweight validator that doesn't import zod at the top level for
  // edge friendliness. Always returns `{ ok, errors }`.
  return function validate(data: Record<string, unknown> | null | undefined) {
    const errors: Record<string, string> = {};
    const clean: Record<string, unknown> = {};
    const dataObj = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
    for (const field of entity.fields) {
      let v = dataObj[field.name];
      if (v === undefined || v === null || v === '') {
        if (field.required) errors[field.name] = `${field.label ?? field.name} is required`;
        else if (field.default !== undefined) clean[field.name] = field.default;
        continue;
      }
      switch (field.type) {
        case 'number': {
          const n = typeof v === 'number' ? v : Number(v);
          if (Number.isNaN(n)) errors[field.name] = 'Must be a number';
          else clean[field.name] = n;
          break;
        }
        case 'boolean':
          clean[field.name] = v === true || v === 'true' || v === 1 || v === '1';
          break;
        case 'date':
        case 'datetime':
        case 'email':
        case 'string':
        case 'text': {
          const s = String(v);
          if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
            errors[field.name] = 'Invalid email';
          else clean[field.name] = s;
          break;
        }
        case 'select': {
          const s = String(v);
          if (field.options && field.options.length && !field.options.some((o) => o.value === s))
            errors[field.name] = 'Invalid option';
          else clean[field.name] = s;
          break;
        }
        case 'multiselect': {
          const arr = Array.isArray(v) ? v.map(String) : [String(v)];
          if (field.options && field.options.length) {
            const allowed = new Set(field.options.map((o) => o.value));
            if (!arr.every((x) => allowed.has(x))) errors[field.name] = 'Invalid option';
          }
          clean[field.name] = arr;
          break;
        }
        case 'relation':
          clean[field.name] = String(v);
          break;
        case 'json':
          if (typeof v === 'string') {
            try { clean[field.name] = JSON.parse(v); } catch { clean[field.name] = v; }
          } else {
            clean[field.name] = v;
          }
          break;
        default:
          clean[field.name] = v;
      }
    }
    return { ok: Object.keys(errors).length === 0, errors, clean };
  };
}
