# Implementation Tasks: Visual Website Builder with AI Customization

## Overview

This document outlines the implementation tasks for transforming the AI App Generator into a comprehensive visual website builder with AI-driven design customization. The implementation follows an 18-week phased approach.

**Implementation Language:** TypeScript (Next.js), Python (FastAPI for AI service)

## Phase 1: Foundation (Weeks 1-2)

### Task 1.1: Extend Data Models
**Estimated effort:** 3 days
**Dependencies:** None

Create extended type definitions in `lib/config/types.ts`:
- Add `VisualStyleProps` interface with typography, colors, spacing, borders, shadows, layout, and responsive breakpoints
- Extend `ComponentNode` to include `visualStyles`, `locked`, `hidden`, `customCSS` fields
- Create comprehensive `ThemeDef` interface with colors, typography, spacing, borderRadius, shadows
- Extend `PageDef` with SEO metadata fields (metaDescription, metaKeywords, ogImage, canonicalUrl, noIndex)
- Add `AssetMetadata` interface for asset management
- Add `NavigationItem` interface for navigation menus
- Extend `AppConfig` with `navigation`, `builderVersion`, `lastEditedAt`, `lastEditedBy`

**Acceptance Criteria:**
- All new interfaces are properly typed with TypeScript
- Backward compatibility maintained with existing AppConfig structure
- Zod schemas created for validation

---

### Task 1.2: Set Up State Management Store
**Estimated effort:** 4 days
**Dependencies:** Task 1.1

Create Zustand store in `stores/builderStore.ts`:
- Implement `EditorState` for current selection, viewport, zoom, panel visibility
- Implement `HistoryState` with circular buffer (max 50 entries)
- Add `undo()` and `redo()` functions with proper state transitions
- Implement `pushHistory()` with automatic size limiting
- Add `CollaborationState` for real-time sync
- Add `AIGenerationState` for AI operation tracking
- Create selectors for derived state (e.g., selected component, current page)

**Acceptance Criteria:**
- Undo/redo works for all operations
- History limited to 50 states
- Store persists to localStorage
- Unit tests for all state operations

---

### Task 1.3: Create Component Tree Utilities
**Estimated effort:** 3 days
**Dependencies:** Task 1.1

Implement tree manipulation functions in `lib/builder/componentTree.ts`:
- `findComponentById()` - recursive search
- `findParentComponent()` - find parent of given child
- `addComponentToTree()` - insert at position
- `updateComponentInTree()` - update properties
- `deleteComponentFromTree()` - remove component
- `moveComponentInTree()` - change parent/position
- `canDropIntoComponent()` - validate drop targets
- `preventCircularNesting()` - prevent invalid moves

**Acceptance Criteria:**
- All functions return new tree (immutable)
- Circular nesting prevented
- Unit tests with 100% coverage
- Performance tested with 1000+ node trees

---

### Task 1.4: Build Basic Canvas Component
**Estimated effort:** 5 days
**Dependencies:** Task 1.2, Task 1.3

Create `components/builder/Canvas.tsx`:
- Render current page using existing `Renderer` component
- Display selection overlay on selected component
- Display hover overlay on hovered component
- Implement viewport sizing (mobile/tablet/desktop presets)
- Add zoom controls (50%-200%)
- Add grid overlay (optional)
- Connect to builder store for state
- Handle component selection clicks

**Acceptance Criteria:**
- Canvas renders all component types correctly
- Selection overlay displays with handles
- Viewport presets work (375px, 768px, 1440px)
- Zoom maintains center point
- Grid overlay toggleable

---

## Phase 2: Core Editing (Weeks 3-4)

### Task 2.1: Implement Drag-and-Drop System
**Estimated effort:** 6 days
**Dependencies:** Task 1.4

Set up DndKit in Canvas component:
- Install and configure `@dnd-kit/core`
- Create `DraggableComponent` wrapper
- Create `DroppableZone` wrapper for containers
- Implement drag preview
- Implement drop position indicators (before/after/inside)
- Handle drag start, drag over, and drop events
- Update store on successful drop
- Add to history on drop

**Acceptance Criteria:**
- Components draggable from palette to canvas
- Components draggable within canvas for reordering
- Drop indicators show valid positions
- Invalid drops prevented
- Smooth drag animations

---

### Task 2.2: Build Component Palette
**Estimated effort:** 4 days
**Dependencies:** Task 2.1

Create `components/builder/ComponentPalette.tsx`:
- Organize components into categories (Navigation, Hero, Content, Forms, Media, Cards, etc.)
- Display component cards with icon, name, description
- Implement search/filter functionality
- Show usage count per component
- Make components draggable
- Add preview tooltip on hover
- Store favorite/recent components

**Acceptance Criteria:**
- 50+ components organized in 13 categories
- Search filters by name/description
- Preview shows component appearance
- Drag initiates from palette successfully

---

### Task 2.3: Create Style Panel
**Estimated effort:** 7 days
**Dependencies:** Task 1.4

Build `components/builder/StylePanel.tsx`:
- Create tabbed interface (Properties, Styles, Interactions, Custom CSS)
- Implement Properties tab with dynamic form generation
- Implement Styles tab with typography, colors, spacing, borders controls
- Add color picker component
- Add spacing visualizer component
- Create responsive breakpoint selector
- Show inherited theme values
- Add copy/paste styles functionality

**Acceptance Criteria:**
- All style properties editable
- Real-time preview on Canvas
- Color picker supports hex, rgb, hsl
- Spacing visualizer shows padding/margin
- Breakpoint overrides work
- Copy/paste preserves all styles

---

### Task 2.4: Implement Real-Time Updates
**Estimated effort:** 3 days
**Dependencies:** Task 2.3

Add reactive updates throughout the system:
- Use debounced updates for style changes (300ms)
- Optimize re-renders with React.memo
- Implement virtual scrolling for large component lists
- Add loading states for heavy operations
- Profile and optimize render performance

**Acceptance Criteria:**
- Style changes update canvas within 100ms
- No unnecessary re-renders
- Canvas smooth with 100+ components
- Virtual scrolling works with 500+ items

---

## Phase 3: AI Integration (Weeks 5-6)

### Task 3.1: Set Up Python AI Service
**Estimated effort:** 4 days
**Dependencies:** None

Create FastAPI service in `ai-service/`:
- Set up FastAPI project structure
- Configure Anthropic Claude API client
- Add CORS for Next.js frontend
- Create health check endpoint
- Set up environment variables
- Add request/response logging
- Deploy to separate service (Cloud Run or similar)

**Acceptance Criteria:**
- FastAPI server runs on port 8000
- Health endpoint returns 200
- CORS allows Next.js origin
- Claude API connection verified
- Deployed and accessible

---

### Task 3.2: Implement Layout Generation
**Estimated effort:** 6 days
**Dependencies:** Task 3.1, Task 1.1

Create `/api/ai/generate-layout` endpoint:
- Design system prompt for Claude with component catalog
- Accept user prompt, website type, target audience, preferred colors
- Call Claude API with structured output format
- Parse JSON response into AppConfig structure
- Validate generated config against schema
- Generate unique IDs for all components
- Apply defaults for missing fields
- Return complete AppConfig with theme

**Acceptance Criteria:**
- Generates valid AppConfig from text prompt
- Includes hero, content, and CRUD components
- Theme colors match user preferences
- Config passes Zod validation
- Handles generation errors gracefully

---

### Task 3.3: Create Design Suggestions System
**Estimated effort:** 5 days
**Dependencies:** Task 3.2

Build `/api/ai/suggest-improvements` endpoint:
- Analyze current AppConfig structure
- Identify improvement opportunities (hierarchy, contrast, spacing)
- Generate 3-5 specific suggestions with explanations
- Calculate confidence scores for each suggestion
- Return structured suggestion objects with before/after previews
- Create UI in builder to display suggestions
- Implement one-click apply for suggestions

**Acceptance Criteria:**
- Suggests valid, actionable improvements
- Explanations are clear and specific
- Suggestions include visual previews
- Apply button updates canvas immediately
- Can reject suggestions without applying

---

### Task 3.4: Implement Color Scheme Generation
**Estimated effort:** 4 days
**Dependencies:** Task 3.1

Create `/api/ai/generate-color-scheme` endpoint:
- Accept base color, mood, and industry inputs
- Generate complementary, analogous, and triadic harmonies
- Use Claude for mood-based and industry-specific palettes
- Validate all schemes meet WCAG AA contrast (4.5:1)
- Generate gradient combinations
- Return 5 color scheme variations with usage guidelines
- Create UI to preview and apply schemes

**Acceptance Criteria:**
- Generates 5 distinct schemes per request
- All schemes meet WCAG AA
- Schemes include primary, secondary, accent, bg, text colors
- Gradients harmonize with base colors
- Usage guidelines provided

---

### Task 3.5: Add Content Generation
**Estimated effort:** 4 days
**Dependencies:** Task 3.1

Build `/api/ai/generate-content` endpoint:
- Accept component type, website context, tone, language
- Generate appropriate content for component fields (heading, body, CTA, etc.)
- Maintain consistent tone across all content
- Support regeneration of individual fields
- Create inline edit UI on canvas for AI content
- Add "Generate Content" button to component properties

**Acceptance Criteria:**
- Content matches component type and context
- Tone consistent across all generated text
- Individual fields regenerable
- Supports 5+ languages
- Inline editing works on canvas

---

## Phase 4: Asset Management (Week 7)

### Task 4.1: Build Asset Manager UI
**Estimated effort:** 5 days
**Dependencies:** Task 1.4

Create `components/builder/AssetManager.tsx`:
- Grid view with thumbnails
- Drag-and-drop file upload
- Folder organization
- Search and filter by name/type/date
- Asset details panel (dimensions, size, URL)
- Delete with usage warning
- Integration with component image properties

**Acceptance Criteria:**
- Upload via drag-and-drop works
- Folders organize assets correctly
- Search returns matching results
- Delete warns if asset in use
- Asset selection updates component

---

### Task 4.2: Implement Asset Upload and Optimization
**Estimated effort:** 5 days  
**Dependencies:** Task 4.1

Create `/api/assets/upload` endpoint:
- Accept multiple file uploads
- Upload originals to S3/CloudFlare R2
- Generate optimized responsive versions (thumbnail, sm, md, lg)
- Use Sharp for image processing
- Store metadata in database
- Return AssetMetadata objects

**Acceptance Criteria:**
- Handles images and videos
- Generates 4 responsive sizes for images
- Stores metadata in PostgreSQL
- Returns URLs for all versions
- Max file size 10MB enforced

---

## Summary of Remaining Phases

**Phase 5 (Week 8):** Pages and Navigation
- Build Pages Panel
- Implement page CRUD operations
- Create navigation menu builder

**Phase 6 (Week 9):** Responsive Design
- Viewport presets and custom sizes
- Breakpoint-specific style overrides
- Responsive validation tools

**Phase 7 (Weeks 10-11):** Advanced Features
- Custom CSS editor with Monaco
- Interaction/animation configuration
- Form builder integration
- SEO configuration interface

**Phase 8 (Week 12):** Templates and Themes
- Design 10+ professional templates
- Theme template system
- Import/export functionality

**Phase 9 (Week 13):** Collaboration
- WebSocket real-time sync
- Presence indicators
- Conflict resolution

**Phase 10 (Week 14):** Export and Deployment  
- Enhanced code generation
- Image optimization pipeline
- Vercel/Netlify deployment
- GitHub repo creation

**Phase 11 (Week 15):** Accessibility and Performance
- WCAG AA validation
- Performance analysis
- Automated fixes

**Phase 12 (Week 16):** Version History
- Auto-save versions
- Version comparison
- Restore functionality

**Phase 13 (Weeks 17-18):** Testing and Polish
- Unit tests (Jest)
- Integration tests (React Testing Library)
- E2E tests (Playwright)
- Performance optimization
- Bug fixes and UI polish

---

## Notes

- Total estimated effort: 18 weeks with 2-3 developers
- This replaces the current CRUD-focused generator with a visual website builder
- Maintains backward compatibility with existing AppConfig structure
- AI-driven customization throughout the experience
- Professional, visually rich templates instead of basic hero+form+table layouts

**Next Steps:** Review this plan with stakeholders, then begin Phase 1 implementation.
