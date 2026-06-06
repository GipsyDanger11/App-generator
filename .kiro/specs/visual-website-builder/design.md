# Design Document: Visual Website Builder with AI-Driven Customization

## 1. Introduction

This document defines the technical design for transforming the AI App Generator into a comprehensive visual website builder with AI-driven design customization. The system will provide a drag-and-drop interface for website creation, real-time visual editing, AI-powered design generation and suggestions, responsive design tools, and deployment capabilities.

### 1.1 Design Goals

- **Visual-First Experience**: Enable website creation through intuitive drag-and-drop interactions without requiring code
- **AI-Powered Assistance**: Leverage AI to generate complete designs, suggest improvements, and automate content creation
- **Real-Time Feedback**: Provide immediate visual feedback for all design changes
- **Professional Output**: Generate production-ready, optimized Next.js projects
- **Extensibility**: Support custom components, styles, and behaviors while maintaining a structured configuration

### 1.2 Architecture Overview

The visual website builder extends the existing App Generator architecture with:

1. **Visual Builder UI Layer** - Canvas, component palette, style panels, and editing tools
2. **AI Design Engine** - Backend service for layout generation, design suggestions, and content creation
3. **State Management** - Centralized state for undo/redo, real-time updates, and persistence
4. **Asset Management** - Upload, optimization, and organization of media files
5. **Export Pipeline** - Enhanced code generation with optimization and deployment
6. **Collaboration Layer** - Real-time synchronization for multi-user editing

## 2. System Architecture

### 2.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Visual Builder UI                          │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Component │  │  Canvas  │  │  Style   │  │    Pages     │  │
│  │  Palette  │  │ (Editor) │  │  Panel   │  │    Panel     │  │
│  └───────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                    State Management Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Site       │  │   History    │  │   Collaboration      │ │
│  │   Config     │  │   Manager    │  │   Sync Engine        │ │
│  │   Store      │  │  (Undo/Redo) │  │                      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Services Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ AI Design    │  │   Asset      │  │     Export          │ │
│  │   Engine     │  │   Manager    │  │     Service         │ │
│  │  (Python)    │  │              │  │                      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Data Persistence Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Site Config │  │    Assets    │  │    Version           │ │
│  │   Database   │  │   Storage    │  │    History           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+ with TypeScript
- Zustand for state management
- DndKit for drag-and-drop
- TailwindCSS for styling
- Monaco Editor for custom CSS
- Zod for validation

**Backend:**
- Next.js API Routes for REST endpoints
- Python FastAPI service for AI operations
- Anthropic Claude API for AI generation
- PostgreSQL for data persistence
- S3-compatible storage for assets

**Infrastructure:**
- Vercel for hosting and deployment
- WebSocket (Pusher/Ably) for real-time collaboration
- GitHub API for repository creation

## 3. Data Models

### 3.1 Extended Site Configuration Types

```typescript
// Extended from existing lib/config/types.ts

export interface VisualStyleProps {
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string | number;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  
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
  
  // Borders
  borderWidth?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: string;
  
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
  
  // Responsive overrides
  breakpoints?: {
    [key: string]: Partial<VisualStyleProps>;
  };
}

export interface ComponentNode {
  id: string; // Required for visual builder
  kind: ComponentKind;
  props?: Record<string, unknown>;
  visualStyles?: VisualStyleProps;
  children?: ComponentNode[];
  // Metadata for builder
  locked?: boolean;
  hidden?: boolean;
  customCSS?: string;
}

export interface ThemeDef {
  // Colors
  colors: {
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
  };
  
  // Typography
  typography: {
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
    };
    fontWeight: {
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
  
  // Spacing
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  
  // Border radius
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  
  // Shadows
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Legacy support
  primary?: string;
  accent?: string;
  logoText?: string;
  faviconEmoji?: string;
}

export interface PageDef {
  id: string;
  route: string;
  title?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  entity?: string;
  layout?: 'default' | 'full' | 'sidebar';
  root: ComponentNode;
}

export interface AssetMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: Date;
  url: string;
  thumbnailUrl?: string;
  optimizedVersions?: {
    [size: string]: string; // e.g., 'sm': 'url', 'md': 'url'
  };
  folder?: string;
  tags?: string[];
  attribution?: {
    source: string;
    author?: string;
    license?: string;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  children?: NavigationItem[];
}

export interface AppConfig {
  name: string;
  description?: string;
  theme: ThemeDef;
  entities: EntityDef[];
  pages: PageDef[];
  navigation?: NavigationItem[];
  workflows?: WorkflowDef[];
  i18n?: Record<string, Record<string, string>>;
  // New visual builder metadata
  builderVersion?: string;
  lastEditedAt?: Date;
  lastEditedBy?: string;
}
```

### 3.2 Builder-Specific State Models

```typescript
// State management for the visual builder

export interface EditorState {
  // Current editing context
  currentPageId: string | null;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  
  // View state
  viewportSize: {
    width: number;
    height: number;
    preset: 'mobile' | 'tablet' | 'desktop' | 'custom';
  };
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  
  // Panel visibility
  panels: {
    componentPalette: boolean;
    stylePanel: boolean;
    pagesPanel: boolean;
    assetsPanel: boolean;
    layersPanel: boolean;
  };
  
  // Active panel tabs
  stylePanelTab: 'properties' | 'styles' | 'interactions' | 'custom-css';
  
  // Drag and drop state
  dragState: {
    isDragging: boolean;
    draggedComponentId: string | null;
    draggedComponentKind: ComponentKind | null;
    dropTargetId: string | null;
    dropPosition: 'before' | 'after' | 'inside' | null;
  } | null;
}

export interface HistoryState {
  past: AppConfig[];
  present: AppConfig;
  future: AppConfig[];
  maxHistorySize: number;
}

export interface CollaborationState {
  sessionId: string;
  users: {
    id: string;
    name: string;
    avatar: string;
    color: string;
    selectedComponentId: string | null;
    cursor: { x: number; y: number } | null;
  }[];
  isConnected: boolean;
  isSyncing: boolean;
}

export interface AIGenerationState {
  isGenerating: boolean;
  progress: number;
  currentOperation: string;
  suggestions: DesignSuggestion[];
}

export interface DesignSuggestion {
  id: string;
  type: 'layout' | 'color' | 'spacing' | 'component' | 'content';
  title: string;
  description: string;
  preview?: string;
  changes: Partial<AppConfig>;
  confidence: number;
}
```

## 4. Core Components

### 4.1 Visual Builder Canvas

The Canvas is the primary editing surface where users interact with their website design.

**Component: `Canvas.tsx`**

```typescript
interface CanvasProps {
  config: AppConfig;
  currentPageId: string;
  editorState: EditorState;
  onComponentSelect: (id: string) => void;
  onComponentDrop: (dropData: DropData) => void;
  onComponentDrag: (id: string, position: Position) => void;
}

export function Canvas({ config, currentPageId, editorState, ... }: CanvasProps) {
  const page = config.pages.find(p => p.id === currentPageId);
  
  // Set up drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  
  // Render the page with selection overlays
  return (
    <DndContext sensors={sensors} onDragStart={...} onDragEnd={...}>
      <div
        className="canvas-container"
        style={{
          width: editorState.viewportSize.width,
          transform: `scale(${editorState.zoom})`,
        }}
      >
        {editorState.showGrid && <GridOverlay />}
        
        <Renderer
          node={page?.root}
          appId={config.id}
          config={config}
          mode="edit"
        />
        
        {editorState.selectedComponentId && (
          <SelectionOverlay componentId={editorState.selectedComponentId} />
        )}
        
        {editorState.hoveredComponentId && (
          <HoverOverlay componentId={editorState.hoveredComponentId} />
        )}
      </div>
    </DndContext>
  );
}
```

**Key Features:**
- Renders components using the existing `Renderer` system
- Overlays selection handles and hover indicators
- Handles drag-and-drop operations for reordering and nesting
- Responsive viewport simulation
- Grid and ruler overlays for alignment
- Zoom controls for detailed editing

### 4.2 Component Palette

The Component Palette provides access to all available components.

**Component: `ComponentPalette.tsx`**

```typescript
interface ComponentPaletteProps {
  categories: ComponentCategory[];
  searchQuery: string;
  onComponentDragStart: (kind: ComponentKind) => void;
}

interface ComponentCategory {
  id: string;
  label: string;
  components: ComponentDefinition[];
}

interface ComponentDefinition {
  kind: ComponentKind;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultProps: Record<string, unknown>;
  preview: string;
  usageCount?: number;
}

export function ComponentPalette({ categories, searchQuery, ... }: ComponentPaletteProps) {
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    
    return categories
      .map(cat => ({
        ...cat,
        components: cat.components.filter(comp =>
          comp.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(cat => cat.components.length > 0);
  }, [categories, searchQuery]);
  
  return (
    <div className="component-palette">
      <SearchInput value={searchQuery} onChange={...} />
      
      {filteredCategories.map(category => (
        <CategorySection key={category.id} category={category}>
          {category.components.map(component => (
            <DraggableComponent
              key={component.kind}
              component={component}
              onDragStart={() => onComponentDragStart(component.kind)}
            />
          ))}
        </CategorySection>
      ))}
    </div>
  );
}
```

**Categories:**
- Navigation (header, navbar, sidebar)
- Hero Sections (hero, banner, intro)
- Content Blocks (text, heading, paragraph)
- Forms (form, input, button, select)
- Media (image, video, gallery, carousel)
- Cards (card, pricing card, feature card)
- Lists (list, timeline, steps)
- Data Display (table, stats, chart, kanban)
- Layout (section, container, grid, flexbox)
- Interactive (button, modal, tabs, accordion)
- Testimonials (testimonial, review)
- Footer (footer, contact)
- Call-to-Action (CTA banner, CTA button)

### 4.3 Style Panel

The Style Panel displays and allows editing of component properties and styles.

**Component: `StylePanel.tsx`**

```typescript
interface StylePanelProps {
  component: ComponentNode | null;
  config: AppConfig;
  breakpoint: string;
  onStyleChange: (componentId: string, styles: Partial<VisualStyleProps>) => void;
  onPropsChange: (componentId: string, props: Record<string, unknown>) => void;
}

export function StylePanel({ component, config, breakpoint, ... }: StylePanelProps) {
  if (!component) {
    return <EmptyState message="Select a component to edit" />;
  }
  
  return (
    <div className="style-panel">
      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="styles">Styles</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="custom-css">Custom CSS</TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties">
          <PropertiesEditor
            component={component}
            onChange={(props) => onPropsChange(component.id, props)}
          />
        </TabsContent>
        
        <TabsContent value="styles">
          <StylesEditor
            component={component}
            theme={config.theme}
            breakpoint={breakpoint}
            onChange={(styles) => onStyleChange(component.id, styles)}
          />
        </TabsContent>
        
        <TabsContent value="interactions">
          <InteractionsEditor component={component} onChange={...} />
        </TabsContent>
        
        <TabsContent value="custom-css">
          <CustomCSSEditor
            value={component.customCSS || ''}
            onChange={(css) => onPropsChange(component.id, { customCSS: css })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Properties Editor:**
- Dynamically generates form controls based on component type
- Text inputs, numbers, toggles, selects, color pickers
- Validation with error messages
- Reset to default functionality
- Help text for complex properties

**Styles Editor:**
- Organized sections: Typography, Colors, Spacing, Borders, Layout
- Visual controls (color pickers, sliders, spacing visualizers)
- Theme value inheritance indicators
- Breakpoint-specific overrides
- Copy/paste styles functionality

### 4.4 Pages Panel

**Component: `PagesPanel.tsx`**

```typescript
interface PagesPanelProps {
  pages: PageDef[];
  currentPageId: string;
  navigation: NavigationItem[];
  onPageSelect: (id: string) => void;
  onPageCreate: (route: string, title: string) => void;
  onPageDelete: (id: string) => void;
  onPageDuplicate: (id: string) => void;
  onNavigationReorder: (items: NavigationItem[]) => void;
}

export function PagesPanel({ pages, currentPageId, navigation, ... }: PagesPanelProps) {
  return (
    <div className="pages-panel">
      <div className="pages-header">
        <h3>Pages</h3>
        <Button onClick={() => onPageCreate('/new-page', 'New Page')}>
          <PlusIcon />
        </Button>
      </div>
      
      <DndContext onDragEnd={handleNavigationReorder}>
        <SortableContext items={navigation}>
          {navigation.map(item => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={item.href === pages.find(p => p.id === currentPageId)?.route}
              onSelect={() => {
                const page = pages.find(p => p.route === item.href);
                if (page) onPageSelect(page.id);
              }}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <div className="pages-list">
        {pages.map(page => (
          <PageListItem
            key={page.id}
            page={page}
            isActive={page.id === currentPageId}
            onSelect={() => onPageSelect(page.id)}
            onDelete={() => onPageDelete(page.id)}
            onDuplicate={() => onPageDuplicate(page.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4.5 Asset Manager

**Component: `AssetManager.tsx`**

```typescript
interface AssetManagerProps {
  assets: AssetMetadata[];
  currentFolder: string;
  onAssetUpload: (files: File[]) => Promise<void>;
  onAssetSelect: (asset: AssetMetadata) => void;
  onAssetDelete: (id: string) => void;
  onFolderCreate: (name: string) => void;
}

export function AssetManager({ assets, currentFolder, ... }: AssetManagerProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onAssetUpload,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
      'video/*': ['.mp4', '.webm'],
    },
  });
  
  const filteredAssets = assets.filter(
    asset => asset.folder === currentFolder
  );
  
  return (
    <div className="asset-manager">
      <div className="asset-toolbar">
        <FolderBreadcrumbs currentFolder={currentFolder} />
        <Button onClick={() => onFolderCreate('New Folder')}>
          New Folder
        </Button>
      </div>
      
      <div {...getRootProps()} className="asset-dropzone">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>Drag and drop files, or click to select</p>
        )}
      </div>
      
      <div className="asset-grid">
        {filteredAssets.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onSelect={() => onAssetSelect(asset)}
            onDelete={() => onAssetDelete(asset.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

## 5. State Management

### 5.1 Zustand Store Architecture

```typescript
// stores/builderStore.ts

interface BuilderStore {
  // Config state
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  
  // Editor state
  editorState: EditorState;
  updateEditorState: (partial: Partial<EditorState>) => void;
  
  // Selection
  selectComponent: (id: string | null) => void;
  
  // History
  history: HistoryState;
  undo: () => void;
  redo: () => void;
  pushHistory: (config: AppConfig) => void;
  
  // Component operations
  addComponent: (parentId: string, component: ComponentNode, position: number) => void;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  deleteComponent: (id: string) => void;
  moveComponent: (id: string, targetParentId: string, position: number) => void;
  duplicateComponent: (id: string) => void;
  
  // Page operations
  createPage: (route: string, title: string) => void;
  updatePage: (id: string, updates: Partial<PageDef>) => void;
  deletePage: (id: string) => void;
  duplicatePage: (id: string) => void;
  
  // Theme operations
  updateTheme: (theme: Partial<ThemeDef>) => void;
  applyThemeTemplate: (template: ThemeDef) => void;
  
  // Asset operations
  assets: AssetMetadata[];
  addAsset: (asset: AssetMetadata) => void;
  deleteAsset: (id: string) => void;
  
  // Collaboration
  collaboration: CollaborationState;
  updateCollaboration: (updates: Partial<CollaborationState>) => void;
  
  // AI Generation
  aiState: AIGenerationState;
  setAIGenerating: (isGenerating: boolean) => void;
  addSuggestion: (suggestion: DesignSuggestion) => void;
  applySuggestion: (id: string) => void;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  config: initialConfig,
  setConfig: (config) => set({ config }),
  
  editorState: initialEditorState,
  updateEditorState: (partial) => set(state => ({
    editorState: { ...state.editorState, ...partial }
  })),
  
  selectComponent: (id) => set(state => ({
    editorState: { ...state.editorState, selectedComponentId: id }
  })),
  
  history: {
    past: [],
    present: initialConfig,
    future: [],
    maxHistorySize: 50,
  },
  
  undo: () => {
    const { history } = get();
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    set({
      history: {
        ...history,
        past: newPast,
        present: previous,
        future: [history.present, ...history.future],
      },
      config: previous,
    });
  },
  
  redo: () => {
    const { history } = get();
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    set({
      history: {
        ...history,
        past: [...history.past, history.present],
        present: next,
        future: newFuture,
      },
      config: next,
    });
  },
  
  pushHistory: (config) => {
    const { history } = get();
    const newPast = [...history.past, history.present];
    
    // Limit history size
    if (newPast.length > history.maxHistorySize) {
      newPast.shift();
    }
    
    set({
      history: {
        ...history,
        past: newPast,
        present: config,
        future: [],
      },
      config,
    });
  },
  
  // Component operations implementation...
  addComponent: (parentId, component, position) => {
    const config = get().config;
    const newConfig = addComponentToConfig(config, parentId, component, position);
    get().pushHistory(newConfig);
  },
  
  // ... other operations
}));
```

### 5.2 History Management

The history system supports undo/redo for all operations:

- Maintains circular buffer of past states (limit 50)
- Clears future on new change
- Serializes entire AppConfig for each state
- Debounces rapid changes (e.g., style property adjustments)

### 5.3 Real-Time Collaboration Sync

```typescript
// lib/collaboration/sync.ts

export class CollaborationSync {
  private ws: WebSocket;
  private sessionId: string;
  private userId: string;
  
  constructor(appId: string, userId: string) {
    this.sessionId = generateSessionId();
    this.userId = userId;
    this.ws = new WebSocket(`wss://api.example.com/builder/${appId}`);
    
    this.ws.onmessage = this.handleMessage.bind(this);
  }
  
  // Send local changes to other collaborators
  sendChange(change: ConfigChange) {
    this.ws.send(JSON.stringify({
      type: 'change',
      sessionId: this.sessionId,
      userId: this.userId,
      change,
      timestamp: Date.now(),
    }));
  }
  
  // Receive and apply remote changes
  handleMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case 'change':
        this.applyRemoteChange(message.change);
        break;
      case 'cursor':
        this.updateRemoteCursor(message.userId, message.position);
        break;
      case 'selection':
        this.updateRemoteSelection(message.userId, message.componentId);
        break;
      case 'presence':
        this.updatePresence(message.users);
        break;
    }
  }
  
  // Operational transform for conflict resolution
  applyRemoteChange(change: ConfigChange) {
    const store = useBuilderStore.getState();
    const localChanges = store.getPendingChanges();
    
    // Transform remote change based on local pending changes
    const transformedChange = transform(change, localChanges);
    
    // Apply without creating history entry
    store.applyRemoteChange(transformedChange);
  }
}
```

## 6. AI Design Engine

### 6.1 AI Service Architecture

The AI Design Engine is a Python FastAPI service that handles:

- Layout generation from text prompts
- Design suggestions and optimization
- Color scheme generation
- Content generation for components
- Image recommendations

**API Endpoints:**

```python
# ai-service/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import anthropic

app = FastAPI()

class LayoutGenerationRequest(BaseModel):
    prompt: str
    website_type: Optional[str] = None
    target_audience: Optional[str] = None
    preferred_colors: Optional[List[str]] = None

class LayoutGenerationResponse(BaseModel):
    config: Dict[str, Any]  # AppConfig structure
    theme: Dict[str, Any]   # ThemeDef structure
    reasoning: str

@app.post("/api/ai/generate-layout")
async def generate_layout(request: LayoutGenerationRequest) -> LayoutGenerationResponse:
    """
    Generate a complete page layout from a text description.
    Uses Claude to understand requirements and generate appropriate component structure.
    """
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    system_prompt = """You are a website design expert. Generate complete website layouts 
    in JSON format based on user descriptions. Consider:
    - Website purpose and target audience
    - Appropriate component selection
    - Visual hierarchy and information architecture
    - Accessibility and user experience best practices
    
    Return a valid AppConfig JSON structure with pages and components."""
    
    user_message = f"""Create a website layout for: {request.prompt}
    Website type: {request.website_type or 'general'}
    Target audience: {request.target_audience or 'general'}
    Preferred colors: {request.preferred_colors or 'auto'}
    
    Generate a complete page structure with appropriate components."""
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        messages=[{"role": "user", "content": user_message}],
        system=system_prompt
    )
    
    # Parse and validate the generated config
    config = parse_ai_config(message.content[0].text)
    theme = extract_theme(config)
    
    return LayoutGenerationResponse(
        config=config,
        theme=theme,
        reasoning="Generated based on your requirements"
    )

class DesignSuggestionRequest(BaseModel):
    config: Dict[str, Any]
    page_id: str
    suggestion_types: List[str]  # ['layout', 'color', 'spacing', 'component']

class DesignSuggestion(BaseModel):
    id: str
    type: str
    title: str
    description: str
    changes: Dict[str, Any]
    confidence: float

@app.post("/api/ai/suggest-improvements")
async def suggest_improvements(
    request: DesignSuggestionRequest
) -> List[DesignSuggestion]:
    """
    Analyze current design and suggest improvements.
    """
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    system_prompt = """You are a UX/UI design expert. Analyze website designs and 
    suggest improvements for visual hierarchy, accessibility, user experience, and aesthetics.
    Provide specific, actionable suggestions."""
    
    user_message = f"""Analyze this website configuration and suggest improvements:
    {json.dumps(request.config, indent=2)}
    
    Focus on: {', '.join(request.suggestion_types)}
    
    Provide 3-5 specific suggestions with explanations."""
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        messages=[{"role": "user", "content": user_message}],
        system=system_prompt
    )
    
    suggestions = parse_suggestions(message.content[0].text)
    return suggestions

class ColorSchemeRequest(BaseModel):
    base_color: Optional[str] = None
    mood: Optional[str] = None  # 'professional', 'playful', 'elegant', etc.
    industry: Optional[str] = None

class ColorScheme(BaseModel):
    name: str
    colors: Dict[str, str]
    gradients: List[str]
    usage_guidelines: str

@app.post("/api/ai/generate-color-scheme")
async def generate_color_scheme(
    request: ColorSchemeRequest
) -> List[ColorScheme]:
    """
    Generate harmonious color schemes with accessibility compliance.
    """
    # Use color theory algorithms + AI for suggestions
    schemes = []
    
    if request.base_color:
        # Generate complementary, analogous, triadic schemes
        schemes.extend(generate_color_harmonies(request.base_color))
    
    # Use AI for mood-based and industry-specific palettes
    ai_schemes = await generate_ai_color_schemes(request.mood, request.industry)
    schemes.extend(ai_schemes)
    
    # Validate WCAG AA compliance
    schemes = [s for s in schemes if validate_accessibility(s)]
    
    return schemes[:5]  # Return top 5

class ContentGenerationRequest(BaseModel):
    component_type: str
    website_context: str
    tone: str  # 'professional', 'casual', 'enthusiastic'
    language: str

@app.post("/api/ai/generate-content")
async def generate_content(request: ContentGenerationRequest) -> Dict[str, str]:
    """
    Generate contextually appropriate content for components.
    """
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    prompts = get_component_prompts(request.component_type)
    
    content = {}
    for field, prompt_template in prompts.items():
        prompt = prompt_template.format(
            context=request.website_context,
            tone=request.tone
        )
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content[field] = message.content[0].text.strip()
    
    return content
```

### 6.2 Layout Generation Algorithm

```python
# ai-service/generator.py

def parse_ai_config(ai_response: str) -> Dict[str, Any]:
    """
    Parse AI-generated layout into valid AppConfig structure.
    Applies validation and defaults for missing required fields.
    """
    try:
        # Extract JSON from AI response (may be wrapped in markdown)
        config_json = extract_json(ai_response)
        config = json.loads(config_json)
        
        # Validate and enhance with defaults
        config = validate_and_enhance_config(config)
        
        return config
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse AI-generated config: {str(e)}"
        )

def validate_and_enhance_config(config: Dict) -> Dict:
    """
    Ensure generated config meets all requirements.
    """
    # Ensure required fields
    if 'name' not in config:
        config['name'] = 'Generated Website'
    
    if 'pages' not in config or len(config['pages']) == 0:
        config['pages'] = [create_default_page()]
    
    # Generate IDs for all components
    for page in config['pages']:
        if 'root' in page:
            assign_component_ids(page['root'])
    
    # Ensure theme exists
    if 'theme' not in config:
        config['theme'] = generate_default_theme()
    
    # Validate component kinds
    for page in config['pages']:
        validate_component_tree(page['root'])
    
    return config

def assign_component_ids(node: Dict, prefix: str = '') -> None:
    """
    Recursively assign unique IDs to components.
    """
    if 'id' not in node:
        node['id'] = f"{prefix}{generate_id()}"
    
    if 'children' in node:
        for i, child in enumerate(node['children']):
            assign_component_ids(child, f"{node['id']}-")
```

## 7. Component Operations

### 7.1 Component Tree Manipulation

```typescript
// lib/builder/componentTree.ts

export function findComponentById(
  node: ComponentNode,
  id: string
): ComponentNode | null {
  if (node.id === id) return node;
  
  if (node.children) {
    for (const child of node.children) {
      const found = findComponentById(child, id);
      if (found) return found;
    }
  }
  
  return null;
}

export function findParentComponent(
  root: ComponentNode,
  childId: string
): ComponentNode | null {
  if (!root.children) return null;
  
  for (const child of root.children) {
    if (child.id === childId) return root;
    
    const found = findParentComponent(child, childId);
    if (found) return found;
  }
  
  return null;
}

export function addComponentToTree(
  root: ComponentNode,
  parentId: string,
  component: ComponentNode,
  position: number
): ComponentNode {
  // Deep clone to avoid mutation
  const newRoot = JSON.parse(JSON.stringify(root));
  
  const parent = findComponentById(newRoot, parentId);
  if (!parent) throw new Error(`Parent ${parentId} not found`);
  
  if (!parent.children) parent.children = [];
  
  // Insert at position
  parent.children.splice(position, 0, component);
  
  return newRoot;
}

export function updateComponentInTree(
  root: ComponentNode,
  componentId: string,
  updates: Partial<ComponentNode>
): ComponentNode {
  const newRoot = JSON.parse(JSON.stringify(root));
  
  const component = findComponentById(newRoot, componentId);
  if (!component) throw new Error(`Component ${componentId} not found`);
  
  Object.assign(component, updates);
  
  return newRoot;
}

export function deleteComponentFromTree(
  root: ComponentNode,
  componentId: string
): ComponentNode {
  const newRoot = JSON.parse(JSON.stringify(root));
  
  const parent = findParentComponent(newRoot, componentId);
  if (!parent || !parent.children) {
    throw new Error(`Cannot delete root component or parent not found`);
  }
  
  parent.children = parent.children.filter(c => c.id !== componentId);
  
  return newRoot;
}

export function moveComponentInTree(
  root: ComponentNode,
  componentId: string,
  targetParentId: string,
  position: number
): ComponentNode {
  // Remove from current location
  let newRoot = deleteComponentFromTree(root, componentId);
  
  // Find the component in the original tree (before deletion)
  const component = findComponentById(root, componentId);
  if (!component) throw new Error(`Component ${componentId} not found`);
  
  // Add to new location
  newRoot = addComponentToTree(newRoot, targetParentId, component, position);
  
  return newRoot;
}

export function canDropIntoComponent(
  targetKind: ComponentKind,
  draggedKind: ComponentKind
): boolean {
  // Layout containers can accept any component
  const layoutContainers: ComponentKind[] = ['section', 'container', 'grid', 'flexbox'];
  if (layoutContainers.includes(targetKind)) return true;
  
  // Cards can accept some components
  if (targetKind === 'card') {
    return ['heading', 'text', 'button', 'image'].includes(draggedKind);
  }
  
  // Most components don't accept children
  return false;
}

export function preventCircularNesting(
  root: ComponentNode,
  draggedId: string,
  targetId: string
): boolean {
  // Cannot drop a component into itself
  if (draggedId === targetId) return false;
  
  // Cannot drop a component into its descendants
  const draggedComponent = findComponentById(root, draggedId);
  if (!draggedComponent) return true;
  
  const isDescendant = (node: ComponentNode, ancestorId: string): boolean => {
    if (node.id === ancestorId) return true;
    if (!node.children) return false;
    return node.children.some(child => isDescendant(child, ancestorId));
  };
  
  return !isDescendant(draggedComponent, targetId);
}
```

## 8. Asset Management

### 8.1 Asset Upload and Optimization

```typescript
// app/api/assets/upload/route.ts

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const folder = formData.get('folder') as string || 'root';
  
  const uploadedAssets: AssetMetadata[] = [];
  
  for (const file of files) {
    try {
      // Upload original file to S3
      const originalUrl = await uploadToS3(file);
      
      // Generate optimized versions for images
      let optimizedVersions: Record<string, string> = {};
      let width: number | undefined;
      let height: number | undefined;
      
      if (file.type.startsWith('image/')) {
        const imageBuffer = await file.arrayBuffer();
        const image = sharp(Buffer.from(imageBuffer));
        const metadata = await image.metadata();
        
        width = metadata.width;
        height = metadata.height;
        
        // Generate responsive sizes
        const sizes = [
          { name: 'thumbnail', width: 150 },
          { name: 'sm', width: 640 },
          { name: 'md', width: 1024 },
          { name: 'lg', width: 1920 },
        ];
        
        for (const size of sizes) {
          if (width && width > size.width) {
            const resized = await image
              .resize(size.width, null, { withoutEnlargement: true })
              .webp({ quality: 80 })
              .toBuffer();
            
            const resizedFile = new File([resized], `${file.name}-${size.name}.webp`);
            optimizedVersions[size.name] = await uploadToS3(resizedFile);
          }
        }
      }
      
      const asset: AssetMetadata = {
        id: generateId(),
        filename: generateUniqueFilename(file.name),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        width,
        height,
        uploadedAt: new Date(),
        url: originalUrl,
        optimizedVersions,
        folder,
      };
      
      // Save metadata to database
      await db.insert(assets).values(asset);
      
      uploadedAssets.push(asset);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
    }
  }
  
  return Response.json({ assets: uploadedAssets });
}
```

### 8.2 Asset Usage Tracking

```typescript
// lib/builder/assetUsage.ts

export function findAssetUsage(
  config: AppConfig,
  assetId: string
): { pageId: string; componentId: string; property: string }[] {
  const usages: { pageId: string; componentId: string; property: string }[] = [];
  
  for (const page of config.pages) {
    findAssetInComponent(page.root, assetId, page.id, usages);
  }
  
  return usages;
}

function findAssetInComponent(
  component: ComponentNode,
  assetId: string,
  pageId: string,
  usages: { pageId: string; componentId: string; property: string }[]
) {
  // Check component props for asset URLs
  if (component.props) {
    for (const [key, value] of Object.entries(component.props)) {
      if (typeof value === 'string' && value.includes(assetId)) {
        usages.push({ pageId, componentId: component.id, property: key });
      }
    }
  }
  
  // Recursively check children
  if (component.children) {
    for (const child of component.children) {
      findAssetInComponent(child, assetId, pageId, usages);
    }
  }
}

export function canDeleteAsset(config: AppConfig, assetId: string): {
  canDelete: boolean;
  reason?: string;
  usages: { pageId: string; componentId: string; property: string }[];
} {
  const usages = findAssetUsage(config, assetId);
  
  if (usages.length === 0) {
    return { canDelete: true, usages: [] };
  }
  
  return {
    canDelete: false,
    reason: `Asset is used in ${usages.length} location(s)`,
    usages,
  };
}
```

## 9. Export and Deployment

### 9.1 Enhanced Export Service

```typescript
// lib/export/codeGenerator.ts

export async function generateNextJsProject(config: AppConfig): Promise<ProjectFiles> {
  const files: ProjectFiles = {};
  
  // Generate package.json
  files['package.json'] = generatePackageJson(config);
  
  // Generate app layout
  files['app/layout.tsx'] = generateRootLayout(config);
  
  // Generate global styles
  files['app/globals.css'] = generateGlobalStyles(config.theme);
  
  // Generate page files
  for (const page of config.pages) {
    const route = page.route === '/' ? '' : page.route;
    files[`app${route}/page.tsx`] = generatePageFile(page, config);
    files[`app${route}/metadata.ts`] = generateMetadata(page);
  }
  
  // Generate component files
  files['components/renderer/Renderer.tsx'] = RENDERER_CODE;
  files['components/renderer/registry.tsx'] = REGISTRY_CODE;
  
  // Copy all used components
  const usedComponents = getUsedComponentKinds(config);
  for (const kind of usedComponents) {
    files[`components/renderer/components/${capitalize(kind)}.tsx`] = 
      await getComponentCode(kind);
  }
  
  // Generate theme configuration
  files['lib/theme.ts'] = generateThemeConfig(config.theme);
  
  // Copy assets
  const assets = await getConfigAssets(config);
  for (const asset of assets) {
    files[`public/assets/${asset.filename}`] = await downloadAsset(asset.url);
  }
  
  // Generate next.config.js
  files['next.config.js'] = generateNextConfig(config);
  
  // Generate TypeScript config
  files['tsconfig.json'] = TSCONFIG;
  
  // Generate README
  files['README.md'] = generateReadme(config);
  
  return files;
}

function generatePageFile(page: PageDef, config: AppConfig): string {
  return `// Generated page: ${page.title}
import { Renderer } from '@/components/renderer/Renderer';

const pageConfig = ${JSON.stringify(page, null, 2)};

export default function Page() {
  return (
    <Renderer 
      node={pageConfig.root}
      appId="${config.id}"
    />
  );
}`;
}

function generateMetadata(page: PageDef): string {
  return `import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${page.title || 'Page'}',
  description: '${page.metaDescription || ''}',
  keywords: ${JSON.stringify(page.metaKeywords || [])},
  openGraph: {
    title: '${page.title || 'Page'}',
    description: '${page.metaDescription || ''}',
    ${page.ogImage ? `image: '${page.ogImage}',` : ''}
  },
  ${page.canonicalUrl ? `alternates: { canonical: '${page.canonicalUrl}' },` : ''}
  ${page.noIndex ? `robots: { index: false },` : ''}
};`;
}

function generateGlobalStyles(theme: ThemeDef): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-text: ${theme.colors.text};
  
  /* Typography */
  --font-heading: ${theme.typography.fontFamily.heading};
  --font-body: ${theme.typography.fontFamily.body};
  
  /* Spacing */
  --spacing-xs: ${theme.spacing.xs};
  --spacing-sm: ${theme.spacing.sm};
  --spacing-md: ${theme.spacing.md};
  --spacing-lg: ${theme.spacing.lg};
  --spacing-xl: ${theme.spacing.xl};
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-background);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}`;
}
```

### 9.2 Deployment Integration

```typescript
// app/api/deploy/vercel/route.ts

export async function POST(request: Request) {
  const { appId, projectName } = await request.json();
  
  // Get config and generate project
  const config = await getAppConfig(appId);
  const projectFiles = await generateNextJsProject(config);
  
  // Create GitHub repository
  const repoUrl = await createGitHubRepo(projectName, projectFiles);
  
  // Deploy to Vercel
  const vercelToken = process.env.VERCEL_TOKEN;
  
  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      gitSource: {
        type: 'github',
        repo: repoUrl,
        ref: 'main',
      },
      projectSettings: {
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
      },
    }),
  });
  
  const deployment = await response.json();
  
  return Response.json({
    success: true,
    deploymentUrl: deployment.url,
    repoUrl,
  });
}
```

## 10. Performance Optimization

### 10.1 Component Rendering Optimization

```typescript
// components/renderer/OptimizedRenderer.tsx

export const OptimizedRenderer = memo(function OptimizedRenderer({
  node,
  ...props
}: RendererProps) {
  // Skip rendering if node hasn't changed
  return <Renderer node={node} {...props} />;
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.node.id === nextProps.node.id &&
    JSON.stringify(prevProps.node.props) === JSON.stringify(nextProps.node.props) &&
    JSON.stringify(prevProps.node.visualStyles) === JSON.stringify(nextProps.node.visualStyles)
  );
});
```

### 10.2 Virtual Scrolling for Large Component Trees

```typescript
// components/builder/VirtualizedCanvas.tsx

export function VirtualizedCanvas({ components }: { components: ComponentNode[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: components.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="canvas-container">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ComponentCard component={components[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 10.3 Debounced Style Updates

```typescript
// lib/builder/debounce.ts

export function useDebouncedStyleUpdate(
  componentId: string,
  onUpdate: (id: string, styles: VisualStyleProps) => void,
  delay: number = 300
) {
  const [pendingStyles, setPendingStyles] = useState<VisualStyleProps>({});
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const updateStyle = useCallback((styles: Partial<VisualStyleProps>) => {
    setPendingStyles(prev => ({ ...prev, ...styles }));
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onUpdate(componentId, { ...pendingStyles, ...styles });
      setPendingStyles({});
    }, delay);
  }, [componentId, onUpdate, delay, pendingStyles]);
  
  return updateStyle;
}
```

## 11. Accessibility Features

### 11.1 Accessibility Validation

```typescript
// lib/builder/a11y.ts

export interface A11yIssue {
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  componentId: string;
  fix?: () => void;
}

export function validateAccessibility(config: AppConfig): A11yIssue[] {
  const issues: A11yIssue[] = [];
  
  for (const page of config.pages) {
    validateComponentTree(page.root, issues, config.theme);
  }
  
  return issues;
}

function validateComponentTree(
  node: ComponentNode,
  issues: A11yIssue[],
  theme: ThemeDef,
  headingLevel: number = 0
) {
  // Check color contrast
  if (node.visualStyles?.color && node.visualStyles?.backgroundColor) {
    const contrast = calculateContrastRatio(
      node.visualStyles.color,
      node.visualStyles.backgroundColor
    );
    
    if (contrast < 4.5) {
      issues.push({
        severity: 'error',
        rule: 'WCAG 2.1 AA',
        message: `Insufficient color contrast ratio: ${contrast.toFixed(2)} (minimum 4.5:1)`,
        componentId: node.id,
      });
    }
  }
  
  // Check alt text for images
  if (node.kind === 'image' && !node.props?.alt) {
    issues.push({
      severity: 'error',
      rule: 'WCAG 2.1 A',
      message: 'Image missing alt text',
      componentId: node.id,
    });
  }
  
  // Check heading hierarchy
  if (node.kind === 'heading') {
    const level = parseInt(node.props?.level as string || '1');
    if (headingLevel > 0 && level > headingLevel + 1) {
      issues.push({
        severity: 'warning',
        rule: 'WCAG 2.1 AAA',
        message: `Heading level skipped (h${headingLevel} to h${level})`,
        componentId: node.id,
      });
    }
    headingLevel = level;
  }
  
  // Check interactive elements
  if (['button', 'link'].includes(node.kind)) {
    if (!node.props?.['aria-label'] && !node.props?.text) {
      issues.push({
        severity: 'warning',
        rule: 'WCAG 2.1 A',
        message: 'Interactive element should have accessible label',
        componentId: node.id,
      });
    }
  }
  
  // Recursively validate children
  if (node.children) {
    for (const child of node.children) {
      validateComponentTree(child, issues, theme, headingLevel);
    }
  }
}

function calculateContrastRatio(fg: string, bg: string): number {
  const fgLuminance = getRelativeLuminance(fg);
  const bgLuminance = getRelativeLuminance(bg);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}
```

## 12. Error Handling

### 12.1 Error Boundaries

```typescript
// components/builder/ErrorBoundary.tsx

export class BuilderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Builder error:', error, errorInfo);
    
    // Send to error tracking service
    trackError(error, {
      component: 'BuilderErrorBoundary',
      errorInfo: errorInfo.componentStack,
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 12.2 Graceful Degradation

```typescript
// lib/builder/recovery.ts

export function recoverFromCorruptedConfig(config: unknown): AppConfig {
  try {
    // Validate basic structure
    if (typeof config !== 'object' || config === null) {
      return createDefaultConfig();
    }
    
    const c = config as Partial<AppConfig>;
    
    // Ensure required fields
    const recovered: AppConfig = {
      name: c.name || 'Recovered Website',
      description: c.description,
      theme: validateTheme(c.theme),
      entities: Array.isArray(c.entities) ? c.entities : [],
      pages: validatePages(c.pages),
      navigation: c.navigation,
      workflows: c.workflows,
      i18n: c.i18n,
    };
    
    return recovered;
  } catch (error) {
    console.error('Config recovery failed:', error);
    return createDefaultConfig();
  }
}

function validatePages(pages: unknown): PageDef[] {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [createDefaultPage()];
  }
  
  return pages.map(page => {
    try {
      return {
        id: page.id || generateId(),
        route: page.route || '/',
        title: page.title || 'Page',
        root: validateComponentNode(page.root),
        ...page,
      };
    } catch {
      return createDefaultPage();
    }
  });
}

function validateComponentNode(node: unknown): ComponentNode {
  if (typeof node !== 'object' || node === null) {
    return createDefaultComponent();
  }
  
  const n = node as Partial<ComponentNode>;
  
  return {
    id: n.id || generateId(),
    kind: isValidComponentKind(n.kind) ? n.kind : 'text',
    props: n.props || {},
    visualStyles: n.visualStyles,
    children: Array.isArray(n.children) 
      ? n.children.map(validateComponentNode)
      : undefined,
  };
}
```

## 13. Testing Strategy

### 13.1 Unit Tests


```typescript
// __tests__/lib/builder/componentTree.test.ts

describe('Component Tree Operations', () => {
  describe('findComponentById', () => {
    it('finds component by id', () => {
      const tree = createTestTree();
      const component = findComponentById(tree, 'comp-1');
      expect(component).toBeDefined();
      expect(component?.id).toBe('comp-1');
    });
    
    it('returns null for non-existent id', () => {
      const tree = createTestTree();
      const component = findComponentById(tree, 'non-existent');
      expect(component).toBeNull();
    });
  });
  
  describe('addComponentToTree', () => {
    it('adds component at specified position', () => {
      const tree = createTestTree();
      const newComponent = createTestComponent('new');
      const updated = addComponentToTree(tree, 'parent-1', newComponent, 1);
      
      const parent = findComponentById(updated, 'parent-1');
      expect(parent?.children?.[1]).toEqual(newComponent);
    });
  });
  
  describe('preventCircularNesting', () => {
    it('prevents dropping component into itself', () => {
      const tree = createTestTree();
      const canDrop = preventCircularNesting(tree, 'comp-1', 'comp-1');
      expect(canDrop).toBe(false);
    });
    
    it('prevents dropping component into descendant', () => {
      const tree = createTestTree();
      const canDrop = preventCircularNesting(tree, 'parent-1', 'child-1');
      expect(canDrop).toBe(false);
    });
  });
});
```

### 13.2 Integration Tests

```typescript
// __tests__/integration/builder.test.tsx

describe('Visual Builder Integration', () => {
  it('adds component via drag and drop', async () => {
    const { container } = render(<Builder config={testConfig} />);
    
    // Drag component from palette
    const component = screen.getByTestId('palette-heading');
    const canvas = screen.getByTestId('canvas');
    
    await userEvent.drag(component, canvas);
    
    // Verify component was added
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
  
  it('updates component styles in real-time', async () => {
    const { container } = render(<Builder config={testConfig} />);
    
    // Select component
    const component = screen.getByTestId('component-1');
    await userEvent.click(component);
    
    // Change color in style panel
    const colorInput = screen.getByLabelText('Text Color');
    await userEvent.clear(colorInput);
    await userEvent.type(colorInput, '#FF0000');
    
    // Verify component style updated
    expect(component).toHaveStyle({ color: '#FF0000' });
  });
  
  it('supports undo/redo', async () => {
    const { container } = render(<Builder config={testConfig} />);
    
    // Make a change
    const component = screen.getByTestId('component-1');
    await userEvent.click(component);
    await userEvent.click(screen.getByText('Delete'));
    
    expect(component).not.toBeInTheDocument();
    
    // Undo
    await userEvent.keyboard('{Control>}z{/Control}');
    expect(screen.getByTestId('component-1')).toBeInTheDocument();
    
    // Redo
    await userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(screen.queryByTestId('component-1')).not.toBeInTheDocument();
  });
});
```

### 13.3 E2E Tests

```typescript
// e2e/builder.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Visual Builder E2E', () => {
  test('complete website creation flow', async ({ page }) => {
    await page.goto('/builder/new');
    
    // Start with AI generation
    await page.fill('[data-testid="ai-prompt"]', 'Create a portfolio website');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for generation
    await page.waitForSelector('[data-testid="canvas"]', { timeout: 30000 });
    
    // Verify components were generated
    const components = await page.locator('[data-component]').count();
    expect(components).toBeGreaterThan(0);
    
    // Customize a component
    await page.click('[data-component-id="hero-1"]');
    await page.fill('[data-testid="heading-text"]', 'Welcome to My Portfolio');
    
    // Verify change
    expect(await page.locator('[data-component-id="hero-1"]').textContent())
      .toContain('Welcome to My Portfolio');
    
    // Export
    await page.click('[data-testid="export-button"]');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });
});
```

## 14. Security Considerations

### 14.1 Input Validation

```typescript
// lib/validation/configSchema.ts

import { z } from 'zod';

export const VisualStylePropsSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.string().regex(/^\d+(px|rem|em)$/).optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  // ... other style properties
});

export const ComponentNodeSchema: z.ZodType<ComponentNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    kind: z.enum([
      'hero', 'heading', 'text', 'stats', 'table', 'form',
      'chart', 'card', 'button', 'list', 'iframe', 'divider',
      'spacer', 'kanban', 'timeline',
    ]),
    props: z.record(z.unknown()).optional(),
    visualStyles: VisualStylePropsSchema.optional(),
    children: z.array(ComponentNodeSchema).optional(),
    locked: z.boolean().optional(),
    hidden: z.boolean().optional(),
    customCSS: z.string().max(10000).optional(),
  })
);

export const AppConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  theme: z.object({
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string(),
      text: z.string(),
      // ... other colors
    }),
    typography: z.object({
      fontFamily: z.object({
        heading: z.string(),
        body: z.string(),
        monospace: z.string(),
      }),
      // ... other typography settings
    }),
    // ... other theme settings
  }),
  entities: z.array(z.any()),
  pages: z.array(z.object({
    id: z.string(),
    route: z.string().regex(/^\/[a-z0-9-/]*$/),
    title: z.string().optional(),
    root: ComponentNodeSchema,
    // ... other page properties
  })),
  navigation: z.array(z.any()).optional(),
  workflows: z.array(z.any()).optional(),
  i18n: z.record(z.record(z.string())).optional(),
});

export function validateConfig(config: unknown): AppConfig {
  return AppConfigSchema.parse(config);
}
```

### 14.2 XSS Prevention

```typescript
// lib/security/sanitize.ts

import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

export function sanitizeCSS(css: string): string {
  // Remove potentially dangerous CSS
  const dangerous = [
    /javascript:/gi,
    /expression\s*\(/gi,
    /import/gi,
    /@import/gi,
    /behavior:/gi,
  ];
  
  let safe = css;
  for (const pattern of dangerous) {
    safe = safe.replace(pattern, '');
  }
  
  return safe;
}

export function sanitizeComponentProps(props: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      // Sanitize string values that might contain HTML
      if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
        sanitized[key] = sanitizeHTML(value);
      } else {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
```

### 14.3 Rate Limiting

```typescript
// middleware/rateLimit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit AI generation requests
const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
  analytics: true,
});

// Rate limit asset uploads
const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 uploads per hour
  analytics: true,
});

export async function checkAIRateLimit(userId: string): Promise<boolean> {
  const { success } = await aiRateLimit.limit(userId);
  return success;
}

export async function checkUploadRateLimit(userId: string): Promise<boolean> {
  const { success } = await uploadRateLimit.limit(userId);
  return success;
}
```

## 15. Migration Strategy

### 15.1 Backward Compatibility

The visual builder must maintain compatibility with existing app configs:

```typescript
// lib/migration/configMigration.ts

export function migrateConfig(config: any, version: string): AppConfig {
  let migrated = config;
  
  // Apply migrations in sequence
  if (version < '2.0.0') {
    migrated = migrateToV2(migrated);
  }
  
  if (version < '3.0.0') {
    migrated = migrateToV3(migrated);
  }
  
  return migrated;
}

function migrateToV2(config: any): any {
  // Add visual styles to components
  const migratedPages = config.pages.map((page: any) => ({
    ...page,
    root: addVisualStylesToNode(page.root),
  }));
  
  return {
    ...config,
    pages: migratedPages,
    builderVersion: '2.0.0',
  };
}

function addVisualStylesToNode(node: any): ComponentNode {
  return {
    ...node,
    id: node.id || generateId(),
    visualStyles: {},
    children: node.children?.map(addVisualStylesToNode),
  };
}

function migrateToV3(config: any): any {
  // Migrate theme to new structure
  const oldTheme = config.theme || {};
  
  const newTheme: ThemeDef = {
    colors: {
      primary: oldTheme.primary || '#3B82F6',
      secondary: oldTheme.secondary || '#10B981',
      accent: oldTheme.accent || '#F59E0B',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
    },
    typography: {
      fontFamily: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
        monospace: 'JetBrains Mono, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    },
    // Preserve legacy fields
    primary: oldTheme.primary,
    accent: oldTheme.accent,
    logoText: oldTheme.logoText,
    faviconEmoji: oldTheme.faviconEmoji,
  };
  
  return {
    ...config,
    theme: newTheme,
    builderVersion: '3.0.0',
  };
}
```

## 16. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Component Drop Adds to Site Config

*For any* valid component and any valid drop location on the Canvas, dropping the component SHALL result in the component being added to the Site_Config at the correct location in the component tree.

**Validates: Requirements 1.3**

### Property 2: Component Reordering Updates Site Config

*For any* component in the Canvas and any valid target position, dragging and dropping the component to reorder or reposition it SHALL update the component's position in the Site_Config accordingly.

**Validates: Requirements 1.5**

### Property 3: Component Deletion Removes from Site Config

*For any* component in the Site_Config, deleting the component SHALL completely remove it from the Canvas and the Site_Config with no orphaned references.

**Validates: Requirements 1.6**

### Property 4: Undo then Redo Restores State

*For any* sequence of edit operations, performing undo followed by redo SHALL restore the Site_Config to the state immediately after the original operation.

**Validates: Requirements 1.7**

### Property 5: Modification Triggers Persistence

*For any* modification to the Canvas (add, update, delete, move component), the Site_Config SHALL be persisted after the modification completes.

**Validates: Requirements 1.8**

### Property 6: Search Filters Components Correctly

*For any* search query in the Component Palette, all returned components SHALL match the query in either their name or description (case-insensitive).

**Validates: Requirements 2.4**

### Property 7: Component Template Round Trip

*For any* component configuration saved as a reusable template, loading the template SHALL produce a component configuration equivalent to the original.

**Validates: Requirements 2.5**

### Property 8: Component Instance Has Defaults

*For any* component type dragged from the Component Palette, the created instance SHALL have all required default properties populated.

**Validates: Requirements 2.6**

### Property 9: Component Usage Count Accuracy

*For any* Site_Config, the usage count displayed for each component type SHALL equal the actual number of instances of that component type in the Site_Config.

**Validates: Requirements 2.7**

### Property 10: Style Modification Updates Real-Time

*For any* style property modification on a selected component, the Canvas SHALL update the component's visual appearance within the real-time update threshold (< 100ms).

**Validates: Requirements 3.7**

### Property 11: Style Copy-Paste Preserves Styles

*For any* component with visual styles, copying its styles and pasting to another component SHALL result in the target component having identical visual style values.

**Validates: Requirements 3.8**

### Property 12: Theme Inheritance and Override

*For any* component using theme values, the component SHALL inherit theme values by default and allow per-component overrides that take precedence over theme values.

**Validates: Requirements 3.9**

### Property 13: AI Generation Produces Valid Config

*For any* AI-generated layout, the resulting structure SHALL be a valid Site_Config that passes schema validation and can be rendered without errors.

**Validates: Requirements 4.2, 4.4, 4.5, 4.6**

### Property 14: Partial Regeneration Preserves Unchanged Sections

*For any* layout with multiple sections, regenerating one section SHALL preserve all other sections unchanged in the Site_Config.

**Validates: Requirements 4.7**

### Property 15: Generation Failure Preserves State

*For any* Canvas state when AI generation is initiated, if generation fails, the Canvas state SHALL remain unchanged from before the generation attempt.

**Validates: Requirements 4.8**

### Property 16: Suggestion Application Updates Canvas

*For any* design suggestion, accepting and applying the suggestion SHALL update the Canvas to reflect all changes specified in the suggestion.

**Validates: Requirements 5.6**

### Property 17: Suggestion Accept/Reject

*For any* design suggestion, accepting it SHALL apply its changes to the Site_Config, and rejecting it SHALL discard the suggestion without modifying the Site_Config.

**Validates: Requirements 5.7**

### Property 18: Suggestions Include Explanations

*For any* generated design suggestion, the suggestion SHALL include a non-empty explanation field describing the improvement.

**Validates: Requirements 5.8**

### Property 19: Theme Changes Propagate to Components

*For any* theme setting modification, all components in the Canvas that use that theme value SHALL update their appearance to reflect the new value in real-time.

**Validates: Requirements 6.5**

### Property 20: Theme Template Application

*For any* theme template, applying it SHALL update all theme values in the Site_Config to match the template's values.

**Validates: Requirements 6.7**

### Property 21: Theme Export/Import Round Trip

*For any* theme configuration, exporting it to JSON and then importing the JSON SHALL produce a theme configuration equivalent to the original.

**Validates: Requirements 6.8**

### Property 22: File Upload Creates Asset

*For any* valid image or video file uploaded via drag-and-drop or file selection, an AssetMetadata entry SHALL be created with optimized versions generated for images.

**Validates: Requirements 7.2, 7.5**

### Property 23: Asset Organization

*For any* folder structure created in the Asset Manager, assets SHALL be correctly organized and retrievable by their folder path.

**Validates: Requirements 7.4**

### Property 24: Asset Search Returns Matching Assets

*For any* search query in the Asset Manager, all returned assets SHALL match the query in their filename, folder name, or tags.

**Validates: Requirements 7.6**

### Property 25: Asset Deletion Warning for Used Assets

*For any* asset that is referenced in the Site_Config, attempting to delete it SHALL trigger a warning indicating where the asset is used.

**Validates: Requirements 7.8**

### Property 26: Viewport Resize Updates Canvas

*For any* viewport size (preset or custom), selecting it SHALL resize the Canvas to display the website at that exact viewport width.

**Validates: Requirements 8.2, 8.3**

### Property 27: Breakpoint Override Application

*For any* style property with breakpoint-specific overrides, viewing the Canvas at that breakpoint SHALL apply the override value instead of the base value.

**Validates: Requirements 8.5**

### Property 28: Accessibility Validation at All Viewports

*For any* component at any viewport size, accessibility validation SHALL verify text readability and interactive element accessibility.

**Validates: Requirements 8.8**

### Property 29: Content Generation Offers for Text Components

*For any* component type that contains text content, adding the component SHALL offer AI content generation as an option.

**Validates: Requirements 9.1**

### Property 30: Generated Content Includes All Required Types

*For any* content generation request, the generated content SHALL include all required text types appropriate for that component (headings, body text, labels, etc.).

**Validates: Requirements 9.3**

### Property 31: Text Field Regeneration Preserves Other Content

*For any* text field in a component, regenerating that field SHALL preserve all other text fields in the component unchanged.

**Validates: Requirements 9.6**

### Property 32: Inline Edit Updates Content

*For any* AI-generated or existing text content, editing it inline on the Canvas SHALL update the content value in the Site_Config.

**Validates: Requirements 9.7**

### Property 33: Language-Specific Content Generation

*For any* supported language, content generation in that language SHALL produce text content written in that language.

**Validates: Requirements 9.8**

### Property 34: Property Control Type Matches Property Type

*For any* component property, the Style Panel SHALL render an input control appropriate for that property's type (text input for strings, color picker for colors, etc.).

**Validates: Requirements 10.2**

### Property 35: Property Validation Catches Invalid Values

*For any* property with validation rules, entering an invalid value SHALL trigger a validation error message before the value is applied.

**Validates: Requirements 10.3**

### Property 36: Property Modification Updates Canvas

*For any* property modification in the Style Panel, the Canvas SHALL update the component to reflect the change immediately.

**Validates: Requirements 10.6**

### Property 37: Property Reset Restores Default

*For any* modified property, resetting it SHALL restore the property to its default value as defined in the component definition.

**Validates: Requirements 10.7**

### Property 38: Non-Default Property Indicator

*For any* property that has been modified from its default value, the Style Panel SHALL display a visual indicator on that property.

**Validates: Requirements 10.8**

### Property 39: Page Creation With Unique Route

*For any* valid route path that doesn't already exist, creating a new page with that route SHALL successfully add the page to the Site_Config.

**Validates: Requirements 11.2**

### Property 40: Page Operations Preserve Integrity

*For any* page, rename/duplicate/delete operations SHALL correctly update the Site_Config while maintaining page data integrity.

**Validates: Requirements 11.3**

### Property 41: Page Selection Loads in Canvas

*For any* page in the Site_Config, selecting it from the pages panel SHALL load that page's component tree in the Canvas for editing.

**Validates: Requirements 11.4**

### Property 42: Navigation Menu Definition

*For any* set of pages, defining a navigation menu SHALL create a valid navigation structure that references existing page routes.

**Validates: Requirements 11.5**

### Property 43: Route Path Uniqueness Validation

*For any* attempt to create or rename a page with a route that already exists, the system SHALL reject the operation with a validation error.

**Validates: Requirements 11.6**

### Property 44: Page Reordering Updates Navigation

*For any* initial page order in the navigation menu, reordering via drag-and-drop SHALL update the navigation menu order in the Site_Config.

**Validates: Requirements 11.8**

### Property 45: Template Loading Applies Site Config

*For any* website template, selecting it SHALL load the template's complete Site_Config into the Canvas, replacing the current config.

**Validates: Requirements 12.4**

### Property 46: Custom Template Saving

*For any* Site_Config, saving it as a custom template SHALL create a reusable template that can be loaded later.

**Validates: Requirements 12.6**

### Property 47: Template Sharing

*For any* custom template, the sharing functionality SHALL make the template accessible to other users.

**Validates: Requirements 12.7**

### Property 48: Template Loading with Theme Preservation

*For any* template load operation with theme preservation enabled, the current theme values SHALL be preserved while the template's pages and components are loaded.

**Validates: Requirements 12.8**

### Property 49: Color Scheme Accessibility Compliance

*For any* AI-generated color scheme, all color combinations SHALL meet WCAG AA contrast ratio requirements (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 13.2**

### Property 50: Color Scheme Completeness

*For any* color scheme generation request, the generated scheme SHALL include all required color types (primary, secondary, accent, background, text).

**Validates: Requirements 13.3**

### Property 51: Multiple Color Scheme Variations

*For any* color scheme generation request, multiple distinct variations (at least 3) SHALL be provided for user selection.

**Validates: Requirements 13.4**

### Property 52: Color Scheme Application Updates Theme

*For any* color scheme, applying it SHALL update all color values in the Site_Config theme to match the scheme's colors.

**Validates: Requirements 13.5**

### Property 53: Gradient Generation for Color Schemes

*For any* generated color scheme, complementary gradient combinations SHALL be generated using the scheme's colors.

**Validates: Requirements 13.6**

### Property 54: Color Usage Guidelines Provided

*For any* generated color scheme, usage guidelines SHALL be provided indicating which colors to use for backgrounds, text, and accents.

**Validates: Requirements 13.7**

### Property 55: Component Nesting in Containers

*For any* component and any layout container, dropping the component into the container SHALL add it as a child of that container in the component tree.

**Validates: Requirements 14.2**

### Property 56: Container-Specific Properties Available

*For any* layout container type, selecting it SHALL display container-specific properties (grid columns, flex direction, gap, etc.) in the Style Panel.

**Validates: Requirements 14.5**

### Property 57: Component Movement Between Containers

*For any* component in a container, dragging it to a different container SHALL move the component from the original container to the target container in the component tree.

**Validates: Requirements 14.6**

### Property 58: Circular Nesting Prevention

*For any* container component, attempting to drop it into itself or any of its descendant components SHALL be prevented by the system.

**Validates: Requirements 14.7**

### Property 59: Export Project Completeness

*For any* Site_Config, the exported Next.js project SHALL include all referenced components, assets, and configuration files required for deployment.

**Validates: Requirements 16.1, 16.2**

### Property 60: Image Optimization in Export

*For any* exported project containing images, all images SHALL be optimized for production (compressed, responsive versions generated).

**Validates: Requirements 16.3**

### Property 61: SEO Metadata Generation

*For any* Site_Config with pages, the export SHALL generate appropriate SEO metadata (title, description, Open Graph tags) for each page.

**Validates: Requirements 16.4**

### Property 62: ZIP Download Completeness

*For any* Site_Config, downloading as ZIP SHALL produce a complete, valid Next.js project that can be extracted and deployed.

**Validates: Requirements 16.8**

### Property 63: Custom CSS Parsing and Application

*For any* valid CSS entered in the custom CSS editor, the CSS SHALL be parsed, validated, and applied to the component in real-time on the Canvas.

**Validates: Requirements 18.2, 18.4**

### Property 64: Interaction Configuration Applies Behaviors

*For any* component with configured interactions (hover, animations, click actions), the exported website SHALL include the interaction behaviors in the component code.

**Validates: Requirements 19.7, 19.8**

### Property 65: Form Field Configuration

*For any* form component, adding/removing/reordering form fields SHALL correctly update the form structure in the Site_Config.

**Validates: Requirements 21.3**

### Property 66: Form Validation Rules Application

*For any* form field with validation rules (required, min/max length, pattern), submitting the form on the published website SHALL validate according to these rules.

**Validates: Requirements 21.5**

### Property 67: SEO Metadata Validation

*For any* page with SEO settings, the system SHALL validate that title tags and meta descriptions are within recommended length limits (title ≤ 60 chars, description ≤ 160 chars).

**Validates: Requirements 22.5**

### Property 68: Version Save After Edit Session

*For any* editing session, closing the builder or navigating away SHALL automatically save the current Site_Config as a version in the history.

**Validates: Requirements 23.1**

### Property 69: Version Restore Replaces Current Config

*For any* version in the history, restoring it SHALL replace the current Site_Config with the selected version's configuration.

**Validates: Requirements 23.4**

### Property 70: Version Comparison Highlights Differences

*For any* two versions in the history, comparing them side-by-side SHALL highlight the differences between the two configurations.

**Validates: Requirements 23.5**

### Property 71: Performance Issue Detection

*For any* Site_Config, analyzing it for performance issues SHALL identify large unoptimized images, excessive nesting, and other performance problems.

**Validates: Requirements 24.2, 24.3**

### Property 72: Accessibility Color Contrast Validation

*For any* component with text and background colors defined, the system SHALL validate that the contrast ratio meets WCAG AA requirements and display warnings for non-compliant combinations.

**Validates: Requirements 25.1**

### Property 73: Image Alt Text Validation

*For any* image component, the accessibility validator SHALL verify that an alt text description is provided and warn if missing.

**Validates: Requirements 25.2**

### Property 74: Heading Hierarchy Validation

*For any* page, the accessibility validator SHALL verify semantic heading hierarchy with no skipped levels (h1 → h2 → h3, not h1 → h3).

**Validates: Requirements 25.4**


## 17. Implementation Phases

The visual website builder will be implemented in the following phases:

### Phase 1: Foundation (Weeks 1-2)
- Extend data models (VisualStyleProps, enhanced ThemeDef)
- Set up Zustand store with history management
- Create basic Canvas component with selection and rendering
- Implement component tree manipulation utilities

### Phase 2: Core Editing (Weeks 3-4)
- Implement drag-and-drop with DndKit
- Build Component Palette with categorized components
- Create Style Panel with properties and styles editors
- Add undo/redo functionality
- Implement real-time style updates

### Phase 3: AI Integration (Weeks 5-6)
- Set up Python FastAPI AI service
- Implement layout generation endpoint
- Create design suggestions system
- Add color scheme generation
- Integrate content generation for components

### Phase 4: Asset Management (Week 7)
- Build Asset Manager UI
- Implement file upload with drag-and-drop
- Add image optimization pipeline
- Create asset search and organization features

### Phase 5: Pages and Navigation (Week 8)
- Build Pages Panel
- Implement page CRUD operations
- Add navigation menu builder
- Create page routing validation

### Phase 6: Responsive Design (Week 9)
- Implement Responsive Preview with viewport presets
- Add breakpoint-specific style overrides
- Create responsive validation tools

### Phase 7: Advanced Features (Weeks 10-11)
- Implement custom CSS editor
- Add interaction and animation configuration
- Build form builder integration
- Create SEO configuration interface

### Phase 8: Templates and Themes (Week 12)
- Design and implement 10+ website templates
- Create theme template system
- Add theme import/export functionality

### Phase 9: Collaboration (Week 13)
- Implement WebSocket-based real-time sync
- Add presence indicators and cursors
- Create conflict resolution system

### Phase 10: Export and Deployment (Week 14)
- Enhance code generation pipeline
- Implement optimization (image, code splitting, minification)
- Add deployment integrations (Vercel, Netlify, Cloudflare)
- Create GitHub repository generation

### Phase 11: Accessibility and Performance (Week 15)
- Build accessibility validation system
- Implement performance analysis tools
- Add automated fixes and suggestions

### Phase 12: Version History and Recovery (Week 16)
- Implement version history storage
- Create version comparison UI
- Add version restore functionality
- Build config recovery system

### Phase 13: Testing and Polish (Weeks 17-18)
- Write comprehensive unit tests
- Create integration tests
- Develop E2E tests with Playwright
- Performance optimization
- Bug fixes and UI polish

## 18. API Endpoints Summary

### Builder API
- `GET /api/builder/config/:appId` - Get site configuration
- `PUT /api/builder/config/:appId` - Update site configuration
- `POST /api/builder/config/:appId/version` - Save version
- `GET /api/builder/config/:appId/versions` - Get version history
- `POST /api/builder/config/:appId/restore/:versionId` - Restore version

### AI API
- `POST /api/ai/generate-layout` - Generate complete layout from prompt
- `POST /api/ai/suggest-improvements` - Get design suggestions
- `POST /api/ai/generate-color-scheme` - Generate color schemes
- `POST /api/ai/generate-content` - Generate text content
- `POST /api/ai/recommend-images` - Get stock image recommendations

### Asset API
- `POST /api/assets/upload` - Upload assets
- `GET /api/assets` - List assets
- `DELETE /api/assets/:id` - Delete asset
- `GET /api/assets/usage/:id` - Get asset usage locations
- `POST /api/assets/folders` - Create folder

### Export API
- `POST /api/export/generate` - Generate project files
- `POST /api/export/download` - Download as ZIP
- `POST /api/export/deploy/vercel` - Deploy to Vercel
- `POST /api/export/deploy/netlify` - Deploy to Netlify
- `POST /api/export/github` - Create GitHub repository

### Collaboration API
- `WS /api/collaboration/:appId` - WebSocket for real-time sync
- `GET /api/collaboration/:appId/users` - Get active users
- `POST /api/collaboration/:appId/cursor` - Update cursor position

## 19. Component Examples

### Example: Hero Component with Visual Styles

```typescript
const heroComponent: ComponentNode = {
  id: 'hero-1',
  kind: 'hero',
  props: {
    heading: 'Welcome to Our Website',
    subheading: 'Build amazing things with our platform',
    ctaText: 'Get Started',
    ctaLink: '/signup',
    backgroundImage: '/assets/hero-bg.jpg',
  },
  visualStyles: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    padding: '4rem 2rem',
    textAlign: 'center',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '500px',
  },
  children: [],
};
```

### Example: Grid Layout Container

```typescript
const gridContainer: ComponentNode = {
  id: 'grid-1',
  kind: 'grid',
  props: {
    columns: 3,
    gap: 'md',
    alignment: 'start',
  },
  visualStyles: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  children: [
    {
      id: 'card-1',
      kind: 'card',
      props: { title: 'Feature 1', description: 'Description here' },
      visualStyles: {},
    },
    {
      id: 'card-2',
      kind: 'card',
      props: { title: 'Feature 2', description: 'Description here' },
      visualStyles: {},
    },
    {
      id: 'card-3',
      kind: 'card',
      props: { title: 'Feature 3', description: 'Description here' },
      visualStyles: {},
    },
  ],
};
```

### Example: Responsive Styling

```typescript
const responsiveComponent: ComponentNode = {
  id: 'section-1',
  kind: 'section',
  props: {},
  visualStyles: {
    padding: '4rem 2rem',
    fontSize: '1rem',
    breakpoints: {
      mobile: {
        padding: '2rem 1rem',
        fontSize: '0.875rem',
      },
      tablet: {
        padding: '3rem 1.5rem',
        fontSize: '0.9375rem',
      },
      desktop: {
        padding: '4rem 2rem',
        fontSize: '1rem',
      },
    },
  },
  children: [],
};
```

## 20. Conclusion

This design document provides a comprehensive blueprint for transforming the AI App Generator into a full-featured visual website builder with AI-driven customization. The architecture leverages the existing component system while adding powerful visual editing, real-time collaboration, and AI assistance capabilities.

Key technical decisions:
- **Zustand** for predictable state management with undo/redo
- **DndKit** for accessible, flexible drag-and-drop
- **Python FastAPI** for AI services to leverage Claude API
- **WebSocket** for real-time collaboration
- **Extended type system** to support visual styles while maintaining backward compatibility

The phased implementation approach allows for incremental delivery of value, with core editing features in the first phases and advanced features (collaboration, AI optimization) in later phases.

The correctness properties defined in this document provide clear, testable specifications for all critical functionality, enabling property-based testing to ensure robustness across the wide input space of user-created designs.

