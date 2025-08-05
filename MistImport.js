const nvk = require('nvk');
const fs = require('fs');
const path = require('path');
const { ensureMistDatabase, TABLES } = require('./MistTrackerVulkan');

/**
 * Asset metadata stored in MySQL
 * - Table: MistAssets
 * - Fields:
 *   - id: UUID
 *   - name: Original filename
 *   - type: '2d' | '3d' | 'shader'
 *   - format: 'gltf' | 'obj' | 'fbx' | 'png' | 'jpg' | 'spv'
 *   - path: Path in Waterfall directory
 *   - created: Timestamp
 *   - modified: Timestamp
 *   - metadata: JSON string with additional info
 */

// --- Asset Import Functions ---

/**
 * Import a 3D model into the Mist platform
 * @param {string} filePath - Path to the model file
 * @param {Object} options - Import options
 * @param {Object} db - Database connection
 * @returns {Promise<string>} - Asset ID
 */
async function import3DModel(filePath, options = {}, db) {
  const supportedFormats = ['gltf', 'glb', 'obj', 'fbx', 'dae'];
  const ext = path.extname(filePath).toLowerCase().slice(1);
  
  if (!supportedFormats.includes(ext)) {
    throw new Error(`Unsupported format: ${ext}`);
  }

  // Generate unique filename
  const assetId = generateAssetId();
  const destPath = path.join('Waterfall', `${assetId}.${ext}`);
  
  // Copy file to Waterfall directory
  await fs.promises.copyFile(filePath, destPath);

  // Store metadata in database
  await db.query(`INSERT INTO ${TABLES.assets} SET ?`, {
    id: assetId,
    name: path.basename(filePath),
    type: '3d',
    format: ext,
    path: destPath,
    created: new Date(),
    modified: new Date(),
    metadata: JSON.stringify({
      originalPath: filePath,
      importOptions: options
    })
  });

  return assetId;
}

/**
 * Import a 2D texture or image
 * @param {string} filePath - Path to the image file
 * @param {Object} options - Import options
 * @param {Object} db - Database connection
 * @returns {Promise<string>} - Asset ID
 */
async function import2DTexture(filePath, options = {}, db) {
  const supportedFormats = ['png', 'jpg', 'jpeg', 'tga', 'bmp'];
  const ext = path.extname(filePath).toLowerCase().slice(1);
  
  if (!supportedFormats.includes(ext)) {
    throw new Error(`Unsupported format: ${ext}`);
  }

  const assetId = generateAssetId();
  const destPath = path.join('Waterfall', `${assetId}.${ext}`);
  
  await fs.promises.copyFile(filePath, destPath);

  await db.query(`INSERT INTO ${TABLES.assets} SET ?`, {
    id: assetId,
    name: path.basename(filePath),
    type: '2d',
    format: ext,
    path: destPath,
    created: new Date(),
    modified: new Date(),
    metadata: JSON.stringify({
      originalPath: filePath,
      importOptions: options
    })
  });

  return assetId;
}

// --- Shader Compilation ---

/**
 * Compile GLSL shader to SPIR-V for Vulkan
 * @param {string} shaderSource - GLSL source code
 * @param {'vertex' | 'fragment' | 'compute'} type - Shader type
 * @param {Object} options - Compilation options
 * @returns {Promise<Buffer>} - Compiled SPIR-V binary
 */
async function compileShader(shaderSource, type, options = {}) {
  // Initialize glslang compiler
  const glslang = await nvk.glslang.init();
  
  const stage = {
    vertex: nvk.VK_SHADER_STAGE_VERTEX_BIT,
    fragment: nvk.VK_SHADER_STAGE_FRAGMENT_BIT,
    compute: nvk.VK_SHADER_STAGE_COMPUTE_BIT
  }[type];

  // Compile to SPIR-V
  const spirv = await glslang.compileGLSL(shaderSource, stage, options);
  
  return spirv;
}

/**
 * Store compiled shader in database and filesystem
 * @param {Buffer} spirv - Compiled SPIR-V binary
 * @param {string} name - Shader name
 * @param {Object} db - Database connection
 * @returns {Promise<string>} - Asset ID
 */
async function storeCompiledShader(spirv, name, db) {
  const assetId = generateAssetId();
  const destPath = path.join('Waterfall', `${assetId}.spv`);
  
  // Save SPIR-V binary
  await fs.promises.writeFile(destPath, spirv);

  // Store metadata
  await db.query(`INSERT INTO ${TABLES.assets} SET ?`, {
    id: assetId,
    name,
    type: 'shader',
    format: 'spv',
    path: destPath,
    created: new Date(),
    modified: new Date(),
    metadata: JSON.stringify({
      shaderName: name
    })
  });

  return assetId;
}

/**
 * Create a shader module for use in Vulkan pipeline
 * @param {Object} device - Vulkan device
 * @param {string} assetId - Shader asset ID
 * @param {Object} db - Database connection
 * @returns {Promise<VkShaderModule>}
 */
async function createShaderModule(device, assetId, db) {
  // Get shader path from database
  const [shader] = await db.query(
    `SELECT * FROM ${TABLES.assets} WHERE id = ? AND type = 'shader'`,
    [assetId]
  );

  if (!shader) {
    throw new Error(`Shader not found: ${assetId}`);
  }

  // Read SPIR-V binary
  const code = await fs.promises.readFile(shader.path);

  // Create shader module
  const shaderModule = device.createShaderModule({
    codeSize: code.length,
    pCode: code
  });

  return shaderModule;
}

/**
 * Load asset from database
 * @param {string} assetId - Asset ID
 * @param {Object} db - Database connection
 * @returns {Promise<Object>} - Asset metadata
 */
async function loadAsset(assetId, db) {
  const [asset] = await db.query(
    `SELECT * FROM ${TABLES.assets} WHERE id = ?`,
    [assetId]
  );

  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  return {
    ...asset,
    metadata: JSON.parse(asset.metadata)
  };
}

// --- Utility Functions ---

/**
 * Generate unique asset ID
 * @returns {string} - UUID v4
 */
function generateAssetId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Ensure assets table exists in database
 * @param {Object} db - Database connection
 */
async function ensureAssetsTables(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLES.assets} (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type ENUM('2d', '3d', 'shader') NOT NULL,
      format VARCHAR(10) NOT NULL,
      path VARCHAR(255) NOT NULL,
      created DATETIME NOT NULL,
      modified DATETIME NOT NULL,
      metadata JSON
    )
  `);
}

// --- Vertex Format Configurations ---

const VERTEX_FORMATS = {
  // Standard 3D mesh format (position, normal, uv, color)
  standard3D: {
    bindings: [
      {
        binding: 0,
        stride: 56, // 3 * float32 (pos) + 3 * float32 (normal) + 2 * float32 (uv) + 4 * float32 (color)
        inputRate: nvk.VK_VERTEX_INPUT_RATE_VERTEX
      }
    ],
    attributes: [
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
  },

  // nD Tensor visualization format (position, tensor components, metadata)
  tensorND: {
    bindings: [
      {
        binding: 0,
        stride: 128, // Variable size based on tensor rank
        inputRate: nvk.VK_VERTEX_INPUT_RATE_VERTEX
      }
    ],
    attributes: [
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
        offset: 44 // Tensor metadata (rank, dimensions, etc.)
      }
    ]
  },

  // Wave function visualization format (position, complex amplitude, quantum numbers)
  waveFunction: {
    bindings: [
      {
        binding: 0,
        stride: 64, // 3 * float32 (pos) + 2 * float32 (complex) + 4 * float32 (quantum) + 4 * float32 (metadata)
        inputRate: nvk.VK_VERTEX_INPUT_RATE_VERTEX
      }
    ],
    attributes: [
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
        offset: 12 // complex amplitude (real, imag)
      },
      {
        location: 2,
        binding: 0,
        format: nvk.VK_FORMAT_R32G32B32A32_SFLOAT,
        offset: 20 // quantum numbers (n, l, m, s)
      },
      {
        location: 3,
        binding: 0,
        format: nvk.VK_FORMAT_R32G32B32A32_SFLOAT,
        offset: 36 // metadata (energy, probability, etc.)
      }
    ]
  }
};

// --- Pipeline Creation Helpers ---

/**
 * Create a graphics pipeline configuration
 * @param {Object} device - Vulkan device
 * @param {Object} config - Pipeline configuration
 * @param {Object} db - Database connection
 * @returns {Promise<VkPipeline>}
 */
async function createGraphicsPipeline(device, config, db) {
  const {
    vertexShader,
    fragmentShader,
    pipelineType = 'standard3D',
    rasterizationState,
    colorBlendState,
    depthStencilState,
    renderPass,
    layout
  } = config;

  // Create shader modules
  const vertModule = await createShaderModule(device, vertexShader, db);
  const fragModule = await createShaderModule(device, fragmentShader, db);

  // Get vertex format configuration
  const vertexFormat = VERTEX_FORMATS[pipelineType];
  if (!vertexFormat) {
    throw new Error(`Unknown pipeline type: ${pipelineType}`);
  }

  // Configure pipeline
  const pipelineInfo = new nvk.VkGraphicsPipelineCreateInfo({
    // Shader stages
    stages: [
      {
        stage: nvk.VK_SHADER_STAGE_VERTEX_BIT,
        module: vertModule,
        pName: 'main'
      },
      {
        stage: nvk.VK_SHADER_STAGE_FRAGMENT_BIT,
        module: fragModule,
        pName: 'main'
      }
    ],
    
    // Vertex input state
    vertexInputState: {
      vertexBindingDescriptions: vertexFormat.bindings,
      vertexAttributeDescriptions: vertexFormat.attributes
    },

    // Input assembly
    inputAssemblyState: {
      topology: nvk.VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST
    },

    // Rasterization
    rasterizationState: rasterizationState || {
      polygonMode: nvk.VK_POLYGON_MODE_FILL,
      cullMode: nvk.VK_CULL_MODE_BACK_BIT,
      frontFace: nvk.VK_FRONT_FACE_COUNTER_CLOCKWISE,
      lineWidth: 1.0
    },

    // Color blend
    colorBlendState: colorBlendState || {
      attachments: [
        {
          blendEnable: true,
          srcColorBlendFactor: nvk.VK_BLEND_FACTOR_SRC_ALPHA,
          dstColorBlendFactor: nvk.VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA,
          colorBlendOp: nvk.VK_BLEND_OP_ADD,
          srcAlphaBlendFactor: nvk.VK_BLEND_FACTOR_ONE,
          dstAlphaBlendFactor: nvk.VK_BLEND_FACTOR_ZERO,
          alphaBlendOp: nvk.VK_BLEND_OP_ADD
        }
      ]
    },

    // Depth and stencil
    depthStencilState: depthStencilState || {
      depthTestEnable: true,
      depthWriteEnable: true,
      depthCompareOp: nvk.VK_COMPARE_OP_LESS_OR_EQUAL
    },

    layout,
    renderPass
  });

  // Create pipeline
  const pipeline = device.createGraphicsPipelines(
    null,
    [pipelineInfo],
    null
  )[0];

  // Cleanup shader modules
  vertModule.destroy();
  fragModule.destroy();

  return pipeline;
}

module.exports = {
  import3DModel,
  import2DTexture,
  compileShader,
  storeCompiledShader,
  createShaderModule,
  loadAsset,
  ensureAssetsTables,
  createGraphicsPipeline
};
