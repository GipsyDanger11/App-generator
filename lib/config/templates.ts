// Built-in templates — COMPLETELY DISTINCT from each other
// Each template has unique entities, fields, page layouts, and components
// No two templates share similar structure or presentation

import type { AppConfig } from './types';

export interface Template {
  id: string; name: string; description: string; emoji: string;
  config: AppConfig; skipValidation?: boolean;
}

export const TEMPLATES: Template[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // 1. REAL ESTATE CRM — Property-focused with Lead Management
  //    Unique: Property listings, showings timeline, lead scoring system
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'crm',
    name: 'Real Estate CRM',
    description: 'Property listings, lead tracking, and showing management.',
    emoji: '🏡',
    config: {
      name: 'Real Estate CRM',
      description: 'Manage properties, track leads, and close more deals.',
      theme: { primary: '#0891b2', accent: '#06b6d4', logoText: '🏡 Properties' },
      entities: [
        { name: 'Property', label: 'Property', labelPlural: 'Properties', fields: [
          { name: 'address',     type: 'string', label: 'Address',        required: true, showInList: true, searchable: true },
          { name: 'price',       type: 'number', label: 'Price ($)',      required: true, showInList: true },
          { name: 'propertyType', type: 'select', label: 'Type',          showInList: true, options: [
            { value: 'house', label: '🏠 House' }, { value: 'condo', label: '🏢 Condo' },
            { value: 'townhouse', label: '🏘️ Townhouse' }, { value: 'land', label: '🌳 Land' },
          ]},
          { name: 'bedrooms',    type: 'number', label: 'Bedrooms',       showInList: true },
          { name: 'bathrooms',   type: 'number', label: 'Bathrooms',      showInList: true },
          { name: 'squareFeet',  type: 'number', label: 'Sq Ft',          showInList: true },
          { name: 'status',      type: 'select', label: 'Status',         showInList: true, options: [
            { value: 'available', label: '✅ Available' }, { value: 'pending', label: '🕐 Pending' },
            { value: 'sold', label: '💰 Sold' }, { value: 'off_market', label: '📦 Off Market' },
          ]},
          { name: 'description', type: 'text',   label: 'Description' },
        ]},
        { name: 'Lead', label: 'Lead', labelPlural: 'Leads', fields: [
          { name: 'name',        type: 'string', label: 'Full Name',      required: true, showInList: true, searchable: true },
          { name: 'email',       type: 'email',  label: 'Email',          showInList: true },
          { name: 'phone',       type: 'string', label: 'Phone',          showInList: true },
          { name: 'budget',      type: 'number', label: 'Budget ($)',     showInList: true },
          { name: 'leadSource',  type: 'select', label: 'Source',         showInList: true, options: [
            { value: 'website', label: '🌐 Website' }, { value: 'referral', label: '👥 Referral' },
            { value: 'social', label: '📱 Social Media' }, { value: 'walk_in', label: '🚶 Walk-in' },
          ]},
          { name: 'score',       type: 'select', label: 'Lead Score',     showInList: true, options: [
            { value: 'hot', label: '🔥 Hot' }, { value: 'warm', label: '☀️ Warm' }, { value: 'cold', label: '❄️ Cold' },
          ]},
          { name: 'notes',       type: 'text',   label: 'Notes' },
        ]},
        { name: 'Showing', label: 'Showing', labelPlural: 'Showings', fields: [
          { name: 'property',    type: 'relation', label: 'Property',     entity: 'Property', required: true, showInList: true },
          { name: 'lead',        type: 'relation', label: 'Lead',         entity: 'Lead', showInList: true },
          { name: 'date',        type: 'datetime', label: 'Date & Time',  required: true, showInList: true },
          { name: 'status',      type: 'select',  label: 'Status',        showInList: true, options: [
            { value: 'scheduled', label: '📅 Scheduled' }, { value: 'completed', label: '✅ Completed' },
            { value: 'cancelled', label: '❌ Cancelled' }, { value: 'no_show', label: '👻 No Show' },
          ]},
          { name: 'feedback',    type: 'text',    label: 'Feedback' },
        ]},
      ],
      pages: [
        // HOME — Hero with property stats and recent listings
        { id: 'home', route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Real Estate CRM', subtitle: 'Your complete property and lead management system.',
          cta: 'Add Property', ctaRoute: '/properties/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Active Listings', source: { entity: 'Property', op: 'count' } },
          { label: 'Total Leads',     source: { entity: 'Lead', op: 'count' } },
          { label: 'Upcoming Showings', source: { entity: 'Showing', op: 'count' } },
          { label: 'Avg Property Price', source: { entity: 'Property', field: 'price', op: 'avg' } },
        ]}}},
        { id: 'home-properties-h', route: '/', title: 'Featured', root: { kind: 'heading', props: { text: '🏡 Featured Properties', level: 2 }}},
        { id: 'home-properties', route: '/', title: 'Properties', entity: 'Property', root: { kind: 'table', props: { entity: 'Property', pageSize: 5 }}},

        // PROPERTIES — Full listing table
        { id: 'properties-h', route: '/properties', title: 'Properties', root: { kind: 'heading', props: { text: 'Property Listings', level: 1 }}},
        { id: 'properties-chart', route: '/properties', title: 'Properties', root: { kind: 'chart', props: {
          entity: 'Property', groupBy: 'propertyType', title: 'Properties by Type', type: 'pie',
        }}},
        { id: 'properties', route: '/properties', title: 'Properties', entity: 'Property', root: { kind: 'table', props: { entity: 'Property', pageSize: 20 }}},
        { id: 'properties-new', route: '/properties/new', title: 'Add Property', entity: 'Property', root: { kind: 'form', props: { entity: 'Property', mode: 'create', successRoute: '/properties' }}},

        // LEADS — Lead management with scoring
        { id: 'leads-h', route: '/leads', title: 'Leads', root: { kind: 'heading', props: { text: 'Lead Pipeline', level: 1 }}},
        { id: 'leads-stats', route: '/leads', title: 'Leads', root: { kind: 'stats', props: { items: [
          { label: 'Total Leads', source: { entity: 'Lead', op: 'count' } },
          { label: 'Avg Budget', source: { entity: 'Lead', field: 'budget', op: 'avg' } },
        ]}}},
        { id: 'leads-chart', route: '/leads', title: 'Leads', root: { kind: 'chart', props: {
          entity: 'Lead', groupBy: 'score', title: 'Leads by Score', type: 'bar',
        }}},
        { id: 'leads', route: '/leads', title: 'Leads', entity: 'Lead', root: { kind: 'table', props: { entity: 'Lead', pageSize: 25 }}},
        { id: 'leads-new', route: '/leads/new', title: 'Add Lead', entity: 'Lead', root: { kind: 'form', props: { entity: 'Lead', mode: 'create', successRoute: '/leads' }}},

        // SHOWINGS — Timeline view of appointments
        { id: 'showings-h', route: '/showings', title: 'Showings', root: { kind: 'heading', props: { text: 'Property Showings', level: 1 }}},
        { id: 'showings-timeline', route: '/showings', title: 'Showings', entity: 'Showing', root: { kind: 'timeline', props: {
          entity: 'Showing', dateField: 'date', titleField: 'property', descriptionField: 'status',
        }}},
        { id: 'showings-new', route: '/showings/new', title: 'Schedule Showing', entity: 'Showing', root: { kind: 'form', props: { entity: 'Showing', mode: 'create', successRoute: '/showings' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. PROJECT MANAGER — Sprint planning with milestone tracking
  //    Unique: Sprint kanban board, milestone timeline, team capacity planning
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'tasks',
    name: 'Project Manager',
    description: 'Sprint planning, milestone tracking, and team collaboration.',
    emoji: '🚀',
    config: {
      name: 'Project Manager',
      description: 'Plan sprints, track milestones, and ship faster.',
      theme: { primary: '#8b5cf6', accent: '#a78bfa', logoText: '🚀 Projects' },
      entities: [
        { name: 'Project', label: 'Project', labelPlural: 'Projects', fields: [
          { name: 'name',        type: 'string', label: 'Project Name',   required: true, showInList: true, searchable: true },
          { name: 'client',      type: 'string', label: 'Client',         showInList: true },
          { name: 'status',      type: 'select', label: 'Status',         showInList: true, options: [
            { value: 'planning', label: '📋 Planning' }, { value: 'active', label: '🏃 Active' },
            { value: 'on_hold', label: '⏸️ On Hold' }, { value: 'completed', label: '✅ Completed' },
          ]},
          { name: 'startDate',   type: 'date',   label: 'Start Date',     showInList: true },
          { name: 'deadline',    type: 'date',   label: 'Deadline',       showInList: true },
          { name: 'budget',      type: 'number', label: 'Budget ($)',     showInList: true },
          { name: 'description', type: 'text',   label: 'Description' },
        ]},
        { name: 'Sprint', label: 'Sprint', labelPlural: 'Sprints', fields: [
          { name: 'name',        type: 'string',   label: 'Sprint Name',   required: true, showInList: true },
          { name: 'project',     type: 'relation', label: 'Project',       entity: 'Project', showInList: true },
          { name: 'startDate',   type: 'date',     label: 'Start Date',    required: true, showInList: true },
          { name: 'endDate',     type: 'date',     label: 'End Date',      required: true, showInList: true },
          { name: 'status',      type: 'select',   label: 'Status',        showInList: true, options: [
            { value: 'planning', label: '📋 Planning' }, { value: 'in_progress', label: '▶️ In Progress' },
            { value: 'completed', label: '✅ Completed' },
          ]},
          { name: 'goal',        type: 'text',     label: 'Sprint Goal' },
        ]},
        { name: 'Story', label: 'User Story', labelPlural: 'User Stories', fields: [
          { name: 'title',       type: 'string',   label: 'Story Title',   required: true, showInList: true, searchable: true },
          { name: 'sprint',      type: 'relation', label: 'Sprint',        entity: 'Sprint', showInList: true },
          { name: 'storyPoints', type: 'select',   label: 'Story Points',  showInList: true, options: [
            { value: '1', label: '1 pt' }, { value: '2', label: '2 pts' }, { value: '3', label: '3 pts' },
            { value: '5', label: '5 pts' }, { value: '8', label: '8 pts' }, { value: '13', label: '13 pts' },
          ]},
          { name: 'status',      type: 'select',   label: 'Status',        showInList: true, options: [
            { value: 'backlog', label: '📦 Backlog' }, { value: 'todo', label: '📝 To Do' },
            { value: 'in_progress', label: '🔨 In Progress' }, { value: 'review', label: '👀 Review' },
            { value: 'done', label: '✅ Done' },
          ]},
          { name: 'assignee',    type: 'string',   label: 'Assignee',      showInList: true },
          { name: 'description', type: 'text',     label: 'Description' },
        ]},
        { name: 'Milestone', label: 'Milestone', labelPlural: 'Milestones', fields: [
          { name: 'title',       type: 'string',   label: 'Milestone',     required: true, showInList: true },
          { name: 'project',     type: 'relation', label: 'Project',       entity: 'Project', showInList: true },
          { name: 'dueDate',     type: 'date',     label: 'Due Date',      required: true, showInList: true },
          { name: 'status',      type: 'select',   label: 'Status',        showInList: true, options: [
            { value: 'upcoming', label: '🔜 Upcoming' }, { value: 'in_progress', label: '🏃 In Progress' },
            { value: 'achieved', label: '🎯 Achieved' }, { value: 'missed', label: '❌ Missed' },
          ]},
          { name: 'description', type: 'text',     label: 'Description' },
        ]},
      ],
      pages: [
        // HOME — Project overview with active sprint board
        { id: 'home', route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Project Manager', subtitle: 'Ship better products with sprint planning and milestone tracking.',
          cta: 'New Project', ctaRoute: '/projects/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Active Projects', source: { entity: 'Project', op: 'count' } },
          { label: 'Active Sprints',  source: { entity: 'Sprint', op: 'count' } },
          { label: 'User Stories',    source: { entity: 'Story', op: 'count' } },
          { label: 'Milestones',      source: { entity: 'Milestone', op: 'count' } },
        ]}}},
        { id: 'home-sprint-h', route: '/', title: 'Sprint Board', root: { kind: 'heading', props: { text: '🏃 Current Sprint', level: 2 }}},
        { id: 'home-sprint', route: '/', title: 'Sprint', entity: 'Story', root: { kind: 'kanban', props: {
          entity: 'Story', groupBy: 'status',
          columns: ['todo', 'in_progress', 'review', 'done'],
        }}},

        // PROJECTS — Project list with budget tracking
        { id: 'projects-h', route: '/projects', title: 'Projects', root: { kind: 'heading', props: { text: 'All Projects', level: 1 }}},
        { id: 'projects-stats', route: '/projects', title: 'Projects', root: { kind: 'stats', props: { items: [
          { label: 'Total Projects', source: { entity: 'Project', op: 'count' } },
          { label: 'Total Budget',   source: { entity: 'Project', field: 'budget', op: 'sum' } },
        ]}}},
        { id: 'projects', route: '/projects', title: 'Projects', entity: 'Project', root: { kind: 'table', props: { entity: 'Project', pageSize: 20 }}},
        { id: 'projects-new', route: '/projects/new', title: 'New Project', entity: 'Project', root: { kind: 'form', props: { entity: 'Project', mode: 'create', successRoute: '/projects' }}},

        // SPRINTS — Sprint planning board
        { id: 'sprints-h', route: '/sprints', title: 'Sprints', root: { kind: 'heading', props: { text: 'Sprint Planning', level: 1 }}},
        { id: 'sprints', route: '/sprints', title: 'Sprints', entity: 'Sprint', root: { kind: 'table', props: { entity: 'Sprint', pageSize: 15 }}},
        { id: 'sprints-new', route: '/sprints/new', title: 'New Sprint', entity: 'Sprint', root: { kind: 'form', props: { entity: 'Sprint', mode: 'create', successRoute: '/sprints' }}},

        // BACKLOG — User story management
        { id: 'backlog-h', route: '/backlog', title: 'Backlog', root: { kind: 'heading', props: { text: 'Product Backlog', level: 1 }}},
        { id: 'backlog-chart', route: '/backlog', title: 'Backlog', root: { kind: 'chart', props: {
          entity: 'Story', groupBy: 'status', title: 'Stories by Status', type: 'bar',
        }}},
        { id: 'backlog', route: '/backlog', title: 'Backlog', entity: 'Story', root: { kind: 'table', props: { entity: 'Story', pageSize: 30 }}},
        { id: 'backlog-new', route: '/backlog/new', title: 'New Story', entity: 'Story', root: { kind: 'form', props: { entity: 'Story', mode: 'create', successRoute: '/backlog' }}},

        // MILESTONES — Timeline view
        { id: 'milestones-h', route: '/milestones', title: 'Milestones', root: { kind: 'heading', props: { text: 'Project Milestones', level: 1 }}},
        { id: 'milestones-timeline', route: '/milestones', title: 'Milestones', entity: 'Milestone', root: { kind: 'timeline', props: {
          entity: 'Milestone', dateField: 'dueDate', titleField: 'title', descriptionField: 'status',
        }}},
        { id: 'milestones-new', route: '/milestones/new', title: 'New Milestone', entity: 'Milestone', root: { kind: 'form', props: { entity: 'Milestone', mode: 'create', successRoute: '/milestones' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. RESTAURANT MANAGER — Table reservations, menu management, staff scheduling
  //    Unique: Reservation timeline, menu with categories, staff shift kanban
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'inventory',
    name: 'Restaurant Manager',
    description: 'Reservations, menu management, and staff scheduling.',
    emoji: '🍽️',
    config: {
      name: 'Restaurant Manager',
      description: 'Manage reservations, menus, and staff — all in one place.',
      theme: { primary: '#dc2626', accent: '#f87171', logoText: '🍽️ Dining' },
      entities: [
        { name: 'Reservation', label: 'Reservation', labelPlural: 'Reservations', fields: [
          { name: 'guestName',   type: 'string',   label: 'Guest Name',    required: true, showInList: true, searchable: true },
          { name: 'phone',       type: 'string',   label: 'Phone',         showInList: true },
          { name: 'email',       type: 'email',    label: 'Email' },
          { name: 'partySize',   type: 'number',   label: 'Party Size',    required: true, showInList: true },
          { name: 'dateTime',    type: 'datetime', label: 'Date & Time',   required: true, showInList: true },
          { name: 'tableNumber', type: 'string',   label: 'Table #',       showInList: true },
          { name: 'status',      type: 'select',   label: 'Status',        showInList: true, options: [
            { value: 'confirmed', label: '✅ Confirmed' }, { value: 'seated', label: '🪑 Seated' },
            { value: 'completed', label: '✔️ Completed' }, { value: 'cancelled', label: '❌ Cancelled' },
            { value: 'no_show', label: '👻 No Show' },
          ]},
          { name: 'specialRequests', type: 'text', label: 'Special Requests' },
        ]},
        { name: 'MenuItem', label: 'Menu Item', labelPlural: 'Menu Items', fields: [
          { name: 'name',        type: 'string', label: 'Dish Name',      required: true, showInList: true, searchable: true },
          { name: 'category',    type: 'select', label: 'Category',       showInList: true, options: [
            { value: 'appetizer', label: '🥗 Appetizer' }, { value: 'main', label: '🍝 Main Course' },
            { value: 'dessert', label: '🍰 Dessert' }, { value: 'beverage', label: '🥤 Beverage' },
            { value: 'special', label: '⭐ Daily Special' },
          ]},
          { name: 'price',       type: 'number', label: 'Price ($)',      required: true, showInList: true },
          { name: 'available',   type: 'boolean', label: 'Available?',    showInList: true, default: true },
          { name: 'ingredients', type: 'text',   label: 'Ingredients' },
          { name: 'description', type: 'text',   label: 'Description' },
        ]},
        { name: 'Staff', label: 'Staff Member', labelPlural: 'Staff', fields: [
          { name: 'name',      type: 'string', label: 'Full Name',      required: true, showInList: true, searchable: true },
          { name: 'role',      type: 'select', label: 'Role',           showInList: true, options: [
            { value: 'chef', label: '👨‍🍳 Chef' }, { value: 'server', label: '🙋 Server' },
            { value: 'host', label: '🎩 Host' }, { value: 'bartender', label: '🍸 Bartender' },
            { value: 'manager', label: '📋 Manager' },
          ]},
          { name: 'phone',     type: 'string', label: 'Phone',          showInList: true },
          { name: 'email',     type: 'email',  label: 'Email' },
          { name: 'hireDate',  type: 'date',   label: 'Hire Date',      showInList: true },
          { name: 'status',    type: 'select', label: 'Status',         showInList: true, options: [
            { value: 'active', label: '✅ Active' }, { value: 'on_leave', label: '🏖️ On Leave' },
            { value: 'terminated', label: '❌ Terminated' },
          ]},
        ]},
        { name: 'Shift', label: 'Shift', labelPlural: 'Shifts', fields: [
          { name: 'staff',      type: 'relation', label: 'Staff Member',  entity: 'Staff', required: true, showInList: true },
          { name: 'date',       type: 'date',     label: 'Date',          required: true, showInList: true },
          { name: 'shiftType',  type: 'select',   label: 'Shift',         showInList: true, options: [
            { value: 'morning', label: '🌅 Morning (7am-3pm)' }, { value: 'afternoon', label: '☀️ Afternoon (3pm-9pm)' },
            { value: 'evening', label: '🌙 Evening (9pm-2am)' },
          ]},
          { name: 'status',     type: 'select',   label: 'Status',        showInList: true, options: [
            { value: 'scheduled', label: '📅 Scheduled' }, { value: 'confirmed', label: '✅ Confirmed' },
            { value: 'completed', label: '✔️ Completed' }, { value: 'cancelled', label: '❌ Cancelled' },
          ]},
        ]},
      ],
      pages: [
        // HOME — Reservations timeline and daily stats
        { id: 'home', route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Restaurant Manager', subtitle: 'Seamless reservations, staff scheduling, and menu management.',
          cta: 'New Reservation', ctaRoute: '/reservations/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Today\'s Reservations', source: { entity: 'Reservation', op: 'count' } },
          { label: 'Menu Items',            source: { entity: 'MenuItem', op: 'count' } },
          { label: 'Active Staff',          source: { entity: 'Staff', op: 'count' } },
          { label: 'Avg Party Size',        source: { entity: 'Reservation', field: 'partySize', op: 'avg' } },
        ]}}},
        { id: 'home-reservations-h', route: '/', title: 'Reservations', root: { kind: 'heading', props: { text: '📅 Today\'s Reservations', level: 2 }}},
        { id: 'home-reservations', route: '/', title: 'Reservations', entity: 'Reservation', root: { kind: 'timeline', props: {
          entity: 'Reservation', dateField: 'dateTime', titleField: 'guestName', descriptionField: 'partySize',
        }}},

        // RESERVATIONS — Full booking calendar
        { id: 'reservations-h', route: '/reservations', title: 'Reservations', root: { kind: 'heading', props: { text: 'Reservation Book', level: 1 }}},
        { id: 'reservations-stats', route: '/reservations', title: 'Reservations', root: { kind: 'stats', props: { items: [
          { label: 'Total Bookings', source: { entity: 'Reservation', op: 'count' } },
          { label: 'Avg Party Size',  source: { entity: 'Reservation', field: 'partySize', op: 'avg' } },
        ]}}},
        { id: 'reservations', route: '/reservations', title: 'Reservations', entity: 'Reservation', root: { kind: 'table', props: { entity: 'Reservation', pageSize: 25 }}},
        { id: 'reservations-new', route: '/reservations/new', title: 'New Reservation', entity: 'Reservation', root: { kind: 'form', props: { entity: 'Reservation', mode: 'create', successRoute: '/reservations' }}},

        // MENU — Menu items by category
        { id: 'menu-h', route: '/menu', title: 'Menu', root: { kind: 'heading', props: { text: 'Restaurant Menu', level: 1 }}},
        { id: 'menu-chart', route: '/menu', title: 'Menu', root: { kind: 'chart', props: {
          entity: 'MenuItem', groupBy: 'category', title: 'Menu Items by Category', type: 'pie',
        }}},
        { id: 'menu', route: '/menu', title: 'Menu', entity: 'MenuItem', root: { kind: 'table', props: { entity: 'MenuItem', pageSize: 30 }}},
        { id: 'menu-new', route: '/menu/new', title: 'Add Menu Item', entity: 'MenuItem', root: { kind: 'form', props: { entity: 'MenuItem', mode: 'create', successRoute: '/menu' }}},

        // STAFF — Staff directory with role breakdown
        { id: 'staff-h', route: '/staff', title: 'Staff', root: { kind: 'heading', props: { text: 'Staff Directory', level: 1 }}},
        { id: 'staff-chart', route: '/staff', title: 'Staff', root: { kind: 'chart', props: {
          entity: 'Staff', groupBy: 'role', title: 'Staff by Role', type: 'bar',
        }}},
        { id: 'staff', route: '/staff', title: 'Staff', entity: 'Staff', root: { kind: 'table', props: { entity: 'Staff', pageSize: 20 }}},
        { id: 'staff-new', route: '/staff/new', title: 'Add Staff', entity: 'Staff', root: { kind: 'form', props: { entity: 'Staff', mode: 'create', successRoute: '/staff' }}},

        // SCHEDULE — Shift scheduling kanban
        { id: 'schedule-h', route: '/schedule', title: 'Schedule', root: { kind: 'heading', props: { text: 'Staff Schedule', level: 1 }}},
        { id: 'schedule-kanban', route: '/schedule', title: 'Schedule', entity: 'Shift', root: { kind: 'kanban', props: {
          entity: 'Shift', groupBy: 'shiftType',
          columns: ['morning', 'afternoon', 'evening'],
        }}},
        { id: 'schedule-new', route: '/schedule/new', title: 'Add Shift', entity: 'Shift', root: { kind: 'form', props: { entity: 'Shift', mode: 'create', successRoute: '/schedule' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. FITNESS TRACKER — Workout logging, nutrition tracking, progress charts
  //    Unique: Exercise library, meal planning, body metrics timeline
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'expenses',
    name: 'Fitness Tracker',
    description: 'Workout logging, meal tracking, and progress visualization.',
    emoji: '💪',
    config: {
      name: 'Fitness Tracker',
      description: 'Track workouts, log meals, and visualize your fitness journey.',
      theme: { primary: '#ea580c', accent: '#fb923c', logoText: '💪 Fit' },
      entities: [
        { name: 'Workout', label: 'Workout', labelPlural: 'Workouts', fields: [
          { name: 'date',        type: 'datetime', label: 'Date & Time',   required: true, showInList: true },
          { name: 'type',        type: 'select',   label: 'Workout Type',  showInList: true, options: [
            { value: 'strength', label: '🏋️ Strength' }, { value: 'cardio', label: '🏃 Cardio' },
            { value: 'flexibility', label: '🧘 Flexibility' }, { value: 'sports', label: '⚽ Sports' },
          ]},
          { name: 'duration',    type: 'number',   label: 'Duration (min)', showInList: true },
          { name: 'caloriesBurned', type: 'number', label: 'Calories Burned', showInList: true },
          { name: 'intensity',   type: 'select',   label: 'Intensity',     showInList: true, options: [
            { value: 'light', label: '🟢 Light' }, { value: 'moderate', label: '🟡 Moderate' },
            { value: 'vigorous', label: '🔴 Vigorous' },
          ]},
          { name: 'notes',       type: 'text',     label: 'Notes' },
        ]},
        { name: 'Exercise', label: 'Exercise', labelPlural: 'Exercise Library', fields: [
          { name: 'name',        type: 'string', label: 'Exercise Name',   required: true, showInList: true, searchable: true },
          { name: 'category',    type: 'select', label: 'Category',        showInList: true, options: [
            { value: 'chest', label: '💪 Chest' }, { value: 'back', label: '🔙 Back' },
            { value: 'legs', label: '🦵 Legs' }, { value: 'arms', label: '💪 Arms' },
            { value: 'core', label: '⚡ Core' }, { value: 'cardio', label: '🏃 Cardio' },
          ]},
          { name: 'equipment',   type: 'select', label: 'Equipment',       showInList: true, options: [
            { value: 'bodyweight', label: 'Bodyweight' }, { value: 'dumbbells', label: 'Dumbbells' },
            { value: 'barbell', label: 'Barbell' }, { value: 'machine', label: 'Machine' },
          ]},
          { name: 'difficulty',  type: 'select', label: 'Difficulty',      showInList: true, options: [
            { value: 'beginner', label: '🟢 Beginner' }, { value: 'intermediate', label: '🟡 Intermediate' },
            { value: 'advanced', label: '🔴 Advanced' },
          ]},
          { name: 'description', type: 'text',   label: 'Instructions' },
        ]},
        { name: 'Meal', label: 'Meal', labelPlural: 'Meals', fields: [
          { name: 'date',        type: 'datetime', label: 'Date & Time',   required: true, showInList: true },
          { name: 'mealType',    type: 'select',   label: 'Meal Type',     showInList: true, options: [
            { value: 'breakfast', label: '🌅 Breakfast' }, { value: 'lunch', label: '☀️ Lunch' },
            { value: 'dinner', label: '🌙 Dinner' }, { value: 'snack', label: '🥨 Snack' },
          ]},
          { name: 'description', type: 'string',   label: 'What You Ate',  required: true, showInList: true, searchable: true },
          { name: 'calories',    type: 'number',   label: 'Calories',      showInList: true },
          { name: 'protein',     type: 'number',   label: 'Protein (g)',   showInList: true },
          { name: 'carbs',       type: 'number',   label: 'Carbs (g)',     showInList: true },
          { name: 'fats',        type: 'number',   label: 'Fats (g)',      showInList: true },
          { name: 'notes',       type: 'text',     label: 'Notes' },
        ]},
        { name: 'BodyMetric', label: 'Body Metric', labelPlural: 'Body Metrics', fields: [
          { name: 'date',        type: 'date',   label: 'Date',           required: true, showInList: true },
          { name: 'weight',      type: 'number', label: 'Weight (lbs)',   showInList: true },
          { name: 'bodyFat',     type: 'number', label: 'Body Fat %',     showInList: true },
          { name: 'muscleMass',  type: 'number', label: 'Muscle Mass (lbs)' },
          { name: 'waist',       type: 'number', label: 'Waist (inches)' },
          { name: 'chest',       type: 'number', label: 'Chest (inches)' },
          { name: 'notes',       type: 'text',   label: 'Notes' },
        ]},
      ],
      pages: [
        // HOME — Fitness dashboard with recent activity
        { id: 'home', route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Fitness Tracker', subtitle: 'Your complete fitness and nutrition journey.',
          cta: 'Log Workout', ctaRoute: '/workouts/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Total Workouts',  source: { entity: 'Workout', op: 'count' } },
          { label: 'Meals Logged',    source: { entity: 'Meal', op: 'count' } },
          { label: 'Calories Burned', source: { entity: 'Workout', field: 'caloriesBurned', op: 'sum' } },
          { label: 'Avg Workout (min)', source: { entity: 'Workout', field: 'duration', op: 'avg' } },
        ]}}},
        { id: 'home-workouts-h', route: '/', title: 'Recent', root: { kind: 'heading', props: { text: '💪 Recent Workouts', level: 2 }}},
        { id: 'home-workouts', route: '/', title: 'Workouts', entity: 'Workout', root: { kind: 'table', props: { entity: 'Workout', pageSize: 5 }}},

        // WORKOUTS — Full workout log with type breakdown
        { id: 'workouts-h', route: '/workouts', title: 'Workouts', root: { kind: 'heading', props: { text: 'Workout Log', level: 1 }}},
        { id: 'workouts-stats', route: '/workouts', title: 'Workouts', root: { kind: 'stats', props: { items: [
          { label: 'Total Workouts', source: { entity: 'Workout', op: 'count' } },
          { label: 'Total Duration', source: { entity: 'Workout', field: 'duration', op: 'sum' } },
        ]}}},
        { id: 'workouts-chart', route: '/workouts', title: 'Workouts', root: { kind: 'chart', props: {
          entity: 'Workout', groupBy: 'type', title: 'Workouts by Type', type: 'pie',
        }}},
        { id: 'workouts', route: '/workouts', title: 'Workouts', entity: 'Workout', root: { kind: 'table', props: { entity: 'Workout', pageSize: 25 }}},
        { id: 'workouts-new', route: '/workouts/new', title: 'Log Workout', entity: 'Workout', root: { kind: 'form', props: { entity: 'Workout', mode: 'create', successRoute: '/workouts' }}},

        // EXERCISES — Exercise library
        { id: 'exercises-h', route: '/exercises', title: 'Exercises', root: { kind: 'heading', props: { text: 'Exercise Library', level: 1 }}},
        { id: 'exercises-chart', route: '/exercises', title: 'Exercises', root: { kind: 'chart', props: {
          entity: 'Exercise', groupBy: 'category', title: 'Exercises by Category', type: 'bar',
        }}},
        { id: 'exercises', route: '/exercises', title: 'Exercises', entity: 'Exercise', root: { kind: 'table', props: { entity: 'Exercise', pageSize: 30 }}},
        { id: 'exercises-new', route: '/exercises/new', title: 'Add Exercise', entity: 'Exercise', root: { kind: 'form', props: { entity: 'Exercise', mode: 'create', successRoute: '/exercises' }}},

        // NUTRITION — Meal log with calorie tracking
        { id: 'nutrition-h', route: '/nutrition', title: 'Nutrition', root: { kind: 'heading', props: { text: 'Nutrition Log', level: 1 }}},
        { id: 'nutrition-stats', route: '/nutrition', title: 'Nutrition', root: { kind: 'stats', props: { items: [
          { label: 'Total Meals',    source: { entity: 'Meal', op: 'count' } },
          { label: 'Total Calories', source: { entity: 'Meal', field: 'calories', op: 'sum' } },
        ]}}},
        { id: 'nutrition-chart', route: '/nutrition', title: 'Nutrition', root: { kind: 'chart', props: {
          entity: 'Meal', groupBy: 'mealType', field: 'calories', title: 'Calories by Meal Type', type: 'bar',
        }}},
        { id: 'nutrition', route: '/nutrition', title: 'Nutrition', entity: 'Meal', root: { kind: 'table', props: { entity: 'Meal', pageSize: 25 }}},
        { id: 'nutrition-new', route: '/nutrition/new', title: 'Log Meal', entity: 'Meal', root: { kind: 'form', props: { entity: 'Meal', mode: 'create', successRoute: '/nutrition' }}},

        // PROGRESS — Body metrics timeline
        { id: 'progress-h', route: '/progress', title: 'Progress', root: { kind: 'heading', props: { text: 'Progress Tracking', level: 1 }}},
        { id: 'progress-timeline', route: '/progress', title: 'Progress', entity: 'BodyMetric', root: { kind: 'timeline', props: {
          entity: 'BodyMetric', dateField: 'date', titleField: 'weight', descriptionField: 'bodyFat',
        }}},
        { id: 'progress-new', route: '/progress/new', title: 'Log Metrics', entity: 'BodyMetric', root: { kind: 'form', props: { entity: 'BodyMetric', mode: 'create', successRoute: '/progress' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. EVENT PLANNER — Wedding/conference planning with vendor management
  //    Unique: Event timeline, vendor directory, guest RSVP tracking
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'habit-tracker',
    name: 'Event Planner',
    description: 'Plan events, manage vendors, and track RSVPs.',
    emoji: '🎉',
    config: {
      name: 'Event Planner',
      description: 'Plan unforgettable events with vendor management and guest tracking.',
      theme: { primary: '#db2777', accent: '#f472b6', logoText: '🎉 Events' },
      entities: [
        { name: 'Event', label: 'Event', labelPlural: 'Events', fields: [
          { name: 'name',        type: 'string',   label: 'Event Name',    required: true, showInList: true, searchable: true },
          { name: 'type',        type: 'select',   label: 'Event Type',    showInList: true, options: [
            { value: 'wedding', label: '💒 Wedding' }, { value: 'conference', label: '🎤 Conference' },
            { value: 'party', label: '🎊 Party' }, { value: 'corporate', label: '💼 Corporate' },
          ]},
          { name: 'date',        type: 'datetime', label: 'Date & Time',   required: true, showInList: true },
          { name: 'venue',       type: 'string',   label: 'Venue',         showInList: true },
          { name: 'budget',      type: 'number',   label: 'Budget ($)',    showInList: true },
          { name: 'guestCount',  type: 'number',   label: 'Expected Guests', showInList: true },
          { name: 'status',      type: 'select',   label: 'Status',        showInList: true, options: [
            { value: 'planning', label: '📋 Planning' }, { value: 'confirmed', label: '✅ Confirmed' },
            { value: 'in_progress', label: '🎬 In Progress' }, { value: 'completed', label: '✔️ Completed' },
          ]},
          { name: 'notes',       type: 'text',     label: 'Notes' },
        ]},
        { name: 'Vendor', label: 'Vendor', labelPlural: 'Vendors', fields: [
          { name: 'name',        type: 'string', label: 'Vendor Name',     required: true, showInList: true, searchable: true },
          { name: 'category',    type: 'select', label: 'Category',        showInList: true, options: [
            { value: 'catering', label: '🍽️ Catering' }, { value: 'photography', label: '📸 Photography' },
            { value: 'music', label: '🎵 Music/DJ' }, { value: 'decoration', label: '🎨 Decoration' },
            { value: 'venue', label: '🏛️ Venue' }, { value: 'other', label: '📦 Other' },
          ]},
          { name: 'contact',     type: 'string', label: 'Contact Person',  showInList: true },
          { name: 'phone',       type: 'string', label: 'Phone',           showInList: true },
          { name: 'email',       type: 'email',  label: 'Email' },
          { name: 'cost',        type: 'number', label: 'Cost ($)',        showInList: true },
          { name: 'status',      type: 'select', label: 'Status',          showInList: true, options: [
            { value: 'inquiry', label: '📞 Inquiry' }, { value: 'booked', label: '✅ Booked' },
            { value: 'paid', label: '💰 Paid' }, { value: 'completed', label: '✔️ Completed' },
          ]},
        ]},
        { name: 'Guest', label: 'Guest', labelPlural: 'Guests', fields: [
          { name: 'name',        type: 'string',   label: 'Full Name',     required: true, showInList: true, searchable: true },
          { name: 'email',       type: 'email',    label: 'Email',         showInList: true },
          { name: 'phone',       type: 'string',   label: 'Phone' },
          { name: 'event',       type: 'relation', label: 'Event',         entity: 'Event', showInList: true },
          { name: 'rsvpStatus',  type: 'select',   label: 'RSVP Status',   showInList: true, options: [
            { value: 'pending', label: '🕐 Pending' }, { value: 'attending', label: '✅ Attending' },
            { value: 'declined', label: '❌ Declined' }, { value: 'maybe', label: '❓ Maybe' },
          ]},
          { name: 'plusOnes',    type: 'number',   label: '+ Ones',        showInList: true, default: 0 },
          { name: 'dietaryRestrictions', type: 'text', label: 'Dietary Restrictions' },
        ]},
        { name: 'Task', label: 'Task', labelPlural: 'Tasks', fields: [
          { name: 'title',       type: 'string',   label: 'Task',          required: true, showInList: true, searchable: true },
          { name: 'event',       type: 'relation', label: 'Event',         entity: 'Event', showInList: true },
          { name: 'dueDate',     type: 'date',     label: 'Due Date',      showInList: true },
          { name: 'status',      type: 'select',   label: 'Status',        showInList: true, options: [
            { value: 'todo', label: '📝 To Do' }, { value: 'in_progress', label: '🔨 In Progress' },
            { value: 'done', label: '✅ Done' },
          ]},
          { name: 'notes',       type: 'text',     label: 'Notes' },
        ]},
      ],
      pages: [
        // HOME — Event overview with upcoming timeline
        { id: 'home', route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Event Planner', subtitle: 'Create memorable events with seamless planning and coordination.',
          cta: 'New Event', ctaRoute: '/events/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Active Events',  source: { entity: 'Event', op: 'count' } },
          { label: 'Total Vendors',  source: { entity: 'Vendor', op: 'count' } },
          { label: 'Total Guests',   source: { entity: 'Guest', op: 'count' } },
          { label: 'Total Budget',   source: { entity: 'Event', field: 'budget', op: 'sum' } },
        ]}}},
        { id: 'home-events-h', route: '/', title: 'Events', root: { kind: 'heading', props: { text: '📅 Upcoming Events', level: 2 }}},
        { id: 'home-events', route: '/', title: 'Events', entity: 'Event', root: { kind: 'timeline', props: {
          entity: 'Event', dateField: 'date', titleField: 'name', descriptionField: 'venue',
        }}},

        // EVENTS — Event list
        { id: 'events-h', route: '/events', title: 'Events', root: { kind: 'heading', props: { text: 'All Events', level: 1 }}},
        { id: 'events-chart', route: '/events', title: 'Events', root: { kind: 'chart', props: {
          entity: 'Event', groupBy: 'type', title: 'Events by Type', type: 'pie',
        }}},
        { id: 'events', route: '/events', title: 'Events', entity: 'Event', root: { kind: 'table', props: { entity: 'Event', pageSize: 20 }}},
        { id: 'events-new', route: '/events/new', title: 'New Event', entity: 'Event', root: { kind: 'form', props: { entity: 'Event', mode: 'create', successRoute: '/events' }}},

        // VENDORS — Vendor directory with category breakdown
        { id: 'vendors-h', route: '/vendors', title: 'Vendors', root: { kind: 'heading', props: { text: 'Vendor Directory', level: 1 }}},
        { id: 'vendors-stats', route: '/vendors', title: 'Vendors', root: { kind: 'stats', props: { items: [
          { label: 'Total Vendors', source: { entity: 'Vendor', op: 'count' } },
          { label: 'Total Cost',    source: { entity: 'Vendor', field: 'cost', op: 'sum' } },
        ]}}},
        { id: 'vendors-chart', route: '/vendors', title: 'Vendors', root: { kind: 'chart', props: {
          entity: 'Vendor', groupBy: 'category', title: 'Vendors by Category', type: 'bar',
        }}},
        { id: 'vendors', route: '/vendors', title: 'Vendors', entity: 'Vendor', root: { kind: 'table', props: { entity: 'Vendor', pageSize: 25 }}},
        { id: 'vendors-new', route: '/vendors/new', title: 'Add Vendor', entity: 'Vendor', root: { kind: 'form', props: { entity: 'Vendor', mode: 'create', successRoute: '/vendors' }}},

        // GUESTS — Guest list with RSVP tracking
        { id: 'guests-h', route: '/guests', title: 'Guests', root: { kind: 'heading', props: { text: 'Guest List', level: 1 }}},
        { id: 'guests-chart', route: '/guests', title: 'Guests', root: { kind: 'chart', props: {
          entity: 'Guest', groupBy: 'rsvpStatus', title: 'RSVP Status', type: 'pie',
        }}},
        { id: 'guests', route: '/guests', title: 'Guests', entity: 'Guest', root: { kind: 'table', props: { entity: 'Guest', pageSize: 30 }}},
        { id: 'guests-new', route: '/guests/new', title: 'Add Guest', entity: 'Guest', root: { kind: 'form', props: { entity: 'Guest', mode: 'create', successRoute: '/guests' }}},

        // TASKS — Task kanban board
        { id: 'tasks-h', route: '/tasks', title: 'Tasks', root: { kind: 'heading', props: { text: 'Planning Tasks', level: 1 }}},
        { id: 'tasks-kanban', route: '/tasks', title: 'Tasks', entity: 'Task', root: { kind: 'kanban', props: {
          entity: 'Task', groupBy: 'status',
          columns: ['todo', 'in_progress', 'done'],
        }}},
        { id: 'tasks-new', route: '/tasks/new', title: 'Add Task', entity: 'Task', root: { kind: 'form', props: { entity: 'Task', mode: 'create', successRoute: '/tasks' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. LEARNING PLATFORM — Online course management with student progress
  //    Unique: Course curriculum, lesson completion tracking, quiz results
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'library',
    name: 'Learning Platform',
    description: 'Course creation, student enrollment, and progress tracking.',
    emoji: '🎓',
    config: {
      name: 'Learning Platform',
      description: 'Build courses, enroll students, and track learning progress.',
      theme: { primary: '#0369a1', accent: '#0ea5e9', logoText: '🎓 Learn' },
      entities: [
        { name: 'Course', label: 'Course', labelPlural: 'Courses', fields: [
          { name: 'title',       type: 'string', label: 'Course Title',   required: true, showInList: true, searchable: true },
          { name: 'category',    type: 'select', label: 'Category',       showInList: true, options: [
            { value: 'programming', label: '💻 Programming' }, { value: 'design', label: '🎨 Design' },
            { value: 'business', label: '💼 Business' }, { value: 'marketing', label: '📈 Marketing' },
            { value: 'data', label: '📊 Data Science' },
          ]},
          { name: 'level',       type: 'select', label: 'Level',          showInList: true, options: [
            { value: 'beginner', label: '🟢 Beginner' }, { value: 'intermediate', label: '🟡 Intermediate' },
            { value: 'advanced', label: '🔴 Advanced' },
          ]},
          { name: 'price',       type: 'number', label: 'Price ($)',      showInList: true },
          { name: 'duration',    type: 'number', label: 'Duration (hours)', showInList: true },
          { name: 'instructor',  type: 'string', label: 'Instructor',     showInList: true },
          { name: 'status',      type: 'select', label: 'Status',         showInList: true, options: [
            { value: 'draft', label: '📝 Draft' }, { value: 'published', label: '✅ Published' },
            { value: 'archived', label: '📦 Archived' },
          ]},
          { name: 'description', type: 'text',   label: 'Description' },
        ]},
        { name: 'Lesson', label: 'Lesson', labelPlural: 'Lessons', fields: [
          { name: 'title',       type: 'string',   label: 'Lesson Title',  required: true, showInList: true, searchable: true },
          { name: 'course',      type: 'relation', label: 'Course',        entity: 'Course', required: true, showInList: true },
          { name: 'order',       type: 'number',   label: 'Order',         showInList: true },
          { name: 'type',        type: 'select',   label: 'Type',          showInList: true, options: [
            { value: 'video', label: '🎥 Video' }, { value: 'reading', label: '📖 Reading' },
            { value: 'quiz', label: '📝 Quiz' }, { value: 'project', label: '🛠️ Project' },
          ]},
          { name: 'duration',    type: 'number',   label: 'Duration (min)' },
          { name: 'content',     type: 'text',     label: 'Content/URL' },
        ]},
        { name: 'Student', label: 'Student', labelPlural: 'Students', fields: [
          { name: 'name',        type: 'string', label: 'Full Name',      required: true, showInList: true, searchable: true },
          { name: 'email',       type: 'email',  label: 'Email',          required: true, showInList: true },
          { name: 'phone',       type: 'string', label: 'Phone' },
          { name: 'enrolledDate', type: 'date',  label: 'Enrolled Date',  showInList: true },
          { name: 'status',      type: 'select', label: 'Status',         showInList: true, options: [
            { value: 'active', label: '✅ Active' }, { value: 'inactive', label: '⏸️ Inactive' },
            { value: 'graduated', label: '🎓 Graduated' },
          ]},
        ]},
        { name: 'Enrollment', label: 'Enrollment', labelPlural: 'Enrollments', fields: [
          { name: 'student',     type: 'relation', label: 'Student',      entity: 'Student', required: true, showInList: true },
          { name: 'course',      type: 'relation', label: 'Course',       entity: 'Course', required: true, showInList: true },
          { name: 'enrolledDate', type: 'date',    label: 'Enrolled On',  showInList: true },
          { name: 'progress',    type: 'number',   label: 'Progress %',   showInList: true, default: 0 },
          { name: 'status',      type: 'select',   label: 'Status',       showInList: true, options: [
            { value: 'in_progress', label: '📚 In Progress' }, { value: 'completed', label: '✅ Completed' },
            { value: 'dropped', label: '❌ Dropped' },
          ]},
        ]},
      ],
      pages: [
        // HOME — Course catalog overview
        { id: 'home', route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Learning Platform', subtitle: 'Create courses, enroll students, and track learning outcomes.',
          cta: 'New Course', ctaRoute: '/courses/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Total Courses',     source: { entity: 'Course', op: 'count' } },
          { label: 'Total Students',    source: { entity: 'Student', op: 'count' } },
          { label: 'Total Enrollments', source: { entity: 'Enrollment', op: 'count' } },
          { label: 'Avg Course Price',  source: { entity: 'Course', field: 'price', op: 'avg' } },
        ]}}},
        { id: 'home-courses-h', route: '/', title: 'Courses', root: { kind: 'heading', props: { text: '📚 Featured Courses', level: 2 }}},
        { id: 'home-courses', route: '/', title: 'Courses', entity: 'Course', root: { kind: 'table', props: { entity: 'Course', pageSize: 6 }}},

        // COURSES — Full course catalog
        { id: 'courses-h', route: '/courses', title: 'Courses', root: { kind: 'heading', props: { text: 'Course Catalog', level: 1 }}},
        { id: 'courses-chart', route: '/courses', title: 'Courses', root: { kind: 'chart', props: {
          entity: 'Course', groupBy: 'category', title: 'Courses by Category', type: 'pie',
        }}},
        { id: 'courses', route: '/courses', title: 'Courses', entity: 'Course', root: { kind: 'table', props: { entity: 'Course', pageSize: 25 }}},
        { id: 'courses-new', route: '/courses/new', title: 'New Course', entity: 'Course', root: { kind: 'form', props: { entity: 'Course', mode: 'create', successRoute: '/courses' }}},

        // LESSONS — Curriculum management
        { id: 'lessons-h', route: '/lessons', title: 'Lessons', root: { kind: 'heading', props: { text: 'Course Curriculum', level: 1 }}},
        { id: 'lessons', route: '/lessons', title: 'Lessons', entity: 'Lesson', root: { kind: 'table', props: { entity: 'Lesson', pageSize: 30 }}},
        { id: 'lessons-new', route: '/lessons/new', title: 'New Lesson', entity: 'Lesson', root: { kind: 'form', props: { entity: 'Lesson', mode: 'create', successRoute: '/lessons' }}},

        // STUDENTS — Student directory
        { id: 'students-h', route: '/students', title: 'Students', root: { kind: 'heading', props: { text: 'Student Directory', level: 1 }}},
        { id: 'students-chart', route: '/students', title: 'Students', root: { kind: 'chart', props: {
          entity: 'Student', groupBy: 'status', title: 'Students by Status', type: 'bar',
        }}},
        { id: 'students', route: '/students', title: 'Students', entity: 'Student', root: { kind: 'table', props: { entity: 'Student', pageSize: 25 }}},
        { id: 'students-new', route: '/students/new', title: 'New Student', entity: 'Student', root: { kind: 'form', props: { entity: 'Student', mode: 'create', successRoute: '/students' }}},

        // ENROLLMENTS — Progress tracking
        { id: 'enrollments-h', route: '/enrollments', title: 'Enrollments', root: { kind: 'heading', props: { text: 'Enrollment & Progress', level: 1 }}},
        { id: 'enrollments', route: '/enrollments', title: 'Enrollments', entity: 'Enrollment', root: { kind: 'table', props: { entity: 'Enrollment', pageSize: 30 }}},
        { id: 'enrollments-new', route: '/enrollments/new', title: 'New Enrollment', entity: 'Enrollment', root: { kind: 'form', props: { entity: 'Enrollment', mode: 'create', successRoute: '/enrollments' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 7. HOSPITAL MANAGER — Patient records, appointments, staff scheduling
  //    Unique: Patient timeline, appointment calendar, medical records
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hr',
    name: 'Hospital Manager',
    description: 'Patient management, appointments, and medical records.',
    emoji: '🏥',
    config: {
      name: 'Hospital Manager',
      description: 'Comprehensive patient care with appointment and records management.',
      theme: { primary: '#16a34a', accent: '#22c55e', logoText: '🏥 Care' },
      entities: [
        { name: 'Patient', label: 'Patient', labelPlural: 'Patients', fields: [
          { name: 'name',        type: 'string', label: 'Full Name',      required: true, showInList: true, searchable: true },
          { name: 'dateOfBirth', type: 'date',   label: 'Date of Birth',  showInList: true },
          { name: 'gender',      type: 'select', label: 'Gender',         showInList: true, options: [
            { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' },
          ]},
          { name: 'phone',       type: 'string', label: 'Phone',          showInList: true },
          { name: 'email',       type: 'email',  label: 'Email' },
          { name: 'address',     type: 'text',   label: 'Address' },
          { name: 'bloodType',   type: 'select', label: 'Blood Type',     showInList: true, options: [
            { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
            { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
            { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
            { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
          ]},
          { name: 'allergies',   type: 'text',   label: 'Allergies' },
        ]},
        { name: 'Doctor', label: 'Doctor', labelPlural: 'Doctors', fields: [
          { name: 'name',         type: 'string', label: 'Full Name',      required: true, showInList: true, searchable: true },
          { name: 'specialty',    type: 'select', label: 'Specialty',      showInList: true, options: [
            { value: 'cardiology', label: '❤️ Cardiology' }, { value: 'neurology', label: '🧠 Neurology' },
            { value: 'pediatrics', label: '👶 Pediatrics' }, { value: 'orthopedics', label: '🦴 Orthopedics' },
            { value: 'general', label: '🩺 General Practice' },
          ]},
          { name: 'phone',        type: 'string', label: 'Phone',          showInList: true },
          { name: 'email',        type: 'email',  label: 'Email' },
          { name: 'licenseNumber', type: 'string', label: 'License #',     showInList: true },
          { name: 'status',       type: 'select', label: 'Status',         showInList: true, options: [
            { value: 'active', label: '✅ Active' }, { value: 'on_leave', label: '🏖️ On Leave' },
          ]},
        ]},
        { name: 'Appointment', label: 'Appointment', labelPlural: 'Appointments', fields: [
          { name: 'patient',     type: 'relation', label: 'Patient',      entity: 'Patient', required: true, showInList: true },
          { name: 'doctor',      type: 'relation', label: 'Doctor',       entity: 'Doctor', required: true, showInList: true },
          { name: 'dateTime',    type: 'datetime', label: 'Date & Time',  required: true, showInList: true },
          { name: 'type',        type: 'select',   label: 'Type',         showInList: true, options: [
            { value: 'consultation', label: '🩺 Consultation' }, { value: 'followup', label: '🔄 Follow-up' },
            { value: 'emergency', label: '🚨 Emergency' }, { value: 'surgery', label: '⚕️ Surgery' },
          ]},
          { name: 'status',      type: 'select',   label: 'Status',       showInList: true, options: [
            { value: 'scheduled', label: '📅 Scheduled' }, { value: 'completed', label: '✅ Completed' },
            { value: 'cancelled', label: '❌ Cancelled' }, { value: 'no_show', label: '👻 No Show' },
          ]},
          { name: 'notes',       type: 'text',     label: 'Notes' },
        ]},
        { name: 'MedicalRecord', label: 'Medical Record', labelPlural: 'Medical Records', fields: [
          { name: 'patient',     type: 'relation', label: 'Patient',      entity: 'Patient', required: true, showInList: true },
          { name: 'doctor',      type: 'relation', label: 'Doctor',       entity: 'Doctor', showInList: true },
          { name: 'date',        type: 'date',     label: 'Date',         required: true, showInList: true },
          { name: 'diagnosis',   type: 'string',   label: 'Diagnosis',    required: true, showInList: true },
          { name: 'treatment',   type: 'text',     label: 'Treatment Plan' },
          { name: 'prescription', type: 'text',    label: 'Prescription' },
          { name: 'notes',       type: 'text',     label: 'Notes' },
        ]},
      ],
      pages: [
        // HOME — Today's appointments and patient overview
        { id: 'home', route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Hospital Manager', subtitle: 'Patient care management with appointment scheduling and medical records.',
          cta: 'New Appointment', ctaRoute: '/appointments/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Total Patients',       source: { entity: 'Patient', op: 'count' } },
          { label: 'Active Doctors',       source: { entity: 'Doctor', op: 'count' } },
          { label: 'Today\'s Appointments', source: { entity: 'Appointment', op: 'count' } },
          { label: 'Medical Records',      source: { entity: 'MedicalRecord', op: 'count' } },
        ]}}},
        { id: 'home-appointments-h', route: '/', title: 'Appointments', root: { kind: 'heading', props: { text: '📅 Today\'s Schedule', level: 2 }}},
        { id: 'home-appointments', route: '/', title: 'Appointments', entity: 'Appointment', root: { kind: 'timeline', props: {
          entity: 'Appointment', dateField: 'dateTime', titleField: 'patient', descriptionField: 'type',
        }}},

        // PATIENTS — Patient directory
        { id: 'patients-h', route: '/patients', title: 'Patients', root: { kind: 'heading', props: { text: 'Patient Directory', level: 1 }}},
        { id: 'patients-chart', route: '/patients', title: 'Patients', root: { kind: 'chart', props: {
          entity: 'Patient', groupBy: 'bloodType', title: 'Patients by Blood Type', type: 'bar',
        }}},
        { id: 'patients', route: '/patients', title: 'Patients', entity: 'Patient', root: { kind: 'table', props: { entity: 'Patient', pageSize: 25 }}},
        { id: 'patients-new', route: '/patients/new', title: 'New Patient', entity: 'Patient', root: { kind: 'form', props: { entity: 'Patient', mode: 'create', successRoute: '/patients' }}},

        // DOCTORS — Doctor directory
        { id: 'doctors-h', route: '/doctors', title: 'Doctors', root: { kind: 'heading', props: { text: 'Medical Staff', level: 1 }}},
        { id: 'doctors-chart', route: '/doctors', title: 'Doctors', root: { kind: 'chart', props: {
          entity: 'Doctor', groupBy: 'specialty', title: 'Doctors by Specialty', type: 'pie',
        }}},
        { id: 'doctors', route: '/doctors', title: 'Doctors', entity: 'Doctor', root: { kind: 'table', props: { entity: 'Doctor', pageSize: 20 }}},
        { id: 'doctors-new', route: '/doctors/new', title: 'Add Doctor', entity: 'Doctor', root: { kind: 'form', props: { entity: 'Doctor', mode: 'create', successRoute: '/doctors' }}},

        // APPOINTMENTS — Full appointment calendar
        { id: 'appointments-h', route: '/appointments', title: 'Appointments', root: { kind: 'heading', props: { text: 'Appointment Calendar', level: 1 }}},
        { id: 'appointments-stats', route: '/appointments', title: 'Appointments', root: { kind: 'stats', props: { items: [
          { label: 'Total Appointments', source: { entity: 'Appointment', op: 'count' } },
        ]}}},
        { id: 'appointments', route: '/appointments', title: 'Appointments', entity: 'Appointment', root: { kind: 'table', props: { entity: 'Appointment', pageSize: 30 }}},
        { id: 'appointments-new', route: '/appointments/new', title: 'Schedule Appointment', entity: 'Appointment', root: { kind: 'form', props: { entity: 'Appointment', mode: 'create', successRoute: '/appointments' }}},

        // RECORDS — Medical records timeline
        { id: 'records-h', route: '/records', title: 'Records', root: { kind: 'heading', props: { text: 'Medical Records', level: 1 }}},
        { id: 'records-timeline', route: '/records', title: 'Records', entity: 'MedicalRecord', root: { kind: 'timeline', props: {
          entity: 'MedicalRecord', dateField: 'date', titleField: 'patient', descriptionField: 'diagnosis',
        }}},
        { id: 'records-new', route: '/records/new', title: 'New Record', entity: 'MedicalRecord', root: { kind: 'form', props: { entity: 'MedicalRecord', mode: 'create', successRoute: '/records' }}},
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 8. HOTEL MANAGER — Room bookings, guest management, housekeeping
  //    Unique: Booking timeline, room status kanban, guest check-in/out
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'ecommerce',
    name: 'Hotel Manager',
    description: 'Room bookings, guest services, and housekeeping management.',
    emoji: '🏨',
    config: {
      name: 'Hotel Manager',
      description: 'Manage bookings, guests, and rooms with complete hotel operations.',
      theme: { primary: '#7c2d12', accent: '#ea580c', logoText: '🏨 Hotel' },
      entities: [
        { name: 'Room', label: 'Room', labelPlural: 'Rooms', fields: [
          { name: 'roomNumber',  type: 'string', label: 'Room Number',    required: true, showInList: true },
          { name: 'type',        type: 'select', label: 'Room Type',      showInList: true, options: [
            { value: 'single', label: '🛏️ Single' }, { value: 'double', label: '🛏️🛏️ Double' },
            { value: 'suite', label: '👑 Suite' }, { value: 'deluxe', label: '✨ Deluxe' },
          ]},
          { name: 'floor',       type: 'number', label: 'Floor',          showInList: true },
          { name: 'pricePerNight', type: 'number', label: 'Price/Night ($)', required: true, showInList: true },
          { name: 'capacity',    type: 'number', label: 'Max Guests',     showInList: true },
          { name: 'status',      type: 'select', label: 'Status',         showInList: true, options: [
            { value: 'available', label: '✅ Available' }, { value: 'occupied', label: '🔴 Occupied' },
            { value: 'cleaning', label: '🧹 Cleaning' }, { value: 'maintenance', label: '🔧 Maintenance' },
          ]},
          { name: 'amenities',   type: 'text',   label: 'Amenities' },
        ]},
        { name: 'Guest', label: 'Guest', labelPlural: 'Guests', fields: [
          { name: 'name',        type: 'string', label: 'Full Name',      required: true, showInList: true, searchable: true },
          { name: 'email',       type: 'email',  label: 'Email',          showInList: true },
          { name: 'phone',       type: 'string', label: 'Phone',          showInList: true },
          { name: 'idType',      type: 'select', label: 'ID Type',        options: [
            { value: 'passport', label: 'Passport' }, { value: 'drivers_license', label: 'Driver\'s License' },
            { value: 'national_id', label: 'National ID' },
          ]},
          { name: 'idNumber',    type: 'string', label: 'ID Number' },
          { name: 'nationality', type: 'string', label: 'Nationality' },
          { name: 'vip',         type: 'boolean', label: 'VIP Guest?',    showInList: true, default: false },
          { name: 'notes',       type: 'text',   label: 'Notes' },
        ]},
        { name: 'Booking', label: 'Booking', labelPlural: 'Bookings', fields: [
          { name: 'guest',       type: 'relation', label: 'Guest',        entity: 'Guest', required: true, showInList: true },
          { name: 'room',        type: 'relation', label: 'Room',         entity: 'Room', required: true, showInList: true },
          { name: 'checkIn',     type: 'date',     label: 'Check-In',     required: true, showInList: true },
          { name: 'checkOut',    type: 'date',     label: 'Check-Out',    required: true, showInList: true },
          { name: 'guests',      type: 'number',   label: 'Guests',       showInList: true },
          { name: 'totalPrice',  type: 'number',   label: 'Total ($)',    showInList: true },
          { name: 'status',      type: 'select',   label: 'Status',       showInList: true, options: [
            { value: 'reserved', label: '📅 Reserved' }, { value: 'checked_in', label: '🔑 Checked In' },
            { value: 'checked_out', label: '✅ Checked Out' }, { value: 'cancelled', label: '❌ Cancelled' },
          ]},
          { name: 'specialRequests', type: 'text', label: 'Special Requests' },
        ]},
        { name: 'Service', label: 'Service', labelPlural: 'Services', fields: [
          { name: 'name',        type: 'string', label: 'Service Name',   required: true, showInList: true, searchable: true },
          { name: 'category',    type: 'select', label: 'Category',       showInList: true, options: [
            { value: 'housekeeping', label: '🧹 Housekeeping' }, { value: 'room_service', label: '🍽️ Room Service' },
            { value: 'laundry', label: '👔 Laundry' }, { value: 'spa', label: '💆 Spa' },
            { value: 'concierge', label: '🎩 Concierge' },
          ]},
          { name: 'price',       type: 'number', label: 'Price ($)',      showInList: true },
          { name: 'available',   type: 'boolean', label: 'Available?',    showInList: true, default: true },
          { name: 'description', type: 'text',   label: 'Description' },
        ]},
      ],
      pages: [
        // HOME — Booking overview with room status
        { id: 'home', route: '/', title: 'Dashboard', root: { kind: 'hero', props: {
          title: 'Hotel Manager', subtitle: 'Complete hotel operations with bookings, guests, and room management.',
          cta: 'New Booking', ctaRoute: '/bookings/new',
        }}},
        { id: 'home-stats', route: '/', title: 'Dashboard', root: { kind: 'stats', props: { items: [
          { label: 'Total Rooms',       source: { entity: 'Room', op: 'count' } },
          { label: 'Active Bookings',   source: { entity: 'Booking', op: 'count' } },
          { label: 'Total Guests',      source: { entity: 'Guest', op: 'count' } },
          { label: 'Revenue',           source: { entity: 'Booking', field: 'totalPrice', op: 'sum' } },
        ]}}},
        { id: 'home-rooms-h', route: '/', title: 'Room Status', root: { kind: 'heading', props: { text: '🏨 Room Status Board', level: 2 }}},
        { id: 'home-rooms', route: '/', title: 'Rooms', entity: 'Room', root: { kind: 'kanban', props: {
          entity: 'Room', groupBy: 'status',
          columns: ['available', 'occupied', 'cleaning', 'maintenance'],
        }}},

        // ROOMS — Room inventory
        { id: 'rooms-h', route: '/rooms', title: 'Rooms', root: { kind: 'heading', props: { text: 'Room Inventory', level: 1 }}},
        { id: 'rooms-stats', route: '/rooms', title: 'Rooms', root: { kind: 'stats', props: { items: [
          { label: 'Total Rooms',  source: { entity: 'Room', op: 'count' } },
          { label: 'Avg Price',    source: { entity: 'Room', field: 'pricePerNight', op: 'avg' } },
        ]}}},
        { id: 'rooms-chart', route: '/rooms', title: 'Rooms', root: { kind: 'chart', props: {
          entity: 'Room', groupBy: 'type', title: 'Rooms by Type', type: 'pie',
        }}},
        { id: 'rooms', route: '/rooms', title: 'Rooms', entity: 'Room', root: { kind: 'table', props: { entity: 'Room', pageSize: 25 }}},
        { id: 'rooms-new', route: '/rooms/new', title: 'Add Room', entity: 'Room', root: { kind: 'form', props: { entity: 'Room', mode: 'create', successRoute: '/rooms' }}},

        // GUESTS — Guest directory
        { id: 'guests-h', route: '/guests', title: 'Guests', root: { kind: 'heading', props: { text: 'Guest Directory', level: 1 }}},
        { id: 'guests', route: '/guests', title: 'Guests', entity: 'Guest', root: { kind: 'table', props: { entity: 'Guest', pageSize: 30 }}},
        { id: 'guests-new', route: '/guests/new', title: 'Register Guest', entity: 'Guest', root: { kind: 'form', props: { entity: 'Guest', mode: 'create', successRoute: '/guests' }}},

        // BOOKINGS — Booking calendar with timeline
        { id: 'bookings-h', route: '/bookings', title: 'Bookings', root: { kind: 'heading', props: { text: 'Booking Calendar', level: 1 }}},
        { id: 'bookings-stats', route: '/bookings', title: 'Bookings', root: { kind: 'stats', props: { items: [
          { label: 'Total Bookings', source: { entity: 'Booking', op: 'count' } },
          { label: 'Total Revenue',  source: { entity: 'Booking', field: 'totalPrice', op: 'sum' } },
        ]}}},
        { id: 'bookings-timeline', route: '/bookings', title: 'Bookings', entity: 'Booking', root: { kind: 'timeline', props: {
          entity: 'Booking', dateField: 'checkIn', titleField: 'guest', descriptionField: 'room',
        }}},
        { id: 'bookings-new', route: '/bookings/new', title: 'New Booking', entity: 'Booking', root: { kind: 'form', props: { entity: 'Booking', mode: 'create', successRoute: '/bookings' }}},

        // SERVICES — Hotel services menu
        { id: 'services-h', route: '/services', title: 'Services', root: { kind: 'heading', props: { text: 'Hotel Services', level: 1 }}},
        { id: 'services-chart', route: '/services', title: 'Services', root: { kind: 'chart', props: {
          entity: 'Service', groupBy: 'category', title: 'Services by Category', type: 'bar',
        }}},
        { id: 'services', route: '/services', title: 'Services', entity: 'Service', root: { kind: 'table', props: { entity: 'Service', pageSize: 25 }}},
        { id: 'services-new', route: '/services/new', title: 'Add Service', entity: 'Service', root: { kind: 'form', props: { entity: 'Service', mode: 'create', successRoute: '/services' }}},
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
