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
  id?: string; // Required for visual builder selection/manipulation
  kind: ComponentKind;
  // any other props are interpreted by the component itself
  props?: Record<string, unknown>;
  // children for layouts
  children?: ComponentNode[];
  
  // Visual builder enhancements
  visualStyles?: VisualStyleProps;
  customCSS?: string; // Advanced users can write custom CSS
  locked?: boolean; // Prevent accidental editing
  hidden?: boolean; // Hide in builder but include in export
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
  
  // SEO metadata for visual builder
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string; // Open Graph image URL
  canonicalUrl?: string;
  noIndex?: boolean; // Prevent search engine indexing
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

// Visual styles for component-level customization
export interface VisualStyleProps {
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  // Colors
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  
  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  gap?: string;
  
  // Borders
  borderWidth?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;
  
  // Shadows
  boxShadow?: string;
  textShadow?: string;
  
  // Layout
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  display?: 'block' | 'inline-block' | 'flex' | 'grid' | 'inline-flex' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  
  // Background
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;
  backgroundRepeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y';
  
  // Position
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;
  
  // Effects
  opacity?: number;
  transform?: string;
  transition?: string;
  
  // Responsive overrides by breakpoint
  breakpoints?: {
    mobile?: Partial<Omit<VisualStyleProps, 'breakpoints'>>;
    tablet?: Partial<Omit<VisualStyleProps, 'breakpoints'>>;
    desktop?: Partial<Omit<VisualStyleProps, 'breakpoints'>>;
  };
}

export interface ThemeDef {
  // Legacy simple theme (backward compatible)
  primary?: string;
  accent?: string;
  logoText?: string;
  faviconEmoji?: string;
  
  // Enhanced theme for visual builder
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  
  typography?: {
    fontFamily: {
      heading: string;
      body: string;
      monospace: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  
  spacing?: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  
  borderRadius?: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  
  shadows?: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
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
  
  // Visual builder metadata
  navigation?: NavigationItem[];
  builderVersion?: string;
  lastEditedAt?: string; // ISO date string
  lastEditedBy?: string; // User ID
}

// Navigation menu structure
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
}

// Asset management
export interface AssetMetadata {
  id: string;
  filename: string; // Unique generated filename
  originalName: string; // Original upload name
  mimeType: string;
  size: number; // Bytes
  width?: number; // For images
  height?: number; // For images
  uploadedAt: string; // ISO date string
  url: string; // CDN/S3 URL
  thumbnailUrl?: string;
  optimizedVersions?: {
    thumbnail?: string; // 150px
    sm?: string; // 640px
    md?: string; // 1024px
    lg?: string; // 1920px
  };
  folder?: string;
  tags?: string[];
  attribution?: {
    source: string; // e.g., 'Unsplash', 'Pexels'
    author?: string;
    license?: string;
    url?: string;
  };
}
