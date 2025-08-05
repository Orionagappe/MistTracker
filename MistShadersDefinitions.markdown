# Mist Shaders API Documentation

## Overview

This document describes the shaders used in the Mist application for rendering and computation. These shaders are written in GLSL 450 and include a compute shader for physics simulations, vertex and fragment shaders for standard 3D rendering, and specialized shaders for visualizing n-dimensional tensors and wave functions. Each shader is designed to integrate into Vulkan pipelines, utilizing push constants and uniform buffers for configuration.

---

## Compute Shaders

### Physics Compute Shader (`physics.comp`)

- **Purpose**: Evolves quantum states over time in a parallelized manner, applying the time evolution operator based on physical parameters.
- **Layout**: `local_size_x = 256` (each workgroup processes 256 states in parallel).
- **Buffers**:
  - `QuantumState` (binding = 0): An SSBO containing an array of `vec2` representing the complex amplitudes (real and imaginary parts) of the quantum states.
- **Push Constants**:
  - `Parameters`:
    - `deltaT: float` – Time step for the evolution.
    - `hBar: float` – Reduced Planck's constant.
    - `mass: float` – Mass of the particle.
    - `potential: float` – Potential energy at the state's position.
    - `numStates: uint` – Total number of quantum states to process.
- **Functionality**:
  - Each invocation handles one quantum state, identified by `gl_GlobalInvocationID.x`.
  - Calculates the energy `E` using the potential and a simplified kinetic energy term (`(hBar * hBar) / (2.0 * mass)`).
  - Applies time evolution by multiplying the state by `exp(-i * E * deltaT / hBar)` using complex arithmetic (cosine and sine functions).
  - Updates the state in the `QuantumState` buffer.
- **Usage Notes**:
  - Assumes a basic potential and kinetic energy model; adjust the energy calculation for more complex systems.
  - Dispatch enough workgroups to cover all states based on `numStates`.

---

## Standard Rendering Shaders

### Standard Vertex Shader (`standard.vert`)

- **Purpose**: Transforms vertex attributes for standard 3D rendering, applying model, view, and projection transformations.
- **Inputs**:
  - `inPosition: vec3` – Vertex position.
  - `inNormal: vec3` – Vertex normal.
  - `inTexCoord: vec2` – Texture coordinates.
  - `inColor: vec4` – Vertex color.
- **Outputs**:
  - `fragPosition: vec3` – World space position.
  - `fragNormal: vec3` – Transformed normal.
  - `fragTexCoord: vec2` – Texture coordinates.
  - `fragColor: vec4` – Vertex color.
- **Push Constants**:
  - `PushConstants`:
    - `model: mat4` – Model transformation matrix.
    - `view: mat4` – View transformation matrix.
    - `projection: mat4` – Projection transformation matrix.
- **Functionality**:
  - Applies the model transformation to compute the world space position.
  - Transforms the normal using the model's normal matrix (derived from `mat3(push.model)`).
  - Passes texture coordinates and color directly to the fragment shader.
  - Computes the final clip space position using the projection and view matrices.
- **Usage Notes**:
  - Expects vertex data in a format including position, normal, texture coordinates, and color.
  - Ensure transformation matrices are set in push constants before rendering.

### Standard Fragment Shader (`standard.frag`)

- **Purpose**: Computes the final fragment color using basic Phong lighting.
- **Inputs**:
  - `fragPosition: vec3` – World space position.
  - `fragNormal: vec3` – Surface normal.
  - `fragTexCoord: vec2` – Texture coordinates (currently unused).
  - `fragColor: vec4` – Base color from the vertex shader.
- **Uniforms**:
  - `LightingParams` (set = 0, binding = 0):
    - `lightPosition: vec3` – Position of the light source.
    - `viewPosition: vec3` – Position of the viewer.
    - `lightColor: vec3` – Color of the light.
    - `ambientStrength: float` – Strength of ambient lighting.
    - `specularStrength: float` – Strength of specular highlights.
- **Outputs**:
  - `outColor: vec4` – Final fragment color.
- **Functionality**:
  - Calculates ambient lighting as a fraction of the light color.
  - Computes diffuse lighting based on the dot product of the normalized normal and light direction.
  - Calculates specular lighting using the Phong reflection model with a shininess exponent of 32.
  - Combines all components with the base color to produce the final color.
- **Usage Notes**:
  - Does not currently use texture sampling; relies on vertex colors.
  - Add texture sampling logic to support textured rendering if needed.

---

## Tensor Visualization Shaders

### Tensor Vertex Shader (`tensor.vert`)

- **Purpose**: Projects n-dimensional tensor data into 3D space for visualization, applying transformations and scaling based on tensor properties.
- **Inputs**:
  - `inPosition: vec3` – Base position in 3D space.
  - `inTensor1: vec4` – First four components of the tensor.
  - `inTensor2: vec4` – Next four components of the tensor.
  - `inMetadata: vec4` – Metadata such as tensor rank and dimensions.
- **Outputs**:
  - `fragPosition: vec3` – Transformed position in world space.
  - `fragTensor1: vec4` – First four tensor components.
  - `fragTensor2: vec4` – Next four tensor components.
  - `fragMetadata: vec4` – Tensor metadata.
- **Push Constants**:
  - `PushConstants`:
    - `model: mat4` – Model transformation.
    - `view: mat4` – View transformation.
    - `projection: mat4` – Projection transformation.
    - `tensorProjection: mat4` – Matrix to project from nD to 3D.
    - `timeComponent: float` – For temporal evolution (if applicable).
- **Functionality**:
  - Applies the `tensorProjection` matrix to map the position from nD to 3D space.
  - Calculates the tensor magnitude by summing the squares of all components and taking the square root.
  - Scales the position slightly (by `1.0 + magnitude * 0.1`) to emphasize tensor strength.
  - Applies standard model, view, and projection transformations.
  - Sets the point size based on the tensor magnitude for point rendering.
- **Usage Notes**:
  - Configure `tensorProjection` to correctly map the nD tensor space to 3D.
  - Adjust the scaling factor (`0.1`) or remove it based on visualization needs.

### Tensor Fragment Shader (`tensor.frag`)

- **Purpose**: Visualizes tensor data by mapping tensor values to colors based on the selected visualization mode.
- **Inputs**:
  - `fragPosition: vec3` – World space position.
  - `fragTensor1: vec4` – First four tensor components.
  - `fragTensor2: vec4` – Next four tensor components.
  - `fragMetadata: vec4` – Tensor metadata (e.g., rank in `x` component).
- **Uniforms**:
  - `VisualizationParams` (set = 0, binding = 0):
    - `colorMap: vec4[4]` – Array of four colors forming a gradient for mapping values.
    - `minValue: float` – Minimum tensor value for normalization.
    - `maxValue: float` – Maximum tensor value for normalization.
    - `opacity: float` – Global opacity for the visualization.
    - `colorMode: int` – Visualization mode (0: magnitude, 1: components, 2: rank-based).
- **Outputs**:
  - `outColor: vec4` – Final fragment color.
- **Functionality**:
  - Calculates the tensor magnitude as the square root of the sum of squared components.
  - Supports three visualization modes:
    - **Mode 0**: Maps the magnitude to a color using the `colorMap` gradient.
    - **Mode 1**: Uses the absolute values of the first three components of `fragTensor1` as RGB.
    - **Mode 2**: Maps the tensor rank (from `fragMetadata.x`) to a color using the gradient.
  - Applies global opacity to the final color.
- **Usage Notes**:
  - Use `colorMode` to switch between visualization styles.
  - Ensure the `colorMap` array provides a meaningful gradient for the data range.

---

## Wave Function Visualization Shaders

### Wave Vertex Shader (`wave.vert`)

- **Purpose**: Handles the time evolution of wave functions and scales positions based on probability density for visualization.
- **Inputs**:
  - `inPosition: vec3` – Base position.
  - `inComplexAmplitude: vec2` – Complex amplitude (real, imaginary).
  - `inQuantumNumbers: vec4` – Quantum numbers (n, l, m, s).
  - `inMetadata: vec4` – Metadata, with energy in the `x` component.
- **Outputs**:
  - `fragPosition: vec3` – Transformed position in world space.
  - `fragComplexAmplitude: vec2` – Evolved complex amplitude.
  - `fragQuantumNumbers: vec4` – Quantum numbers.
  - `fragMetadata: vec4` – Updated metadata with probability in the `y` component.
- **Push Constants**:
  - `PushConstants`:
    - `model: mat4`, `view: mat4`, `projection: mat4` – Transformation matrices.
    - `time: float` – Current time for wave evolution.
    - `planckConstant: float` – Reduced Planck's constant (ℏ).
    - `mass: float` – Particle mass.
- **Functionality**:
  - Calculates the phase based on energy (`inMetadata.x`) and time using `-energy * time / ℏ`.
  - Applies time evolution to the complex amplitude using cosine and sine functions.
  - Computes the probability density as the magnitude squared of the evolved amplitude.
  - Scales the position by `1.0 + probability * 0.1` to emphasize high-probability regions.
  - Applies standard transformations and sets the point size based on probability.
- **Usage Notes**:
  - Ensure energy is provided in `inMetadata.x` for accurate phase calculation.
  - Adjust the scaling factor (`0.1`) to control the visualization effect.

### Wave Fragment Shader (`wave.frag`)

- **Purpose**: Visualizes wave function properties such as probability density, phase, or energy levels using different modes.
- **Inputs**:
  - `fragPosition: vec3` – World space position.
  - `fragComplexAmplitude: vec2` – Evolved complex amplitude.
  - `fragQuantumNumbers: vec4` – Quantum numbers.
  - `fragMetadata: vec4` – Metadata with energy in `x` and probability in `y`.
- **Uniforms**:
  - `VisualizationParams` (set = 0, binding = 0):
    - `baseColor: vec4` – Base color for density visualization.
    - `phaseColor: vec4` – Color for phase visualization (unused directly; HSV is used instead).
    - `minEnergy: float`, `maxEnergy: float` – Energy range for normalization.
    - `opacity: float` – Global opacity.
    - `visualMode: int` – Visualization mode (0: density, 1: phase, 2: energy, 3+: quantum numbers).
- **Outputs**:
  - `outColor: vec4` – Final fragment color.
- **Functionality**:
  - Calculates probability density and phase from the complex amplitude.
  - Supports multiple visualization modes:
    - **Mode 0**: Scales `baseColor` by probability density.
    - **Mode 1**: Maps phase to an HSV color wheel (hue from [-π, π]), with value based on probability.
    - **Mode 2**: Maps normalized energy to a blue-to-red gradient, scaled by probability.
    - **Mode 3+**: Uses normalized absolute quantum numbers as RGB, scaled by probability.
  - Applies global opacity to the final color.
- **Usage Notes**:
  - Use `visualMode` to select the desired visualization style.
  - For phase visualization, the hue reflects the phase angle, with probability controlling brightness.

---

This documentation provides a detailed reference for developers working with the Mist application's shaders, enabling integration into rendering and computation pipelines.