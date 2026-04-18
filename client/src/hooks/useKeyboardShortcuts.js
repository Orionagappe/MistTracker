/**
 * useKeyboardShortcuts.js - Global keyboard shortcut handler
 * Phase 9.0: Keyboard Shortcuts Foundation
 *
 * Provides centralized keyboard event handling for both Builder and Simulator tabs
 * Manages key press tracking, hotkey matching, and action dispatching
 */

import { useEffect, useRef, useCallback } from 'react';
import HOTKEYS_CONFIG, { matchesHotkey, getHotkeyByAction } from '../config/HOTKEYS_CONFIG';

/**
 * Custom hook for managing keyboard shortcuts
 *
 * @param {string} tabName - Current tab ('builder' or 'simulator')
 * @param {Object} handlers - Object mapping action names to callback functions
 * @param {boolean} enabled - Whether keyboard shortcuts are enabled (default: true)
 *
 * Usage:
 * const handlers = {
 *   'save': () => console.log('Saving...'),
 *   'undo': () => console.log('Undoing...'),
 *   // ... more handlers
 * };
 * useKeyboardShortcuts('builder', handlers);
 */
export const useKeyboardShortcuts = (tabName = 'builder', handlers = {}, enabled = true) => {
  const keysPressed = useRef(new Set());

  // Get relevant hotkey configs for current tab
  const getActiveHotkeys = useCallback(() => {
    const tab = tabName === 'builder' ? HOTKEYS_CONFIG.builder : HOTKEYS_CONFIG.simulator;
    return { ...tab, ...HOTKEYS_CONFIG.global };
  }, [tabName]);

  // Handle key down event
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Track which keys are currently pressed
      keysPressed.current.add(event.key);

      // Special handling for modifier keys
      if (event.ctrlKey || event.metaKey) keysPressed.current.add('Control');
      if (event.altKey) keysPressed.current.add('Alt');
      if (event.shiftKey) keysPressed.current.add('Shift');

      const activeHotkeys = getActiveHotkeys();

      // Check each hotkey to see if it matches the current key press
      for (const [actionId, hotkeyConfig] of Object.entries(activeHotkeys)) {
        // Skip context-specific hotkeys (e.g., placement dialog hotkeys)
        if (hotkeyConfig.context) continue;

        if (matchesHotkey(Array.from(keysPressed.current), hotkeyConfig)) {
          // Found a matching hotkey
          const action = hotkeyConfig.action;
          const handler = handlers[action];

          if (handler && typeof handler === 'function') {
            event.preventDefault();
            handler(event);
          }
        }
      }
    },
    [enabled, handlers, getActiveHotkeys]
  );

  // Handle key up event
  const handleKeyUp = useCallback((event) => {
    // Remove the released key from pressed keys
    keysPressed.current.delete(event.key);

    // Also remove modifier keys if they're no longer pressed
    if (!event.ctrlKey && !event.metaKey) keysPressed.current.delete('Control');
    if (!event.altKey) keysPressed.current.delete('Alt');
    if (!event.shiftKey) keysPressed.current.delete('Shift');
  }, []);

  // Setup and cleanup event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressed.current.clear();
    };
  }, [handleKeyDown, handleKeyUp]);

  // Return utility functions
  return {
    /**
     * Trigger a specific action by action ID
     */
    triggerAction: (actionId) => {
      const handler = handlers[actionId];
      if (handler && typeof handler === 'function') {
        handler();
      }
    },

    /**
     * Check if a specific action is currently pressed
     */
    isActionPressed: (actionId) => {
      const hotkeyConfig = getHotkeyByAction(actionId, tabName);
      return hotkeyConfig && matchesHotkey(Array.from(keysPressed.current), hotkeyConfig);
    },

    /**
     * Get currently pressed keys
     */
    getPressedKeys: () => Array.from(keysPressed.current),

    /**
     * Clear all pressed keys (useful for context switches)
     */
    clearPressedKeys: () => keysPressed.current.clear(),

    /**
     * Temporarily disable/enable keyboard shortcuts
     */
    setEnabled: (isEnabled) => {
      // This is controlled by the 'enabled' prop, but you can add state if needed
    }
  };
};

/**
 * Hook for handling context-specific keyboard shortcuts
 * (e.g., shortcuts that only work in placement dialogs or measurement mode)
 *
 * @param {string} context - Context name (e.g., 'placement_dialog')
 * @param {Object} handlers - Action handlers for this context
 * @param {boolean} enabled - Whether this context is active
 */
export const useContextKeyboardShortcuts = (context, handlers = {}, enabled = true) => {
  const keysPressed = useRef(new Set());

  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      keysPressed.current.add(event.key);
      if (event.ctrlKey || event.metaKey) keysPressed.current.add('Control');
      if (event.altKey) keysPressed.current.add('Alt');
      if (event.shiftKey) keysPressed.current.add('Shift');

      // Find matching hotkey for this context
      const allHotkeys = { ...HOTKEYS_CONFIG.builder, ...HOTKEYS_CONFIG.simulator };

      for (const [actionId, hotkeyConfig] of Object.entries(allHotkeys)) {
        if (hotkeyConfig.context === context) {
          if (matchesHotkey(Array.from(keysPressed.current), hotkeyConfig)) {
            const action = hotkeyConfig.action;
            const handler = handlers[action];

            if (handler && typeof handler === 'function') {
              event.preventDefault();
              handler(event);
            }
          }
        }
      }
    },
    [enabled, handlers, context]
  );

  const handleKeyUp = useCallback((event) => {
    keysPressed.current.delete(event.key);
    if (!event.ctrlKey && !event.metaKey) keysPressed.current.delete('Control');
    if (!event.altKey) keysPressed.current.delete('Alt');
    if (!event.shiftKey) keysPressed.current.delete('Shift');
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressed.current.clear();
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  return {
    getPressedKeys: () => Array.from(keysPressed.current),
    clearPressedKeys: () => keysPressed.current.clear()
  };
};

export default useKeyboardShortcuts;
