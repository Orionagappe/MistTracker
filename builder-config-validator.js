/**
 * Builder Config Validator
 * Validates builder configuration against required schema
 * Prevents physics engine crashes from malformed data
 */

const BUILDER_CONFIG_SCHEMA = {
  atoms: {
    type: 'array',
    items: {
      type: 'object',
      required: ['id', 'position'],
      properties: {
        id: { type: 'string' },
        position: {
          type: 'array',
          length: 3,
          items: { type: 'number' }
        },
        // orbital can be a string ('1s', '2s', ...) or quantum number object {n, l, m}
        // orbital_name is the string form when orbital is an object
        mass: { type: 'number', min: 0, nullable: true },
        charge: { type: 'number', nullable: true },
        spin: { type: 'string', enum: ['up', 'down'], nullable: true }
      }
    },
    nullable: true
  },
  emitters: {
    type: 'array',
    items: {
      type: 'object',
      required: ['id', 'position', 'frequency', 'amplitude'],
      properties: {
        id: { type: 'string' },
        position: {
          type: 'array',
          length: 3,
          items: { type: 'number' }
        },
        frequency: { type: 'number', min: 0 },
        amplitude: { type: 'number', min: 0 },
        wavelength: { type: 'number', min: 0, nullable: true },
        phase: { type: 'number', nullable: true }
      }
    },
    nullable: true
  },
  metadata: {
    type: 'object',
    properties: {
      name: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
      dimension: { type: 'string', enum: ['3D', '4D'], nullable: true }
    },
    nullable: true
  },
  simulationParams: {
    type: 'object',
    properties: {},
    nullable: true
  }
};

/**
 * Validates a value against a schema
 * @param {*} value - The value to validate
 * @param {object} schema - The schema to validate against
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateValue(value, schema) {
  const errors = [];

  if (schema.nullable && value === null) {
    return { valid: true, errors: [] };
  }

  // Type validation
  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`Expected array, got ${typeof value}`);
      return { valid: false, errors };
    }

    if (schema.items) {
      value.forEach((item, index) => {
        const itemValidation = validateValue(item, schema.items);
        if (!itemValidation.valid) {
          itemValidation.errors.forEach(err => {
            errors.push(`[${index}] ${err}`);
          });
        }
      });
    }
  } else if (schema.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`Expected object, got ${typeof value}`);
      return { valid: false, errors };
    }

    if (schema.required) {
      schema.required.forEach(field => {
        if (!(field in value)) {
          errors.push(`Missing required field: ${field}`);
        }
      });
    }

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([field, fieldSchema]) => {
        if (field in value) {
          const fieldValidation = validateValue(value[field], fieldSchema);
          if (!fieldValidation.valid) {
            fieldValidation.errors.forEach(err => {
              errors.push(`${field}: ${err}`);
            });
          }
        }
      });
    }
  } else if (schema.type === 'number') {
    if (typeof value !== 'number') {
      errors.push(`Expected number, got ${typeof value}`);
    }
    if (schema.min !== undefined && value < schema.min) {
      errors.push(`Must be >= ${schema.min}, got ${value}`);
    }
    if (schema.max !== undefined && value > schema.max) {
      errors.push(`Must be <= ${schema.max}, got ${value}`);
    }
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`Expected string, got ${typeof value}`);
    }
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`Must be one of: ${schema.enum.join(', ')}, got "${value}"`);
    }
  } else if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') {
      errors.push(`Expected boolean, got ${typeof value}`);
    }
  }

  // Array-specific validations
  if (schema.type === 'array' && schema.length !== undefined) {
    if (value.length !== schema.length) {
      errors.push(`Expected array length ${schema.length}, got ${value.length}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a builder configuration
 * @param {object} config - The builder configuration to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateBuilderConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {
      valid: false,
      errors: ['Config must be an object']
    };
  }

  // Validate each schema property
  Object.entries(BUILDER_CONFIG_SCHEMA).forEach(([field, fieldSchema]) => {
    if (field in config) {
      const validation = validateValue(config[field], fieldSchema);
      if (!validation.valid) {
        validation.errors.forEach(err => {
          errors.push(`${field}: ${err}`);
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

export { validateBuilderConfig, BUILDER_CONFIG_SCHEMA };
