// Core metadata config types — the "JSON blueprint" that drives the runtime.
// The goal is to be permissive: anything unknown should be ignored, anything
// invalid should be coerced or defaulted. Never throw at parse time.

export type FieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'select'
  | 'multiselect'
  | 'relation'
  | 'json';

export interface FieldDef {
  name: string;
  type: FieldType;
  label?: string;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  // for select/multiselect
  options?: Array<{ value: string; label: string }>;
  // for relation: points to another entity
  entity?: string;
  // visual hints
  placeholder?: string;
  helpText?: string;
  showInList?: boolean;
  sortable?: boolean;
  searchable?: boolean;
}

export interface EntityDef {
  name: string; // e.g. "Customer"
  label?: string;
  labelPlural?: string;
  fields: FieldDef[];
  // free-form: page that lists this entity
  defaultPage?: string;
}

export type ComponentKind =
  | 'hero'
  | 'heading'
  | 'text'
  | 'stats'
  | 'table'
  | 'form'
  | 'chart'
  | 'card'
  | 'button'
  | 'list'
  | 'iframe'
  | 'divider'
  | 'spacer'
  | 'kanban'
  | 'timeline';

export interface ComponentNode {
  id?: string;
  kind: ComponentKind;
  // any other props are interpreted by the component itself
  props?: Record<string, unknown>;
  // children for layouts
  children?: ComponentNode[];
}

export interface PageDef {
  id: string; // stable id
  route: string; // e.g. "/", "/customers"
  title?: string;
  // what entity does this page primarily deal with (for CRUD lists/forms)
  entity?: string;
  layout?: 'default' | 'full' | 'sidebar';
  // root component tree
  root: ComponentNode;
}

export interface WorkflowTrigger {
  entity: string;
  event: 'create' | 'update' | 'delete';
}

export interface WorkflowAction {
  type: 'notify' | 'setField' | 'webhook';
  // free-form payload, validated per-type at runtime
  [k: string]: unknown;
}

export interface WorkflowDef {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  enabled?: boolean;
}

export interface ThemeDef {
  primary?: string;
  accent?: string;
  logoText?: string;
  faviconEmoji?: string;
}

export interface AppConfig {
  name: string;
  description?: string;
  theme?: ThemeDef;
  entities: EntityDef[];
  pages: PageDef[];
  workflows?: WorkflowDef[];
  // Map locale -> { key: translation }
  i18n?: Record<string, Record<string, string>>;
}
