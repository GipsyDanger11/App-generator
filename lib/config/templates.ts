// Built-in templates that work without any AI call. These are used as the
// "use template" path in the builder and as a reliable fallback when
// Mistral is unavailable or returns invalid output.

import type { AppConfig } from './types';

export interface Template { id: string; name: string; description: string; emoji: string; config: AppConfig }

export const TEMPLATES: Template[] = [
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Track daily habits, streaks, and progress with stats.',
    emoji: '🌱',
    config: {
      name: 'Habit Tracker',
      description: 'Build better habits, one day at a time.',
      theme: { primary: '#7c3aed', accent: '#a855f7', logoText: '🌱 Habits' },
      entities: [
        {
          name: 'Habit',
          label: 'Habit',
          labelPlural: 'Habits',
          fields: [
            { name: 'name', type: 'string', label: 'Name', required: true, showInList: true, sortable: true, searchable: true },
            { name: 'description', type: 'text', label: 'Description' },
            { name: 'icon', type: 'string', label: 'Icon (emoji)' },
            { name: 'frequency', type: 'select', label: 'Frequency', options: [
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'weekdays', label: 'Weekdays only' },
            ] },
            { name: 'streak', type: 'number', label: 'Current streak', default: 0, showInList: true },
            { name: 'bestStreak', type: 'number', label: 'Best streak', default: 0 },
            { name: 'lastCompleted', type: 'date', label: 'Last completed' },
            { name: 'color', type: 'string', label: 'Color (hex)' },
          ],
        },
        {
          name: 'Entry',
          label: 'Entry',
          labelPlural: 'Entries',
          fields: [
            { name: 'habit', type: 'relation', label: 'Habit', entity: 'Habit' },
            { name: 'date', type: 'date', label: 'Date', required: true },
            { name: 'completed', type: 'boolean', label: 'Completed?', default: true, showInList: true },
            { name: 'note', type: 'text', label: 'Note' },
          ],
        },
      ],
      pages: [
        { id: 'home', route: '/', title: 'Home', root: { kind: 'hero', props: {
          title: 'Build Better Habits, One Day at a Time',
          subtitle: 'Track your daily habits, maintain streaks, and watch your progress grow.',
        } } },
        { id: 'home-cta', route: '/', title: 'Home', root: { kind: 'spacer', props: { height: 16 }, children: [
          { kind: 'stats', props: {
            items: [
              { label: 'Total habits', source: { entity: 'Habit', op: 'count' } },
              { label: 'Active streaks', source: { entity: 'Habit', field: 'streak', op: 'sum' } },
              { label: 'Best streak', source: { entity: 'Habit', field: 'bestStreak', op: 'max' } },
              { label: 'Entries today', source: { entity: 'Entry', op: 'count' } },
            ],
          } },
        ] } },
        { id: 'habits', route: '/habits', title: 'Habits', entity: 'Habit', root: { kind: 'table', props: { entity: 'Habit', pageSize: 20 } } },
        { id: 'habits-new', route: '/habits/new', title: 'New habit', entity: 'Habit', root: { kind: 'form', props: { entity: 'Habit', mode: 'create', successRoute: '/habits' } } },
        { id: 'entries', route: '/entries', title: 'Entries', entity: 'Entry', root: { kind: 'table', props: { entity: 'Entry', pageSize: 50 } } },
        { id: 'entries-new', route: '/entries/new', title: 'Log entry', entity: 'Entry', root: { kind: 'form', props: { entity: 'Entry', mode: 'create', successRoute: '/entries' } } },
        { id: 'progress', route: '/progress', title: 'Progress', root: { kind: 'chart', props: { entity: 'Entry', field: 'completed', groupBy: 'date', title: 'Completions by date' } } },
      ],
      i18n: {
        en: { 'page.habits.title': 'My Habits', 'page.entries.title': 'Habit Entries', 'page.progress.title': 'Progress' },
      },
    },
  },
  {
    id: 'crm',
    name: 'Mini CRM',
    description: 'Track customers, deals, and revenue.',
    emoji: '💼',
    config: {
      name: 'Mini CRM',
      description: 'Your customers and deals, in one place.',
      theme: { primary: '#7c3aed', accent: '#a855f7' },
      entities: [
        { name: 'Customer', label: 'Customer', labelPlural: 'Customers', fields: [
          { name: 'name', type: 'string', label: 'Name', required: true, showInList: true, searchable: true },
          { name: 'email', type: 'email', label: 'Email' },
          { name: 'company', type: 'string', label: 'Company' },
          { name: 'status', type: 'select', label: 'Status', options: [
            { value: 'active', label: 'Active' }, { value: 'lead', label: 'Lead' }, { value: 'inactive', label: 'Inactive' },
          ] },
        ] },
        { name: 'Deal', label: 'Deal', labelPlural: 'Deals', fields: [
          { name: 'title', type: 'string', label: 'Title', required: true, showInList: true },
          { name: 'amount', type: 'number', label: 'Amount', showInList: true },
          { name: 'stage', type: 'select', label: 'Stage', options: [
            { value: 'new', label: 'New' }, { value: 'qualified', label: 'Qualified' },
            { value: 'won', label: 'Won' }, { value: 'lost', label: 'Lost' },
          ] },
          { name: 'customer', type: 'relation', label: 'Customer', entity: 'Customer' },
        ] },
      ],
      pages: [
        { id: 'home', route: '/', title: 'Home', root: { kind: 'hero', props: { title: 'Welcome to your CRM', subtitle: 'Track customers and deals.' } } },
        { id: 'home-stats', route: '/', title: 'Home', root: { kind: 'stats', props: { items: [
          { label: 'Customers', source: { entity: 'Customer', op: 'count' } },
          { label: 'Deals', source: { entity: 'Deal', op: 'count' } },
          { label: 'Total revenue', source: { entity: 'Deal', field: 'amount', op: 'sum' } },
          { label: 'Avg deal', source: { entity: 'Deal', field: 'amount', op: 'avg' } },
        ] } } },
        { id: 'customers', route: '/customers', title: 'Customers', entity: 'Customer', root: { kind: 'table', props: { entity: 'Customer' } } },
        { id: 'customers-new', route: '/customers/new', title: 'New customer', entity: 'Customer', root: { kind: 'form', props: { entity: 'Customer', mode: 'create', successRoute: '/customers' } } },
        { id: 'deals', route: '/deals', title: 'Deals', entity: 'Deal', root: { kind: 'table', props: { entity: 'Deal' } } },
        { id: 'deals-new', route: '/deals/new', title: 'New deal', entity: 'Deal', root: { kind: 'form', props: { entity: 'Deal', mode: 'create', successRoute: '/deals' } } },
      ],
    },
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Track products and stock levels.',
    emoji: '📦',
    config: {
      name: 'Inventory',
      description: 'Know what you have, always.',
      entities: [
        { name: 'Product', label: 'Product', labelPlural: 'Products', fields: [
          { name: 'name', type: 'string', label: 'Name', required: true, showInList: true, searchable: true },
          { name: 'sku', type: 'string', label: 'SKU' },
          { name: 'stock', type: 'number', label: 'Stock', showInList: true },
          { name: 'reorderAt', type: 'number', label: 'Reorder at' },
          { name: 'price', type: 'number', label: 'Price' },
        ] },
      ],
      pages: [
        { id: 'home', route: '/', title: 'Home', root: { kind: 'hero', props: { title: 'Inventory', subtitle: 'Track products and stock.' } } },
        { id: 'home-stats', route: '/', title: 'Home', root: { kind: 'stats', props: { items: [
          { label: 'Products', source: { entity: 'Product', op: 'count' } },
          { label: 'Total stock', source: { entity: 'Product', field: 'stock', op: 'sum' } },
        ] } } },
        { id: 'list', route: '/products', title: 'Products', entity: 'Product', root: { kind: 'table', props: { entity: 'Product' } } },
        { id: 'new', route: '/products/new', title: 'New product', entity: 'Product', root: { kind: 'form', props: { entity: 'Product', mode: 'create', successRoute: '/products' } } },
      ],
    },
  },
  {
    id: 'blank',
    name: 'Blank app',
    description: 'Start from scratch.',
    emoji: '✨',
    config: {
      name: 'My App',
      description: 'A new app.',
      entities: [],
      pages: [{ id: 'home', route: '/', title: 'Welcome', root: { kind: 'hero', props: { title: 'Welcome to your app', subtitle: 'Edit the config to get started.' } } }],
    },
  },
];

export function findTemplate(id: string): Template | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}
