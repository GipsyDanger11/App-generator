'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Renderer, ErrorState } from '@/components/renderer/Renderer';
import { setI18nContext } from '@/components/renderer/useT';
import { listLocales, translate } from '@/lib/i18n';
import { Bell, Globe, Menu, X, Upload, ArrowLeft, Rocket, Github as GithubIcon, Code2 } from 'lucide-react';
import type { AppConfig } from '@/lib/config/types';
import { CsvImport } from './CsvImport';
import { ConfigView } from './ConfigView';
import { GithubExport } from './GithubExport';
import { Deploy } from './Deploy';

interface Props {
  appId: string;
  name: string;
  slug: string;
  description: string;
  config: AppConfig;
  defaultLocale: string;
  supportedLocales: string[];
  themeColor?: string;
  themeAccent?: string;
}

export function AppRunner(props: Props) {
  const [locale, setLocale] = useState(props.defaultLocale);

  // Apply theme colors as CSS custom properties so every component picks them up.
  const themeStyle = props.themeColor
    ? ({ '--app-primary': props.themeColor, '--app-accent': props.themeAccent ?? props.themeColor } as React.CSSProperties)
    : undefined;
  const [route, setRoute] = useState<string>('/');
  const [page, setPage] = useState<'preview' | 'config' | 'export' | 'deploy'>('preview');
  const [navOpen, setNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body?: string | null; read: boolean; createdAt: string }>>([]);
  const [importEntity, setImportEntity] = useState<string | null>(null);

  // Update i18n context for the renderer.
  useEffect(() => {
    setI18nContext({ i18n: props.config.i18n, locale });
  }, [locale, props.config.i18n]);

  // Poll notifications.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch('/api/notifications');
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setNotifications(j);
      } catch {}
    }
    load();
    const t = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const pages = props.config.pages ?? [];

  // Deduplicate pages by (route, kind) so the same route with multiple
  // page definitions (e.g. home hero + home stats) is collapsed into one
  // entry in the sidebar. We keep the FIRST occurrence per unique route.
  const uniqueRoutes = Array.from(
    new Map(pages.map((p) => [p.route, p])).entries()
  ).map(([, p]) => p);

  const currentPage = useMemo(() => {
    if (route === '/') return pages.find((p) => p.route === '/') ?? pages[0];
    return pages.find((p) => p.route === route) ?? pages[0];
  }, [pages, route]);

  const unread = notifications.filter((n) => !n.read).length;
  const locales = listLocales(props.config.i18n, props.supportedLocales);

  return (
    <div className="min-h-screen flex flex-col" style={themeStyle}>
      {/* Top bar with gradient */}
      <header
        className="text-white shadow-lg"
        style={{ background: 'linear-gradient(to right, var(--app-primary, #6d28d9), color-mix(in srgb, var(--app-primary, #6d28d9) 70%, var(--app-accent, #c026d3) 30%), var(--app-accent, #6d28d9))' }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2 px-4 h-14">
          <button onClick={() => setNavOpen((v) => !v)} className="md:hidden p-2 -ml-2 rounded hover:bg-white/10" aria-label="Menu">
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <a href="/dashboard" className="text-sm text-purple-100 hover:text-white inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
          </a>
          <div className="font-semibold ml-2 truncate">{props.name}</div>
          <div className="ml-auto flex items-center gap-1">
            <div className="hidden md:flex rounded-md border border-white/20 overflow-hidden text-sm">
              {([
                { v: 'preview', label: 'Preview', icon: null },
                { v: 'config', label: 'Config', icon: Code2 },
                { v: 'export', label: 'GitHub', icon: GithubIcon },
                { v: 'deploy', label: 'Deploy', icon: Rocket },
              ] as const).map((t) => (
                <button key={t.v} onClick={() => setPage(t.v)} className={`px-3 py-1.5 inline-flex items-center gap-1 ${page === t.v ? 'bg-white text-purple-700 font-medium' : 'text-purple-50 hover:bg-white/10'}`}>
                  {t.icon && <t.icon className="h-3.5 w-3.5" />} {t.label}
                </button>
              ))}
            </div>
            {locales.length > 1 && (
              <div className="relative ml-1">
                <select aria-label="Locale" value={locale} onChange={(e) => setLocale(e.target.value)} className="appearance-none pl-7 pr-2 py-1.5 rounded-md border border-white/30 bg-white/10 text-white text-sm">
                  {locales.map((l) => <option key={l} value={l} className="text-slate-900">{l.toUpperCase()}</option>)}
                </select>
                <Globe className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-purple-100" />
              </div>
            )}
            <button onClick={() => setNotifOpen((v) => !v)} className="relative p-2 rounded-md hover:bg-white/10" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-purple-900 text-[10px] font-bold rounded-full px-1.5 py-0.5">{unread}</span>}
            </button>
          </div>
        </div>
        {notifOpen && (
          <div className="border-t border-white/10 bg-white/95 text-slate-900 max-h-80 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Notifications</h3>
                <button onClick={async () => { await fetch('/api/notifications', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) }); setNotifOpen(false); }} className="text-xs text-purple-600 hover:underline">Mark all read</button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500">No notifications yet.</p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id} className={`text-sm rounded-md border px-3 py-2 ${n.read ? 'border-purple-100 bg-white' : 'border-purple-300 bg-purple-50'}`}>
                      <div className="font-medium">{n.title}</div>
                      {n.body && <div className="text-slate-600 text-xs mt-0.5">{n.body}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 flex">
        {/* Sidebar nav (pages + entities) */}
        <aside className={`${navOpen ? 'block' : 'hidden'} md:block w-60 shrink-0 border-r border-purple-100 bg-white`}>
          <nav className="p-3 space-y-1">
            <div className="text-xs font-medium uppercase text-purple-500 px-2 pt-2">Pages</div>
            {uniqueRoutes.map((p) => (
              <button key={p.route} onClick={() => { setRoute(p.route); setNavOpen(false); setPage('preview'); }} className={`w-full text-left px-2 py-1.5 rounded text-sm transition ${route === p.route && page === 'preview' ? 'bg-purple-100 text-purple-900 font-medium' : 'text-slate-700 hover:bg-purple-50'}`}>
                {translate(props.config.i18n, locale, `page.${p.id}.title`, p.title ?? p.route)}
              </button>
            ))}
            {props.config.entities.length > 0 && (
              <>
                <div className="text-xs font-medium uppercase text-purple-500 px-2 pt-4">Entities</div>
                {props.config.entities.map((e) => (
                  <div key={e.name} className="px-2 py-1 text-sm flex items-center justify-between">
                    <span className="text-slate-700">{e.label ?? e.name}</span>
                    <button onClick={() => setImportEntity(e.name)} className="text-xs text-purple-600 hover:text-purple-800 inline-flex items-center gap-1">
                      <Upload className="h-3 w-3" /> CSV
                    </button>
                  </div>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:py-8 bg-gradient-to-b from-purple-50/30 to-white">
          {page === 'preview' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Render every page whose route matches — home can have hero + stats stacked */}
              {pages.filter((p) => p.route === route).length > 0
                ? pages
                    .filter((p) => p.route === route)
                    .map((p) => (
                      <Renderer key={p.id} node={p.root} appId={props.appId} entityName={p.entity ?? currentPage?.entity} />
                    ))
                : <ErrorState message="This app has no pages." />
              }
            </div>
          )}
          {page === 'config' && <ConfigView appId={props.appId} initialConfig={props.config} />}
          {page === 'export' && <GithubExport appId={props.appId} defaultName={props.slug} />}
          {page === 'deploy' && <Deploy appId={props.appId} appName={props.name} />}
        </main>
      </div>

      {importEntity && (
        <CsvImport
          appId={props.appId}
          entity={importEntity}
          onClose={() => setImportEntity(null)}
        />
      )}
    </div>
  );
}
