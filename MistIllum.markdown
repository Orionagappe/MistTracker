# MistIllum API Documentation

## Overview

This document details the API for `MistIllum.js`, a core module for visualization and physics simulation in the Mist Solution ecosystem. Functions and classes are grouped by functionality, with notes on their primary purposes.

---

## Classes

### MistIllum

- **Description**: Main class for the MistIllum visualization system. Initializes the universe, sets up Vulkan rendering, manages physics, and handles quantum states.

#### Methods

- **initializeUniverse(config)**: Generates the universe using MistSolution, initializing state, landscape, objects, and categories.
- **setupWindow()**: Creates an X11 window and Vulkan surface for rendering.
- **setupSwapchain()**: Configures the swapchain for rendering frames.
- **setupRenderPass()**: Sets up the render pass for drawing operations.
- **setupPipelines()**: Creates graphics pipelines for various rendering modes (standard, nD, wave).
- **start(user)**: Starts the session, initializes quantum states, and begins the render loop.
- **initializeQuantumState()**: Sets up initial quantum states for wave state and objects.
- **updateQuantumState()**: Updates quantum states over time, evolving masses and wave functions.
- **renderLoop()**: Manages the rendering loop, updating physics and rendering frames.
- **updateViewport()**: Updates the viewport with current session data.

---

### LightSource

- **Description**: Defines light sources with properties like type, position, color, intensity, and direction for rendering.

---

### MetricTensor

- **Description**: General metric tensor class for n-dimensional space, used in physics and rendering calculations.

---

### MistPhysicsEngine

- **Description**: Physics engine for menu logic and navigation, not for world simulation.

---

### MetricTensor3D

- **Description**: Specialized metric tensor for 3D spatial calculations.

---

### MetricTensorND

- **Description**: Metric tensor for n-dimensional physics and transformations.

---

### MistMenuControl

- **Description**: Controls menu interactions, integrating viewport functions and mode switching (3D/nD).

---

## Functions

### Tiling and Multi-Monitor Support

- **tileMode(enable, config)**: Manages window tiling for multi-monitor setups, arranging windows based on config.
- **tileSpan(monitors)**: Spans the viewport across multiple monitors using monitor descriptors.

---

### Wave and Interference Utilities

- **waveFunction(amplitude, k, x, omega, t)**: Computes a wave function, returning a complex value for rendering and physics.
- **interferencePattern(source, obj1, obj2, lambda)**: Calculates the interference pattern between objects from a source.
- **applyInterference(source, obj1, obj2, lambda)**: Applies interference effects to object intensities.

---

### Object Management

- **createVoxelObject(center, size, angularMomentumMap)**: Creates a voxel-based 3D object for rendering.
- **updateDistanceFromObserver(object, observer)**: Updates an object's distance from the observer for spatial calculations.
- **computeAngularMomentumMap(object)**: Computes the angular momentum map for an object.
- **isEdgeVoxel(v, object)**: Checks if a voxel is on the edge of an object.
- **interactObjects(objA, objB, tensor)**: Handles interactions between objects using a tensor.
- **spawnObjectNearPlayer(player, objectData)**: Spawns an object near the player in the scene.
- **cullObject(obj)**: Removes an object from the scene, handling user-specific logic if applicable.

---

### Rendering Utilities

- **fastTransform(ray)**: Performs a fast Fourier transform on a ray for wave analysis.
- **worldWarp(geometryType, params, metricTensor)**: Applies geometric transformations (e.g., sphere, torus) to the world.
- **wireFrames(item, options, metricTensor)**: Generates wireframe meshes for items using a metric tensor.
- **rastRenderMap(wireframe, textureMap, waveParams)**: Renders wireframes with texture and wave-based shading.
- **renderObject3D(object, renderer)**: Renders a 3D object using the provided renderer.
- **renderObjectND(object, renderer)**: Renders an n-dimensional object.

---

### Audio Management

- **audioQueue(soundId, options, listenerPosition)**: Queues a sound for playback, modulated by wave and geometry.
- **volumeGlobal(level)**: Sets the global volume, optionally modulated by wave logic.
- **volumeAmbient(level, options)**: Sets ambient volume, modulated by spatial and temporal waves.
- **volumeInteract(level, obj1, obj2, options)**: Sets interaction volume, modulated by proximity and interference.
- **volumeDialogue(level, speakerPosition, listenerPosition, options)**: Sets dialogue volume, modulated by distance and wave envelope.

---

### Settings and UI

- **settingsMenu(uiRenderer, currentConfig, onUpdate)**: Displays and manages the settings menu for audio, wave, and display options.
- **mistFirstStart()**: Displays initial title, credits, and disclaimers for Mist modules.
- **mistSetup()**: Checks and configures dependencies for MistTracker, MistMulti, and MistIllum.
- **mistDepend()**: Verifies system dependencies (e.g., MySQL, Vulkan).
- **mistWarn(message, type)**: Displays a warning message in CLI or GUI.
- **mistMenu(overlayConfig)**: Shows a menu overlay for adjusting MistIllum settings.

---

### Core and Multi-User Modules

- **launchMistCore(config, uiRenderer)**: Launches the core MistIllum environment in single-user mode.
- **launchMistMulti(config, uiRenderer)**: Launches MistIllum in multi-user (P2P) mode with event handlers.
- **shutdownMist(menuControl, onShutdown)**: Shuts down the session and cleans up resources.

---

### Dimensional Utilities

- **dimensionalStack(objects, dimension)**: Stacks objects along a specified higher dimension.
- **perspectiveTransform(object, observerDimension, objectDimension)**: Calculates apparent distance and size from a dimensional perspective.
- **projectToLowerDimension(object, fromDimension, toDimension, time)**: Projects a higher-dimensional object to a lower dimension.
- **decomposeHigherToLower(object, lowerDimension)**: Decomposes a higher-dimensional object into lower-dimensional slices.
- **extraDimensionMode(object, asObject)**: Treats extra dimensions as spatial axes or object properties.
- **setDimensionLimit(space, dimension, limit)**: Sets boundaries for a specific dimension.
- **distributeEnergy(energy, dimensions)**: Distributes energy across specified dimensions.
- **energyDistribution(system, dimensions)**: Calculates energy distribution across dimensions for a system.
- **deformObject(object, energyDistribution)**: Deforms an object based on energy distribution.
- **applyCurvature(space, curvatureFn)**: Applies curvature to space using a provided function.
- **schwarzschildCurvature(pos, params)**: Applies Schwarzschild curvature to a position vector.
- **sphericalCurvature(pos, radius)**: Applies spherical curvature to a position vector.

---

### Physics and Math Utilities

- **bellTheorem(a, b, c, d)**: Validates Bell's theorem for quantum mechanics.
- **pilotWave(psi, potential)**: Computes a pilot wave based on wave function and potential.
- **locality(p1, p2)**: Checks if two points are local (distance < 1 unit).
- **lightWave(source, obj1, obj2)**: Computes light wave propagation times to two objects.
- **relativeAcceleration(v1, v2, t)**: Calculates relative acceleration between velocities over time.
- **eulerLagrange(L, q, qDot, t, dt)**: Computes Euler-Lagrange equations for a Lagrangian.
- **gaussLawMagnetism(B, tolerance)**: Verifies Gauss's law for magnetism.
- **principleOfStationaryAction(actionVariation, tolerance)**: Checks if action is stationary.
- **composeWaves(waves)**: Composes multiple waves by summing intensities and averaging properties.
- **intensityHardnessRelationship(intensity, hardness)**: Computes the relationship between intensity and hardness.
- **particleWaveDuality(particle, wave)**: Models particle-wave duality for an object.

---

### Navigation and Interaction

- **getGravityAtPoint(point, physicsEngine)**: Retrieves gravity at a point using the physics engine.
- **navigate(currentPosition, direction, step, physicsEngine)**: Navigates in n-dimensional space.
- **navigate3D(currentPosition, direction, step, physicsEngine)**: Navigates in 3D space.
- **checkCollisionWithWave(obj1, obj2, physicsEngine, lambda)**: Checks collisions with wave-based culling.

---

### Menu and Environment Interaction

- **handleUserInput(input, menuState, envState)**: Routes user input to menu or environment logic.
- **handleMenuInput(input, menuState)**: Processes input for menu navigation and selection.
- **handleEnvironmentInput(input, envState)**: Handles input for environment interactions (e.g., camera movement).

---

### Milestone-Aware Mode Selection

- **getAvailableModes()**: Returns available projection and render modes based on milestones.
- **showModeSelectionMenu(uiRenderer, onSelect)**: Displays a menu for selecting enabled modes.
- **trySwitchModes(modeType, modeName, onSuccess, onFail)**: Attempts to switch modes if milestone is met.
- **getMenuOptionsWithMilestones()**: Generates menu options including milestone-enabled modes.

---

This documentation provides a comprehensive overview of the `MistIllum.js` API, covering visualization, physics, and user interaction functionalities.