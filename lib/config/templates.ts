// Built-in templates that work without any AI call. These are used as the
// "use template" path in the builder and as a reliable fallback when
// Mistral is unavailable or returns invalid output.

import type { AppConfig } from './types';

export interface Template { id: string; name: string; description: string; emoji: string; config: AppConfig; skipValidation?: boolean }

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
          { name: 'sku', type: 'string', label: 'SKU', showInList: true },
          { name: 'category', type: 'string', label: 'Category' },
          { name: 'stock', type: 'number', label: 'Stock on hand', showInList: true, default: 0 },
          { name: 'reorderAt', type: 'number', label: 'Reorder at', default: 10 },
          { name: 'price', type: 'number', label: 'Unit price', showInList: true, default: 0 },
          { name: 'supplier', type: 'string', label: 'Supplier' },
          { name: 'notes', type: 'text', label: 'Notes' },
        ] },
        { name: 'Alert', label: 'Alert', labelPlural: 'Alerts', fields: [
          { name: 'product', type: 'relation', label: 'Product', entity: 'Product' },
          { name: 'message', type: 'string', label: 'Message', required: true },
          { name: 'severity', type: 'select', label: 'Severity', options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ], default: 'medium', showInList: true },
          { name: 'resolved', type: 'boolean', label: 'Resolved?', default: false, showInList: true },
        ] },
      ],
      pages: [
        { id: 'home', route: '/', title: 'Home', root: { kind: 'hero', props: { title: 'Inventory Manager', subtitle: 'Track your products and stock levels efficiently' } } },
        { id: 'home-stats', route: '/', title: 'Home', root: { kind: 'stats', props: { items: [
          { label: 'Total products', source: { entity: 'Product', op: 'count' } },
          { label: 'Low stock items', source: { entity: 'Product', field: 'stock', op: 'sum' } },
          { label: 'Open alerts', source: { entity: 'Alert', op: 'count' } },
          { label: 'Inventory value', source: { entity: 'Product', field: 'price', op: 'sum' } },
        ] } } },
        { id: 'products', route: '/products', title: 'Products', entity: 'Product', root: { kind: 'table', props: { entity: 'Product', pageSize: 20 } } },
        { id: 'products-new', route: '/products/new', title: 'New product', entity: 'Product', root: { kind: 'form', props: { entity: 'Product', mode: 'create', successRoute: '/products' } } },
        { id: 'alerts', route: '/alerts', title: 'Alerts', entity: 'Alert', root: { kind: 'table', props: { entity: 'Alert', pageSize: 50 } } },
        { id: 'alerts-new', route: '/alerts/new', title: 'New alert', entity: 'Alert', root: { kind: 'form', props: { entity: 'Alert', mode: 'create', successRoute: '/alerts' } } },
      ],
    },
  },
  {
    id: 'tasks',
    name: 'Task Tracker',
    description: 'Track tasks, assignees, and due dates.',
    emoji: '✅',
    config: {
      name: 'Task Tracker',
      description: 'Get things done.',
      entities: [
        { name: 'Task', label: 'Task', labelPlural: 'Tasks', fields: [
          { name: 'title', type: 'string', label: 'Title', required: true, showInList: true, searchable: true },
          { name: 'description', type: 'text', label: 'Description' },
          { name: 'status', type: 'select', label: 'Status', options: [
            { value: 'todo', label: 'To do' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'done', label: 'Done' },
          ], default: 'todo', showInList: true },
          { name: 'priority', type: 'select', label: 'Priority', options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ], default: 'medium', showInList: true },
          { name: 'assignee', type: 'string', label: 'Assignee' },
          { name: 'dueDate', type: 'date', label: 'Due date', showInList: true },
        ] },
      ],
      pages: [
        { id: 'home', route: '/', title: 'Home', root: { kind: 'hero', props: { title: 'Task Tracker', subtitle: 'Get things done.' } } },
        { id: 'home-stats', route: '/', title: 'Home', root: { kind: 'stats', props: { items: [
          { label: 'Total tasks', source: { entity: 'Task', op: 'count' } },
          { label: 'To do', source: { entity: 'Task', op: 'count' } },
          { label: 'In progress', source: { entity: 'Task', op: 'count' } },
          { label: 'Done', source: { entity: 'Task', op: 'count' } },
        ] } } },
        { id: 'tasks', route: '/tasks', title: 'Tasks', entity: 'Task', root: { kind: 'table', props: { entity: 'Task', pageSize: 20 } } },
        { id: 'tasks-new', route: '/tasks/new', title: 'New task', entity: 'Task', root: { kind: 'form', props: { entity: 'Task', mode: 'create', successRoute: '/tasks' } } },
      ],
    },
  },
  {
    id: 'library',
    name: 'Library',
    description: 'Catalog books, movies, or recipes.',
    emoji: '📚',
    config: {
      name: 'Library',
      description: 'Your personal collection.',
      entities: [
        { name: 'Item', label: 'Item', labelPlural: 'Items', fields: [
          { name: 'title', type: 'string', label: 'Title', required: true, showInList: true, searchable: true },
          { name: 'author', type: 'string', label: 'Author / Director', showInList: true },
          { name: 'category', type: 'string', label: 'Category', showInList: true },
          { name: 'rating', type: 'number', label: 'Rating (1-5)', default: 0, showInList: true },
          { name: 'notes', type: 'text', label: 'Notes' },
        ] },
      ],
      pages: [
        { id: 'home', route: '/', title: 'Home', root: { kind: 'hero', props: { title: 'My Library', subtitle: 'Books, movies, recipes — all in one place.' } } },
        { id: 'home-stats', route: '/', title: 'Home', root: { kind: 'stats', props: { items: [
          { label: 'Total items', source: { entity: 'Item', op: 'count' } },
          { label: 'Avg rating', source: { entity: 'Item', field: 'rating', op: 'avg' } },
        ] } } },
        { id: 'items', route: '/items', title: 'Items', entity: 'Item', root: { kind: 'table', props: { entity: 'Item', pageSize: 30 } } },
        { id: 'items-new', route: '/items/new', title: 'New item', entity: 'Item', root: { kind: 'form', props: { entity: 'Item', mode: 'create', successRoute: '/items' } } },
      ],
    },
  },
  {
    id: 'expenses',
    name: 'Expense Tracker',
    description: 'Track expenses and budgets.',
    emoji: '💰',
    config: {
      name: 'Expense Tracker',
      description: 'Where does the money go?',
      entities: [
        { name: 'Expense', label: 'Expense', labelPlural: 'Expenses', fields: [
          { name: 'description', type: 'string', label: 'Description', required: true, showInList: true, searchable: true },
          { name: 'amount', type: 'number', label: 'Amount', required: true, showInList: true, default: 0 },
          { name: 'category', type: 'select', label: 'Category', options: [
            { value: 'food', label: 'Food' },
            { value: 'transport', label: 'Transport' },
            { value: 'housing', label: 'Housing' },
            { value: 'entertainment', label: 'Entertainment' },
            { value: 'other', label: 'Other' },
          ], showInList: true },
          { name: 'date', type: 'date', label: 'Date', required: true, showInList: true },
          { name: 'notes', type: 'text', label: 'Notes' },
        ] },
      ],
      pages: [
        { id: 'home', route: '/', title: 'Home', root: { kind: 'hero', props: { title: 'Expense Tracker', subtitle: 'See where your money goes.' } } },
        { id: 'home-stats', route: '/', title: 'Home', root: { kind: 'stats', props: { items: [
          { label: 'Total spent', source: { entity: 'Expense', field: 'amount', op: 'sum' } },
          { label: 'Expenses', source: { entity: 'Expense', op: 'count' } },
          { label: 'Avg amount', source: { entity: 'Expense', field: 'amount', op: 'avg' } },
        ] } } },
        { id: 'expenses', route: '/expenses', title: 'Expenses', entity: 'Expense', root: { kind: 'table', props: { entity: 'Expense', pageSize: 30 } } },
        { id: 'expenses-new', route: '/expenses/new', title: 'New expense', entity: 'Expense', root: { kind: 'form', props: { entity: 'Expense', mode: 'create', successRoute: '/expenses' } } },
      ],
    },
  },
  {
    id: 'blank',
    name: 'Blank app',
    description: 'Start from scratch.',
    emoji: '✨',
    skipValidation: true,
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

/**
 * Validate that an AppConfig is actually useful — has entities and non-hero pages.
 * This is a lightweight version for template validation to avoid circular dependencies.
 * Returns { valid: boolean, reason?: string }.
 */
function validateTemplateConfig(cfg: AppConfig): { valid: boolean; reason?: string } {
  // Check for at least one entity
  if (cfg.entities.length === 0) {
    return { valid: false, reason: 'No entities defined' };
  }

  // Check for at least one table page
  const tablePages = cfg.pages.filter((p) => p.root?.kind === 'table');
  if (tablePages.length === 0) {
    return { valid: false, reason: 'No table pages found' };
  }

  // Check for at least one form page
  const formPages = cfg.pages.filter((p) => p.root?.kind === 'form');
  if (formPages.length === 0) {
    return { valid: false, reason: 'No form pages found' };
  }

  return { valid: true };
}

/**
 * Validate all template configs at module initialization.
 * This ensures all curated templates are valid complete apps (fail-fast).
 */
export function validateAllTemplates(): void {
  console.log('[templates] Validating template configs at startup...');
  
  const results: { id: string; valid: boolean; reason?: string }[] = [];
  
  for (const template of TEMPLATES) {
    // Templates marked skipValidation (e.g. blank starter) are intentionally minimal
    if (template.skipValidation) {
      console.log(`[templates] ⊘ Template "${template.id}" skipped (skipValidation=true)`);
      results.push({ id: template.id, valid: true });
      continue;
    }

    const validation = validateTemplateConfig(template.config);
    
    if (validation.valid) {
      console.log(`[templates] ✓ Template "${template.id}" is valid`, {
        entities: template.config.entities.length,
        pages: template.config.pages.length,
        tablePages: template.config.pages.filter(p => p.root?.kind === 'table').length,
        formPages: template.config.pages.filter(p => p.root?.kind === 'form').length,
      });
      results.push({ id: template.id, valid: true });
    } else {
      console.error(`[templates] ✗ Template "${template.id}" is INVALID: ${validation.reason}`, {
        entities: template.config.entities.length,
        pages: template.config.pages.length,
        pageKinds: template.config.pages.map(p => p.root?.kind),
      });
      results.push({ id: template.id, valid: false, reason: validation.reason });
    }
  }
  
  const invalidTemplates = results.filter(r => !r.valid);
  
  if (invalidTemplates.length > 0) {
    const errorMsg = `Template validation FAILED! Invalid templates: ${invalidTemplates.map(t => `${t.id} (${t.reason})`).join(', ')}`;
    console.error('[templates]', errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log(`[templates] ✅ All ${TEMPLATES.length} template configs validated successfully`);
}

// Run validation at module initialization (server-side only)
if (typeof window === 'undefined') {
  validateAllTemplates();
}
