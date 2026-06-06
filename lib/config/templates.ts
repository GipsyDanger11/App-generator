// Built-in templates — each one intentionally uses a DIFFERENT combination of
// page components (kanban, timeline, chart-first, card-heavy, etc.) so every
// template feels like a distinct product, not the same layout with a new name.

import type { AppConfig } from './types';

export interface Template {
  id: string; name: string; description: string; emoji: string;
  config: AppConfig; skipValidation?: boolean;
}

export const TEMPLATES: Template[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // 1. CRM — kanban deal pipeline + customer table
  //    Unique: deals live on a KANBAN board, not a table
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'crm',
    name: 'Sales CRM',
    description: 'Kanban deal pipeline + customer list with revenue stats.',
    emoji: '💼',
    config: {
      name: 'Sales CRM',
      description: 'Close more deals. Track every customer. See your pipeline at a glance.',
      theme: { primary: '#7c3aed', accent: '#a855f7', logoText: '💼 CRM' },
      entities: [
        { name: 'Customer', label: 'Customer', labelPlural: 'Customers', fields: [
          { name: 'name',    type: 'string', label: 'Name',    required: true, showInList: true, searchable: true },
          { name: 'email',   type: 'email',  label: 'Email',   showInList: true },
          { name: 'company', type: 'string', label: 'Company', showInList: true },
          { name: 'phone',   type: 'string', label: 'Phone' },
          { name: 'status',  type: 'select', label: 'Status',  showInList: true, options: [
            { value: 'lead', label: 'Lead' }, { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }, { value: 'churned', label: 'Churned' },
          ]},
          { name: 'notes', type: 'text', label: 'Notes' },
        ]},
        { name: 'Deal', label: 'Deal', labelPlural: 'Deals', fields: [
          { name: 'title',     type: 'string',   label: 'Title',         required: true, showInList: true },
          { name: 'amount',    type: 'number',   label: 'Value ($)',      showInList: true },
          { name: 'stage',     type: 'select',   label: 'Stage',          showInList: true, options: [
            { value: 'new', label: 'New' }, { value: 'qualified', label: 'Qualified' },
            { value: 'proposal', label: 'Proposal' }, { value: 'negotiation', label: 'Negotiation' },
            { value: 'won', label: 'Won ✓' }, { value: 'lost', label: 'Lost ✗' },
          ]},
          { name: 'customer',  type: 'relation', label: 'Customer',       entity: 'Customer', showInList: true },
          { name: 'closeDate', type: 'date',     label: 'Expected Close', showInList: true },
          { name: 'notes',     type: 'text',     label: 'Notes' },
        ]},
      ],
      pages: [
        // HOME — big revenue stats + pipeline kanban
        { id: 'home',       route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Sales CRM', subtitle: 'Your entire pipeline — from first lead to closed deal.',
          cta: 'Add Deal', ctaRoute: '/deals/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Total Customers', source: { entity: 'Customer', op: 'count' } },
          { label: 'Open Deals',      source: { entity: 'Deal',     op: 'count' } },
          { label: 'Pipeline Value',  source: { entity: 'Deal', field: 'amount', op: 'sum' } },
          { label: 'Avg Deal Size',   source: { entity: 'Deal', field: 'amount', op: 'avg' } },
        ]}}},
        // PIPELINE — kanban is the main deals view
        { id: 'home-pipeline-h', route: '/', title: 'Pipeline', root: { kind: 'heading', props: { text: 'Deal Pipeline', level: 2 }}},
        { id: 'home-pipeline',   route: '/', title: 'Pipeline', entity: 'Deal', root: { kind: 'kanban', props: {
          entity: 'Deal', groupBy: 'stage',
          columns: ['new','qualified','proposal','negotiation','won','lost'],
        }}},

        // CUSTOMERS page — table with search
        { id: 'customers-h',   route: '/customers',     title: 'Customers', root: { kind: 'heading', props: { text: 'All Customers', level: 1 }}},
        { id: 'customers',     route: '/customers',     title: 'Customers', entity: 'Customer', root: { kind: 'table',  props: { entity: 'Customer', pageSize: 25 }}},
        { id: 'customers-new', route: '/customers/new', title: 'New Customer', entity: 'Customer', root: { kind: 'form', props: { entity: 'Customer', mode: 'create', successRoute: '/customers' }}},

        // DEALS page — kanban board (not a table)
        { id: 'deals-h',   route: '/deals',     title: 'Deals', root: { kind: 'heading', props: { text: 'Deal Board', level: 1 }}},
        { id: 'deals-stats', route: '/deals',   title: 'Deals', root: { kind: 'stats', props: { items: [
          { label: 'Total Value', source: { entity: 'Deal', field: 'amount', op: 'sum' } },
          { label: 'Avg Deal',    source: { entity: 'Deal', field: 'amount', op: 'avg' } },
          { label: 'Total Deals', source: { entity: 'Deal', op: 'count' } },
        ]}}},
        { id: 'deals',     route: '/deals',     title: 'Deals', entity: 'Deal', root: { kind: 'kanban', props: {
          entity: 'Deal', groupBy: 'stage',
          columns: ['new','qualified','proposal','negotiation','won','lost'],
        }}},
        { id: 'deals-new', route: '/deals/new', title: 'New Deal', entity: 'Deal', root: { kind: 'form', props: { entity: 'Deal', mode: 'create', successRoute: '/deals' }}},

        // REVENUE chart page
        { id: 'revenue-h',   route: '/revenue', title: 'Revenue', root: { kind: 'heading', props: { text: 'Revenue Analytics', level: 1 }}},
        { id: 'revenue-bar', route: '/revenue', title: 'Revenue', root: { kind: 'chart', props: {
          entity: 'Deal', groupBy: 'stage', field: 'amount', title: 'Value by Stage', type: 'bar',
        }}},
        { id: 'revenue-pie', route: '/revenue', title: 'Revenue', root: { kind: 'chart', props: {
          entity: 'Customer', groupBy: 'status', title: 'Customers by Status', type: 'pie',
        }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. TASK TRACKER — kanban board as the PRIMARY view
  //    Unique: home = kanban, /analytics = 2 charts, no chart on home
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'tasks',
    name: 'Task Board',
    description: 'Kanban-first task management with priority analytics.',
    emoji: '✅',
    config: {
      name: 'Task Board',
      description: 'Drag tasks from To Do → Done. Track who owns what.',
      theme: { primary: '#2563eb', accent: '#60a5fa', logoText: '✅ Tasks' },
      entities: [
        { name: 'Task', label: 'Task', labelPlural: 'Tasks', fields: [
          { name: 'title',    type: 'string', label: 'Title',    required: true, showInList: true, searchable: true },
          { name: 'status',   type: 'select', label: 'Status',   showInList: true, default: 'todo', options: [
            { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' },
            { value: 'review', label: 'In Review' }, { value: 'done', label: 'Done' },
          ]},
          { name: 'priority', type: 'select', label: 'Priority', showInList: true, default: 'medium', options: [
            { value: 'low', label: '🟢 Low' }, { value: 'medium', label: '🟡 Medium' },
            { value: 'high', label: '🔴 High' }, { value: 'urgent', label: '🚨 Urgent' },
          ]},
          { name: 'assignee',    type: 'string', label: 'Assignee', showInList: true },
          { name: 'dueDate',     type: 'date',   label: 'Due Date', showInList: true },
          { name: 'project',     type: 'select', label: 'Project',  showInList: true, options: [
            { value: 'design', label: 'Design' }, { value: 'dev', label: 'Development' },
            { value: 'marketing', label: 'Marketing' }, { value: 'ops', label: 'Operations' },
          ]},
          { name: 'description', type: 'text', label: 'Description' },
        ]},
      ],
      pages: [
        // HOME — stats + kanban (no chart on home, keep it action-focused)
        { id: 'home',       route: '/', title: 'Board', root: { kind: 'hero', props: {
          title: 'Task Board', subtitle: 'Your team\'s work — organized, prioritized, and tracked.',
          cta: 'Add Task', ctaRoute: '/tasks/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Board', root: { kind: 'stats', props: { items: [
          { label: 'Total Tasks',  source: { entity: 'Task', op: 'count' } },
          { label: 'In Progress',  source: { entity: 'Task', op: 'count' } },
          { label: 'Overdue',      source: { entity: 'Task', op: 'count' } },
          { label: 'Completed',    source: { entity: 'Task', op: 'count' } },
        ]}}},
        { id: 'home-board-h', route: '/', title: 'Board', root: { kind: 'heading', props: { text: 'Kanban Board', level: 2 }}},
        { id: 'home-board',   route: '/', title: 'Board', entity: 'Task', root: { kind: 'kanban', props: {
          entity: 'Task', groupBy: 'status',
          columns: ['todo', 'in_progress', 'review', 'done'],
        }}},

        // TASKS LIST — table for searching/filtering
        { id: 'tasks-h',   route: '/tasks',     title: 'All Tasks', root: { kind: 'heading', props: { text: 'All Tasks', level: 1 }}},
        { id: 'tasks',     route: '/tasks',     title: 'Tasks', entity: 'Task', root: { kind: 'table', props: { entity: 'Task', pageSize: 30 }}},
        { id: 'tasks-new', route: '/tasks/new', title: 'New Task', entity: 'Task', root: { kind: 'form', props: { entity: 'Task', mode: 'create', successRoute: '/' }}},

        // ANALYTICS — purely charts, no table
        { id: 'analytics-h',        route: '/analytics', title: 'Analytics', root: { kind: 'heading', props: { text: 'Task Analytics', level: 1 }}},
        { id: 'analytics-stats',    route: '/analytics', title: 'Analytics', root: { kind: 'stats', props: { items: [
          { label: 'Total Tasks', source: { entity: 'Task', op: 'count' } },
        ]}}},
        { id: 'analytics-priority', route: '/analytics', title: 'By Priority', root: { kind: 'chart', props: {
          entity: 'Task', groupBy: 'priority', title: 'Tasks by Priority', type: 'pie',
        }}},
        { id: 'analytics-project',  route: '/analytics', title: 'By Project', root: { kind: 'chart', props: {
          entity: 'Task', groupBy: 'project', title: 'Tasks by Project', type: 'bar',
        }}},
        { id: 'analytics-status',   route: '/analytics', title: 'By Status', root: { kind: 'chart', props: {
          entity: 'Task', groupBy: 'status', title: 'Tasks by Status', type: 'bar',
        }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. INVENTORY — alert-first dashboard; charts drive the home page
  //    Unique: home leads with alerts (not hero), stock chart is primary
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Stock levels, reorder alerts, and category breakdowns.',
    emoji: '📦',
    config: {
      name: 'Inventory Manager',
      description: 'Know exactly what you have — and what you\'re about to run out of.',
      theme: { primary: '#059669', accent: '#34d399', logoText: '📦 Stock' },
      entities: [
        { name: 'Product', label: 'Product', labelPlural: 'Products', fields: [
          { name: 'name',      type: 'string', label: 'Product Name', required: true, showInList: true, searchable: true },
          { name: 'sku',       type: 'string', label: 'SKU',          showInList: true },
          { name: 'category',  type: 'select', label: 'Category',     showInList: true, options: [
            { value: 'electronics', label: 'Electronics' }, { value: 'clothing', label: 'Clothing' },
            { value: 'food', label: 'Food & Drink' }, { value: 'tools', label: 'Tools' }, { value: 'office', label: 'Office' },
          ]},
          { name: 'stock',     type: 'number', label: 'Stock on Hand', showInList: true, default: 0 },
          { name: 'reorderAt', type: 'number', label: 'Reorder Level',  default: 10 },
          { name: 'price',     type: 'number', label: 'Unit Price ($)', showInList: true, default: 0 },
          { name: 'supplier',  type: 'string', label: 'Supplier',       showInList: true },
          { name: 'notes',     type: 'text',   label: 'Notes' },
        ]},
        { name: 'Alert', label: 'Alert', labelPlural: 'Alerts', fields: [
          { name: 'product',  type: 'relation', label: 'Product',  entity: 'Product', showInList: true },
          { name: 'message',  type: 'string',   label: 'Message',  required: true, showInList: true },
          { name: 'severity', type: 'select',   label: 'Severity', showInList: true, options: [
            { value: 'low', label: '🟢 Low' }, { value: 'medium', label: '🟡 Medium' }, { value: 'high', label: '🔴 High' },
          ], default: 'medium' },
          { name: 'resolved', type: 'boolean', label: 'Resolved?', default: false, showInList: true },
        ]},
      ],
      pages: [
        // HOME — chart-first (no hero banner, goes straight to data)
        { id: 'home-h',     route: '/', title: 'Inventory', root: { kind: 'heading', props: { text: 'Inventory Dashboard', level: 1 }}},
        { id: 'home-stats', route: '/', title: 'Inventory', root: { kind: 'stats', props: { items: [
          { label: 'Total Products',  source: { entity: 'Product', op: 'count' } },
          { label: 'Inventory Value', source: { entity: 'Product', field: 'price', op: 'sum' } },
          { label: 'Open Alerts',     source: { entity: 'Alert',   op: 'count' } },
          { label: 'Avg Unit Price',  source: { entity: 'Product', field: 'price', op: 'avg' } },
        ]}}},
        // Stock by category chart — immediately visible
        { id: 'home-chart', route: '/', title: 'Stock', root: { kind: 'chart', props: {
          entity: 'Product', groupBy: 'category', field: 'stock', title: 'Stock Levels by Category', type: 'bar',
        }}},
        // Alerts table inline on home
        { id: 'home-alerts-h', route: '/', title: 'Alerts', root: { kind: 'heading', props: { text: '🔴 Open Alerts', level: 2 }}},
        { id: 'home-alerts',   route: '/', title: 'Alerts', entity: 'Alert', root: { kind: 'table', props: { entity: 'Alert', pageSize: 5 }}},

        // PRODUCTS — full table with value chart above
        { id: 'products-h',     route: '/products',     title: 'Products', root: { kind: 'heading', props: { text: 'Product Catalogue', level: 1 }}},
        { id: 'products-stats', route: '/products',     title: 'Products', root: { kind: 'stats', props: { items: [
          { label: 'Products',   source: { entity: 'Product', op: 'count' } },
          { label: 'Total Value', source: { entity: 'Product', field: 'price', op: 'sum' } },
        ]}}},
        { id: 'products',     route: '/products',     title: 'Products', entity: 'Product', root: { kind: 'table', props: { entity: 'Product', pageSize: 25 }}},
        { id: 'products-new', route: '/products/new', title: 'Add Product', entity: 'Product', root: { kind: 'form', props: { entity: 'Product', mode: 'create', successRoute: '/products' }}},

        // ALERTS — full alert list
        { id: 'alerts-h',   route: '/alerts',     title: 'Alerts', root: { kind: 'heading', props: { text: 'Stock Alerts', level: 1 }}},
        { id: 'alerts',     route: '/alerts',     title: 'Alerts', entity: 'Alert', root: { kind: 'table', props: { entity: 'Alert', pageSize: 25 }}},
        { id: 'alerts-new', route: '/alerts/new', title: 'New Alert', entity: 'Alert', root: { kind: 'form', props: { entity: 'Alert', mode: 'create', successRoute: '/alerts' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. EXPENSE TRACKER — finance dashboard, charts dominate every page
  //    Unique: spending pie + bar on home AND list page; budgets comparison table
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'expenses',
    name: 'Expense Tracker',
    description: 'Log expenses with pie/bar breakdowns and budget limits.',
    emoji: '💰',
    config: {
      name: 'Expense Tracker',
      description: 'Every dollar tracked. Every category visualized. Every budget respected.',
      theme: { primary: '#d97706', accent: '#fbbf24', logoText: '💰 Budget' },
      entities: [
        { name: 'Expense', label: 'Expense', labelPlural: 'Expenses', fields: [
          { name: 'description',   type: 'string', label: 'Description',  required: true, showInList: true, searchable: true },
          { name: 'amount',        type: 'number', label: 'Amount ($)',   required: true, showInList: true, default: 0 },
          { name: 'category',      type: 'select', label: 'Category',     showInList: true, options: [
            { value: 'food',    label: '🍔 Food' }, { value: 'transport', label: '🚗 Transport' },
            { value: 'housing', label: '🏠 Housing' }, { value: 'utilities', label: '💡 Utilities' },
            { value: 'entertainment', label: '🎬 Entertainment' }, { value: 'health', label: '❤️ Health' },
            { value: 'shopping', label: '🛍️ Shopping' }, { value: 'other', label: '📦 Other' },
          ]},
          { name: 'date',          type: 'date',   label: 'Date',         required: true, showInList: true },
          { name: 'paymentMethod', type: 'select', label: 'Paid With',    showInList: true, options: [
            { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' },
            { value: 'bank', label: 'Bank Transfer' }, { value: 'upi', label: 'UPI / Wallet' },
          ]},
          { name: 'notes', type: 'text', label: 'Notes' },
        ]},
        { name: 'Budget', label: 'Budget', labelPlural: 'Budgets', fields: [
          { name: 'category', type: 'select', label: 'Category', required: true, showInList: true, options: [
            { value: 'food', label: 'Food' }, { value: 'transport', label: 'Transport' },
            { value: 'housing', label: 'Housing' }, { value: 'entertainment', label: 'Entertainment' },
            { value: 'health', label: 'Health' }, { value: 'shopping', label: 'Shopping' },
          ]},
          { name: 'limit',  type: 'number', label: 'Monthly Limit ($)', required: true, showInList: true },
          { name: 'period', type: 'select', label: 'Period', showInList: true, default: 'monthly', options: [
            { value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' },
          ]},
        ]},
      ],
      pages: [
        // HOME — finance-style: no hero, lead with numbers then charts
        { id: 'home-h',     route: '/', title: 'Finance', root: { kind: 'heading', props: { text: 'My Finances', level: 1 }}},
        { id: 'home-stats', route: '/', title: 'Finance', root: { kind: 'stats', props: { items: [
          { label: 'Total Spent',  source: { entity: 'Expense', field: 'amount', op: 'sum' } },
          { label: 'Transactions', source: { entity: 'Expense', op: 'count' } },
          { label: 'Avg Expense',  source: { entity: 'Expense', field: 'amount', op: 'avg' } },
          { label: 'Budgets Set',  source: { entity: 'Budget',  op: 'count' } },
        ]}}},
        // Two charts side-by-side on home (pie shows relative spending)
        { id: 'home-pie', route: '/', title: 'By Category', root: { kind: 'chart', props: {
          entity: 'Expense', groupBy: 'category', field: 'amount', title: 'Spending by Category', type: 'pie',
        }}},
        { id: 'home-bar', route: '/', title: 'By Payment', root: { kind: 'chart', props: {
          entity: 'Expense', groupBy: 'paymentMethod', field: 'amount', title: 'Spending by Payment Method', type: 'bar',
        }}},
        { id: 'home-recent-h', route: '/', title: 'Recent', root: { kind: 'heading', props: { text: 'Recent Expenses', level: 2 }}},
        { id: 'home-recent',   route: '/', title: 'Expenses', entity: 'Expense', root: { kind: 'table', props: { entity: 'Expense', pageSize: 8 }}},
        { id: 'home-cta',      route: '/', title: 'Log', root: { kind: 'button', props: { label: '+ Log Expense', route: '/expenses/new', variant: 'primary' }}},

        // EXPENSES — charts above the table
        { id: 'expenses-h',     route: '/expenses', title: 'Expenses', root: { kind: 'heading', props: { text: 'All Expenses', level: 1 }}},
        { id: 'expenses-stats', route: '/expenses', title: 'Expenses', root: { kind: 'stats', props: { items: [
          { label: 'Total', source: { entity: 'Expense', field: 'amount', op: 'sum' } },
          { label: 'Count', source: { entity: 'Expense', op: 'count' } },
          { label: 'Avg',   source: { entity: 'Expense', field: 'amount', op: 'avg' } },
        ]}}},
        { id: 'expenses-chart', route: '/expenses', title: 'By Category', root: { kind: 'chart', props: {
          entity: 'Expense', groupBy: 'category', field: 'amount', title: 'Spend by Category', type: 'bar',
        }}},
        { id: 'expenses',     route: '/expenses',     title: 'Expenses', entity: 'Expense', root: { kind: 'table', props: { entity: 'Expense', pageSize: 30 }}},
        { id: 'expenses-new', route: '/expenses/new', title: 'Log Expense', entity: 'Expense', root: { kind: 'form', props: { entity: 'Expense', mode: 'create', successRoute: '/expenses' }}},

        // BUDGETS
        { id: 'budgets-h',   route: '/budgets',     title: 'Budgets', root: { kind: 'heading', props: { text: 'Monthly Budgets', level: 1 }}},
        { id: 'budgets',     route: '/budgets',     title: 'Budgets', entity: 'Budget', root: { kind: 'table', props: { entity: 'Budget', pageSize: 20 }}},
        { id: 'budgets-new', route: '/budgets/new', title: 'Set Budget', entity: 'Budget', root: { kind: 'form', props: { entity: 'Budget', mode: 'create', successRoute: '/budgets' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. HABIT TRACKER — timeline for daily entries, streak table for habits
  //    Unique: /log page uses TIMELINE component, not a table
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Build streaks. Daily log shown as a timeline.',
    emoji: '🌱',
    config: {
      name: 'Habit Tracker',
      description: 'Build better habits, one day at a time.',
      theme: { primary: '#7c3aed', accent: '#a855f7', logoText: '🌱 Habits' },
      entities: [
        { name: 'Habit', label: 'Habit', labelPlural: 'Habits', fields: [
          { name: 'name',      type: 'string', label: 'Habit Name', required: true, showInList: true, searchable: true },
          { name: 'category',  type: 'select', label: 'Category',   showInList: true, options: [
            { value: 'health', label: '❤️ Health' }, { value: 'fitness', label: '💪 Fitness' },
            { value: 'mindfulness', label: '🧘 Mindfulness' }, { value: 'productivity', label: '⚡ Productivity' },
            { value: 'learning', label: '📚 Learning' }, { value: 'social', label: '👥 Social' },
          ]},
          { name: 'frequency', type: 'select', label: 'Frequency', showInList: true, default: 'daily', options: [
            { value: 'daily', label: 'Daily' }, { value: 'weekdays', label: 'Weekdays' }, { value: 'weekly', label: 'Weekly' },
          ]},
          { name: 'streak',     type: 'number', label: '🔥 Streak (days)',  showInList: true, default: 0 },
          { name: 'bestStreak', type: 'number', label: '🏆 Best Streak',    showInList: true, default: 0 },
          { name: 'lastDone',   type: 'date',   label: 'Last Completed',    showInList: true },
          { name: 'goal',       type: 'text',   label: 'Goal / Motivation' },
        ]},
        { name: 'Entry', label: 'Log Entry', labelPlural: 'Log Entries', fields: [
          { name: 'habit',     type: 'relation', label: 'Habit',      entity: 'Habit', showInList: true },
          { name: 'date',      type: 'date',    label: 'Date',        required: true, showInList: true },
          { name: 'completed', type: 'boolean', label: 'Completed?',  default: true, showInList: true },
          { name: 'mood',      type: 'select',  label: 'How did it feel?', showInList: true, options: [
            { value: '5', label: '😄 Amazing' }, { value: '4', label: '🙂 Good' },
            { value: '3', label: '😐 Okay' }, { value: '2', label: '😔 Struggled' }, { value: '1', label: '😞 Skipped' },
          ]},
          { name: 'note', type: 'text', label: 'Note / Reflection' },
        ]},
      ],
      pages: [
        // HOME — streaks front and center
        { id: 'home',       route: '/', title: 'My Habits', root: { kind: 'hero', props: {
          title: '🌱 Habit Tracker', subtitle: 'Small daily actions create extraordinary results.',
          cta: 'Log Today', ctaRoute: '/log/new',
        }}},
        { id: 'home-stats', route: '/', title: 'My Habits', root: { kind: 'stats', props: { items: [
          { label: 'Active Habits',  source: { entity: 'Habit', op: 'count' } },
          { label: 'Total Streaks',  source: { entity: 'Habit', field: 'streak', op: 'sum' } },
          { label: 'Best Streak',    source: { entity: 'Habit', field: 'bestStreak', op: 'avg' } },
          { label: 'Entries Logged', source: { entity: 'Entry', op: 'count' } },
        ]}}},
        { id: 'home-habits-h', route: '/', title: 'Habits', root: { kind: 'heading', props: { text: 'Active Habits & Streaks', level: 2 }}},
        { id: 'home-habits',   route: '/', title: 'Habits', entity: 'Habit', root: { kind: 'table', props: { entity: 'Habit', pageSize: 10 }}},

        // HABITS page — table + category chart
        { id: 'habits-h',     route: '/habits', title: 'Habits', root: { kind: 'heading', props: { text: 'All Habits', level: 1 }}},
        { id: 'habits-chart', route: '/habits', title: 'Habits', root: { kind: 'chart', props: {
          entity: 'Habit', groupBy: 'category', title: 'Habits by Category', type: 'pie',
        }}},
        { id: 'habits',     route: '/habits',     title: 'Habits', entity: 'Habit', root: { kind: 'table', props: { entity: 'Habit', pageSize: 25 }}},
        { id: 'habits-new', route: '/habits/new', title: 'Add Habit', entity: 'Habit', root: { kind: 'form', props: { entity: 'Habit', mode: 'create', successRoute: '/habits' }}},

        // LOG — timeline view (unique: not a table, shows entries chronologically)
        { id: 'log-h',       route: '/log', title: 'Daily Log', root: { kind: 'heading', props: { text: '📅 Daily Log', level: 1 }}},
        { id: 'log-stats',   route: '/log', title: 'Daily Log', root: { kind: 'stats', props: { items: [
          { label: 'Total Entries', source: { entity: 'Entry', op: 'count' } },
        ]}}},
        { id: 'log-timeline', route: '/log', title: 'Log', entity: 'Entry', root: { kind: 'timeline', props: {
          entity: 'Entry', dateField: 'date', titleField: 'habit', descriptionField: 'note',
        }}},
        { id: 'log-new', route: '/log/new', title: 'Log Entry', entity: 'Entry', root: { kind: 'form', props: { entity: 'Entry', mode: 'create', successRoute: '/log' }}},

        // PROGRESS — completion chart
        { id: 'progress-h',     route: '/progress', title: 'Progress', root: { kind: 'heading', props: { text: 'Progress Over Time', level: 1 }}},
        { id: 'progress-chart', route: '/progress', title: 'Progress', root: { kind: 'chart', props: {
          entity: 'Entry', groupBy: 'date', title: 'Daily Completions', type: 'bar',
        }}},
        { id: 'progress-mood',  route: '/progress', title: 'Progress', root: { kind: 'chart', props: {
          entity: 'Entry', groupBy: 'mood', title: 'Mood Distribution', type: 'pie',
        }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. PERSONAL LIBRARY — reading-list focused, status-driven, no charts
  //    Unique: minimal/clean — /reading shows only in-progress books,
  //    /done shows completed, /wishlist shows want-to-read
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'library',
    name: 'Personal Library',
    description: 'Catalog books, movies, courses — with status lists.',
    emoji: '📚',
    config: {
      name: 'My Library',
      description: 'Everything you\'ve read, watched, or learned.',
      theme: { primary: '#0f766e', accent: '#2dd4bf', logoText: '📚 Library' },
      entities: [
        { name: 'Item', label: 'Item', labelPlural: 'Items', fields: [
          { name: 'title',  type: 'string', label: 'Title',  required: true, showInList: true, searchable: true },
          { name: 'author', type: 'string', label: 'Author / Creator', showInList: true },
          { name: 'type',   type: 'select', label: 'Type', showInList: true, options: [
            { value: 'book',    label: '📖 Book' }, { value: 'movie',   label: '🎬 Movie' },
            { value: 'podcast', label: '🎙️ Podcast' }, { value: 'course', label: '🎓 Course' },
            { value: 'article', label: '📄 Article' },
          ]},
          { name: 'status', type: 'select', label: 'Status', showInList: true, options: [
            { value: 'wishlist', label: '⭐ Wishlist' }, { value: 'reading', label: '📖 Reading Now' },
            { value: 'done',     label: '✅ Finished' }, { value: 'dropped', label: '❌ Dropped' },
          ], default: 'wishlist' },
          { name: 'rating', type: 'number', label: 'Rating (1–5)', showInList: true, default: 0 },
          { name: 'genre',  type: 'string', label: 'Genre / Tags',  showInList: true },
          { name: 'year',   type: 'number', label: 'Year' },
          { name: 'review', type: 'text',   label: 'Review / Notes' },
        ]},
        { name: 'Collection', label: 'Collection', labelPlural: 'Collections', fields: [
          { name: 'name',        type: 'string', label: 'Name',        required: true, showInList: true },
          { name: 'description', type: 'text',   label: 'Description' },
          { name: 'type',        type: 'select', label: 'Type', showInList: true, options: [
            { value: 'reading_list', label: 'Reading List' }, { value: 'watchlist', label: 'Watchlist' },
            { value: 'favourites',   label: 'Favourites' },   { value: 'custom', label: 'Custom' },
          ]},
        ]},
      ],
      pages: [
        // HOME — stats + chart by type + current reading
        { id: 'home',       route: '/', title: 'Library', root: { kind: 'hero', props: {
          title: '📚 My Library', subtitle: 'Track everything you read, watch, and learn.',
          cta: 'Add Item', ctaRoute: '/items/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Library', root: { kind: 'stats', props: { items: [
          { label: 'Total Items', source: { entity: 'Item', op: 'count' } },
          { label: 'Finished',    source: { entity: 'Item', op: 'count' } },
          { label: 'Avg Rating',  source: { entity: 'Item', field: 'rating', op: 'avg' } },
          { label: 'Collections', source: { entity: 'Collection', op: 'count' } },
        ]}}},
        { id: 'home-reading-h', route: '/', title: 'Reading Now', root: { kind: 'heading', props: { text: '📖 Currently Reading / Watching', level: 2 }}},
        { id: 'home-reading',   route: '/', title: 'Items', entity: 'Item', root: { kind: 'table', props: { entity: 'Item', pageSize: 5 }}},

        // ALL ITEMS — full catalogue with rating chart
        { id: 'items-h',     route: '/items', title: 'All Items', root: { kind: 'heading', props: { text: 'Full Collection', level: 1 }}},
        { id: 'items-stats', route: '/items', title: 'Items',     root: { kind: 'stats', props: { items: [
          { label: 'Total',     source: { entity: 'Item', op: 'count' } },
          { label: 'Avg Rating', source: { entity: 'Item', field: 'rating', op: 'avg' } },
        ]}}},
        { id: 'items-type-chart', route: '/items', title: 'By Type', root: { kind: 'chart', props: {
          entity: 'Item', groupBy: 'type', title: 'Collection by Type', type: 'pie',
        }}},
        { id: 'items',     route: '/items',     title: 'Items', entity: 'Item', root: { kind: 'table', props: { entity: 'Item', pageSize: 30 }}},
        { id: 'items-new', route: '/items/new', title: 'Add Item', entity: 'Item', root: { kind: 'form', props: { entity: 'Item', mode: 'create', successRoute: '/items' }}},

        // WISHLIST — filtered view (want-to-read only concept via table)
        { id: 'wishlist-h', route: '/wishlist', title: 'Wishlist', root: { kind: 'heading', props: { text: '⭐ Wishlist', level: 1 }}},
        { id: 'wishlist',   route: '/wishlist', title: 'Wishlist', entity: 'Item', root: { kind: 'table', props: { entity: 'Item', pageSize: 20 }}},

        // COLLECTIONS
        { id: 'collections-h',   route: '/collections',     title: 'Collections', root: { kind: 'heading', props: { text: 'My Collections', level: 1 }}},
        { id: 'collections',     route: '/collections',     title: 'Collections', entity: 'Collection', root: { kind: 'table', props: { entity: 'Collection', pageSize: 20 }}},
        { id: 'collections-new', route: '/collections/new', title: 'New Collection', entity: 'Collection', root: { kind: 'form', props: { entity: 'Collection', mode: 'create', successRoute: '/collections' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 7. HR DASHBOARD — org chart view, headcount charts before tables
  //    Unique: home shows a department bar chart before any employee table;
  //    /reports is a pure-charts page
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hr',
    name: 'HR Dashboard',
    description: 'Headcount charts, employee directory, leave tracker.',
    emoji: '👥',
    config: {
      name: 'HR Dashboard',
      description: 'Headcount. Leave. Departments. All in one place.',
      theme: { primary: '#4f46e5', accent: '#818cf8', logoText: '👥 People' },
      entities: [
        { name: 'Employee', label: 'Employee', labelPlural: 'Employees', fields: [
          { name: 'name',       type: 'string', label: 'Full Name',   required: true, showInList: true, searchable: true },
          { name: 'email',      type: 'email',  label: 'Work Email',  showInList: true },
          { name: 'department', type: 'select', label: 'Department',  showInList: true, options: [
            { value: 'engineering', label: 'Engineering' }, { value: 'design', label: 'Design' },
            { value: 'marketing',   label: 'Marketing' },   { value: 'sales', label: 'Sales' },
            { value: 'hr',          label: 'HR' },           { value: 'finance', label: 'Finance' },
          ]},
          { name: 'role',      type: 'string', label: 'Job Title',    showInList: true },
          { name: 'startDate', type: 'date',   label: 'Start Date',   showInList: true },
          { name: 'status',    type: 'select', label: 'Status',       showInList: true, options: [
            { value: 'active', label: 'Active' }, { value: 'on_leave', label: 'On Leave' }, { value: 'terminated', label: 'Terminated' },
          ]},
          { name: 'salary', type: 'number', label: 'Annual Salary ($)' },
        ]},
        { name: 'LeaveRequest', label: 'Leave Request', labelPlural: 'Leave Requests', fields: [
          { name: 'employee',  type: 'relation', label: 'Employee',   entity: 'Employee', showInList: true },
          { name: 'type',      type: 'select',   label: 'Leave Type', showInList: true, options: [
            { value: 'vacation', label: 'Vacation' }, { value: 'sick', label: 'Sick Leave' },
            { value: 'personal', label: 'Personal' }, { value: 'maternity', label: 'Maternity/Paternity' },
          ]},
          { name: 'startDate', type: 'date',   label: 'From',   required: true, showInList: true },
          { name: 'endDate',   type: 'date',   label: 'To',     required: true, showInList: true },
          { name: 'status',    type: 'select', label: 'Status', showInList: true, options: [
            { value: 'pending', label: '🕐 Pending' }, { value: 'approved', label: '✅ Approved' }, { value: 'rejected', label: '❌ Rejected' },
          ]},
          { name: 'reason', type: 'text', label: 'Reason' },
        ]},
      ],
      pages: [
        // HOME — org breakdown chart is the FIRST thing you see
        { id: 'home-h',     route: '/', title: 'People Dashboard', root: { kind: 'heading', props: { text: 'People Dashboard', level: 1 }}},
        { id: 'home-stats', route: '/', title: 'People', root: { kind: 'stats', props: { items: [
          { label: 'Total Headcount',  source: { entity: 'Employee', op: 'count' } },
          { label: 'Active Employees', source: { entity: 'Employee', op: 'count' } },
          { label: 'Pending Leave',    source: { entity: 'LeaveRequest', op: 'count' } },
          { label: 'Avg Salary',       source: { entity: 'Employee', field: 'salary', op: 'avg' } },
        ]}}},
        // Org chart bar — shown before any table
        { id: 'home-dept-chart', route: '/', title: 'By Dept', root: { kind: 'chart', props: {
          entity: 'Employee', groupBy: 'department', title: 'Headcount by Department', type: 'bar',
        }}},
        { id: 'home-leave-h', route: '/', title: 'Leave', root: { kind: 'heading', props: { text: '📋 Pending Leave Requests', level: 2 }}},
        { id: 'home-leave',   route: '/', title: 'Leave', entity: 'LeaveRequest', root: { kind: 'table', props: { entity: 'LeaveRequest', pageSize: 5 }}},

        // EMPLOYEES — table + salary chart
        { id: 'employees-h',     route: '/employees', title: 'Employees', root: { kind: 'heading', props: { text: 'Employee Directory', level: 1 }}},
        { id: 'employees-stats', route: '/employees', title: 'Employees', root: { kind: 'stats', props: { items: [
          { label: 'Total Employees', source: { entity: 'Employee', op: 'count' } },
          { label: 'Avg Salary',      source: { entity: 'Employee', field: 'salary', op: 'avg' } },
        ]}}},
        { id: 'employees',     route: '/employees',     title: 'Employees', entity: 'Employee', root: { kind: 'table', props: { entity: 'Employee', pageSize: 25 }}},
        { id: 'employees-new', route: '/employees/new', title: 'Add Employee', entity: 'Employee', root: { kind: 'form', props: { entity: 'Employee', mode: 'create', successRoute: '/employees' }}},

        // LEAVE
        { id: 'leave-h',   route: '/leaverequests',     title: 'Leave', root: { kind: 'heading', props: { text: 'Leave Requests', level: 1 }}},
        { id: 'leave',     route: '/leaverequests',     title: 'Leave', entity: 'LeaveRequest', root: { kind: 'table', props: { entity: 'LeaveRequest', pageSize: 25 }}},
        { id: 'leave-new', route: '/leaverequests/new', title: 'Request Leave', entity: 'LeaveRequest', root: { kind: 'form', props: { entity: 'LeaveRequest', mode: 'create', successRoute: '/leaverequests' }}},

        // REPORTS — pure charts page (no tables at all)
        { id: 'reports-h',      route: '/reports', title: 'Reports', root: { kind: 'heading', props: { text: 'HR Reports', level: 1 }}},
        { id: 'reports-dept',   route: '/reports', title: 'Reports', root: { kind: 'chart', props: {
          entity: 'Employee', groupBy: 'department', title: 'Headcount by Department', type: 'bar',
        }}},
        { id: 'reports-status', route: '/reports', title: 'Reports', root: { kind: 'chart', props: {
          entity: 'Employee', groupBy: 'status', title: 'Employment Status', type: 'pie',
        }}},
        { id: 'reports-leave',  route: '/reports', title: 'Reports', root: { kind: 'chart', props: {
          entity: 'LeaveRequest', groupBy: 'type', title: 'Leave by Type', type: 'pie',
        }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 8. E-COMMERCE — order timeline + revenue charts; product grid table
  //    Unique: /orders uses TIMELINE (not a table), /analytics is chart-only
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'ecommerce',
    name: 'Shop Manager',
    description: 'Product catalogue, order timeline, and revenue analytics.',
    emoji: '🛍️',
    config: {
      name: 'Shop Manager',
      description: 'Products. Orders. Revenue — all in one dashboard.',
      theme: { primary: '#059669', accent: '#34d399', logoText: '🛍️ Shop' },
      entities: [
        { name: 'Product', label: 'Product', labelPlural: 'Products', fields: [
          { name: 'name',     type: 'string', label: 'Product Name', required: true, showInList: true, searchable: true },
          { name: 'sku',      type: 'string', label: 'SKU',          showInList: true },
          { name: 'price',    type: 'number', label: 'Price ($)',    required: true, showInList: true },
          { name: 'stock',    type: 'number', label: 'Stock',        showInList: true, default: 0 },
          { name: 'category', type: 'select', label: 'Category',     showInList: true, options: [
            { value: 'electronics', label: 'Electronics' }, { value: 'clothing', label: 'Clothing' },
            { value: 'books',       label: 'Books' },       { value: 'beauty', label: 'Beauty' },
            { value: 'home',        label: 'Home & Garden' },
          ]},
          { name: 'status', type: 'select', label: 'Status', showInList: true, options: [
            { value: 'active', label: '✅ Active' }, { value: 'draft', label: '📝 Draft' }, { value: 'archived', label: '📦 Archived' },
          ]},
          { name: 'description', type: 'text', label: 'Description' },
        ]},
        { name: 'Order', label: 'Order', labelPlural: 'Orders', fields: [
          { name: 'orderNumber', type: 'string',   label: 'Order #',        required: true, showInList: true },
          { name: 'customer',    type: 'string',   label: 'Customer Name',  required: true, showInList: true },
          { name: 'email',       type: 'email',    label: 'Email',          showInList: true },
          { name: 'total',       type: 'number',   label: 'Total ($)',      showInList: true },
          { name: 'status',      type: 'select',   label: 'Status',         showInList: true, options: [
            { value: 'pending',    label: '🕐 Pending' },   { value: 'processing', label: '⚙️ Processing' },
            { value: 'shipped',    label: '📦 Shipped' },   { value: 'delivered',  label: '✅ Delivered' },
            { value: 'cancelled',  label: '❌ Cancelled' },
          ]},
          { name: 'date',  type: 'datetime', label: 'Order Date', showInList: true },
          { name: 'notes', type: 'text',     label: 'Notes' },
        ]},
      ],
      pages: [
        // HOME — revenue stats + recent orders timeline
        { id: 'home',       route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Shop Manager', subtitle: 'Track inventory, manage orders, and monitor your revenue.',
          cta: 'New Order', ctaRoute: '/orders/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Products Listed', source: { entity: 'Product', op: 'count' } },
          { label: 'Total Orders',    source: { entity: 'Order',   op: 'count' } },
          { label: 'Revenue',         source: { entity: 'Order', field: 'total', op: 'sum' } },
          { label: 'Avg Order Value', source: { entity: 'Order', field: 'total', op: 'avg' } },
        ]}}},
        // Recent orders as TIMELINE on home
        { id: 'home-orders-h',    route: '/', title: 'Recent Orders', root: { kind: 'heading', props: { text: '📦 Recent Orders', level: 2 }}},
        { id: 'home-orders',      route: '/', title: 'Orders', entity: 'Order', root: { kind: 'timeline', props: {
          entity: 'Order', dateField: 'date', titleField: 'orderNumber', descriptionField: 'customer',
        }}},

        // PRODUCTS — table with category chart
        { id: 'products-h',     route: '/products', title: 'Products', root: { kind: 'heading', props: { text: 'Product Catalogue', level: 1 }}},
        { id: 'products-stats', route: '/products', title: 'Products', root: { kind: 'stats', props: { items: [
          { label: 'Total Products', source: { entity: 'Product', op: 'count' } },
          { label: 'Avg Price',      source: { entity: 'Product', field: 'price', op: 'avg' } },
        ]}}},
        { id: 'products',     route: '/products',     title: 'Products', entity: 'Product', root: { kind: 'table', props: { entity: 'Product', pageSize: 25 }}},
        { id: 'products-new', route: '/products/new', title: 'Add Product', entity: 'Product', root: { kind: 'form', props: { entity: 'Product', mode: 'create', successRoute: '/products' }}},

        // ORDERS — timeline view (unique: not a table)
        { id: 'orders-h',     route: '/orders', title: 'Orders', root: { kind: 'heading', props: { text: 'Order Management', level: 1 }}},
        { id: 'orders-stats', route: '/orders', title: 'Orders', root: { kind: 'stats', props: { items: [
          { label: 'Total Orders', source: { entity: 'Order', op: 'count' } },
          { label: 'Revenue',      source: { entity: 'Order', field: 'total', op: 'sum' } },
          { label: 'Avg Order',    source: { entity: 'Order', field: 'total', op: 'avg' } },
        ]}}},
        { id: 'orders-timeline', route: '/orders', title: 'Orders', entity: 'Order', root: { kind: 'timeline', props: {
          entity: 'Order', dateField: 'date', titleField: 'orderNumber', descriptionField: 'customer',
        }}},
        { id: 'orders-new', route: '/orders/new', title: 'New Order', entity: 'Order', root: { kind: 'form', props: { entity: 'Order', mode: 'create', successRoute: '/orders' }}},

        // ANALYTICS — pure charts (no tables at all)
        { id: 'analytics-h',        route: '/analytics', title: 'Analytics', root: { kind: 'heading', props: { text: 'Revenue Analytics', level: 1 }}},
        { id: 'analytics-revenue',  route: '/analytics', title: 'Analytics', root: { kind: 'chart', props: {
          entity: 'Order', groupBy: 'status', field: 'total', title: 'Revenue by Order Status', type: 'bar',
        }}},
        { id: 'analytics-category', route: '/analytics', title: 'Analytics', root: { kind: 'chart', props: {
          entity: 'Product', groupBy: 'category', title: 'Products by Category', type: 'pie',
        }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLANK — start from scratch
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'blank',
    name: 'Blank App',
    description: 'Start completely from scratch with an empty canvas.',
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

function validateTemplateConfig(cfg: AppConfig): { valid: boolean; reason?: string } {
  if (cfg.entities.length === 0) return { valid: false, reason: 'No entities defined' };
  if (!cfg.pages.some((p) => p.root?.kind === 'table')) return { valid: false, reason: 'No table pages found' };
  if (!cfg.pages.some((p) => p.root?.kind === 'form'))  return { valid: false, reason: 'No form pages found' };
  return { valid: true };
}

export function validateAllTemplates(): void {
  const invalid = TEMPLATES
    .filter((t) => !t.skipValidation)
    .map((t) => ({ id: t.id, ...validateTemplateConfig(t.config) }))
    .filter((r) => !r.valid);

  if (invalid.length > 0) {
    const msg = `Template validation FAILED! Invalid: ${invalid.map(t => `${t.id} (${t.reason})`).join(', ')}`;
    console.error('[templates]', msg);
    throw new Error(msg);
  }
  console.log(`[templates] ✅ All ${TEMPLATES.length} templates valid`);
}

if (typeof window === 'undefined') {
  validateAllTemplates();
}
