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
  const VK = nvk.VK_STRUCTURE_TYPE;

  const configs = {
    standard: {
      vertexShader: 'standard.vert',
      fragmentShader: 'standard.frag',
      vertexInputState: {
        vertexBindingDescriptions: [{
          binding: 0,
          stride: 56, // 3 * float32 (pos) + 3 * float32 (normal) + 2 * float32 (uv) + 4 * float32 (color)
          inputRate: nvk.VK_VERTEX_INPUT_RATE_VERTEX
        }],
        vertexAttributeDescriptions: [
          {
            location: 0,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32_SFLOAT,
            offset: 0 // position
          },
          {
            location: 1,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32_SFLOAT,
            offset: 12 // normal
          },
          {
            location: 2,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32_SFLOAT,
            offset: 24 // uv
          },
          {
            location: 3,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32A32_SFLOAT,
            offset: 32 // color
          }
        ]
      }
    },
    
    tensor: {
      vertexShader: 'tensor.vert',
      fragmentShader: 'tensor.frag',
      vertexInputState: {
        vertexBindingDescriptions: [{
          binding: 0,
          stride: 128, // Variable size based on tensor rank
          inputRate: nvk.VK_VERTEX_INPUT_RATE_VERTEX
        }],
        vertexAttributeDescriptions: [
          {
            location: 0,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32_SFLOAT,
            offset: 0 // 3D projection position
          },
          {
            location: 1,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32A32_SFLOAT,
            offset: 12 // First 4 tensor components
          },
          {
            location: 2,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32A32_SFLOAT,
            offset: 28 // Next 4 tensor components
          },
          {
            location: 3,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32A32_SFLOAT,
            offset: 44 // Tensor metadata
          }
        ]
      }
    },
    
    wave: {
      vertexShader: 'wave.vert',
      fragmentShader: 'wave.frag',
      vertexInputState: {
        vertexBindingDescriptions: [{
          binding: 0,
          stride: 64, // 3 * float32 (pos) + 2 * float32 (complex) + 4 * float32 (quantum) + 4 * float32 (metadata)
          inputRate: nvk.VK_VERTEX_INPUT_RATE_VERTEX
        }],
        vertexAttributeDescriptions: [
          {
            location: 0,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32_SFLOAT,
            offset: 0 // position
          },
          {
            location: 1,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32_SFLOAT,
            offset: 12 // complex amplitude
          },
          {
            location: 2,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32A32_SFLOAT,
            offset: 20 // quantum numbers
          },
          {
            location: 3,
            binding: 0,
            format: nvk.VK_FORMAT_R32G32B32A32_SFLOAT,
            offset: 36 // metadata
          }
        ]
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
