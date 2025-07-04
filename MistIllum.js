// --- Tiling and Multi-Monitor Support ---
function tileMode(enable, config = {}) {
  // If not enabled, reset to single window (fullscreen or default)
  if (!enable) {
    exec('wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz', () => {
      exec('wmctrl -r :ACTIVE: -e 0,0,0,-1,-1'); // Move to 0,0 and resize to default
    });
    return;
  }

  // If enabled, tile according to config
  const { rows = 1, cols = 1, monitorLayout = [] } = config;
  // Calculate window size and position for each tile
  const screenWidth = 1920; // Default fallback, should query xrandr for actual size
  const screenHeight = 1080;
  const tileWidth = Math.floor(screenWidth / cols);
  const tileHeight = Math.floor(screenHeight / rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileWidth;
      const y = r * tileHeight;
      // Use wmctrl to move/resize window (assumes one instance per tile)
      // In a real implementation, you would launch separate MistIllum instances per tile or use a window manager API
      exec(`wmctrl -r :ACTIVE: -e 0,${x},${y},${tileWidth},${tileHeight}`);
    }
  }

  // If monitorLayout is provided, use it to position windows
  if (monitorLayout.length > 0) {
    monitorLayout.forEach((mon, idx) => {
      exec(`wmctrl -r :ACTIVE: -e 0,${mon.x},${mon.y},${mon.width},${mon.height}`);
    });
  }
}

/**
 * Span the MistIllum viewport across multiple monitors in the user's X11 session.
 * @param {Array} monitors - Array of monitor descriptors [{x, y, width, height}]
 */
function tileSpan(monitors = []) {
  if (!Array.isArray(monitors) || monitors.length === 0) return;

  // For each monitor, move/resize the window to span that monitor
  monitors.forEach((mon, idx) => {
    // In a real implementation, you may want to launch a new window per monitor or use X11 multi-head APIs
    exec(`wmctrl -r :ACTIVE: -e 0,${mon.x},${mon.y},${mon.width},${mon.height}`);
  });
}

// --- Lighting and Rendering ---
class LightSource {
  constructor(type, position, color, intensity, direction) {
    this.type = type; // e.g., 'point', 'directional', 'ambient'
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    this.direction = direction;
  }
}

class MetricTensor {
  constructor(rank, dimensions, data) {
    this.rank = rank;
    this.dimensions = dimensions;
    this.data = data;
  }
}

// Define metricTensor5D outside the class
const metricTensor5D = new MetricTensor(
  5,
  [5, 5],
  [
    [-1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1]
  ]
);


// --- Wave Function Utilities ---
function waveFunction(amplitude, k, x, omega, t) {
  // psi = A * exp(i * (k * x - omega * t))
  // Returns complex value as [real, imag]
  const phase = k * x - omega * t;
  return [amplitude * Math.cos(phase), amplitude * Math.sin(phase)];
}

function interferencePattern(source, obj1, obj2, lambda) {
  // Calculate the interference pattern of light waves from a single source
  const D = (p1, p2) => Math.sqrt(
    Math.pow(p2[0] - p1[0], 2) +
    Math.pow(p2[1] - p1[1], 2) +
    Math.pow(p2[2] - p1[2], 2)
  );
  const distance1 = D(source, obj1);
  const distance2 = D(source, obj2);
  const phaseDifference = (distance1 - distance2) * (2 * Math.PI / lambda);
  return Math.cos(phaseDifference); // Interference pattern
}

function applyInterference(source, obj1, obj2, lambda) {
  const pattern = interferencePattern(source, obj1.position, obj2.position, lambda);
  obj1.intensity = (obj1.intensity || 1) * pattern;
  obj2.intensity = (obj2.intensity || 1) * pattern;
}

function createVoxelObject(center, size, angularMomentumMap = {}) { /* ... */ }
function updateDistanceFromObserver(object, observer) { /* ... */ }
function computeAngularMomentumMap(object) { /* ... */ }
function isEdgeVoxel(v, object) { /* ... */ }
function interactObjects(objA, objB, tensor = metricTensor5D) { /* ... */ }
function spawnObjectNearPlayer(player, objectData) { /* ... */ }

// --- Global Illumination and Wave-Based Rendering ---
function globalIllumination(lightSources, scene, waveParams = {}) {
  // lightSources: array of LightSource
  // scene: array of objects with position, intensity, etc.
  // waveParams: { lambda, amplitude, omega, t }
  scene.forEach(obj => {
    let totalIntensity = 0;
    lightSources.forEach(light => {
      // Calculate distance and phase
      const D = (p1, p2) => Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) +
        Math.pow(p2[1] - p1[1], 2) +
        Math.pow(p2[2] - p1[2], 2)
      );
      const distance = D(light.position, obj.position);
      const k = 2 * Math.PI / (waveParams.lambda || 1);
      const [real, imag] = waveFunction(
        waveParams.amplitude || 1,
        k,
        distance,
        waveParams.omega || 1,
        waveParams.t || 0
      );
      // Interference with other lights (optional)
      totalIntensity += real * (light.intensity || 1);
    });
    obj.intensity = totalIntensity;
  });
}

function fastTransform(ray) {
  // ray: array of sample values (e.g., intensity along a path)
  // Returns: array of frequency components (magnitude, phase)
  // Simple DFT for demonstration; replace with optimized FFT as needed
  const N = ray.length;
  let result = [];
  for (let k = 0; k < N; k++) {
    let real = 0, imag = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += ray[n] * Math.cos(angle);
      imag -= ray[n] * Math.sin(angle);
    }
    result.push({ magnitude: Math.sqrt(real * real + imag * imag), phase: Math.atan2(imag, real) });
  }
  return result;
}

function worldWarp(geometryType, params, metricTensor) {
  // geometryType: 'plane', 'sphere', 'cube', 'torus', 'hypercube', etc.
  // params: geometry-specific parameters (e.g., radius for sphere)
  // metricTensor: for curved space
  // Returns a transformation function
  switch (geometryType) {
    case 'sphere':
      // Project (x, y, z) onto sphere of radius r
      return (point) => {
        const [x, y, z] = point;
        const r = params.radius || 1;
        const norm = Math.sqrt(x * x + y * y + z * z) || 1;
        return [r * x / norm, r * y / norm, r * z / norm];
      };
    case 'torus':
      // Project onto torus (R: major, r: minor)
      return (point) => {
        const [x, y, z] = point;
        const R = params.R || 2, r = params.r || 1;
        const theta = Math.atan2(y, x);
        const phi = Math.atan2(z, Math.sqrt(x * x + y * y) - R);
        return [
          (R + r * Math.cos(phi)) * Math.cos(theta),
          (R + r * Math.cos(phi)) * Math.sin(theta),
          r * Math.sin(phi)
        ];
      };
    // Add more geometries as needed
    default:
      // Identity (no warp)
      return (point) => point;
  }
}

function wireFrames(item, options = {}, metricTensor) {
  // item: object with position, shape, etc.
  // options: { levelOfDetail, color, ... }
  // metricTensor: for nD geometry
  // Returns: array of edges (pairs of points)
  // Example: cube wireframe in 3D
  if (item.shape === 'cube') {
    const size = options.size || 1;
    const vertices = [
      [0, 0, 0], [size, 0, 0], [size, size, 0], [0, size, 0],
      [0, 0, size], [size, 0, size], [size, size, size], [0, size, size]
    ].map(v => metricTensor ? metricTensor.transform(v) : v);
    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];
    return edges.map(([a, b]) => [vertices[a], vertices[b]]);
  }
  // Add more shapes as needed
  return [];
}

function rastRenderMap(wireframe, textureMap, waveParams = {}) {
  // wireframe: array of edges (pairs of points)
  // textureMap: lookup table or image
  // waveParams: for wave-based shading
  // Returns: rasterized image or buffer
  // Skeleton: For each edge, sample points and modulate intensity by wave function
  let raster = [];
  wireframe.forEach(([p1, p2]) => {
    // Simple linear interpolation between p1 and p2
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = p1.map((v, idx) => v + t * (p2[idx] - v));
      // Use wave function for intensity
      const [real, imag] = waveFunction(
        waveParams.amplitude || 1,
        waveParams.k || 1,
        point[0], // x
        waveParams.omega || 1,
        waveParams.t || 0
      );
      // Sample texture (placeholder)
      const texColor = textureMap ? textureMap(point) : [real, real, real];
      raster.push({ point, color: texColor, intensity: real });
    }
  });
  return raster;
}

// --- Audio and Soundscape ---
/**
 * Queue a sound file for playback, modulated by wave and geometric logic.
 * @param {string} soundId - Reference to soundScape table.
 * @param {Object} options - { volume, loop, position, frequency, amplitude, phase }
 * @param {Object} listenerPosition - [x, y, z] of the listener for geometric modulation.
 */
function audioQueue(soundId, options = {}, listenerPosition = [0,0,0]) {
  // Example: Use wave function for amplitude modulation based on distance
  // and apply geometric attenuation/interference
  const { position = [0,0,0], frequency = 440, amplitude = 1, phase = 0, t = 0 } = options;
  // Distance-based attenuation (inverse square law)
  const D = (p1, p2) => Math.sqrt(
    Math.pow(p2[0] - p1[0], 2) +
    Math.pow(p2[1] - p1[1], 2) +
    Math.pow(p2[2] - p1[2], 2)
  );
  const distance = D(listenerPosition, position);
  const attenuation = 1 / (1 + distance * distance);
  // Wave function for sound pressure at listener
  const omega = 2 * Math.PI * frequency;
  const k = omega / 343; // 343 m/s speed of sound (air)
  const [real, imag] = waveFunction(amplitude * attenuation, k, distance, omega, t + phase);
  // Queue sound with calculated intensity
  // (Implementation: pass to audio engine, e.g., WebAudio API or native)
  return {
    soundId,
    effectiveAmplitude: real,
    frequency,
    phase,
    position,
    listenerPosition,
    time: t
  };
}

/**
 * Set global volume for all audio, modulated by wave logic if desired.
 * @param {number} level - Volume level (0.0 to 1.0).
 */
function volumeGlobal(level) {
  // Clamp level between 0.0 and 1.0
  const clampedLevel = Math.max(0, Math.min(1, level));
  // Set master gain in audio engine (WebAudio API, ALSA, or PulseAudio)
  // Example for PulseAudio (X11/Linux):
  const { exec } = require('child_process');
  // This sets the volume for the current process (replace 'MistIllum' with the actual sink if needed)
  // Note: Requires 'pactl' and appropriate permissions
  exec(`pactl set-sink-volume @DEFAULT_SINK@ ${Math.round(clampedLevel * 100)}%`);
  // Optionally, update in-app audio engine if present
  if (typeof globalAudioEngine !== 'undefined' && globalAudioEngine.setMasterGain) {
    globalAudioEngine.setMasterGain(clampedLevel);
  }
  // Store the current global volume for reference
  global.currentMistIllumVolume = clampedLevel;
}

/**
 * Set ambient sound volume, modulated by spatial/temporal wave logic.
 * @param {number} level - Volume level (0.0 to 1.0).
 * @param {Object} options - { frequency, amplitude, t }
 */
function volumeAmbient(level, options = {}) {
  // Example: Use slow wave for ambient modulation
  const { frequency = 0.1, amplitude = 1, t = 0 } = options;
  const omega = 2 * Math.PI * frequency;
  const [real] = waveFunction(amplitude, omega, 0, omega, t);
  // Set ambient volume as product
  // ambientVolume = level * (0.5 + 0.5 * real)
}

/**
 * Set volume for object interaction sounds, modulated by proximity/interference.
 * @param {number} level - Volume level (0.0 to 1.0).
 * @param {Object} obj1 - First object (with position).
 * @param {Object} obj2 - Second object (with position).
 * @param {Object} options - { lambda }
 */
function volumeInteract(level, obj1, obj2, options = {}) {
  // Use interference pattern for interaction volume
  const { lambda = 1 } = options;
  const pattern = interferencePattern([0,0,0], obj1.position, obj2.position, lambda);
  // interactionVolume = level * Math.abs(pattern)
}

/**
 * Set volume for character dialogue, modulated by distance and wave envelope.
 * @param {number} level - Volume level (0.0 to 1.0).
 * @param {Object} speakerPosition - [x, y, z] of the speaker.
 * @param {Object} listenerPosition - [x, y, z] of the listener.
 * @param {Object} options - { frequency, amplitude, t }
 */
function volumeDialogue(level, speakerPosition, listenerPosition, options = {}) {
  const D = (p1, p2) => Math.sqrt(
    Math.pow(p2[0] - p1[0], 2) +
    Math.pow(p2[1] - p1[1], 2) +
    Math.pow(p2[2] - p1[2], 2)
  );
  const distance = D(speakerPosition, listenerPosition);
  const { frequency = 220, amplitude = 1, t = 0 } = options;
  const omega = 2 * Math.PI * frequency;
  const k = omega / 343;
  const [real] = waveFunction(amplitude / (1 + distance), k, distance, omega, t);
  // dialogueVolume = level * Math.abs(real)
}

// --- Settings and UI ---
/**
 * Display and manage the settings menu for MistIllum session in the user's X11 session.
 * Allows user to configure session settings such as:
 * - Global volume
 * - Ambient volume
 * - Interaction volume
 * - Dialogue volume
 * - Wave parameters (frequency, amplitude, phase)
 * - Geometry parameters (listener position, spatialization)
 * - Tiling and multi-monitor display
 * - Keybinds
 * - Save/load session config
 * @param {Object} uiRenderer - UI rendering interface for X11 session.
 * @param {Object} currentConfig - Current session config (optional).
 * @param {Function} onUpdate - Callback when settings are updated.
 */
function settingsMenu(uiRenderer, currentConfig = {}, onUpdate) {
  // Build settings options
  const options = [
    {
      label: 'Global Volume',
      type: 'slider',
      min: 0, max: 1, step: 0.01,
      value: currentConfig.globalVolume || 1,
      onChange: (val) => {
        volumeGlobal(val);
        if (onUpdate) onUpdate({ ...currentConfig, globalVolume: val });
      }
    },
    {
      label: 'Ambient Volume',
      type: 'slider',
      min: 0, max: 1, step: 0.01,
      value: currentConfig.ambientVolume || 0.5,
      onChange: (val) => {
        volumeAmbient(val);
        if (onUpdate) onUpdate({ ...currentConfig, ambientVolume: val });
      }
    },
    {
      label: 'Interaction Volume',
      type: 'slider',
      min: 0, max: 1, step: 0.01,
      value: currentConfig.interactionVolume || 0.7,
      onChange: (val) => {
        volumeInteract(val);
        if (onUpdate) onUpdate({ ...currentConfig, interactionVolume: val });
      }
    },
    {
      label: 'Dialogue Volume',
      type: 'slider',
      min: 0, max: 1, step: 0.01,
      value: currentConfig.dialogueVolume || 0.8,
      onChange: (val) => {
        volumeDialogue(val);
        if (onUpdate) onUpdate({ ...currentConfig, dialogueVolume: val });
      }
    },
    {
      label: 'Wave Frequency',
      type: 'number',
      min: 0.01, max: 10000, step: 0.01,
      value: currentConfig.waveFrequency || 440,
      onChange: (val) => {
        if (onUpdate) onUpdate({ ...currentConfig, waveFrequency: val });
      }
    },
    {
      label: 'Wave Amplitude',
      type: 'number',
      min: 0, max: 10, step: 0.01,
      value: currentConfig.waveAmplitude || 1,
      onChange: (val) => {
        if (onUpdate) onUpdate({ ...currentConfig, waveAmplitude: val });
      }
    },
    {
      label: 'Wave Phase',
      type: 'number',
      min: 0, max: 2 * Math.PI, step: 0.01,
      value: currentConfig.wavePhase || 0,
      onChange: (val) => {
        if (onUpdate) onUpdate({ ...currentConfig, wavePhase: val });
      }
    },
    {
      label: 'Listener Position',
      type: 'vector3',
      value: currentConfig.listenerPosition || [0, 0, 0],
      onChange: (val) => {
        if (onUpdate) onUpdate({ ...currentConfig, listenerPosition: val });
      }
    },
    {
      label: 'Tiling/Display Mode',
      type: 'button',
      onClick: () => {
        uiRenderer.promptTilingConfig((tileConfig) => {
          tileMode(true, tileConfig);
          if (onUpdate) onUpdate({ ...currentConfig, tileConfig });
        });
      }
    },
    {
      label: 'Keybinds',
      type: 'button',
      onClick: () => {
        uiRenderer.promptKeybinds((newKeybinds) => {
          if (onUpdate) onUpdate({ ...currentConfig, keybinds: newKeybinds });
        });
      }
    },
    {
      label: 'Save Session Config',
      type: 'button',
      onClick: () => {
        uiRenderer.saveSessionConfig(currentConfig);
      }
    },
    {
      label: 'Load Session Config',
      type: 'button',
      onClick: () => {
        uiRenderer.loadSessionConfig((loadedConfig) => {
          if (onUpdate) onUpdate(loadedConfig);
        });
      }
    }
  ];

  // Render the settings menu using the provided UI renderer
  uiRenderer.showSettingsMenu(options, currentConfig);
}

function mistFirstStart() {
  // Display title, credits, and disclaimers for MistTrackerVulkan, MistMulti, and MistIllum.
}

/**
 * Setup function to check, create, and update required dependencies for MistTracker, MistMulti, and MistIllum.
 * Scans the user system for required software/hardware and attempts to configure or prompt as needed.
 */
function mistSetup() {
  // Scan for dependencies using MistTrackerVulkan.js utilities
  const missingDeps = checkSystemDependencies([
    'MySQL',
    'Vulkan',
    'wmctrl',
    'pactl'
    // Add other dependencies as needed
  ]);

  if (missingDeps.length > 0) {
    // Attempt to configure or prompt user for each missing dependency
    missingDeps.forEach(dep => {
      const configured = configureDependency(dep);
      if (!configured) {
        mistWarn(`Dependency "${dep}" is missing or not configured. Please install or configure it to continue.`, warnTypes.DEPENDENCY);
      }
    });
  }
  // Additional setup logic...
}

/**
 * Check user system for software and hardware dependencies (e.g., MySQL, Vulkan).
 * Uses MistTrackerVulkan.js functions for detection and configuration.
 * If failed, call mistWarn.
 */
function mistDepend() {
  const requiredDeps = [
    'MySQL',
    'Vulkan',
    'wmctrl',
    'pactl'
    // Add other dependencies as needed
  ];
  const missingDeps = checkSystemDependencies(requiredDeps);

  if (missingDeps.length > 0) {
    missingDeps.forEach(dep => {
      mistWarn(`Dependency "${dep}" is missing or not configured.`, warnTypes.DEPENDENCY);
    });
    return false;
  }
  return true;
}

/**
 * Display a warning message to the user in MistIllum CLI or dialog box.
 * If running in a GUI/X11 session, show a dialog with copy and close buttons.
 * @param {string} message - The warning message to display.
 * @param {string} type - Warning type (from warnTypes).
 */
function mistWarn(message, type) {
  // Detect if running in CLI or GUI/X11 session
  const isCLI = !global.uiRenderer || typeof global.uiRenderer.showDialog !== 'function';

  if (isCLI) {
    // Fallback: Print to console
    console.warn(`[MistIllum Warning${type ? ' - ' + type : ''}]: ${message}`);
  } else {
    // GUI/X11: Show dialog with copy and close buttons
    global.uiRenderer.showDialog({
      title: `MistIllum Warning${type ? ' - ' + type : ''}`,
      message: message,
      buttons: [
        {
          label: 'Copy to Clipboard',
          onClick: () => {
            // Use xclip or clipboardy for X11 clipboard support
            try {
              const { exec } = require('child_process');
              // Try xclip (Linux/X11)
              exec(`echo "${message.replace(/"/g, '\\"')}" | xclip -selection clipboard`);
            } catch (e) {
              // Fallback: try clipboardy (cross-platform, if installed)
              try {
                require('clipboardy').writeSync(message);
              } catch (err) {
                // If all fails, show error in dialog
                global.uiRenderer.showDialog({
                  title: 'Clipboard Error',
                  message: 'Could not copy to clipboard. Please copy manually.',
                  buttons: [{ label: 'Close', onClick: () => global.uiRenderer.closeDialog() }]
                });
              }
            }
          }
        },
        {
          label: 'Close',
          onClick: () => global.uiRenderer.closeDialog()
        }
      ]
    });
  }
}

class warnTypes {
  constructor() {
    this.types = {
      DEPENDENCY: 'Dependency',
      PERFORMANCE: 'Performance',
      SECURITY: 'Security',
      NETWORK: 'Network',
      OTHER: 'Other'
    };
  }
}

// --- Overlay and Menu ---
// --- Integration with Core and Multi-User Modules ---
/**
 * Display a menu overlay for the Mist solution.
 * The menu is shown as a dialog box and can be opened/closed with the "esc" key.
 * Allows the user to alter any MistIllum setting (globalVolume, precision, mode selection, etc).
 * @param {Object} overlayConfig - Optional menu structure, callbacks, etc.
 */

function mistMenu(overlayConfig = {}) {
  // Use global.uiRenderer if available, otherwise fallback to CLI
  const ui = global.uiRenderer;
  let menuOpen = true;

  // Helper to build menu options dynamically from current settings
  function buildMenuOptions(currentConfig, onUpdate) {
    const options = [
      {
        label: 'Global Volume',
        type: 'slider',
        min: 0, max: 1, step: 0.01,
        value: currentConfig.globalVolume || 1,
        onChange: (val) => {
          volumeGlobal(val);
          if (onUpdate) onUpdate({ ...currentConfig, globalVolume: val });
        }
      },
      {
        label: 'Precision',
        type: 'number',
        min: 1, max: 18, step: 1,
        value: currentConfig.precision || 3,
        onChange: (val) => {
          // Example: set milestone for precision
          if (typeof milestoneManager !== 'undefined') {
            milestoneManager.achieveMilestone(val);
          }
          if (onUpdate) onUpdate({ ...currentConfig, precision: val });
        }
      },
      {
        label: 'Mode Selection',
        type: 'button',
        onClick: () => {
          showModeSelectionMenu(ui, (selected) => {
            if (onUpdate) onUpdate({ ...currentConfig, mode: selected });
          });
        }
      },
      // Add more settings as needed (ambient volume, interaction volume, etc.)
      {
        label: 'Close Menu',
        type: 'button',
        onClick: () => {
          menuOpen = false;
          if (ui && ui.closeDialog) ui.closeDialog();
        }
      }
    ];
    return options;
  }

  // Initial config (could be loaded from session or overlayConfig)
  let currentConfig = overlayConfig.currentConfig || {};

  // Handler for updating config from menu
  function handleUpdate(newConfig) {
    currentConfig = { ...currentConfig, ...newConfig };
    // Optionally persist config or update session
  }

  // Show the menu dialog
  function showMenuDialog() {
    if (ui && ui.showSettingsMenu) {
      ui.showSettingsMenu(buildMenuOptions(currentConfig, handleUpdate), currentConfig);
    } else {
      // CLI fallback: print options and wait for input
      console.log('MistIllum Menu:');
      console.log('1. Global Volume');
      console.log('2. Precision');
      console.log('3. Mode Selection');
      console.log('4. Close Menu');
      // Implement CLI input handling as needed
    }
  }

  // Keyboard event handler for "esc" to close menu
  function onKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'esc') {
      menuOpen = false;
      if (ui && ui.closeDialog) ui.closeDialog();
      window.removeEventListener('keydown', onKeyDown);
    }
  }

  // Open the menu and listen for "esc"
  showMenuDialog();
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('keydown', onKeyDown);
  }
}

/**
 * Launch the core MistIllum environment (single-user mode).
 * Initializes the physics engine, menu, and rendering loop.
 * @param {Object} config - Optional configuration object.
 * @param {Object} uiRenderer - UI rendering interface.
 */
function launchMistCore(config = {}, uiRenderer = global.uiRenderer) {
  const db = config.db || null;
  const menuControl = new MistMenuControl(db, uiRenderer);
  menuControl.start(config.userName || 'guest');
  // Start main render loop (single-user)
  function mainLoop() {
    menuControl.renderMenu();
    setTimeout(mainLoop, 1000 / 30); // 30 FPS
  }
  mainLoop();
  console.log('MistIllum core launched (single-user mode).');
}

/**
 * Launch MistIllum in multi-user (P2P) mode.
 * Sets up event handlers and connects to MistMulti for real-time collaboration.
 * @param {Object} config - Optional configuration object.
 * @param {Object} uiRenderer - UI rendering interface.
 */
function launchMistMulti(config = {}, uiRenderer = global.uiRenderer) {
  const MistMulti = require('./MistMulti.js');
  const db = config.db || null;
  const menuControl = new MistMenuControl(db, uiRenderer);
  menuControl.start(config.userName || 'guest');

  // Register multi-user event handlers
  MistMulti.onEvent('selection', (data, sender) => {
    // Handle selection event from peers
    if (menuControl.session) {
      require('./MistTrackerVulkan.js').handleSelectionBackend(
        menuControl.session,
        data.selection,
        menuControl.selectionModeState
      );
      menuControl.renderMenu();
    }
  });

  MistMulti.onEvent('physicsUpdate', (data, sender) => {
    if (menuControl.physicsEngine) {
      menuControl.physicsEngine.setMode(data.mode);
      // Optionally update other physics state
    }
  });

  // Start main render loop (multi-user)
  function mainLoop() {
    menuControl.renderMenu();
    setTimeout(mainLoop, 1000 / 30); // 30 FPS
  }
  mainLoop();
  console.log('MistIllum launched in multi-user (P2P) mode.');
}

/**
 * Shutdown MistIllum session, clean up resources, and close UI.
 * @param {Object} menuControl - The active MistMenuControl instance.
 * @param {Function} [onShutdown] - Optional callback after shutdown.
 */
function shutdownMist(menuControl, onShutdown) {
  if (menuControl && typeof menuControl.uiRenderer?.closeDialog === 'function') {
    menuControl.uiRenderer.closeDialog();
  }
  // Additional cleanup logic (e.g., save session, disconnect peers)
  if (typeof onShutdown === 'function') onShutdown();
  console.log('MistIllum session shutdown complete.');
}

// --- Dimensional Stacking ---
/**
 * Stack objects or spaces in higher dimensions.
 * Each object is placed along the specified dimension, spaced equally.
 * @param {Array} objects - Array of objects or spaces to stack.
 * @param {number} dimension - The dimension to stack along (e.g., 3 for W in 4D).
 * @returns {Array} - Stacked representation (array of objects with updated positions).
 */
function dimensionalStack(objects, dimension) {
  // Place each object at a unique coordinate along the stacking dimension
  return objects.map((obj, idx) => {
    let pos = Array.isArray(obj.position) ? [...obj.position] : [0, 0, 0, 0];
    pos[dimension] = idx; // Stack along the specified dimension
    return { ...obj, position: pos };
  });
}

/**
 * Calculate apparent distance and size of an object from a given dimensional perspective.
 * If observerDimension < objectDimension, projects object down and scales size.
 * @param {Object} object - The object to observe (with position and size).
 * @param {number} observerDimension - The dimension of the observer.
 * @param {number} objectDimension - The dimension of the object.
 * @returns {Object} - { apparentDistance, apparentSize }
 */
function perspectiveTransform(object, observerDimension, objectDimension) {
  // Project position to observerDimension
  const pos = object.position || [];
  const projected = pos.slice(0, observerDimension);
  // Apparent size shrinks exponentially with extra dimensions
  const apparentSize = (object.size || 1) / Math.pow(2, objectDimension - observerDimension);
  // Apparent distance is Euclidean in observerDimension
  const apparentDistance = Math.sqrt(projected.reduce((sum, v) => sum + v * v, 0));
  return { apparentDistance, apparentSize };
}

/**
 * Project a higher-dimensional object into a lower dimension over time or motion.
 * @param {Object} object - The higher-dimensional object (with position).
 * @param {number} fromDimension - The original dimension.
 * @param {number} toDimension - The target (lower) dimension.
 * @param {number} time - Time parameter for the projection (optional).
 * @returns {Object} - Lower-dimensional projection at given time.
 */
function projectToLowerDimension(object, fromDimension, toDimension, time = 0) {
  // Simple orthogonal projection: drop extra dimensions
  const pos = object.position || [];
  const projected = pos.slice(0, toDimension);
  // Optionally, animate projection over time (e.g., interpolate extra dims to zero)
  if (fromDimension > toDimension && time > 0) {
    for (let i = toDimension; i < fromDimension; i++) {
      projected[toDimension - 1] += (pos[i] || 0) * Math.exp(-time); // Fade out extra dims
    }
  }
  return { ...object, position: projected };
}

/**
 * Decompose a higher-dimensional object into its lower-dimensional "shadows" or slices.
 * @param {Object} object - The higher-dimensional object (with position).
 * @param {number} lowerDimension - The dimension to decompose into.
 * @returns {Array} - Array of lower-dimensional objects (slices).
 */
function decomposeHigherToLower(object, lowerDimension) {
  // For each possible value in the extra dimensions, create a slice
  const pos = object.position || [];
  const extraDims = pos.slice(lowerDimension);
  const slices = [];
  // For simplicity, create one slice per unique value in the first extra dimension
  const numSlices = extraDims.length > 0 ? Math.max(1, Math.round(Math.abs(extraDims[0]) || 1)) : 1;
  for (let i = 0; i < numSlices; i++) {
    const slicePos = pos.slice(0, lowerDimension);
    slices.push({ ...object, position: slicePos, sliceIndex: i });
  }
  return slices;
}

/**
 * Treat extra dimensions as either spatial axes or as object properties.
 * @param {Object} object - The object to analyze (with position).
 * @param {boolean} asObject - If true, treat extra dimensions as object properties.
 * @returns {Object} - Modified object or space.
 */
function extraDimensionMode(object, asObject) {
  const pos = object.position || [];
  if (asObject) {
    // Move extra dimensions into object properties
    const extra = pos.slice(3); // Assume 3D is spatial, rest are "object"
    return { ...object, extraDimensions: extra, position: pos.slice(0, 3) };
  } else {
    // Treat all as spatial
    return { ...object, position: pos };
  }
}

/**
 * Set limits or boundaries for extra dimensions.
 * @param {Object} space - The space or object (with position).
 * @param {number} dimension - The dimension to limit.
 * @param {number|null} limit - The limit value, or null for infinite.
 * @returns {Object} - Modified space/object.
 */
function setDimensionLimit(space, dimension, limit) {
  // If limit is null, dimension is infinite; otherwise, clamp position
  let pos = Array.isArray(space.position) ? [...space.position] : [];
  if (limit !== null && pos[dimension] !== undefined) {
    pos[dimension] = Math.max(Math.min(pos[dimension], limit), -limit);
  }
  return { ...space, position: pos, dimensionLimits: { ...(space.dimensionLimits || {}), [dimension]: limit } };
}

// --- Energy Distribution Through Extra Dimensions ---
/**
 * Calculate or simulate energy distribution across extra dimensions.
 * @param {Object} system - The physical system or object.
 * @param {Array} dimensions - Array of dimensions to distribute energy through.
 * @returns {Object} - Energy distribution result.
 */
function distributeEnergy (energy, dimensions) {
  
  // Implement energy distribution logic
  const energyDistribution = {};
  dimensions.forEach(dim => {
    energyDistribution[dim] = energy / dimensions.length; // Simple equal distribution
  })
}

function energyDistribution(system, dimensions) {
  // Calculate energy distribution across specified dimensions
  const energy = system.energy || 0; // Get energy from system
  return distributeEnergy(energy, dimensions);

}

function deformObject(object, energyDistribution){
  // Apply energy distribution to deform the object
  // Example: modify vertices based on energy levels in dimensions
  object.vertices.forEach(vertex => {
    dimensions.forEach((dim, index) => {
      vertex[index] += energyDistribution[dim] || 0;
    });
  });
  return object;
}

// --- Non-Flat Extra Dimensions (Caveat) ---
/**
 * Apply curvature or non-flat geometry to extra dimensions.
 * Modifies the object's position or space according to a curvature function (e.g., Schwarzschild, spherical, or custom).
 * @param {Object} space - The space or object (with position: Array).
 * @param {Function} curvatureFn - Function describing curvature. Should accept (position:Array) and return new position.
 * @returns {Object} - Modified space/object with curved position.
 */
function applyCurvature(space, curvatureFn) {
  if (!space || typeof curvatureFn !== 'function') return space;
  // Example: Apply curvature to position vector
  const pos = Array.isArray(space.position) ? space.position : [];
  const curvedPos = curvatureFn(pos);
  return { ...space, position: curvedPos };
}

// --- Example curvature functions for integration ---

/**
 * Schwarzschild curvature for 4D spacetime (inspired by pureMathPhysicsEngine.js).
 * @param {Array<number>} pos - [t, x, y, z]
 * @param {Object} params - { G, M, c }
 * @returns {Array<number>} - Curved position vector
 */
function schwarzschildCurvature(pos, params = { G: 6.67430e-11, M: 1, c: 299792458 }) {
  const [t, x, y, z] = pos;
  const { G, M, c } = params;
  const r = Math.sqrt((x || 0) ** 2 + (y || 0) ** 2 + (z || 0) ** 2) || 1;
  const factor = Math.sqrt(1 - (2 * G * M) / (r * c * c));
  // Time dilation and spatial contraction
  return [
    t * factor,
    x / factor,
    y / factor,
    z / factor
  ];
}

/**
 * Spherical curvature for extra dimensions (maps to a hypersphere).
 * @param {Array<number>} pos - Position vector.
 * @param {number} radius - Sphere radius.
 * @returns {Array<number>} - Curved position vector.
 */
function sphericalCurvature(pos, radius = 1) {
  const norm = Math.sqrt(pos.reduce((sum, v) => sum + v * v, 0)) || 1;
  return pos.map(v => (radius * v) / norm);
}


// --- Physics Engine for Menu and Menu Navigation (UI only) ---
class MistPhysicsEngine {
  /**
   * This class is used for menu logic, menu navigation, and UI-related physics only.
   * It does NOT handle 3D/4D world interactions, rendering, or simulation.
   */
  constructor(config = {}) {
    this.config = config;
    this.menuState = null;
    this.selectionIndex = 0;
    this.options = [];
  }

  setMenuOptions(options) {
    this.options = options;
    this.selectionIndex = 0;
  }

  moveSelection(delta) {
    if (!this.options.length) return;
    this.selectionIndex = (this.selectionIndex + delta + this.options.length) % this.options.length;
  }

  selectCurrent() {
    if (this.options[this.selectionIndex] && typeof this.options[this.selectionIndex].action === 'function') {
      this.options[this.selectionIndex].action();
    }
  }

  getCurrentOption() {
    return this.options[this.selectionIndex] || null;
  }
}

// --- Metric Tensor for 3D Mode ---
class MetricTensor3D {
  constructor() {
    // Only spatial dimensions: X, Y, Z
    this.rank = 3;
    this.data = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  intervalSquared(p1, p2) {
    // p1, p2: [x, y, z]
    let delta = p1.map((v, i) => v - p2[i]);
    let sum = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        sum += this.data[i][j] * delta[i] * delta[j];
      }
    }
    return sum;
  }
}

// --- Metric Tensor for nD Physics ---
class MetricTensorND {
  /**
   * @param {number} rank - The rank (dimensions) of the tensor.
   * @param {Array<Array<number>>} data - The metric tensor matrix.
   */
  constructor(rank, data) {
    this.rank = rank;
    this.data = data; // e.g., 4x4 or 5x5 array
  }

  /**
   * Calculate the squared interval (distance) between two points in this metric.
   * @param {Array<number>} p1 - First point (array of coordinates).
   * @param {Array<number>} p2 - Second point.
   * @returns {number} - The squared interval.
   */
  intervalSquared(p1, p2) {
    let delta = p1.map((v, i) => v - p2[i]);
    let sum = 0;
    for (let i = 0; i < this.rank; i++) {
      for (let j = 0; j < this.rank; j++) {
        sum += this.data[i][j] * delta[i] * delta[j];
      }
    }
    return sum;
  }
  

  /**
   * Project a vector from higher to lower dimension using the metric.
   * @param {Array<number>} vec - The vector to project.
   * @param {number} targetRank - The target dimension.
   * @returns {Array<number>} - Projected vector.
   */
  project(vec, targetRank) {
    return vec.slice(0, targetRank);
  }

  /**
   * Apply the metric to transform a vector (for orientation/navigation).
   * @param {Array<number>} vec
   * @returns {Array<number>}
   */
  transform(vec) {
    let result = Array(this.rank).fill(0);
    for (let i = 0; i < this.rank; i++) {
      for (let j = 0; j < this.rank; j++) {
        result[i] += this.data[i][j] * vec[j];
      }
    }
    return result;
  }
}

class MistPhysicsEngineND {
  constructor(config = {}) {
    // Default to 4D Minkowski metric, but allow 3D mode
    this.metric3D = new MetricTensor3D();
    this.metric4D = config.metric || new MetricTensorND(4, [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]);
    this.mode = config.mode || '4D'; // '3D' or '4D'
    this.G = config.G || 6.67430e-11; // Gravitational constant
    this.M = config.M || 1.0; // Mass for gravity calculations
  }

  setMode(mode) {
    this.mode = mode;
  }

  // Use the appropriate metric for distance
  distance(p1, p2) {
    if (this.mode === '3D') {
      return Math.sqrt(this.metric3D.intervalSquared(p1, p2));
    } else {
      return Math.sqrt(this.metric4D.intervalSquared(p1, p2));
    }
  }

  // Gravity as a function of distance in 3D at a given time
  gravityAt(p, mass = this.M) {
    // p: [x, y, z]
    const r = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
    if (r === 0) return 0;
    // Newtonian gravity: g = G * M / r^2
    return this.G * mass / (r * r);
  }

  // For compatibility: project to 3D view
  projectToView(vec, viewRank = 3) {
    if (this.mode === '3D') {
      return this.metric3D.project ? this.metric3D.project(vec, viewRank) : vec.slice(0, 3);
    } else {
      return this.metric4D.project(vec, viewRank);
    }
  }

  // For compatibility: collision detection in 3D
  checkCollision3D(p1, p2, threshold = 1e-6) {
    return Math.abs(this.metric3D.intervalSquared(p1, p2)) < threshold;
  }

/**
   * Bell's theorem culling logic.
   * Returns true if Bell's inequality is satisfied for the given variables.
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @param {number} d
   * @returns {boolean}
   */
  bellTheorem(a, b, c, d) {
    return Math.abs(a * b + c * d) <= 2;
  }

  // --- Pilot Wave Theory ---
  /**
   * Pilot wave theory for defined objects.
   * Calculates the pilot wave based on the wave function and potential.
   * @param {number} psi - The wave function value.
   * @param {number} potential - The potential at the object's location.
   * @returns {number}
   */
  pilotWave(psi, potential) {
    return psi * potential;
  }

  // --- Locality ---
  /**
   * Check if two points are local to each other (distance < 1 unit).
   * @param {Array<number>} p1 - First point [x, y, z].
   * @param {Array<number>} p2 - Second point [x, y, z].
   * @returns {boolean}
   */
  locality(p1, p2) {
    const distance = Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) +
      Math.pow(p2[1] - p1[1], 2) +
      Math.pow(p2[2] - p1[2], 2)
    );
    return distance < 1;
  }

  // --- Light Wave Propagation ---
  /**
   * Relationship between light wave emitted by a single source object and the wave arriving at two objects.
   * Returns the time taken for light to reach each object.
   * @param {Array<number>} source - Source position [x, y, z].
   * @param {Array<number>} obj1 - First object position [x, y, z].
   * @param {Array<number>} obj2 - Second object position [x, y, z].
   * @returns {{time1: number, time2: number}}
   */
  lightWave(source, obj1, obj2) {
    const D = (p1, p2) => Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) +
      Math.pow(p2[1] - p1[1], 2) +
      Math.pow(p2[2] - p1[2], 2)
    );
    const distance1 = D(source, obj1);
    const distance2 = D(source, obj2);
    return {
      time1: distance1 / this.C,
      time2: distance2 / this.C
    };
  }

  // --- Relative Acceleration ---
  /**
   * Relative acceleration between two velocities over time.
   * @param {number} v1 - Initial velocity.
   * @param {number} v2 - Final velocity.
   * @param {number} t - Time interval.
   * @returns {number}
   */
  relativeAcceleration(v1, v2, t) {
    return (v2 - v1) / t;
  }

eulerLagrange(L, q, qDot, t = 0, dt = 1e-5) {
    const n = q.length;
    const result = [];
    for (let i = 0; i < n; i++) {
      // ∂L/∂q_i
      const dq = [...q];
      dq[i] += dt;
      const dL_dq = (L(dq, qDot, t) - L(q, qDot, t)) / dt;

      // ∂L/∂qDot_i
      const dqDot = [...qDot];
      dqDot[i] += dt;
      const dL_dqDot = (L(q, dqDot, t) - L(q, qDot, t)) / dt;

      // d/dt(∂L/∂qDot_i) ≈ (∂L/∂qDot_i at t+dt - ∂L/∂qDot_i at t) / dt
      const dqDotNext = [...qDot];
      dqDotNext[i] += dt;
      const dL_dqDot_next = (L(q, dqDotNext, t + dt) - L(q, qDot, t + dt)) / dt;
      const d_dt_dL_dqDot = (dL_dqDot_next - dL_dqDot) / dt;

      // Euler-Lagrange: d/dt(∂L/∂qDot_i) - ∂L/∂q_i
      result.push(d_dt_dL_dqDot - dL_dq);
    }
    return result;
  }

  /**
   * Gauss's law for magnetism: net magnetic flux through any closed surface is zero.
   * @param {number|Array<number>} B - Magnetic field or array of flux values.
   * @param {number} [tolerance=1e-10]
   * @returns {boolean}
   */
  gaussLawMagnetism(B, tolerance = 1e-10) {
    let totalFlux = Array.isArray(B) ? B.reduce((sum, val) => sum + val, 0) : B;
    return Math.abs(totalFlux) < tolerance;
  }

  /**
   * Principle of stationary action: action is stationary (variation ≈ 0).
   * @param {number|Array<number>} actionVariation
   * @param {number} [tolerance=1e-10]
   * @returns {boolean}
   */
  principleOfStationaryAction(actionVariation, tolerance = 1e-10) {
    let variation = Array.isArray(actionVariation)
      ? Math.max(...actionVariation.map(Math.abs))
      : Math.abs(actionVariation);
    return variation < tolerance;
  }

  /**
   * Compose multiple wave objects by summing intensities and averaging properties.
   * @param {Array<Object>} waves
   * @returns {Object}
   */
  composeWaves(waves) {
    if (!Array.isArray(waves) || waves.length === 0) return { intensity: 0 };
    let totalIntensity = 0;
    let totalFrequency = 0;
    let totalWavelength = 0;
    let count = 0;
    waves.forEach(wave => {
      totalIntensity += wave.intensity || 0;
      if (wave.frequency) totalFrequency += wave.frequency;
      if (wave.wavelength) totalWavelength += wave.wavelength;
      count++;
    });
    return {
      intensity: totalIntensity,
      frequency: count ? totalFrequency / count : undefined,
      wavelength: count ? totalWavelength / count : undefined
    };
  }

  /**
   * Relationship between intensity and object hardness.
   * @param {number} intensity
   * @param {number} hardness
   * @returns {number}
   */
  intensityHardnessRelationship(intensity, hardness) {
    return intensity * hardness;
  }

  /**
   * Particle-wave duality model.
   * @param {Object} particle - { position, mass }
   * @param {Object} wave - { wavelength, frequency }
   * @returns {Object}
   */
  particleWaveDuality(particle, wave) {
    return {
      position: particle.position,
      mass: particle.mass,
      wavelength: wave.wavelength,
      frequency: wave.frequency,
      duality: true
    };
  };

}

function eulerLagrange(L, q, qDot, t = 0, dt = 1e-5) {
  return (new MistPhysicsEngineND()).eulerLagrange(L, q, qDot, t, dt);
}
function gaussLawMagnetism(B, tolerance = 1e-10) {
  return (new MistPhysicsEngineND()).gaussLawMagnetism(B, tolerance);
}
function principleOfStationaryAction(actionVariation, tolerance = 1e-10) {
  return (new MistPhysicsEngineND()).principleOfStationaryAction(actionVariation, tolerance);
}
function composeWaves(waves) {
  return (new MistPhysicsEngineND()).composeWaves(waves);
}
function intensityHardnessRelationship(intensity, hardness) {
  return (new MistPhysicsEngineND()).intensityHardnessRelationship(intensity, hardness);
}
function particleWaveDuality(particle, wave) {
  return (new MistPhysicsEngineND()).particleWaveDuality(particle, wave);
}
function bellTheorem(a, b, c, d) {
  return (new MistPhysicsEngineND()).bellTheorem(a, b, c, d);
}
function pilotWave(psi, potential) {
  return (new MistPhysicsEngineND()).pilotWave(psi, potential);
}
function locality(p1, p2) {
  return (new MistPhysicsEngineND()).locality(p1, p2);
}
function lightWave(source, obj1, obj2) {
  return (new MistPhysicsEngineND()).lightWave(source, obj1, obj2);
}
function relativeAcceleration(v1, v2, t) {
  return (new MistPhysicsEngineND()).relativeAcceleration(v1, v2, t);
}
/**
 * Attempt to switch to a new projection or render mode, only if milestone is met.
 * Calls onSuccess if allowed, onFail with a message if not.
 * @param {string} modeType - 'projection' or 'render'
 * @param {string} modeName - The mode to switch to (e.g., '3D', 'nD', 'wave-based')
 * @param {Function} onSuccess - Callback if mode switch is allowed.
 * @param {Function} onFail - Callback if not allowed.
 */
function trySwitchModes(modeType, modeName, onSuccess, onFail) {
  const { milestoneManager } = require('./MistTrackerVulkan.js');
  if (milestoneManager && milestoneManager.isModeEnabled(modeType, modeName)) {
    if (typeof onSuccess === 'function') onSuccess();
  } else {
    if (typeof onFail === 'function') {
      onFail(`Mode "${modeName}" not enabled. Achieve the required milestone to unlock.`);
    }
  }
}

function navigate3D(currentPosition, direction, step, physicsEngine) {
  let move = direction.map(d => d * step);
  let newPos = currentPosition.map((v, i) => v + move[i]);
  return newPos; // Already 3D
}

// Example: Rendering in 3D mode
function renderObject3D(object, camera, physicsEngine) {
  let projected = physicsEngine.projectToView(object.position, 3);
  // ...pass projected to renderer
  return projected;
}

// Example: Gravity at a point in 3D
function getGravityAtPoint(point, physicsEngine) {
  return physicsEngine.gravityAt(point);
}

// Example: Use metric for navigation/orientation
function navigate(currentPosition, direction, step, physicsEngine) {
  // direction: unit vector in nD
  let move = direction.map(d => d * step);
  let newPos = currentPosition.map((v, i) => v + move[i]);
  // Optionally transform using metric
  return physicsEngine.transformVector(newPos);
}

// Rendering with wave-based intensity
function renderObjectND(object, camera, physicsEngine, viewRank = 3, waveParams = {}) {
  // Project object's nD position to 3D for rendering
  let projected = physicsEngine.projectToView(object.position, viewRank);
  // Apply wave function for intensity modulation
  if (waveParams.amplitude && waveParams.k && waveParams.omega && waveParams.t !== undefined) {
    const [real, imag] = waveFunction(
      waveParams.amplitude,
      waveParams.k,
      projected[0], // x
      waveParams.omega,
      waveParams.t
    );
    object.intensity = real; // Use real part for intensity
  }
  // ...pass projected and intensity to renderer
  return projected;
}

// Collision with wave-based culling
function checkCollisionWithWave(obj1, obj2, physicsEngine, lambda) {
  // Standard collision
  const collision = physicsEngine.checkCollision3D(obj1.position, obj2.position);
  // Wave-based culling: if interference pattern is destructive, cull
  if (lambda && collision) {
    const pattern = interferencePattern([0,0,0], obj1.position, obj2.position, lambda);
    if (pattern < 0.1) { // Destructive interference
      cullObject(obj1);
      cullObject(obj2);
      return false;
    }
  }
  return collision;
}

/**
 * Remove an object from the scene/model and handle user-specific logic.
 * If the object is a user, call deleteUser.
 * @param {Object} obj - The object to cull (should have at least a type and userId if user).
 */
function cullObject(obj) {
  // Remove object from scene/model (implementation depends on your scene graph or object list)
  if (typeof globalScene !== 'undefined' && Array.isArray(globalScene.objects)) {
    globalScene.objects = globalScene.objects.filter(o => o !== obj);
  }
  // If the object is a user, handle user deletion logic
  if (obj.type === 'user' && obj.userId) {
    deleteUser(obj.userId);
  }
  // Optionally, log or trigger events for culling
  if (typeof global !== 'undefined' && global.onObjectCulled) {
    global.onObjectCulled(obj);
  }
}

/**
 * Remove a user from active sessions and database, or warn/add strike based on probability.
 * Uses a probability distribution to determine if the user is removed or warned.
 * @param {string} userId - The user ID to delete or warn.
 */
function deleteUser(userId) {
  // Remove user from active sessions
  if (typeof globalActiveUsers !== 'undefined') {
    delete globalActiveUsers[userId];
  }
  // Probability-based removal or warning (inspired by pureMathPhysicsEngine.js)
  const removalProbability = 0.8; // 80% chance to remove, 20% to warn (adjust as needed)
  if (Math.random() < removalProbability) {
    // Remove user from database (pseudo-code, replace with real DB logic)
    if (typeof globalDB !== 'undefined' && typeof globalDB.removeUser === 'function') {
      globalDB.removeUser(userId);
    }
    // Optionally, broadcast removal event
    if (typeof global !== 'undefined' && global.onUserRemoved) {
      global.onUserRemoved(userId);
    }
  } else {
    // Warn user and add a strike (pseudo-code)
    if (typeof globalUserWarnings !== 'undefined') {
      globalUserWarnings[userId] = (globalUserWarnings[userId] || 0) + 1;
    }
    if (typeof global !== 'undefined' && global.onUserWarned) {
      global.onUserWarned(userId);
    }
  }
}

const {
  getMistViewportData,
  advanceSelectionMode,
  getViewportCentering,
  isItemVisible,
  handleSelectionBackend,
  MapModeState,
  initViewport,
  renderViewport,
  selectTimeIndex,
  selectCategory,
  selectItem,
  showAddTimeInput,
  showAddCategoryInput,
  showAddItemInput,
  showInputBox,
  handleSelection
} = require('./MistTrackerVulkan.js');

// --- Menu State ---

class MistMenuControl {
  constructor(db, uiRenderer) {
    this.db = db;
    this.uiRenderer = uiRenderer;
    this.session = null;
    this.selectionModeState = new (require('./MistTrackerVulkan.js').SelectionModeState)();
    this.mapModeState = new MapModeState();
    this.physicsEngine = new MistPhysicsEngine();
    this.mode = '3D'; // or 'nD'
  }

  async start(user) {
    // Initialize session and viewport
    this.session = require('./MistTrackerVulkan.js').startSession(user);
    await initViewport(this.session, this.db);
    this.viewportData = await getMistViewportData(this.db);
    this.renderMenu();
  }

  renderMenu() {
    // Render the menu and viewport
    renderViewport(this.session, this.uiRenderer);
    this.uiRenderer.showMenu(this.getMenuOptions());
  }

  getMenuOptions() {
    // Build menu options based on current state
    const options = [
      { label: 'Select Time Index', action: () => this.promptTimeIndex() },
      { label: 'Select Category', action: () => this.promptCategory() },
      { label: 'Select Item', action: () => this.promptItem() },
      { label: 'Add Time Index', action: () => showAddTimeInput(this.uiRenderer) },
      { label: 'Add Category', action: () => showAddCategoryInput(this.uiRenderer) },
      { label: 'Add Item', action: () => showAddItemInput(this.uiRenderer) },
      { label: `Switch to ${this.mode === '3D' ? 'nD' : '3D'} Mode`, action: () => this.toggleMode() }
    ];
    return options;
  }

  promptTimeIndex() {
    // Show input for selecting time index
    const timeIndices = this.viewportData.primaryLine;
    this.uiRenderer.promptSelect('Select Time Index', timeIndices, (idx) => {
      selectTimeIndex(this.session, idx);
      this.renderMenu();
    });
  }

  promptCategory() {
    // Show input for selecting category
    const categories = this.viewportData.categories[this.session.selectedTimeIndex] || [];
    this.uiRenderer.promptSelect('Select Category', categories, (idx) => {
      selectCategory(this.session, idx);
      this.renderMenu();
    });
  }

  promptItem() {
    // Show input for selecting item
    const items = this.viewportData.items[this.session.selectedCategory] || [];
    this.uiRenderer.promptSelect('Select Item', items, (idx) => {
      selectItem(this.session, idx);
      this.renderMenu();
    });
  }

  toggleMode() {
    // Switch between 3D and nD modes
    if (this.mode === '3D') {
      this.mode = 'nD';
      this.physicsEngine.setMode('nD');
      this.physicsEngine.metric = new MetricTensor(4, [
        [-1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]);
    } else {
      this.mode = '3D';
      this.physicsEngine.setMode('3D');
      this.physicsEngine.metric = new MetricTensor3D();
    }
    this.renderMenu();
  }
}

// --- Menu and Environment Interaction ---

/**
 * Handle user input, routing to menu or environment as appropriate.
 * @param {string} input - Key or mouse button identifier.
 * @param {object} menuState - Current menu state (null if no menu).
 * @param {object} envState - Current environment state.
 */
function handleUserInput(input, menuState, envState) {
  if (menuState && menuState.isActive) {
    handleMenuInput(input, menuState);
  } else {
    handleEnvironmentInput(input, envState);
  }
}

/**
 * Handle input for menu objects.
 * @param {string} input
 * @param {object} menuState
 */
function handleMenuInput(input, menuState) {
  // Example: navigate menu, select item, close menu, etc.
  switch (input) {
    case 'up':
      menuState.moveSelection(-1);
      break;
    case 'down':
      menuState.moveSelection(1);
      break;
    case 'select':
      menuState.selectCurrent();
      break;
    case 'menu':
      menuState.close();
      break;
    // Add more as needed
  }
}

/**
 * Handle input for environment (scene/world) objects.
 * @param {string} input
 * @param {object} envState
 */
function handleEnvironmentInput(input, envState) {
  // Example: move camera, interact with object, etc.
  switch (input) {
    case 'up':
      envState.moveCamera(0, 1, 0);
      break;
    case 'down':
      envState.moveCamera(0, -1, 0);
      break;
    case 'left':
      envState.moveCamera(-1, 0, 0);
      break;
    case 'right':
      envState.moveCamera(1, 0, 0);
      break;
    case 'select':
      envState.interact();
      break;
    // Add more as needed
  }
}

// --- Import MilestoneManager from MistTrackerVulkan.js ---
const { MilestoneManager, milestoneManager } = require('./MistTrackerVulkan.js');

// --- Milestone-Aware Mode Selection ---

/**
 * Returns available projection and render modes based on achieved milestones.
 * @returns {Object} { projectionModes: Array, renderModes: Array }
 */
function getAvailableModes() {
  const projectionModes = [];
  const renderModes = [];

  if (milestoneManager.isModeEnabled('projection', '3D')) {
    projectionModes.push('3D');
  }
  if (milestoneManager.isModeEnabled('projection', '4D')) {
    projectionModes.push('4D');
  }
  if (milestoneManager.isModeEnabled('projection', 'nD')) {
    projectionModes.push('nD');
  }

  if (milestoneManager.isModeEnabled('render', 'standard')) {
    renderModes.push('standard');
  }
  if (milestoneManager.isModeEnabled('render', 'wave-based')) {
    renderModes.push('wave-based');
  }
  if (milestoneManager.isModeEnabled('render', 'quantum')) {
    renderModes.push('quantum');
  }

  return { projectionModes, renderModes };
}

/**
 * Presents mode selection menu, only showing modes enabled by milestones.
 * @param {Object} uiRenderer - UI rendering interface.
 * @param {Function} onSelect - Callback when a mode is selected.
 */
function showModeSelectionMenu(uiRenderer, onSelect) {
  const { projectionModes, renderModes } = getAvailableModes();

  // Only show menu if at least one mode is available
  if (projectionModes.length === 0 && renderModes.length === 0) {
    uiRenderer.showMessage('No advanced modes available. Achieve more milestones to unlock.');
    return;
  }

  const options = [];
  projectionModes.forEach(mode => options.push({ label: `Projection: ${mode}`, value: { type: 'projection', mode } }));
  renderModes.forEach(mode => options.push({ label: `Render: ${mode}`, value: { type: 'render', mode } }));

  uiRenderer.promptSelect('Select Mode', options, (selected) => {
    if (onSelect) onSelect(selected.value);
  });
}

/**
 * Example: Attempt to switch mode, only if milestone is met.
 * @param {string} modeType - 'projection' or 'render'
 * @param {string} modeName
 * @param {Function} onSuccess - Callback if mode switch is allowed.
 * @param {Function} onFail - Callback if not allowed.
 */
function trySwitchMode(modeType, modeName, onSuccess, onFail) {
  if (milestoneManager.isModeEnabled(modeType, modeName)) {
    if (onSuccess) onSuccess();
  } else {
    if (onFail) onFail(`Mode "${modeName}" not enabled. Achieve the required milestone to unlock.`);
  }
}

// In MistMenuControl.getMenuOptions or similar:
function getMenuOptionsWithMilestones() {
  const { projectionModes, renderModes } = getAvailableModes();
  const options = [
    // ...other menu options...
  ];
  projectionModes.forEach(mode => {
    options.push({
      label: `Switch to Projection Mode: ${mode}`,
      action: () => trySwitchMode('projection', mode, () => {
        // Switch logic here
      }, (msg) => {
        // Show warning
        uiRenderer.showMessage(msg);
      })
    });
  });
  renderModes.forEach(mode => {
    options.push({
      label: `Switch to Render Mode: ${mode}`,
      action: () => trySwitchMode('render', mode, () => {
        // Switch logic here
      }, (msg) => {
        uiRenderer.showMessage(msg);
      })
    });
  });
  return options;
}


// --- Export API ---

module.exports = {
  tileMode,
  tileSpan,
  LightSource,
  waveFunction,
  interferencePattern,
  applyInterference,
  createVoxelObject,
  updateDistanceFromObserver,
  computeAngularMomentumMap,
  isEdgeVoxel,
  interactObjects,
  spawnObjectNearPlayer,
  globalIllumination,
  fastTransform,
  worldWarp,
  wireFrames,
  rastRenderMap,
  audioQueue,
  volumeGlobal,
  volumeAmbient,
  volumeInteract,
  volumeDialogue,
  settingsMenu,
  mistFirstStart,
  mistSetup,
  mistDepend,
  mistWarn,
  warnTypes,
  mistMenu,
  launchMistCore,
  launchMistMulti,
  shutdownMist,
  dimensionalStack,
  perspectiveTransform,
  projectToLowerDimension,
  decomposeHigherToLower,
  extraDimensionMode,
  setDimensionLimit,
  distributeEnergy,
  energyDistribution,
  deformObject,
  applyCurvature,
  schwarzschildCurvature,
  sphericalCurvature,
  MistPhysicsEngine,
  bellTheorem,
  pilotWave,
  locality,
  lightWave,
  relativeAcceleration,
  eulerLagrange,
  gaussLawMagnetism,
  principleOfStationaryAction,
  composeWaves,
  intensityHardnessRelationship,
  particleWaveDuality,
  MetricTensor,
  MetricTensor3D,
  MetricTensorND,
  getGravityAtPoint,
  navigate,
  navigate3D,
  renderObject3D,
  renderObjectND,
  checkCollisionWithWave,
  cullObject,
  MistMenuControl,
  handleUserInput,
  handleMenuInput,
  handleEnvironmentInput,
  getAvailableModes,
  showModeSelectionMenu,
  trySwitchModes,
  getMenuOptionsWithMilestones,
};