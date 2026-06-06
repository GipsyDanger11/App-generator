import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppConfig, ComponentNode, PageDef, AssetMetadata } from '@/lib/config/types';

// ============================================================================
// STATE INTERFACES
// ============================================================================

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
  zoom: number; // 0.5 to 2.0
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
    draggedComponentKind: string | null;
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
  sessionId: string | null;
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

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface BuilderStore {
  // Config state
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  
  // Editor state
  editorState: EditorState;
  updateEditorState: (partial: Partial<EditorState>) => void;
  selectComponent: (id: string | null) => void;
  hoverComponent: (id: string | null) => void;
  setViewportPreset: (preset: 'mobile' | 'tablet' | 'desktop') => void;
  setZoom: (zoom: number) => void;
  togglePanel: (panel: keyof EditorState['panels']) => void;
  
  // History
  history: HistoryState;
  undo: () => void;
  redo: () => void;
  pushHistory: (config: AppConfig) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Component operations
  addComponent: (parentId: string, component: ComponentNode, position: number) => void;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  deleteComponent: (id: string) => void;
  moveComponent: (id: string, targetParentId: string, position: number) => void;
  duplicateComponent: (id: string) => void;
  
  // Page operations
  setCurrentPage: (pageId: string) => void;
  createPage: (route: string, title: string) => void;
  updatePage: (id: string, updates: Partial<PageDef>) => void;
  deletePage: (id: string) => void;
  duplicatePage: (id: string) => void;
  
  // Theme operations
  updateTheme: (theme: Partial<AppConfig['theme']>) => void;
  
  // Asset operations
  assets: AssetMetadata[];
  addAsset: (asset: AssetMetadata) => void;
  deleteAsset: (id: string) => void;
  
  // Collaboration
  collaboration: CollaborationState;
  updateCollaboration: (updates: Partial<CollaborationState>) => void;
  
  // AI Generation
  aiState: AIGenerationState;
  setAIGenerating: (isGenerating: boolean, operation?: string) => void;
  addSuggestion: (suggestion: DesignSuggestion) => void;
  applySuggestion: (id: string) => void;
  clearSuggestions: () => void;
}

// ============================================================================
// DEFAULT STATES
// ============================================================================

const defaultEditorState: EditorState = {
  currentPageId: null,
  selectedComponentId: null,
  hoveredComponentId: null,
  viewportSize: {
    width: 1440,
    height: 900,
    preset: 'desktop',
  },
  zoom: 1,
  showGrid: false,
  showRulers: false,
  panels: {
    componentPalette: true,
    stylePanel: true,
    pagesPanel: true,
    assetsPanel: false,
    layersPanel: false,
  },
  stylePanelTab: 'properties',
  dragState: null,
};

const defaultCollaborationState: CollaborationState = {
  sessionId: null,
  users: [],
  isConnected: false,
  isSyncing: false,
};

const defaultAIState: AIGenerationState = {
  isGenerating: false,
  progress: 0,
  currentOperation: '',
  suggestions: [],
};

const defaultConfig: AppConfig = {
  name: 'New Website',
  description: '',
  entities: [],
  pages: [],
  theme: {
    primary: '#3B82F6',
    accent: '#10B981',
  },
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set, get) => ({
      // Config
      config: defaultConfig,
      setConfig: (config) => set({ config }),
      
      // Editor state
      editorState: defaultEditorState,
      updateEditorState: (partial) =>
        set((state) => ({
          editorState: { ...state.editorState, ...partial },
        })),
      
      selectComponent: (id) =>
        set((state) => ({
          editorState: { ...state.editorState, selectedComponentId: id },
        })),
      
      hoverComponent: (id) =>
        set((state) => ({
          editorState: { ...state.editorState, hoveredComponentId: id },
        })),
      
      setViewportPreset: (preset) => {
        const sizes = {
          mobile: { width: 375, height: 667 },
          tablet: { width: 768, height: 1024 },
          desktop: { width: 1440, height: 900 },
        };
        set((state) => ({
          editorState: {
            ...state.editorState,
            viewportSize: { ...sizes[preset], preset },
          },
        }));
      },
      
      setZoom: (zoom) =>
        set((state) => ({
          editorState: { ...state.editorState, zoom: Math.max(0.25, Math.min(2, zoom)) },
        })),
      
      togglePanel: (panel) =>
        set((state) => ({
          editorState: {
            ...state.editorState,
            panels: {
              ...state.editorState.panels,
              [panel]: !state.editorState.panels[panel],
            },
          },
        })),
      
      // History
      history: {
        past: [],
        present: defaultConfig,
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
        let newPast = [...history.past, history.present];
        
        // Limit history size
        if (newPast.length > history.maxHistorySize) {
          newPast = newPast.slice(newPast.length - history.maxHistorySize);
        }
        
        set({
          history: {
            ...history,
            past: newPast,
            present: config,
            future: [], // Clear future on new change
          },
          config,
        });
      },
      
      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,
      
      // Component operations (stubs - will implement with component tree utilities)
      addComponent: (parentId, component, position) => {
        console.log('addComponent', { parentId, component, position });
        // TODO: Implement with componentTree utilities
      },
      
      updateComponent: (id, updates) => {
        console.log('updateComponent', { id, updates });
        // TODO: Implement with componentTree utilities
      },
      
      deleteComponent: (id) => {
        console.log('deleteComponent', { id });
        // TODO: Implement with componentTree utilities
      },
      
      moveComponent: (id, targetParentId, position) => {
        console.log('moveComponent', { id, targetParentId, position });
        // TODO: Implement with componentTree utilities
      },
      
      duplicateComponent: (id) => {
        console.log('duplicateComponent', { id });
        // TODO: Implement with componentTree utilities
      },
      
      // Page operations
      setCurrentPage: (pageId) =>
        set((state) => ({
          editorState: { ...state.editorState, currentPageId: pageId },
        })),
      
      createPage: (route, title) => {
        const newPage: PageDef = {
          id: `page-${Date.now()}`,
          route,
          title,
          root: {
            id: `root-${Date.now()}`,
            kind: 'hero',
            props: {
              title: title || 'New Page',
              subtitle: 'Start building your page',
            },
          },
        };
        
        const config = get().config;
        const newConfig = {
          ...config,
          pages: [...config.pages, newPage],
        };
        
        get().pushHistory(newConfig);
        set({ config: newConfig });
      },
      
      updatePage: (id, updates) => {
        const config = get().config;
        const newConfig = {
          ...config,
          pages: config.pages.map((page) =>
            page.id === id ? { ...page, ...updates } : page
          ),
        };
        
        get().pushHistory(newConfig);
        set({ config: newConfig });
      },
      
      deletePage: (id) => {
        const config = get().config;
        const newConfig = {
          ...config,
          pages: config.pages.filter((page) => page.id !== id),
        };
        
        get().pushHistory(newConfig);
        set({ config: newConfig });
      },
      
      duplicatePage: (id) => {
        const config = get().config;
        const originalPage = config.pages.find((page) => page.id === id);
        if (!originalPage) return;
        
        const newPage: PageDef = {
          ...JSON.parse(JSON.stringify(originalPage)),
          id: `page-${Date.now()}`,
          route: `${originalPage.route}-copy`,
          title: `${originalPage.title || 'Page'} (Copy)`,
        };
        
        const newConfig = {
          ...config,
          pages: [...config.pages, newPage],
        };
        
        get().pushHistory(newConfig);
        set({ config: newConfig });
      },
      
      // Theme operations
      updateTheme: (theme) => {
        const config = get().config;
        const newConfig = {
          ...config,
          theme: { ...config.theme, ...theme },
        };
        
        get().pushHistory(newConfig);
        set({ config: newConfig });
      },
      
      // Assets
      assets: [],
      addAsset: (asset) =>
        set((state) => ({
          assets: [...state.assets, asset],
        })),
      
      deleteAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== id),
        })),
      
      // Collaboration
      collaboration: defaultCollaborationState,
      updateCollaboration: (updates) =>
        set((state) => ({
          collaboration: { ...state.collaboration, ...updates },
        })),
      
      // AI
      aiState: defaultAIState,
      setAIGenerating: (isGenerating, operation = '') =>
        set((state) => ({
          aiState: {
            ...state.aiState,
            isGenerating,
            currentOperation: operation,
            progress: isGenerating ? 0 : 100,
          },
        })),
      
      addSuggestion: (suggestion) =>
        set((state) => ({
          aiState: {
            ...state.aiState,
            suggestions: [...state.aiState.suggestions, suggestion],
          },
        })),
      
      applySuggestion: (id) => {
        const { aiState, config, pushHistory } = get();
        const suggestion = aiState.suggestions.find((s) => s.id === id);
        if (!suggestion) return;
        
        const newConfig = { ...config, ...suggestion.changes };
        pushHistory(newConfig);
        set({ config: newConfig });
      },
      
      clearSuggestions: () =>
        set((state) => ({
          aiState: { ...state.aiState, suggestions: [] },
        })),
    }),
    {
      name: 'builder-storage',
      partialize: (state) => ({
        // Only persist these fields
        config: state.config,
        editorState: {
          currentPageId: state.editorState.currentPageId,
          viewportSize: state.editorState.viewportSize,
          zoom: state.editorState.zoom,
          panels: state.editorState.panels,
        },
      }),
    }
  )
);
