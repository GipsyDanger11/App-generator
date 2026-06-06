import type { ComponentNode, ComponentKind } from '@/lib/config/types';

/**
 * Component Tree Manipulation Utilities
 * 
 * All functions return new trees (immutable operations) to ensure
 * proper state management and history tracking.
 */

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Find a component by ID in the tree
 */
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

/**
 * Find the parent of a component
 */
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

/**
 * Get all ancestors of a component (from root to immediate parent)
 */
export function getAncestors(
  root: ComponentNode,
  componentId: string
): ComponentNode[] {
  const ancestors: ComponentNode[] = [];
  
  function findPath(node: ComponentNode): boolean {
    if (node.id === componentId) return true;
    
    if (node.children) {
      for (const child of node.children) {
        if (findPath(child)) {
          ancestors.unshift(node);
          return true;
        }
      }
    }
    
    return false;
  }
  
  findPath(root);
  return ancestors;
}

// ============================================================================
// TREE MODIFICATION FUNCTIONS
// ============================================================================

/**
 * Add a component to the tree at a specific location
 */
export function addComponentToTree(
  root: ComponentNode,
  parentId: string,
  component: ComponentNode,
  position: number
): ComponentNode {
  // Deep clone to avoid mutation
  const newRoot = JSON.parse(JSON.stringify(root)) as ComponentNode;
  
  const parent = findComponentById(newRoot, parentId);
  if (!parent) {
    throw new Error(`Parent component ${parentId} not found`);
  }
  
  // Ensure component has an ID
  if (!component.id) {
    component.id = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!parent.children) {
    parent.children = [];
  }
  
  // Insert at position (clamp to valid range)
  const validPosition = Math.max(0, Math.min(position, parent.children.length));
  parent.children.splice(validPosition, 0, component);
  
  return newRoot;
}

/**
 * Update a component's properties
 */
export function updateComponentInTree(
  root: ComponentNode,
  componentId: string,
  updates: Partial<ComponentNode>
): ComponentNode {
  const newRoot = JSON.parse(JSON.stringify(root)) as ComponentNode;
  
  const component = findComponentById(newRoot, componentId);
  if (!component) {
    throw new Error(`Component ${componentId} not found`);
  }
  
  // Apply updates
  Object.assign(component, updates);
  
  return newRoot;
}

/**
 * Delete a component from the tree
 */
export function deleteComponentFromTree(
  root: ComponentNode,
  componentId: string
): ComponentNode {
  // Cannot delete root
  if (root.id === componentId) {
    throw new Error('Cannot delete root component');
  }
  
  const newRoot = JSON.parse(JSON.stringify(root)) as ComponentNode;
  
  const parent = findParentComponent(newRoot, componentId);
  if (!parent || !parent.children) {
    throw new Error(`Parent of component ${componentId} not found`);
  }
  
  parent.children = parent.children.filter((c) => c.id !== componentId);
  
  return newRoot;
}

/**
 * Move a component to a new location in the tree
 */
export function moveComponentInTree(
  root: ComponentNode,
  componentId: string,
  targetParentId: string,
  position: number
): ComponentNode {
  // Validate move is legal
  if (!preventCircularNesting(root, componentId, targetParentId)) {
    throw new Error('Cannot move component into itself or its descendants');
  }
  
  // Find the component in the original tree
  const component = findComponentById(root, componentId);
  if (!component) {
    throw new Error(`Component ${componentId} not found`);
  }
  
  // Deep clone the component to move
  const componentCopy = JSON.parse(JSON.stringify(component)) as ComponentNode;
  
  // Remove from current location
  let newRoot = deleteComponentFromTree(root, componentId);
  
  // Add to new location
  newRoot = addComponentToTree(newRoot, targetParentId, componentCopy, position);
  
  return newRoot;
}

/**
 * Duplicate a component (creates a copy with new ID)
 */
export function duplicateComponentInTree(
  root: ComponentNode,
  componentId: string
): { newRoot: ComponentNode; duplicatedId: string } {
  const component = findComponentById(root, componentId);
  if (!component) {
    throw new Error(`Component ${componentId} not found`);
  }
  
  const parent = findParentComponent(root, componentId);
  if (!parent || !parent.children) {
    throw new Error('Cannot duplicate root component or component without parent');
  }
  
  // Deep clone and assign new IDs
  const duplicated = JSON.parse(JSON.stringify(component)) as ComponentNode;
  const newId = assignNewIds(duplicated);
  
  // Find position of original component
  const position = parent.children.findIndex((c) => c.id === componentId);
  
  // Insert duplicate right after original
  const newRoot = addComponentToTree(root, parent.id!, duplicated, position + 1);
  
  return { newRoot, duplicatedId: newId };
}

/**
 * Recursively assign new IDs to a component and all its children
 */
function assignNewIds(node: ComponentNode): string {
  const newId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  node.id = newId;
  
  if (node.children) {
    node.children.forEach((child) => assignNewIds(child));
  }
  
  return newId;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a component kind can accept children
 */
export function canHaveChildren(kind: ComponentKind): boolean {
  // Layout containers can have children
  const containers: ComponentKind[] = ['hero', 'card'];
  return containers.includes(kind);
}

/**
 * Check if a component can be dropped into a target
 */
export function canDropIntoComponent(
  targetKind: ComponentKind,
  draggedKind: ComponentKind
): boolean {
  // For now, only specific containers can accept children
  // This can be expanded based on component capabilities
  
  if (targetKind === 'hero') {
    // Hero can contain most display components
    return ['heading', 'text', 'button', 'stats'].includes(draggedKind);
  }
  
  if (targetKind === 'card') {
    // Cards can contain simple components
    return ['heading', 'text', 'button'].includes(draggedKind);
  }
  
  // Most components don't accept children
  return false;
}

/**
 * Prevent circular nesting (component dropped into itself or descendants)
 */
export function preventCircularNesting(
  root: ComponentNode,
  draggedId: string,
  targetId: string
): boolean {
  // Cannot drop into itself
  if (draggedId === targetId) return false;
  
  // Cannot drop into descendants
  const draggedComponent = findComponentById(root, draggedId);
  if (!draggedComponent) return true; // Component not found, allow operation
  
  const isDescendant = (node: ComponentNode, ancestorId: string): boolean => {
    if (node.id === ancestorId) return true;
    if (!node.children) return false;
    return node.children.some((child) => isDescendant(child, ancestorId));
  };
  
  return !isDescendant(draggedComponent, targetId);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all components in the tree (flattened)
 */
export function flattenComponentTree(root: ComponentNode): ComponentNode[] {
  const result: ComponentNode[] = [root];
  
  if (root.children) {
    for (const child of root.children) {
      result.push(...flattenComponentTree(child));
    }
  }
  
  return result;
}

/**
 * Count total components in tree
 */
export function countComponents(root: ComponentNode): number {
  let count = 1;
  
  if (root.children) {
    for (const child of root.children) {
      count += countComponents(child);
    }
  }
  
  return count;
}

/**
 * Get tree depth (maximum nesting level)
 */
export function getTreeDepth(root: ComponentNode): number {
  if (!root.children || root.children.length === 0) return 1;
  
  const childDepths = root.children.map((child) => getTreeDepth(child));
  return 1 + Math.max(...childDepths);
}

/**
 * Generate a unique component ID
 */
export function generateComponentId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
