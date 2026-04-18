/**
 * useMultiSelect.js
 * Phase 9.3: Multi-select management hook
 * 
 * Manages selection of atoms/emitters with support for:
 * - Single select (click)
 * - Multi-select (Shift+click, Ctrl+click)
 * - Clear selection (click on empty space, ESC key)
 * - Selection highlighting visuals
 */

import { useState, useCallback, useRef } from 'react';

/**
 * useMultiSelect Hook
 * 
 * @param {Array} items - All items (atoms/emitters) in scene
 * @param {Function} onSelectionChange - Callback when selection changes
 * @returns {Object} Selection state and handlers
 */
export function useMultiSelect(items = [], onSelectionChange) {
  const [selected, setSelected] = useState(new Set());
  const lastSelectedRef = useRef(null);

  /**
   * Toggle selection for single item
   */
  const toggleSelect = useCallback((itemId, modifiers = {}) => {
    const { shift = false, ctrl = false } = modifiers;

    setSelected(prevSelected => {
      let newSelected = new Set(prevSelected);

      if (shift && lastSelectedRef.current) {
        // Shift+click: select range between last selected and this
        const currentIndex = items.findIndex(i => i.id === itemId);
        const lastIndex = items.findIndex(i => i.id === lastSelectedRef.current);

        if (currentIndex >= 0 && lastIndex >= 0) {
          const [start, end] = [
            Math.min(currentIndex, lastIndex),
            Math.max(currentIndex, lastIndex)
          ];
          for (let i = start; i <= end; i++) {
            newSelected.add(items[i].id);
          }
        }
      } else if (ctrl) {
        // Ctrl+click: add/remove from selection
        if (newSelected.has(itemId)) {
          newSelected.delete(itemId);
        } else {
          newSelected.add(itemId);
        }
      } else {
        // Regular click: replace selection
        newSelected.clear();
        newSelected.add(itemId);
      }

      lastSelectedRef.current = itemId;
      onSelectionChange?.(Array.from(newSelected));
      return newSelected;
    });
  }, [items, onSelectionChange]);

  /**
   * Select multiple items (used by marquee selection)
   */
  const selectMultiple = useCallback((itemIds) => {
    setSelected(new Set(itemIds));
    if (itemIds.length > 0) {
      lastSelectedRef.current = itemIds[itemIds.length - 1];
    }
    onSelectionChange?.(itemIds);
  }, [onSelectionChange]);

  /**
   * Add to existing selection
   */
  const addToSelection = useCallback((itemIds) => {
    setSelected(prevSelected => {
      const newSelected = new Set(prevSelected);
      itemIds.forEach(id => newSelected.add(id));
      onSelectionChange?.(Array.from(newSelected));
      return newSelected;
    });
  }, [onSelectionChange]);

  /**
   * Remove from selection
   */
  const removeFromSelection = useCallback((itemIds) => {
    setSelected(prevSelected => {
      const newSelected = new Set(prevSelected);
      itemIds.forEach(id => newSelected.delete(id));
      onSelectionChange?.(Array.from(newSelected));
      return newSelected;
    });
  }, [onSelectionChange]);

  /**
   * Clear all selection
   */
  const clearSelection = useCallback(() => {
    setSelected(new Set());
    lastSelectedRef.current = null;
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  /**
   * Replace current selection
   */
  const setSelection = useCallback((itemIds) => {
    const newSelected = new Set(itemIds);
    setSelected(newSelected);
    if (itemIds.length > 0) {
      lastSelectedRef.current = itemIds[itemIds.length - 1];
    }
    onSelectionChange?.(itemIds);
  }, [onSelectionChange]);

  /**
   * Check if item is selected
   */
  const isSelected = useCallback((itemId) => {
    return selected.has(itemId);
  }, [selected]);

  /**
   * Get all selected IDs
   */
  const getSelectedIds = useCallback(() => {
    return Array.from(selected);
  }, [selected]);

  /**
   * Get selected items (full objects)
   */
  const getSelectedItems = useCallback(() => {
    return items.filter(item => selected.has(item.id));
  }, [items, selected]);

  /**
   * Get selection count
   */
  const getSelectionCount = useCallback(() => {
    return selected.size;
  }, [selected]);

  /**
   * Select all items
   */
  const selectAll = useCallback(() => {
    const allIds = items.map(item => item.id);
    setSelection(allIds);
  }, [items, setSelection]);

  /**
   * Invert selection
   */
  const invertSelection = useCallback(() => {
    const allIds = new Set(items.map(item => item.id));
    setSelected(prevSelected => {
      const newSelected = new Set();
      allIds.forEach(id => {
        if (!prevSelected.has(id)) {
          newSelected.add(id);
        }
      });
      onSelectionChange?.(Array.from(newSelected));
      return newSelected;
    });
  }, [items, onSelectionChange]);

  return {
    // State
    selected,
    selectedCount: selected.size,
    selectedIds: getSelectedIds(),
    selectedItems: getSelectedItems(),

    // Modifiers
    toggleSelect,
    selectMultiple,
    addToSelection,
    removeFromSelection,
    clearSelection,
    setSelection,
    selectAll,
    invertSelection,

    // Queries
    isSelected,
    getSelectedIds,
    getSelectedItems,
    getSelectionCount,
    hasSelection: selected.size > 0,
    hasSingleSelection: selected.size === 1,
    hasMultipleSelection: selected.size > 1
  };
}

export default useMultiSelect;
