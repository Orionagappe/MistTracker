# MistShaders API Documentation

## Overview

This document details the API for `MistShaders.js`, which manages the compilation of shaders and configuration of Vulkan pipelines for the Mist application.

### Functions

- **`precompileShaders(db)`**: Compiles all default shaders located in the shaders directory, storing the compiled SPIR-V binaries in the database and filesystem.
- **`createPipelineConfigs(device, db)`**: Creates and returns configurations for Vulkan graphics pipelines, tailored for different rendering modes such as standard 3D, nD tensor visualization, and wave function visualization.