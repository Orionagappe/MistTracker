# MistImport API Documentation

## Overview

This document details the API for `MistImport.js`, which manages the importing of assets such as 3D models and textures, as well as the compilation and storage of shaders for the Mist application.

### Asset Import Functions

- **`import3DModel(filePath, options, db)`**: Imports a 3D model from the specified file path into the Mist platform, supporting formats like GLTF, OBJ, and FBX.
- **`import2DTexture(filePath, options, db)`**: Imports a 2D texture or image, supporting formats such as PNG, JPG, and TGA.

### Shader Compilation and Storage

- **`compileShader(shaderSource, type, options)`**: Compiles GLSL shader source code into SPIR-V binary for use with Vulkan.
- **`storeCompiledShader(spirv, name, db)`**: Stores the compiled SPIR-V shader in the database and filesystem for later use.

### Vulkan Integration

- **`createShaderModule(device, assetId, db)`**: Creates a Vulkan shader module from a stored shader asset.
- **`createGraphicsPipeline(device, config, db)`**: Configures and creates a Vulkan graphics pipeline using the provided configuration and shader assets.

### Utility Functions

- **`loadAsset(assetId, db)`**: Retrieves asset metadata from the database using the asset ID.
- **`ensureAssetsTables(db)`**: Ensures that the necessary database tables for asset management exist.
- **`generateAssetId()`**: Generates a unique identifier for new assets.