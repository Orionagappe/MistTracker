import nvk from 'nvk';
import { renderViewport, selectTimeIndex, selectCategory, selectItem } from './MistCore.js';
import { SelectionModeState, MetricTensorND } from './MistCommon.js';
import { startSession, loadMistUser, milestoneManager } from './MistTrackerVulkan.js';
import { mistSolution } from './mistSolution.js';

class MistIllum {
    constructor(config = {}) {
        // Initialize universe from MistSolution
        this.initializeUniverse(config);

        // Vulkan instance and device setup
        this.instance = new nvk.Instance({
            appName: "Mist Solution",
            engineName: "MistIllum",
            vulkanVersion: nvk.VERSION_1_2,
            enabledExtensions: [
                "VK_KHR_surface",
                "VK_KHR_xlib_surface", // For X11 integration
                "VK_KHR_timeline_semaphore" // For quantum time synchronization
            ]
        });
        
        // Initialize physics and quantum states
        this.physicsEngine = new MistPhysicsEngine({
            timeComponents: 3, // Support quantum, interaction, and cosmological time
            metric: metricTensor7D
        });
        
        // Wave function state
        this.waveState = {
            psi: null,
            evolvedMasses: [],
            timeVector: [0, 0, 0]
        };

        // Physical device selection
        this.physicalDevice = this.instance.getPhysicalDevices().find(device => {
            const props = device.getProperties();
            return props.deviceType === nvk.PHYSICAL_DEVICE_TYPE_DISCRETE_GPU;
        });

        // Logical device and queues
        this.device = this.physicalDevice.createDevice({
            queueCreateInfos: [{
                queueFamilyIndex: 0,
                queuePriorities: [1.0]
            }],
            enabledFeatures: {
                geometryShader: true, // For nD geometry processing
                tessellationShader: true // For advanced surface detail
            }
        });

        // Command pool for graphics commands
        this.commandPool = this.device.createCommandPool({
            queueFamilyIndex: 0,
            flags: nvk.COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT
        });

        // Setup physics engine and metric tensors
        this.physicsEngine = new MistPhysicsEngine();
        this.metricTensor3D = new MetricTensor3D();
        this.metricTensorND = new MetricTensorND(config.dimensions || 4);

        // Window and surface management
        this.setupWindow();
        this.setupSwapchain();
        this.setupRenderPass();
        this.setupPipelines();

        // Session state
        this.session = null;
        this.viewportData = null;
    }

    setupWindow() {
        // Create X11 window using node-x11
        const x11 = require('node-x11');
        this.display = x11.createClient((err, display) => {
            this.X = display.client;
            this.root = display.screen[0].root;
            this.windowId = this.X.AllocID();

            // Create main window
            this.X.CreateWindow(
                this.windowId,
                this.root,
                0, 0, 1280, 720, // Default size
                0, 0, 0, 0,
                {
                    eventMask: x11.eventMask.Exposure |
                              x11.eventMask.KeyPress |
                              x11.eventMask.ButtonPress |
                              x11.eventMask.PointerMotion
                }
            );
            this.X.MapWindow(this.windowId);

            // Create Vulkan surface for X11 window
            this.surface = this.instance.createXlibSurface({
                dpy: this.display,
                window: this.windowId
            });
        });
    }

    setupSwapchain() {
        // Create swapchain for rendering
        const capabilities = this.physicalDevice.getSurfaceCapabilities(this.surface);
        this.swapchain = this.device.createSwapchain({
            surface: this.surface,
            minImageCount: capabilities.minImageCount + 1,
            imageFormat: nvk.FORMAT_B8G8R8A8_UNORM,
            imageExtent: capabilities.currentExtent,
            imageArrayLayers: 1,
            imageUsage: nvk.IMAGE_USAGE_COLOR_ATTACHMENT_BIT,
            preTransform: capabilities.currentTransform,
            compositeAlpha: nvk.COMPOSITE_ALPHA_OPAQUE_BIT_KHR,
            presentMode: nvk.PRESENT_MODE_MAILBOX_KHR,
            clipped: true
        });
    }

    setupRenderPass() {
        // Create render pass for main drawing
        this.renderPass = this.device.createRenderPass({
            attachments: [{
                format: nvk.FORMAT_B8G8R8A8_UNORM,
                samples: nvk.SAMPLE_COUNT_1_BIT,
                loadOp: nvk.ATTACHMENT_LOAD_OP_CLEAR,
                storeOp: nvk.ATTACHMENT_STORE_OP_STORE,
                initialLayout: nvk.IMAGE_LAYOUT_UNDEFINED,
                finalLayout: nvk.IMAGE_LAYOUT_PRESENT_SRC_KHR
            }],
            subpasses: [{
                colorAttachments: [{
                    attachment: 0,
                    layout: nvk.IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL
                }]
            }]
        });
    }

    setupPipelines() {
        // Create graphics pipelines for different rendering modes
        this.pipelines = {
            standard: this.createStandardPipeline(),
            nD: this.createNDPipeline(),
            wave: this.createWavePipeline()
        };
    }

    async initializeUniverse(config) {
        // Generate universe using MistSolution
        const universeState = await mistSolution(config.db, {
            dimensions: 7, // Support full 7D tensor space
            size: config.size || 100,
            user: config.user,
            dictionary: config.dictionary
        });
        
        this.universe = universeState.universe;
        this.landscape = universeState.landscape;
        this.objects = universeState.objects;
        this.categories = universeState.categories;
        
        // Initialize quantum states for all objects
        this.objects.forEach(obj => {
            obj.quantumState = [0, 0, 0]; // [T0, T1, T2]
            obj.waveFunction = null;
            obj.pilotWave = null;
        });
    }

    async start(user) {
        // Initialize session
        if (!user) {
            user = process.env.MIST_DEFAULT_USER || 'guest';
        }
        this.session = await startSession(user);
        

        // Initialize quantum physics state
        await this.initializeQuantumState();
        
        // Start render loop with quantum time evolution
        this.renderLoop();
    }

    async initializeQuantumState() {
        // Set up initial quantum states
        this.waveState.psi = waveFunction(1, 1, 0, 1, [0, 0, 0]);
        this.waveState.evolvedMasses = this.physicsEngine.quantumMassEvolution([1, 4.5, 21.0], [0, 0, 0]);
        
        // Initialize object wave functions
        for (const obj of this.objects) {
            obj.waveFunction = waveFunction(1, 1, 0, 1, obj.quantumState);
            obj.pilotWave = pilotWave(obj.waveFunction, {});
        }
    }

    updateQuantumState() {
        // Update time vector
        this.waveState.timeVector[0] += 1/60; // Quantum time
        this.waveState.timeVector[1] += 1/30; // Interaction time
        this.waveState.timeVector[2] += 1/3600; // Cosmological time
        
        // Evolve quantum states
        this.waveState.evolvedMasses = this.physicsEngine.quantumMassEvolution(
            [1, 4.5, 21.0],
            this.waveState.timeVector
        );
        
        // Update object states
        for (const obj of this.objects) {
            // Update wave functions
            obj.waveFunction = waveFunction(1, 1, 0, 1, obj.quantumState);
            obj.pilotWave = pilotWave(obj.waveFunction, {});
            
            // Apply deformations based on energy distribution
            const energyDist = distributeEnergy(obj.energy, ['quantum', 'interaction', 'cosmological', 'spatial']);
            deformObject(obj, energyDist);
        }
    }

    renderLoop() {
        const commandBuffer = this.commandPool.allocateCommandBuffers({
            level: nvk.COMMAND_BUFFER_LEVEL_PRIMARY,
            commandBufferCount: 1
        })[0];

        const renderFrame = () => {
            // Update quantum and classical physics
            this.updateQuantumState();
            this.physicsEngine.update();
            
            // Apply wave interference patterns
            for (const obj of this.objects) {
                if (obj.pilotWave) {
                    const pattern = interferencePattern(
                        obj,
                        this.objects[0], // Example: interact with first object
                        this.objects[1], // Example: and second object
                        1.0
                    );
                    applyInterference(obj, pattern);
                }
            }
            
            // Update viewport with quantum states
            this.updateViewport();

            // Record and submit command buffer
            commandBuffer.begin();
            this.recordCommands(commandBuffer);
            commandBuffer.end();

            // Submit to queue and present
            this.device.getQueue(0).submit({
                commandBuffers: [commandBuffer]
            });

            // Request next frame with quantum time sync
            requestAnimationFrame(renderFrame);
        };

        renderFrame();
    }

    updateViewport() {
        if (this.session && this.viewportData) {
            renderViewport(this.session, {
                drawPrimitive: this.drawPrimitive.bind(this),
                drawText: this.drawText.bind(this)
            });
        }
    }

    // ... Additional methods for handling input, cleanup, etc.
}


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
// Helper functions for settings menu
function showTilingConfig(onUpdate) {
  const menuManager = new MenuManager('tiling-config');
  const configPage = new MenuPage('tiling');
  
  configPage
    .addComponent(new Dropdown('layout')
      .setLabel('Monitor Layout')
      .setOptions(['Single', 'Dual Horizontal', 'Dual Vertical', 'Grid'])
      .setValue('Single')
      .onChange(val => {
        const config = { layout: val };
        tileMode(true, config);
        if (onUpdate) onUpdate({ tileConfig: config });
      }));

  menuManager
    .addPage(configPage)
    .showPage('tiling');

  return menuManager;
}

function showKeybindConfig(onUpdate) {
  const menuManager = new MenuManager('keybind-config');
  const configPage = new MenuPage('keybinds');
  
  const defaultBinds = {
    'menu': 'Escape',
    'select': 'Enter',
    'back': 'Backspace',
    'up': 'ArrowUp',
    'down': 'ArrowDown'
  };

  Object.entries(defaultBinds).forEach(([action, key]) => {
    configPage.addComponent(new Button(`bind-${action}`)
      .setLabel(`${action}: ${key}`)
      .onClick(() => {
        // Show dialog to capture new key
        menuManager.showDialog({
          title: `Press any key to bind to ${action}`,
          onKeyPress: (newKey) => {
            defaultBinds[action] = newKey;
            if (onUpdate) onUpdate({ keybinds: { ...defaultBinds } });
          }
        });
      }));
  });

  menuManager
    .addPage(configPage)
    .showPage('keybinds');

  return menuManager;
}

function settingsMenu(onUpdate) {
  // Create settings menu using MistInterface components
  const menuManager = new MenuManager('settings-menu');
  const settingsPage = new MenuPage('settings');

  // Audio settings
  const audioSection = new MenuPage('audio-settings');
  audioSection
    .addComponent(new Slider('global-volume')
      .setLabel('Global Volume')
      .setRange(0, 1, 0.01)
      .setValue(1)
      .onChange(val => {
        volumeGlobal(val);
        if (onUpdate) onUpdate({ globalVolume: val });
      }))
    .addComponent(new Slider('ambient-volume')
      .setLabel('Ambient Volume')
      .setRange(0, 1, 0.01)
      .setValue(0.5)
      .onChange(val => {
        volumeAmbient(val);
        if (onUpdate) onUpdate({ ambientVolume: val });
      }))
    .addComponent(new Slider('interaction-volume')
      .setLabel('Interaction Volume')
      .setRange(0, 1, 0.01)
      .setValue(0.7)
      .onChange(val => {
        volumeInteract(val);
        if (onUpdate) onUpdate({ interactionVolume: val });
      }))
    .addComponent(new Slider('dialogue-volume')
      .setLabel('Dialogue Volume')
      .setRange(0, 1, 0.01)
      .setValue(0.8)
      .onChange(val => {
        volumeDialogue(val);
        if (onUpdate) onUpdate({ dialogueVolume: val });
      }))
    .addComponent(new Button('back')
      .setLabel('Back')
      .onClick(() => menuManager.showPage('settings')));

  // Wave parameters
  const waveSection = new MenuPage('wave-settings');
  waveSection
    .addComponent(new Slider('wave-frequency')
      .setLabel('Wave Frequency')
      .setRange(0.01, 10000, 0.01)
      .setValue(440)
      .onChange(val => {
        if (onUpdate) onUpdate({ waveFrequency: val });
      }))
    .addComponent(new Slider('wave-amplitude')
      .setLabel('Wave Amplitude')
      .setRange(0, 10, 0.01)
      .setValue(1)
      .onChange(val => {
        if (onUpdate) onUpdate({ waveAmplitude: val });
      }))
    .addComponent(new Slider('wave-phase')
      .setLabel('Wave Phase')
      .setRange(0, 2 * Math.PI, 0.01)
      .setValue(0)
      .onChange(val => {
        if (onUpdate) onUpdate({ wavePhase: val });
      }))
    .addComponent(new Button('back')
      .setLabel('Back')
      .onClick(() => menuManager.showPage('settings')));

  // Display settings
  const displaySection = new MenuPage('display-settings');
  displaySection
    .addComponent(new Dropdown('display-mode')
      .setLabel('Display Mode')
      .setOptions(['3D', 'nD'])
      .setValue('3D')
      .onChange(val => {
        if (onUpdate) onUpdate({ displayMode: val });
      }))
    .addComponent(new Button('tiling')
      .setLabel('Configure Tiling')
      .onClick(() => showTilingConfig(onUpdate)))
    .addComponent(new Button('back')
      .setLabel('Back')
      .onClick(() => menuManager.showPage('settings')));

  // Controls settings
  const controlsSection = new MenuPage('controls-settings');
  controlsSection
    .addComponent(new Button('configure-keybinds')
      .setLabel('Configure Keybinds')
      .onClick(() => showKeybindConfig(onUpdate)))
    .addComponent(new Button('back')
      .setLabel('Back')
      .onClick(() => menuManager.showPage('settings')));

  // Add sections to main settings page
  settingsPage
    .addComponent(new Button('audio')
      .setLabel('Audio Settings')
      .onClick(() => menuManager.showPage('audio-settings')))
    .addComponent(new Button('wave')
      .setLabel('Wave Parameters')
      .onClick(() => menuManager.showPage('wave-settings')))
    .addComponent(new Button('display')
      .setLabel('Display Settings')
      .onClick(() => menuManager.showPage('display-settings')))
    .addComponent(new Button('controls')
      .setLabel('Controls')
      .onClick(() => menuManager.showPage('controls-settings')));

  // Add all pages to menu manager
  menuManager
    .addPage(settingsPage)
    .addPage(audioSection)
    .addPage(waveSection)
    .addPage(displaySection)
    .addPage(controlsSection);

  // Show main settings page
  menuManager.showPage('settings');

  return menuManager;
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
import { Button, Slider, Checkbox, InputBox, ColorPicker, Dropdown } from './MistInterface.js';

/**
 * Display a menu overlay for the Mist solution using MistInterface components.
 * The menu is shown as a dialog box and can be opened/closed with the "esc" key.
 * Allows the user to alter any MistIllum setting (globalVolume, precision, mode selection, etc).
 * @param {Object} overlayConfig - Optional menu structure, callbacks, etc.
 */

function mistMenu(overlayConfig = {}) {
    // Create main menu container
    const menuContainer = document.createElement('div');
    menuContainer.classList.add('mist-menu-overlay');

    // Volume Controls
    const volumeSection = document.createElement('div');
    volumeSection.classList.add('mist-menu-section');
    
    const globalVolumeSlider = new Slider('globalVolume', volumeSection, 0, 100, 1)
        .setTooltip('Adjust global volume')
        .setValue(overlayConfig.globalVolume || 100)
        .onChange(value => volumeGlobal(value / 100));

    const ambientVolumeSlider = new Slider('ambientVolume', volumeSection, 0, 100, 1)
        .setTooltip('Adjust ambient sound volume')
        .setValue(overlayConfig.ambientVolume || 70)
        .onChange(value => volumeAmbient(value / 100));

    const dialogueVolumeSlider = new Slider('dialogueVolume', volumeSection, 0, 100, 1)
        .setTooltip('Adjust dialogue volume')
        .setValue(overlayConfig.dialogueVolume || 85)
        .onChange(value => volumeDialogue(value / 100));

    // Mode Selection
    const modeSection = document.createElement('div');
    modeSection.classList.add('mist-menu-section');

    const modeDropdown = new Dropdown('viewMode', modeSection, getAvailableModes())
        .setTooltip('Select view mode')
        .onChange(mode => trySwitchMode(mode));

    // Wave Parameters
    const waveSection = document.createElement('div');
    waveSection.classList.add('mist-menu-section');

    const waveFreqSlider = new Slider('waveFrequency', waveSection, 0.1, 10, 0.1)
        .setTooltip('Adjust wave frequency')
        .setValue(overlayConfig.waveFrequency || 1)
        .onChange(value => updateWaveParams({ frequency: value }));

    const waveAmpSlider = new Slider('waveAmplitude', waveSection, 0, 2, 0.1)
        .setTooltip('Adjust wave amplitude')
        .setValue(overlayConfig.waveAmplitude || 1)
        .onChange(value => updateWaveParams({ amplitude: value }));

    // Display Settings
    const displaySection = document.createElement('div');
    displaySection.classList.add('mist-menu-section');

    const showWireframeCheck = new Checkbox('showWireframe', displaySection, 'Show Wireframes')
        .setTooltip('Toggle wireframe display')
        .setChecked(overlayConfig.showWireframe || false)
        .onChange(checked => wireFrames({ enabled: checked }));

    const colorPicker = new ColorPicker('ambientColor', displaySection)
        .setTooltip('Set ambient light color')
        .onSelect(color => updateAmbientLight(color));

    // Control Buttons
    const buttonSection = document.createElement('div');
    buttonSection.classList.add('mist-menu-section');

    const resetButton = new Button('resetSettings', buttonSection, 'Reset Settings')
        .setTooltip('Reset all settings to default')
        .onClick(() => resetSettings());

    const applyButton = new Button('applySettings', buttonSection, 'Apply')
        .setTooltip('Apply current settings')
        .onClick(() => applySettings());

    // Add sections to container
    menuContainer.appendChild(volumeSection);
    menuContainer.appendChild(modeSection);
    menuContainer.appendChild(waveSection);
    menuContainer.appendChild(displaySection);
    menuContainer.appendChild(buttonSection);

    // Setup keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            menuContainer.classList.toggle('visible');
        }
    });

    return menuContainer;
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
 * Initializes the physics engine, menu system, and rendering loop.
 * @param {Object} config - Configuration object containing:
 * @param {Object} config.db - Database connection
 * @param {string} config.userName - User's name
 * @param {MenuManager} config.menuManager - Instance of MenuManager for UI control
 * @param {Object} config.display - X11 display information (optional)
 * @param {number} config.windowId - X11 window ID (optional)
 */
function launchMistCore(config = {}) {
    const { db, userName, menuManager, display, windowId } = config;

    // Initialize core components
    const physicsEngine = new MistPhysicsEngine();
    const renderSystem = display ? new X11RenderSystem(display, windowId) : null;

    // Setup menu event handlers
    if (menuManager) {
        menuManager.getState().then(state => {
            // Apply loaded configuration
            physicsEngine.setParameters(state.physics || {});
            if (renderSystem) {
                renderSystem.setParameters(state.display || {});
            }
        });

        // Watch for configuration changes
        menuManager.on('stateChange', async () => {
            await menuManager.saveConfig();
        });
    }

    // Initialize rendering loop if X11 display is available
    if (renderSystem) {
        renderSystem.startRenderLoop(() => {
            physicsEngine.update();
            // Additional render logic
        });
    }

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

// --- Menu State ---

class MistMenuControl {
  constructor() {
    this.menuManager = new MenuManager('mist-menu');
    this.physicsEngine = new MistPhysicsEngine();
    this.mode = '3D';
    this.session = { 
      selectedTimeIndex: 0,
      selectedCategory: null,
      selectedItem: null,
      settings: {
        volumes: {
          global: 1,
          ambient: 0.5,
          interaction: 0.7,
          dialogue: 0.8
        },
        wave: {
          frequency: 440,
          amplitude: 1,
          phase: 0
        },
        display: {
          mode: '3D',
          tiling: false
        }
      }
    };
    this.setupMenuPages();
  }

  setupMenuPages() {
    // Main menu page
    const mainPage = new MenuPage('main');
    mainPage
      .addComponent(new Button('time')
        .setLabel('Select Time Index')
        .onClick(() => this.showTimeSelect()))
      .addComponent(new Button('category')
        .setLabel('Select Category')
        .onClick(() => this.showCategorySelect()))
      .addComponent(new Button('settings')
        .setLabel('Settings')
        .onClick(() => this.menuManager.showPage('settings')));

    // Settings page
    const settingsPage = new MenuPage('settings');
    settingsPage
      .addComponent(new Button('audio')
        .setLabel('Audio Settings')
        .onClick(() => this.menuManager.showPage('audio')))
      .addComponent(new Button('display')
        .setLabel('Display Settings')
        .onClick(() => this.menuManager.showPage('display')))
      .addComponent(new Button('wave')
        .setLabel('Wave Parameters')
        .onClick(() => this.menuManager.showPage('wave')))
      .addComponent(new Button('back')
        .setLabel('Back')
        .onClick(() => this.menuManager.showPage('main')));

    // Audio settings page
    const audioPage = new MenuPage('audio');
    audioPage
      .addComponent(new Slider('global-volume')
        .setLabel('Global Volume')
        .setRange(0, 1, 0.01)
        .setValue(this.session.settings.volumes.global)
        .onChange(val => {
          this.session.settings.volumes.global = val;
          volumeGlobal(val);
        }))
      .addComponent(new Slider('ambient-volume')
        .setLabel('Ambient Volume')
        .setRange(0, 1, 0.01)
        .setValue(this.session.settings.volumes.ambient)
        .onChange(val => {
          this.session.settings.volumes.ambient = val;
          volumeAmbient(val);
        }))
      .addComponent(new Button('back')
        .setLabel('Back')
        .onClick(() => this.menuManager.showPage('settings')));

    // Display settings page
    const displayPage = new MenuPage('display');
    displayPage
      .addComponent(new Dropdown('mode')
        .setLabel('Display Mode')
        .setOptions(['3D', 'nD'])
        .setValue(this.mode)
        .onChange(val => this.setMode(val)))
      .addComponent(new Button('tiling')
        .setLabel('Configure Tiling')
        .onClick(() => this.showTilingConfig()))
      .addComponent(new Button('back')
        .setLabel('Back')
        .onClick(() => this.menuManager.showPage('settings')));

    // Wave parameters page
    const wavePage = new MenuPage('wave');
    wavePage
      .addComponent(new Slider('frequency')
        .setLabel('Wave Frequency')
        .setRange(0.01, 10000, 0.01)
        .setValue(this.session.settings.wave.frequency)
        .onChange(val => this.session.settings.wave.frequency = val))
      .addComponent(new Slider('amplitude')
        .setLabel('Wave Amplitude')
        .setRange(0, 10, 0.01)
        .setValue(this.session.settings.wave.amplitude)
        .onChange(val => this.session.settings.wave.amplitude = val))
      .addComponent(new Button('back')
        .setLabel('Back')
        .onClick(() => this.menuManager.showPage('settings')));

    // Add pages to menu manager
    this.menuManager
      .addPage(mainPage)
      .addPage(settingsPage)
      .addPage(audioPage)
      .addPage(displayPage)
      .addPage(wavePage);

    // Show main page by default
    this.menuManager.showPage('main');
  }

  start() {
    this.menuManager.show();
    this.renderViewport();
  }

  renderViewport() {
    renderViewport(this.session, this.menuManager);
  }

  showTimeSelect() {
    this.menuManager.showDialog({
      title: 'Select Time Index',
      content: new Dropdown('time-select')
        .setOptions(this.getTimeIndices())
        .setValue(this.session.selectedTimeIndex)
        .onChange(idx => {
          this.session.selectedTimeIndex = idx;
          this.renderViewport();
        })
    });
  }

  showCategorySelect() {
    const categories = this.getCategories();
    if (categories.length === 0) {
      this.menuManager.showMessage('No categories available for this time index');
      return;
    }

    this.menuManager.showDialog({
      title: 'Select Category',
      content: new Dropdown('category-select')
        .setOptions(categories)
        .setValue(this.session.selectedCategory)
        .onChange(category => {
          this.session.selectedCategory = category;
          this.renderViewport();
        })
    });
  }

  getTimeIndices() {
    // Return available time indices
    return ['Time 1', 'Time 2', 'Time 3']; // Example data
  }

  getCategories() {
    // Return categories for current time index
    return ['Category 1', 'Category 2']; // Example data
  }

  setMode(mode) {
    this.mode = mode;
    this.session.settings.display.mode = mode;
    this.physicsEngine.setMode(mode);
    if (mode === 'nD') {
      this.physicsEngine.metric = new MetricTensor(4, [
        [-1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]);
    } else {
      this.physicsEngine.metric = new MetricTensor3D();
    }
    this.renderViewport();
  }

  showTilingConfig() {
    this.menuManager.showDialog({
      title: 'Tiling Configuration',
      content: new Button('toggle-tiling')
        .setLabel(this.session.settings.display.tiling ? 'Disable Tiling' : 'Enable Tiling')
        .onClick(() => {
          this.session.settings.display.tiling = !this.session.settings.display.tiling;
          tileMode(this.session.settings.display.tiling);
        })
    });
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
  isEdgeVoxel,
  interactObjects,
  spawnObjectNearPlayer,
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
  perspectiveTransform,
  decomposeHigherToLower,
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
  checkCollisionWithWave,
  cullObject,
  MistMenuControl,
  handleUserInput,
  handleMenuInput,
  handleEnvironmentInput,
  getAvailableModes,
  showModeSelectionMenu,
  showTilingConfig,
  showKeybindConfig,
  trySwitchMode,
  getMenuOptionsWithMilestones,
};