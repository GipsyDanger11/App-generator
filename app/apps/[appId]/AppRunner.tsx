'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Renderer, ErrorState } from '@/components/renderer/Renderer';
import { setI18nContext } from '@/components/renderer/useT';
import { listLocales, translate } from '@/lib/i18n';
import {
  Bell, Globe, Menu, X, Upload, ArrowLeft, Rocket,
  Github as GithubIcon, Code2, Home, TableProperties,
  PlusCircle, ChevronRight, ChevronDown, ChevronUp,
} from 'lucide-react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body?: string | null; read: boolean; createdAt: string }>>([]);
  const [importEntity, setImportEntity] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Update i18n context for the renderer.
  useEffect(() => {
    setI18nContext({ i18n: props.config.i18n, locale });
  }, [locale, props.config.i18n]);

  // Initialize all entity sections as expanded
  useEffect(() => {
    const sections: Record<string, boolean> = {};
    props.config.entities.forEach((e) => { sections[e.name] = true; });
    setExpandedSections(sections);
  }, [props.config.entities]);

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

  // Deduplicate pages by route
  const uniqueRoutes = Array.from(
    new Map(pages.map((p) => [p.route, p])).entries()
  ).map(([, p]) => p);

  // Build entity-based navigation structure
  const entityNav = useMemo(() => {
    return props.config.entities.map((entity) => {
      const entitySlug = entity.name.toLowerCase();
      // Find pages that match this entity
      const listRoute = pages.find(
        (p) => p.entity === entity.name && p.root?.kind === 'table'
      )?.route ?? `/${entitySlug}`;
      const newRoute = pages.find(
        (p) => p.entity === entity.name && p.root?.kind === 'form'
      )?.route ?? `/${entitySlug}/new`;

      return {
        entity,
        listRoute,
        newRoute,
        label: entity.label ?? entity.labelPlural ?? entity.name,
      };
    });
  }, [pages, props.config.entities]);

  const currentPage = useMemo(() => {
    if (route === '/') return pages.find((p) => p.route === '/') ?? pages[0];
    return pages.find((p) => p.route === route) ?? pages[0];
  }, [pages, route]);

  // Build breadcrumb
  const breadcrumb = useMemo(() => {
    if (route === '/') return [{ label: 'Home', route: '/' }];
    const crumbs: Array<{ label: string; route: string }> = [{ label: 'Home', route: '/' }];
    // Find entity for this route
    const entityMatch = entityNav.find(
      (en) => en.listRoute === route || en.newRoute === route
    );
    if (entityMatch) {
      crumbs.push({ label: entityMatch.label, route: entityMatch.listRoute });
      if (route === entityMatch.newRoute) {
        crumbs.push({ label: `New ${entityMatch.entity.name}`, route: route });
      }
    } else if (currentPage) {
      crumbs.push({ label: currentPage.title ?? route, route: route });
    }
    return crumbs;
  }, [route, entityNav, currentPage]);

  const unread = notifications.filter((n) => !n.read).length;
  const locales = listLocales(props.config.i18n, props.supportedLocales);

  function toggleSection(entityName: string) {
    setExpandedSections((prev) => ({ ...prev, [entityName]: !prev[entityName] }));
  }

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
        {/* Sidebar nav (pages + entities) — collapsible on desktop */}
        <aside className={`${navOpen ? 'block' : 'hidden'} md:block ${sidebarCollapsed ? 'w-14' : 'w-64'} shrink-0 border-r border-purple-100 bg-white transition-all duration-200`}>
          <nav className="p-3 space-y-1">
            {/* Collapse toggle (desktop) */}
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="hidden md:flex w-full items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors mb-2"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-90" />}
            </button>

            {/* Home link */}
            <button
              onClick={() => { setRoute('/'); setNavOpen(false); setPage('preview'); }}
              className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                route === '/' && page === 'preview'
                  ? 'bg-purple-100 text-purple-900 font-medium shadow-sm'
                  : 'text-slate-700 hover:bg-purple-50'
              }`}
            >
              <Home className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Home</span>}
            </button>

            {/* Entity sections */}
            {entityNav.map((en) => (
              <div key={en.entity.name} className="mt-1">
                {!sidebarCollapsed && (
                  <button
                    onClick={() => toggleSection(en.entity.name)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-500 hover:text-purple-700 transition-colors"
                  >
                    <span>{en.label}</span>
                    {expandedSections[en.entity.name]
                      ? <ChevronUp className="h-3 w-3" />
                      : <ChevronDown className="h-3 w-3" />
                    }
                  </button>
                )}
                {(sidebarCollapsed || expandedSections[en.entity.name]) && (
                  <div className="space-y-0.5">
                    {/* List link */}
                    <button
                      onClick={() => { setRoute(en.listRoute); setNavOpen(false); setPage('preview'); }}
                      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                        route === en.listRoute && page === 'preview'
                          ? 'bg-purple-100 text-purple-900 font-medium shadow-sm'
                          : 'text-slate-600 hover:bg-purple-50 hover:text-slate-800'
                      }`}
                    >
                      <TableProperties className="h-4 w-4 shrink-0 text-slate-400" />
                      {!sidebarCollapsed && <span>List</span>}
                    </button>
                    {/* + New link */}
                    <button
                      onClick={() => { setRoute(en.newRoute); setNavOpen(false); setPage('preview'); }}
                      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                        route === en.newRoute && page === 'preview'
                          ? 'bg-purple-100 text-purple-900 font-medium shadow-sm'
                          : 'text-slate-600 hover:bg-purple-50 hover:text-slate-800'
                      }`}
                    >
                      <PlusCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      {!sidebarCollapsed && <span>+ New</span>}
                    </button>
                    {/* CSV import */}
                    {!sidebarCollapsed && (
                      <button
                        onClick={() => setImportEntity(en.entity.name)}
                        className="w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5 shrink-0" />
                        <span>Import CSV</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Additional pages not tied to entities */}
            {uniqueRoutes.filter(p => p.route !== '/' && !entityNav.some(en => en.listRoute === p.route || en.newRoute === p.route)).length > 0 && (
              <>
                {!sidebarCollapsed && (
                  <div className="text-xs font-semibold uppercase tracking-wider text-purple-500 px-2.5 pt-4 pb-1">
                    Other Pages
                  </div>
                )}
                {uniqueRoutes
                  .filter(p => p.route !== '/' && !entityNav.some(en => en.listRoute === p.route || en.newRoute === p.route))
                  .map((p) => (
                    <button
                      key={p.route}
                      onClick={() => { setRoute(p.route); setNavOpen(false); setPage('preview'); }}
                      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                        route === p.route && page === 'preview'
                          ? 'bg-purple-100 text-purple-900 font-medium shadow-sm'
                          : 'text-slate-600 hover:bg-purple-50 hover:text-slate-800'
                      }`}
                    >
                      {!sidebarCollapsed && (
                        <span>{translate(props.config.i18n, locale, `page.${p.id}.title`, p.title ?? p.route)}</span>
                      )}
                    </button>
                  ))
                }
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:py-8 bg-gradient-to-b from-purple-50/30 to-white">
          {page === 'preview' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Breadcrumb */}
              {breadcrumb.length > 1 && (
                <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-2" aria-label="Breadcrumb">
                  {breadcrumb.map((crumb, i) => (
                    <React.Fragment key={crumb.route}>
                      {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                      {i < breadcrumb.length - 1 ? (
                        <button
                          onClick={() => setRoute(crumb.route)}
                          className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="text-slate-700 font-medium">{crumb.label}</span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              )}

              {/* Render every page whose route matches — home can have hero + stats stacked */}
              {pages.filter((p) => p.route === route).length > 0
                ? pages
                    .filter((p) => p.route === route)
                    .map((p) => (
                      <Renderer key={p.id} node={p.root} appId={props.appId} entityName={p.entity ?? currentPage?.entity} config={props.config} />
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
