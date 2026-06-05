// Safe parser: takes ANY input (object, string, null) and always returns a
// valid AppConfig. Missing fields are filled in, invalid values are coerced
// or dropped, unknown things are ignored. We never throw.

import type { AppConfig, ComponentNode, EntityDef, FieldDef, PageDef } from './types';

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

export function parseConfig(input: unknown): AppConfig {
  // 1) Accept string by attempting JSON.parse, otherwise return safe empty.
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch { return { ...SAFE_EMPTY }; }
  }
  if (!input || typeof input !== 'object') return { ...SAFE_EMPTY };

  const r = input as Record<string, unknown>;
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

  return {
    name: asString(r.name, 'Untitled app'),
    description: typeof r.description === 'string' ? r.description : '',
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
}

// Given an AppConfig, ensure every entity has a usable list (table) and
// new-record (form) page. If the AI returned entities but only a hero home
// page, this fills in the missing CRUD pages so the app is actually usable.
// Returns a new AppConfig (does not mutate).
export function ensureCompleteApp(cfg: AppConfig): AppConfig {
  const entityNames = cfg.entities.map((e) => e.name);
  if (entityNames.length === 0) return cfg;

  const slugFor = (name: string) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    // Naive pluralizer: append "s" unless it already ends in "s".
    return base.endsWith('s') ? base : base + 's';
  };
  const existingRoutes = new Set(cfg.pages.map((p) => p.route.toLowerCase()));

  const augmented: PageDef[] = [...cfg.pages];

  // 1. Make sure home has a stats section if any entity exists.
  const homeIdx = augmented.findIndex((p) => p.route === '/');
  const hasStats = augmented.some((p) => p.root?.kind === 'stats' || p.root?.children?.some((c) => c.kind === 'stats'));
  if (homeIdx >= 0 && !hasStats && entityNames.length > 0) {
    augmented.push({
      id: 'home-stats',
      route: '/',
      title: 'Home',
      root: {
        kind: 'stats',
        props: {
          items: entityNames.slice(0, 4).map((name) => ({
            label: `Total ${name.toLowerCase()}s`,
            source: { entity: name, op: 'count' },
          })),
        },
      },
    });
  }

  // 2. For each entity, make sure a table page and a form page exist.
  for (const e of cfg.entities) {
    const slug = slugFor(e.name);
    const listRoute = `/${slug}`;
    const newRoute = `/${slug}/new`;
    const hasList = existingRoutes.has(listRoute) || augmented.some((p) => p.root?.kind === 'table' && (p.root.props?.entity === e.name || p.entity === e.name));
    if (!hasList) {
      augmented.push({
        id: `${slug}-list`,
        route: listRoute,
        title: e.labelPlural ?? `${e.name}s`,
        entity: e.name,
        root: { kind: 'table', props: { entity: e.name, pageSize: 20 } },
      });
    }
    const hasForm = existingRoutes.has(newRoute) || augmented.some((p) => p.root?.kind === 'form' && (p.root.props?.entity === e.name || p.entity === e.name));
    if (!hasForm) {
      augmented.push({
        id: `${slug}-new`,
        route: newRoute,
        title: `New ${e.label ?? e.name}`,
        entity: e.name,
        root: { kind: 'form', props: { entity: e.name, mode: 'create', successRoute: listRoute } },
      });
    }
  }

  // 3. If the home page is the *only* page and has no real content, swap
  //    it to a proper hero with a real subtitle.
  if (homeIdx >= 0 && augmented.length <= 2) {
    const home = augmented[homeIdx];
    if (home.root?.kind === 'hero') {
      const subtitle = String(home.root.props?.subtitle ?? cfg.description ?? '');
      if (!subtitle) {
        augmented[homeIdx] = {
          ...home,
          root: {
            kind: 'hero',
            props: {
              title: String(home.root.props?.title ?? cfg.name),
              subtitle: cfg.description || `Manage your ${cfg.entities.length} ${cfg.entities.length === 1 ? 'entity' : 'entities'} from the sidebar.`,
            },
          },
        };
      }
    }
  }

  return { ...cfg, pages: augmented };
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
