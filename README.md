# App Generator — Track A

A metadata-driven application runtime. Describe an app in plain English, the
platform generates a working app with forms, tables, dashboards, and APIs —
all driven by a JSON config that you can inspect and edit live.

Built for the **Track A — AI App Generator** brief. Reference: [base44.com](https://base44.com/).

## Stack

- **Frontend**: Next.js 14 (App Router) · React · TypeScript · TailwindCSS
- **Backend**: Next.js API Routes (Node.js + TypeScript)
- **Database**: PostgreSQL (Neon recommended) via Prisma ORM
- **AI**: Mistral AI (config generation + live translation)
- **Auth**: NextAuth (email/password + Google + GitHub)
- **Deploy**: Vercel / Railway / Render / Cloudflare / Neon

## Features (all 5 extra, integrated)

| Feature | Where |
| --- | --- |
| **CSV import** | `/apps/[appId]` → "CSV" next to each entity in the sidebar; per-row field mapping; row-level error report. |
| **Notifications** | Bell icon in the app shell; auto-created by workflow `notify` actions. |
| **Multi-language (i18n)** | Locale switcher in the top bar; renderer translates via `useT()`. Translation API uses Mistral. |
| **Multi-auth login** | Email/password + Google + GitHub. Configure keys in `.env`. |
| **GitHub export** | "Export" tab in the app shell — pushes a new repo containing the runtime + config. |
| **PWA** | `manifest.webmanifest` + service worker registered in production. |
| **AI generation (Mistral)** | `/builder` — describe an app, get a config, preview, save. |
| **Workflow automation** | Config-driven `on create/update/delete` actions: `notify`, `setField`, `webhook`. |

## Architecture

```
JSON config (entities, pages, components, i18n, workflows)
   │
   ├──> Frontend Renderer (recursive, with <UnknownComponent/> fallback)
   │      ├──> Table  ──> /api/apps/[appId]/entities/[entity]
   │      ├──> Form   ──> /api/apps/[appId]/entities/[entity]
   │      ├──> Stats  ──> /api/apps/[appId]/entities/[entity]
   │      └──> Chart  ──> /api/apps/[appId]/entities/[entity]
   │
   ├──> Dynamic API runtime ──> Prisma ──> PostgreSQL
   │
   └──> Workflows (create/update/delete) ──> Notifications / Webhooks
```

**Reliability under broken configs.** The runtime is designed to never crash
on bad input. `parseConfig()` is total: it accepts any input (object, string,
null), fills in missing fields, drops unknown things, and returns a valid
`AppConfig`. Unknown component kinds are rendered as an inline notice, not
exceptions. Each renderer component handles its own loading and error states.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# fill in DATABASE_URL, NEXTAUTH_SECRET, MISTRAL_API_KEY, etc.

# 3. Initialize the database
npx prisma db push

# 4. Run
npm run dev
```

Open http://localhost:3000 and sign up.

### Required env vars

| Var | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon free tier works). |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32`. |
| `MISTRAL_API_KEY` | From https://console.mistral.ai/. Optional — a demo CRM is used if missing. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional, enables Google login. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional, enables GitHub login + per-user export. |
| `GITHUB_EXPORT_TOKEN` | Optional PAT (with `repo` scope) used as a fallback when exporting to GitHub. |

## How the runtime works

### Config shape (abridged)

```jsonc
{
  "name": "CRM",
  "entities": [
    { "name": "Customer", "fields": [
      { "name": "name", "type": "string", "required": true, "showInList": true },
      { "name": "email", "type": "email" },
      { "name": "status", "type": "select", "options": [
        { "value": "active", "label": "Active" }
      ]}
    ]}
  ],
  "pages": [
    { "id": "home", "route": "/", "root": { "kind": "hero", "props": { "title": "Welcome" } } },
    { "id": "list", "route": "/customers", "entity": "Customer",
      "root": { "kind": "table", "props": { "entity": "Customer" } } },
    { "id": "new", "route": "/customers/new", "entity": "Customer",
      "root": { "kind": "form", "props": { "entity": "Customer", "successRoute": "/customers" } } }
  ],
  "i18n": {
    "en": { "page.list.title": "Customers" },
    "es": { "page.list.title": "Clientes" }
  }
}
```

### Adding a new component kind

1. Create `components/renderer/components/MyComponent.tsx`.
2. Register it in `components/renderer/registry.tsx`.
3. Done — any page in any app can use `{ "kind": "my-component" }`.

### Adding a new field type

1. Add the type to the union in `lib/config/types.ts`.
2. Add validation rules in `lib/config/parser.ts → buildEntityZodSchema`.
3. Add the input UI in `components/renderer/components/Form.tsx → FieldInput`.

## Deploy

- **Vercel**: import the repo, add env vars, set the build command to `prisma generate && next build`.
- **Railway / Render**: same env vars; use the included `npm start`.
- **Neon**: provision a free Postgres, paste the connection string into `DATABASE_URL`.

## License

MIT
