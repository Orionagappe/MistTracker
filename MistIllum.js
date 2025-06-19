// --- Tiling and Multi-Monitor Support ---
function tileMode(enable, config) {
  // Enable or disable tiling of the MistTracker viewport.
  // config: { rows, cols, monitorLayout }
}

function tileSpan(monitors) {
  // Span the viewport across multiple monitors.
  // monitors: array of monitor descriptors (position, resolution)
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
  // Optionally, modulate by global wave envelope or geometric mean
  // (Implementation: set master gain in audio engine)
  // Example: globalVolume = level * waveEnvelope(t)
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
function settingsMenu(config) {
  // Display settings for:
  // - Global volume
  // - Ambient volume
  // - Interaction volume
  // - Dialogue volume
  // - Wave parameters (frequency, amplitude, phase)
  // - Geometry parameters (listener position, spatialization)
  // - Callbacks to update config and propagate to audio engine
  // (Implementation: UI code, not shown here)
}

function mistFirstStart() {
  // Display title, credits, and disclaimers for MistTrackerVulkan, MistMulti, and MistIllum.
}

function mistSetup() {
  // Setup function to check, create, and update required dependencies for MistTracker, MistMulti, and MistIllum.
  mistDepend();
  // Additional setup logic...
}

function mistDepend() {
  // Check user system for software and hardware dependencies (e.g., MySQL, Vulkan).
  // If failed, call mistWarn.
}

function mistWarn(message, type) {
  // Display a warning message to the user.
  // type: from warnTypes
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
function mistMenu(overlayConfig) {
  // Display a menu overlay for the Mist solution.
  // overlayConfig: menu structure, callbacks, etc.
}

// --- Integration with Core and Multi-User Modules ---
function launchMistCore(config) {
  // Launch and initialize MistTrackerVulkan.js core functionality.
}

function launchMistMulti(config) {
  // Optionally launch and initialize MistMulti.js for multi-user support.
}

function shutdownMist() {
  // Cleanly shut down MistIllum and all Mist modules.
}

// --- Physics Engine for MistTrackerVulkan.js ---

// --- Dimensional Stacking ---
/**
 * Stack objects or spaces in higher dimensions.
 * @param {Array} objects - Array of objects or spaces to stack.
 * @param {number} dimension - The dimension to stack along.
 * @returns {Array} - Stacked representation.
 */
function dimensionalStack(objects, dimension) {
  // Implement stacking logic for nD objects
}

// --- Distance and Size Change from Different Dimensional Perspectives ---
/**
 * Calculate apparent distance and size of an object from a given dimensional perspective.
 * @param {Object} object - The object to observe.
 * @param {number} observerDimension - The dimension of the observer.
 * @param {number} objectDimension - The dimension of the object.
 * @returns {Object} - { apparentDistance, apparentSize }
 */
function perspectiveTransform(object, observerDimension, objectDimension) {
  // Implement transformation logic
}

// --- Higher Dimensions Observed in Lower Dimensions Through Motion/Time ---
/**
 * Project a higher-dimensional object into a lower dimension over time or motion.
 * @param {Object} object - The higher-dimensional object.
 * @param {number} fromDimension - The original dimension.
 * @param {number} toDimension - The target (lower) dimension.
 * @param {number} time - Time parameter for the projection.
 * @returns {Object} - Lower-dimensional projection at given time.
 */
function projectToLowerDimension(object, fromDimension, toDimension, time) {
  // Implement projection logic
}

// --- Single Object in Higher Dimension as Multiple in Lower Dimensions ---
/**
 * Decompose a higher-dimensional object into its lower-dimensional "shadows" or slices.
 * @param {Object} object - The higher-dimensional object.
 * @param {number} lowerDimension - The dimension to decompose into.
 * @returns {Array} - Array of lower-dimensional objects.
 */
function decomposeHigherToLower(object, lowerDimension) {
  // Implement decomposition logic
}

// --- Extra Dimensions as Objects vs Space ---
/**
 * Treat extra dimensions as either spatial axes or as object properties.
 * @param {Object} object - The object to analyze.
 * @param {boolean} asObject - If true, treat extra dimensions as object properties.
 * @returns {Object} - Modified object or space.
 */
function extraDimensionMode(object, asObject) {
  // Implement logic for treating extra dimensions as objects or space
}

// --- Limited vs Infinite Extra Dimensions ---
/**
 * Set limits or boundaries for extra dimensions.
 * @param {Object} space - The space or object.
 * @param {number} dimension - The dimension to limit.
 * @param {number|null} limit - The limit value, or null for infinite.
 * @returns {Object} - Modified space/object.
 */
function setDimensionLimit(space, dimension, limit) {
  // Implement logic for limiting or making dimensions infinite
}

// --- Energy Distribution Through Extra Dimensions ---
/**
 * Calculate or simulate energy distribution across extra dimensions.
 * @param {Object} system - The physical system or object.
 * @param {Array} dimensions - Array of dimensions to distribute energy through.
 * @returns {Object} - Energy distribution result.
 */
function energyDistribution(system, dimensions) {
  // Implement energy distribution logic
}

// --- Non-Flat Extra Dimensions (Caveat) ---
/**
 * Apply curvature or non-flat geometry to extra dimensions.
 * @param {Object} space - The space or object.
 * @param {Function} curvatureFn - Function describing curvature.
 * @returns {Object} - Modified space/object with curvature.
 */
function applyCurvature(space, curvatureFn) {
  // Implement non-flat geometry logic
}

// --- Physics Engine Class ---
class MistPhysicsEngine {
  constructor(config = {}) {
    this.config = config;
    // Store state, constants, etc.
  }

  // Example: Step simulation forward in time
  step(deltaTime) {
    // Advance physics simulation by deltaTime
  }

  // Example: Attach to MistTrackerVulkan.js scene or data
  attachScene(scene) {
    this.scene = scene;
  }

  // Example: Query or update object state
  updateObjectState(objectId, newState) {
    // Update object in simulation
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
class MetricTensor {
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

class MistPhysicsEngine {
  constructor(config = {}) {
    // Default to 4D Minkowski metric, but allow 3D mode
    this.metric3D = new MetricTensor3D();
    this.metric4D = config.metric || new MetricTensor(4, [
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

function cullObject(obj) {
  // Remove object from scene/model
  // ...existing culling logic...
  if (obj.type === 'user' && obj.userId) {
    deleteUser(obj.userId);
  }
}

function deleteUser(userId) {
  // Remove user from active sessions and either warn and add strike to user or remove from DB
  // Use probability distribution to determine if user is removed or warned
  // ...implement DB/user removal logic...
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

const { MistPhysicsEngine, MetricTensor, MetricTensor3D } = require('./MistIllum.js');

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


// --- Export API ---

module.exports = {
  tileMode,
  tileSpan,
  LightSource,
  waveFunction,
  interferencePattern,
  applyInterference,
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
  energyDistribution,
  applyCurvature,
  MistPhysicsEngine,
  MetricTensor,
  MetricTensor3D,
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
  handleEnvironmentInput
};