const fs = require('fs').promises;
const path = require('path');
const { compileShader, storeCompiledShader } = require('./MistImport');

const SHADER_DIR = './shaders';
const DEFAULT_SHADERS = {
  // Standard rendering shaders
  'standard.vert': {
    type: 'vertex',
    options: { optimizationLevel: 3 }
  },
  'standard.frag': {
    type: 'fragment',
    options: { optimizationLevel: 3 }
  },
  
  // nD tensor visualization shaders
  'tensor.vert': {
    type: 'vertex',
    options: { optimizationLevel: 3 }
  },
  'tensor.frag': {
    type: 'fragment',
    options: { optimizationLevel: 3 }
  },
  
  // Wave function visualization shaders
  'wave.vert': {
    type: 'vertex',
    options: { optimizationLevel: 3 }
  },
  'wave.frag': {
    type: 'fragment',
    options: { optimizationLevel: 3 }
  },
  
  // Physics computation shaders
  'physics.comp': {
    type: 'compute',
    options: { optimizationLevel: 3 }
  }
};

/**
 * Compile all shaders in the shaders directory
 * @param {Object} db - Database connection
 */
async function precompileShaders(db) {
  // Ensure shader directory exists
  try {
    await fs.mkdir(SHADER_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  // Process each shader
  for (const [filename, config] of Object.entries(DEFAULT_SHADERS)) {
    const shaderPath = path.join(SHADER_DIR, filename);
    
    try {
      // Read shader source
      const source = await fs.readFile(shaderPath, 'utf8');
      
      // Compile to SPIR-V
      const spirv = await compileShader(source, config.type, config.options);
      
      // Store in database and Waterfall directory
      await storeCompiledShader(spirv, filename, db);
      
      console.log(`Successfully compiled ${filename}`);
    } catch (err) {
      console.error(`Failed to compile ${filename}:`, err);
    }
  }
}

/**
 * Create all necessary Vulkan pipeline configurations
 * @param {Object} device - Vulkan device
 * @param {Object} db - Database connection
 */
async function createPipelineConfigs(device, db) {
  const configs = {
    standard: {
      vertexShader: 'standard.vert',
      fragmentShader: 'standard.frag',
      vertexInputState: {
        // Standard 3D mesh vertex format
        vertexBindingDescriptions: [...],
        vertexAttributeDescriptions: [...]
      }
    },
    
    tensor: {
      vertexShader: 'tensor.vert',
      fragmentShader: 'tensor.frag',
      vertexInputState: {
        // nD tensor data format
        vertexBindingDescriptions: [...],
        vertexAttributeDescriptions: [...]
      }
    },
    
    wave: {
      vertexShader: 'wave.vert',
      fragmentShader: 'wave.frag',
      vertexInputState: {
        // Wave function visualization format
        vertexBindingDescriptions: [...],
        vertexAttributeDescriptions: [...]
      }
    }
  };

  return configs;
}

module.exports = {
  precompileShaders,
  createPipelineConfigs,
  SHADER_DIR,
  DEFAULT_SHADERS
};
