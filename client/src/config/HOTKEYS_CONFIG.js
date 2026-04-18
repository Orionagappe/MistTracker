/**
 * HOTKEYS_CONFIG.js - Centralized keyboard shortcut bindings
 * Phase 9.0: Keyboard Shortcuts Foundation
 * 
 * All keyboard bindings for both Builder and Simulator tabs
 * Used by useKeyboardShortcuts hook and UI tooltips
 */

export const HOTKEYS_CONFIG = {
  // ===== BUILDER TAB HOTKEYS =====
  builder: {
    // File operations
    save: {
      keys: ['Control', 's'],
      description: 'Save builder configuration',
      action: 'save',
      category: 'file'
    },
    load: {
      keys: ['Control', 'l'],
      description: 'Load builder configuration',
      action: 'load',
      category: 'file'
    },

    // Edit operations
    delete: {
      keys: ['Delete'],
      description: 'Delete selected atom or object',
      action: 'delete',
      category: 'edit'
    },
    undo: {
      keys: ['Control', 'z'],
      description: 'Undo last action',
      action: 'undo',
      category: 'edit'
    },
    redo: {
      keys: ['Control', 'y'],
      description: 'Redo last undone action',
      action: 'redo',
      category: 'edit'
    },
    selectAll: {
      keys: ['Control', 'a'],
      description: 'Select all atoms',
      action: 'select_all',
      category: 'selection'
    },
    escape: {
      keys: ['Escape'],
      description: 'Deselect current selection',
      action: 'deselect',
      category: 'selection'
    },

    // Mode hotkeys
    selectMode: {
      keys: ['1'],
      description: 'Switch to Select mode',
      action: 'mode_select',
      category: 'mode'
    },
    atomMode: {
      keys: ['2'],
      description: 'Switch to Atom Placement mode',
      action: 'mode_atom',
      category: 'mode'
    },
    emitterMode: {
      keys: ['3'],
      description: 'Switch to Emitter Placement mode',
      action: 'mode_emitter',
      category: 'mode'
    },
    observerMode: {
      keys: ['4'],
      description: 'Switch to Observer/Probe mode',
      action: 'mode_observer',
      category: 'mode'
    },
    measureMode: {
      keys: ['5'],
      description: 'Switch to Measurement mode',
      action: 'mode_measure',
      category: 'mode'
    },

    // Navigation
    zoomReset: {
      keys: ['0'],
      description: 'Reset camera zoom to default',
      action: 'zoom_reset',
      category: 'navigation'
    },
    panUp: {
      keys: ['ArrowUp'],
      description: 'Pan camera up',
      action: 'pan_up',
      category: 'navigation'
    },
    panDown: {
      keys: ['ArrowDown'],
      description: 'Pan camera down',
      action: 'pan_down',
      category: 'navigation'
    },
    panLeft: {
      keys: ['ArrowLeft'],
      description: 'Pan camera left',
      action: 'pan_left',
      category: 'navigation'
    },
    panRight: {
      keys: ['ArrowRight'],
      description: 'Pan camera right',
      action: 'pan_right',
      category: 'navigation'
    },

    // Quick config during placement
    orbitCycleNext: {
      keys: ['ArrowRight'],
      description: 'Cycle to next orbital (during placement)',
      action: 'orbital_next',
      category: 'config',
      context: 'placement_dialog'
    },
    orbitCyclePrev: {
      keys: ['ArrowLeft'],
      description: 'Cycle to previous orbital (during placement)',
      action: 'orbital_prev',
      category: 'config',
      context: 'placement_dialog'
    },
    confirmPlacement: {
      keys: ['Enter'],
      description: 'Confirm atom placement and orbital selection',
      action: 'confirm_placement',
      category: 'config',
      context: 'placement_dialog'
    },
    cancelPlacement: {
      keys: ['Escape'],
      description: 'Cancel atom placement',
      action: 'cancel_placement',
      category: 'config',
      context: 'placement_dialog'
    }
  },

  // ===== SIMULATOR TAB HOTKEYS =====
  simulator: {
    // Playback control
    playPause: {
      keys: ['Space'],
      description: 'Play or pause the simulation',
      action: 'play_pause',
      category: 'playback'
    },
    reset: {
      keys: ['r'],
      description: 'Reset simulation to start',
      action: 'reset',
      category: 'playback'
    },
    stepForward: {
      keys: ['Right'],
      description: 'Single step simulation forward',
      action: 'step_forward',
      category: 'playback'
    },
    stepBackward: {
      keys: ['Left'],
      description: 'Single step simulation backward',
      action: 'step_backward',
      category: 'playback'
    },

    // Tools
    measureMode: {
      keys: ['m'],
      description: 'Toggle measurement tool',
      action: 'toggle_measure',
      category: 'tools'
    },
    probeMode: {
      keys: ['p'],
      description: 'Toggle probe/observer tool',
      action: 'toggle_probe',
      category: 'tools'
    },

    // Navigation
    resetView: {
      keys: ['0'],
      description: 'Reset camera to default view',
      action: 'reset_view',
      category: 'navigation'
    },
    rotateUp: {
      keys: ['ArrowUp'],
      description: 'Rotate view upward',
      action: 'rotate_up',
      category: 'navigation'
    },
    rotateDown: {
      keys: ['ArrowDown'],
      description: 'Rotate view downward',
      action: 'rotate_down',
      category: 'navigation'
    },
    rotateLeft: {
      keys: ['ArrowLeft'],
      description: 'Rotate view left',
      action: 'rotate_left',
      category: 'navigation'
    },
    rotateRight: {
      keys: ['ArrowRight'],
      description: 'Rotate view right',
      action: 'rotate_right',
      category: 'navigation'
    },

    // Speed control
    speedUp: {
      keys: ['+'],
      description: 'Increase simulation speed',
      action: 'speed_up',
      category: 'simulation'
    },
    speedDown: {
      keys: ['-'],
      description: 'Decrease simulation speed',
      action: 'speed_down',
      category: 'simulation'
    },
    speedReset: {
      keys: ['1'],
      description: 'Reset simulation speed to 1x',
      action: 'speed_reset',
      category: 'simulation'
    },

    // Display options
    toggleWireframe: {
      keys: ['w'],
      description: 'Toggle wireframe display',
      action: 'toggle_wireframe',
      category: 'display'
    },
    toggleLabels: {
      keys: ['l'],
      description: 'Toggle atom/probe labels',
      action: 'toggle_labels',
      category: 'display'
    },
    toggleGrid: {
      keys: ['g'],
      description: 'Toggle reference grid',
      action: 'toggle_grid',
      category: 'display'
    }
  },

  // ===== GLOBAL HOTKEYS (Both Tabs) =====
  global: {
    menu: {
      keys: ['Escape'],
      description: 'Toggle menu/settings',
      action: 'toggle_menu',
      category: 'global'
    },
    help: {
      keys: ['h', '?'],
      description: 'Show keyboard shortcuts help',
      action: 'show_help',
      category: 'global'
    },
    switchToBuilder: {
      keys: ['Control', '1'],
      description: 'Switch to Builder tab',
      action: 'tab_builder',
      category: 'tabs'
    },
    switchToSimulator: {
      keys: ['Control', '2'],
      description: 'Switch to Simulator tab',
      action: 'tab_simulator',
      category: 'tabs'
    }
  }
};

/**
 * Get all hotkeys grouped by category
 */
export const getHotkeysByCategory = (tabName) => {
  const hotkeys = tabName === 'builder' 
    ? HOTKEYS_CONFIG.builder 
    : HOTKEYS_CONFIG.simulator;
  
  const grouped = {};
  Object.entries(hotkeys).forEach(([key, config]) => {
    const category = config.category || 'other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ id: key, ...config });
  });
  return grouped;
};

/**
 * Get hotkey by action ID and tab
 */
export const getHotkeyByAction = (action, tabName = 'builder') => {
  const hotkeys = tabName === 'builder'
    ? HOTKEYS_CONFIG.builder
    : HOTKEYS_CONFIG.simulator;

  for (const [, config] of Object.entries(hotkeys)) {
    if (config.action === action) return config;
  }
  
  // Also check global hotkeys
  for (const [, config] of Object.entries(HOTKEYS_CONFIG.global)) {
    if (config.action === action) return config;
  }
  
  return null;
};

/**
 * Check if a key combination matches a hotkey
 */
export const matchesHotkey = (keysPressed, hotkeyConfig) => {
  if (!hotkeyConfig || !hotkeyConfig.keys) return false;
  
  // Normalize keys to lowercase for comparison
  const normalized = keysPressed.map(k => k.toLowerCase());
  const hotkeyKeys = hotkeyConfig.keys.map(k => k.toLowerCase());
  
  // Check if all keys in hotkey are pressed (order-independent for modifiers)
  return hotkeyKeys.length === normalized.length &&
         hotkeyKeys.every(key => normalized.includes(key));
};

/**
 * Format hotkey for display (e.g., "Ctrl+S")
 */
export const formatHotkey = (hotkeyConfig) => {
  if (!hotkeyConfig || !hotkeyConfig.keys) return '';
  
  const keys = hotkeyConfig.keys.map(k => {
    if (k === 'Control') return 'Ctrl';
    if (k === 'Alt') return 'Alt';
    if (k === 'Shift') return 'Shift';
    if (k === 'ArrowUp') return '↑';
    if (k === 'ArrowDown') return '↓';
    if (k === 'ArrowLeft') return '←';
    if (k === 'ArrowRight') return '→';
    if (k === 'Delete') return 'Del';
    if (k === 'Enter') return 'Enter';
    if (k === 'Escape') return 'Esc';
    // Single character keys: convert to uppercase
    if (k.length === 1) return k.toUpperCase();
    return k;
  });
  
  return keys.join('+');
};

export default HOTKEYS_CONFIG;
