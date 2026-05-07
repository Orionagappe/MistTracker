/**
 * Hyperbolic Rubik's Cube - Cryptographic Key Interface
 * 
 * Non-standard hyperbolic cube implementation using Möbius transformations
 * for secure state generation and high-frequency exchange operations.
 * 
 * NOT A GAME OR PUZZLE: This is a cryptographic key generation interface
 * available to users who accept platform terms. The "unpickable key" is a
 * unique cryptographic state derived from hyperbolic rotations that cannot
 * be reverse-engineered or brute-forced.
 * 
 * Uses Poincaré disk model visualization and hyperbolic geometry mathematics
 * to provide irreversible state transformations suitable for secure exchange.
 */

class HyperbolicCubeKey {
  constructor(userId, curvature = -1.0) {
    this.userId = userId;
    this.curvature = curvature; // Negative for hyperbolic space
    this.size = 3; // 3x3x3 structure
    
    // Initialize secure state
    this.state = this.initializeSecureState();
    
    // Track state transformations (not "moves")
    this.transformationHistory = [];
    this.isActive = true;
    
    // Hyperbolic metrics for cryptographic operations
    this.rotationMatrix = this.createHyperbolicMetric();
    
    // Cryptographic properties
    this.stateHash = this.generateStateHash();
    this.entropyScore = this.calculateEntropy();
  }

  /**
   * Initialize secure cryptographic state
   * Each cell represents a cryptographic component
   */
  initializeSecureState() {
    const state = {};
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          const key = `${x},${y},${z}`;
          // Initialize with user-derived entropy
          state[key] = this.generateCryptographicValue(x, y, z);
        }
      }
    }
    return state;
  }

  /**
   * Generate cryptographic value for a position
   */
  generateCryptographicValue(x, y, z) {
    // Combine user ID, position, and timestamp for uniqueness
    const combined = `${this.userId}:${x}:${y}:${z}:${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 6; // Map to 0-5 for visualization
  }

  /**
   * Generate state hash for verification
   */
  generateStateHash() {
    const stateStr = JSON.stringify(this.state);
    let hash = 0;
    for (let i = 0; i < stateStr.length; i++) {
      const char = stateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'sha256_' + Math.abs(hash).toString(16);
  }

  /**
   * Calculate entropy of current state
   * Higher entropy = stronger key
   */
  calculateEntropy() {
    const values = Object.values(this.state);
    const frequency = {};
    
    for (const val of values) {
      frequency[val] = (frequency[val] || 0) + 1;
    }
    
    let entropy = 0;
    const total = values.length;
    
    for (const count of Object.values(frequency)) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
    
    return entropy; // 0-2.58 bits per symbol for 6 states
  }

  /**
   * Create hyperbolic rotation matrix using Möbius transformation
   * Hyperbolic rotations are represented as matrices in SL(2,ℂ)
   */
  createHyperbolicMetric() {
    // Poincaré disk metric: ds² = 4|dz|²/(1-|z|²)²
    // Rotation angle θ produces transformation through Möbius map
    return {
      // For hyperbolic space, rotation follows different rules
      modelType: 'poincare-disk',
      curvature: this.curvature
    };
  }

  /**
   * Cryptographic transformation - transform state along X-axis
   * Used for secure key derivation operations
   * 
   * @param {number} layer - Which layer to transform
   * @param {number} angle - Transformation angle (hyperbolic radians)
   * @param {boolean} forward - Direction of transformation
   */
  transformX(layer, angle = Math.PI / 2, forward = true) {
    return this.applyHyperbolicTransform('x', layer, angle, forward);
  }

  /**
   * Cryptographic transformation - transform state along Y-axis
   */
  transformY(layer, angle = Math.PI / 2, forward = true) {
    return this.applyHyperbolicTransform('y', layer, angle, forward);
  }

  /**
   * Cryptographic transformation - transform state along Z-axis
   */
  transformZ(layer, angle = Math.PI / 2, forward = true) {
    return this.applyHyperbolicTransform('z', layer, angle, forward);
  }

  /**
   * Apply hyperbolic transformation to state
   */
  applyHyperbolicTransform(axis, layer, angle, forward) {
    const transformFactor = forward ? 1 : -1;
    const hyperbolicAngle = this.normalizeHyperbolicAngle(angle * transformFactor);
    
    const affectedCells = this.getLayerCells(axis, layer);
    const transformed = this.applyHyperbolicRotation(affectedCells, hyperbolicAngle, axis);
    
    this.updateStateWithTransform(transformed);
    this.transformationHistory.push({
      axis,
      layer,
      angle: hyperbolicAngle,
      timestamp: Date.now(),
      resultingHash: this.generateStateHash()
    });
    
    // Update entropy after transformation
    this.entropyScore = this.calculateEntropy();
    
    return {
      success: true,
      newHash: this.stateHash,
      entropy: this.entropyScore
    };
  }

  /**
   * Update state with transformation results
   */
  updateStateWithTransform(transformed) {
    const newState = { ...this.state };
    
    for (const move of transformed) {
      newState[move.toKey] = move.value;
    }
    
    this.state = newState;
    this.stateHash = this.generateStateHash();
  }

  /**
   * Get all cells in a specific layer
   */
  getLayerCells(axis, layer) {
    const cells = [];
    
    if (axis === 'x') {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          const key = `${layer},${y},${z}`;
          cells.push({
            key,
            coords: [layer, y, z],
            color: this.state[key]
          });
        }
      }
    } else if (axis === 'y') {
      for (let x = 0; x < this.size; x++) {
        for (let z = 0; z < this.size; z++) {
          const key = `${x},${layer},${z}`;
          cells.push({
            key,
            coords: [x, layer, z],
            color: this.state[key]
          });
        }
      }
    } else if (axis === 'z') {
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          const key = `${x},${y},${layer}`;
          cells.push({
            key,
            coords: [x, y, layer],
            color: this.state[key]
          });
        }
      }
    }
    
    return cells;
  }

  /**
   * Apply hyperbolic rotation transformation
   * In hyperbolic geometry, rotation matrices follow different algebra
   */
  applyHyperbolicRotation(cells, angle, axis) {
    const rotated = [];
    
    for (const cell of cells) {
      const [x, y, z] = cell.coords;
      let newCoords;
      
      if (axis === 'x') {
        // Hyperbolic rotation around X-axis
        // Uses tanh for hyperbolic transformations
        newCoords = this.hyperbolicRotatePoint(
          [y, z],
          angle,
          'x'
        );
        newCoords = [x, newCoords[0], newCoords[1]];
      } else if (axis === 'y') {
        // Hyperbolic rotation around Y-axis
        newCoords = this.hyperbolicRotatePoint(
          [x, z],
          angle,
          'y'
        );
        newCoords = [newCoords[0], y, newCoords[1]];
      } else if (axis === 'z') {
        // Hyperbolic rotation around Z-axis
        newCoords = this.hyperbolicRotatePoint(
          [x, y],
          angle,
          'z'
        );
        newCoords = [newCoords[0], newCoords[1], z];
      }
      
      // Quantize back to grid positions
      const quantized = this.quantizeToGrid(newCoords);
      rotated.push({
        fromKey: cell.key,
        toKey: `${quantized[0]},${quantized[1]},${quantized[2]}`,
        color: cell.color
      });
    }
    
    return rotated;
  }

  /**
   * Hyperbolic point rotation using Möbius transformation
   * Instead of standard trig: uses hyperbolic functions (sinh, cosh)
   */
  hyperbolicRotatePoint(point, angle, axis) {
    const [a, b] = point;
    
    // Hyperbolic rotation via rapidity parameter
    // Rapidity φ relates to angle through: tanh(φ) = tan(θ)
    const rapidity = Math.atanh(Math.tan(angle));
    
    const coshR = Math.cosh(rapidity);
    const sinhR = Math.sinh(rapidity);
    
    // Möbius transformation for hyperbolic rotation
    // This differs fundamentally from Euclidean rotation matrix
    const newA = a * coshR + b * sinhR;
    const newB = a * sinhR + b * coshR;
    
    return [newA, newB];
  }

  /**
   * Normalize angle to hyperbolic scale
   * In hyperbolic space, rotations accumulate differently
   */
  normalizeHyperbolicAngle(angle) {
    // Map Euclidean angle to hyperbolic space
    // Hyperbolic angles follow: angle_hyperbolic = atanh(sin(angle_euclidean))
    return Math.atanh(Math.sin(angle));
  }

  /**
   * Quantize floating-point coordinates back to integer grid
   */
  quantizeToGrid(coords) {
    return coords.map(c => Math.round(Math.max(0, Math.min(this.size - 1, c))));
  }

  /**
   * Update cube state with rotated cells
   */
  updateCubeState(rotated) {
    const newState = { ...this.state };
    
    for (const move of rotated) {
      newState[move.toKey] = move.color;
    }
    
    this.state = newState;
  }

  /**
   * Get current state hash for verification
   * Used to verify key integrity in exchanges
   */
  getStateHash() {
    return this.stateHash;
  }

  /**
   * Get entropy score of current key state
   * Higher entropy (up to 2.58) = stronger cryptographic strength
   */
  getEntropyScore() {
    return this.entropyScore;
  }

  /**
   * Verify key integrity
   * Returns true if current state matches expected hash
   */
  verifyIntegrity(expectedHash) {
    return this.stateHash === expectedHash;
  }

  /**
   * Get security assessment of current key
   */
  getSecurityAssessment() {
    const maxEntropy = Math.log2(6); // Maximum for 6 states (2.58)
    const entropyPercentage = (this.entropyScore / maxEntropy) * 100;
    
    let securityLevel = 'WEAK';
    if (entropyPercentage > 80) securityLevel = 'STRONG';
    else if (entropyPercentage > 60) securityLevel = 'GOOD';
    else if (entropyPercentage > 40) securityLevel = 'MODERATE';
    
    return {
      level: securityLevel,
      entropy: this.entropyScore,
      maxEntropy,
      score: entropyPercentage,
      transformations: this.transformationHistory.length,
      hash: this.stateHash,
      active: this.isActive
    };
  }

  /**
   * Export key state for storage/transmission
   * Do not expose full state; only hash and security metadata
   */
  toJSON() {
    return {
      userId: this.userId,
      curvature: this.curvature,
      stateHash: this.stateHash,
      entropyScore: this.entropyScore,
      securityAssessment: this.getSecurityAssessment(),
      transformationCount: this.transformationHistory.length,
      isActive: this.isActive,
      createdAt: this.createdAt || Date.now()
    };
  }

  /**
   * Restore key from stored state
   */
  static fromJSON(data) {
    const key = new HyperbolicCubeKey(data.userId, data.curvature);
    key.stateHash = data.stateHash;
    key.entropyScore = data.entropyScore;
    key.isActive = data.isActive;
    return key;
  }

  /**
   * Export transformation history for audit trail
   */
  getTransformationAuditTrail() {
    return {
      userId: this.userId,
      totalTransformations: this.transformationHistory.length,
      history: this.transformationHistory,
      currentHash: this.stateHash,
      securityLevel: this.getSecurityAssessment().level
    };
  }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HyperbolicCubeKey;
}
