/**
 * MeasurementEngine.js
 * Phase 9.4: Core measurement calculation engine
 * 
 * Implements:
 * - 3D distance calculations
 * - Angle measurements between three points
 * - Surface area and volume estimates
 * - Measurement history and undo/redo
 * - Unit conversions
 */

export class MeasurementEngine {
  constructor(options = {}) {
    this.points = [];
    this.measurements = [];
    this.units = options.units || 'meters';
    this.precision = options.precision || 2;
    this.history = [];
    this.historyIndex = -1;
    this.conversionFactors = {
      millimeters: 0.001,
      centimeters: 0.01,
      meters: 1,
      kilometers: 1000,
      inches: 0.0254,
      feet: 0.3048,
      yards: 0.9144,
      miles: 1609.34
    };
  }

  /**
   * Add a measurement point in 3D space
   */
  addPoint(point) {
    if (!this._validatePoint(point)) {
      throw new Error('Invalid point: must have x, y, z coordinates');
    }

    this.points.push({
      ...point,
      id: this._generateId(),
      timestamp: Date.now()
    });

    this._saveToHistory();
    return this.points[this.points.length - 1];
  }

  /**
   * Remove a point by index
   */
  removePoint(index) {
    if (index < 0 || index >= this.points.length) {
      throw new Error('Invalid point index');
    }

    this.points.splice(index, 1);
    this._saveToHistory();

    // Remove measurements that reference this point
    this.measurements = this.measurements.filter(m => 
      !m.points.includes(index)
    );
  }

  /**
   * Calculate 3D Euclidean distance between two points
   */
  calculateDistance(p1, p2) {
    if (!p1 || !p2) return null;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Add a distance measurement between two points
   */
  addDistanceMeasurement(idx1, idx2, label = null) {
    if (idx1 === idx2) {
      throw new Error('Cannot measure distance between the same point');
    }

    const p1 = this.points[idx1];
    const p2 = this.points[idx2];

    if (!p1 || !p2) {
      throw new Error('Invalid point indices');
    }

    const distance = this.calculateDistance(p1, p2);
    const convertedDistance = this._convertUnits(distance);

    const measurement = {
      id: this._generateId(),
      type: 'distance',
      points: [idx1, idx2],
      value: convertedDistance,
      label: label || `Distance P${idx1 + 1}-P${idx2 + 1}`,
      timestamp: Date.now()
    };

    this.measurements.push(measurement);
    this._saveToHistory();
    return measurement;
  }

  /**
   * Calculate angle between three points (in degrees)
   * p1 - start point
   * p2 - vertex (angle center)
   * p3 - end point
   */
  calculateAngle(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return null;

    // Vectors from vertex to other points
    const v1 = {
      x: p1.x - p2.x,
      y: p1.y - p2.y,
      z: p1.z - p2.z
    };

    const v2 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y,
      z: p3.z - p2.z
    };

    // Dot product
    const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;

    // Magnitudes
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

    if (mag1 === 0 || mag2 === 0) return 0;

    // Angle in radians, then convert to degrees
    const cosAngle = dotProduct / (mag1 * mag2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    return (angleRad * 180) / Math.PI;
  }

  /**
   * Add an angle measurement between three points
   */
  addAngleMeasurement(idx1, idx2, idx3, label = null) {
    if (idx1 === idx2 || idx2 === idx3 || idx1 === idx3) {
      throw new Error('Angle requires three different points');
    }

    const p1 = this.points[idx1];
    const p2 = this.points[idx2];
    const p3 = this.points[idx3];

    if (!p1 || !p2 || !p3) {
      throw new Error('Invalid point indices');
    }

    const angle = this.calculateAngle(p1, p2, p3);

    const measurement = {
      id: this._generateId(),
      type: 'angle',
      points: [idx1, idx2, idx3],
      value: angle,
      label: label || `Angle P${idx1 + 1}-P${idx2 + 1}-P${idx3 + 1}`,
      timestamp: Date.now()
    };

    this.measurements.push(measurement);
    this._saveToHistory();
    return measurement;
  }

  /**
   * Calculate surface area of a polygon defined by points
   * Assumes points form a convex polygon
   */
  calculateSurfaceArea(pointIndices) {
    if (pointIndices.length < 3) {
      throw new Error('Surface area requires at least 3 points');
    }

    const points = pointIndices.map(idx => this.points[idx]);
    if (points.some(p => !p)) {
      throw new Error('Invalid point indices');
    }

    // Use Shoelace formula in 3D (simplified for planar surfaces)
    let area = 0;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      // Cross product components
      const cx = (p1.y * p2.z) - (p1.z * p2.y);
      const cy = (p1.z * p2.x) - (p1.x * p2.z);
      const cz = (p1.x * p2.y) - (p1.y * p2.x);

      area += Math.sqrt(cx * cx + cy * cy + cz * cz);
    }

    return (area / 2) * this.conversionFactors[this.units];
  }

  /**
   * Estimate volume using convex hull (simplified)
   * Works best with boundary points
   */
  calculateVolume(pointIndices) {
    if (pointIndices.length < 4) {
      throw new Error('Volume calculation requires at least 4 points');
    }

    const points = pointIndices.map(idx => this.points[idx]);
    if (points.some(p => !p)) {
      throw new Error('Invalid point indices');
    }

    // Simplified: Use average center and tetrahedron decomposition
    const center = this._calculateCenter(points);
    let volume = 0;

    for (let i = 0; i < points.length - 2; i++) {
      volume += this._tetrahedronVolume(
        center,
        points[0],
        points[i + 1],
        points[i + 2]
      );
    }

    return Math.abs(volume) * Math.pow(this.conversionFactors[this.units], 3);
  }

  /**
   * Calculate distance from a point to a line defined by two points
   */
  calculatePointToLineDistance(point, lineP1, lineP2) {
    if (!point || !lineP1 || !lineP2) return null;

    const v = {
      x: lineP2.x - lineP1.x,
      y: lineP2.y - lineP1.y,
      z: lineP2.z - lineP1.z
    };

    const w = {
      x: point.x - lineP1.x,
      y: point.y - lineP1.y,
      z: point.z - lineP1.z
    };

    const vDotV = v.x * v.x + v.y * v.y + v.z * v.z;
    if (vDotV === 0) return this.calculateDistance(point, lineP1);

    const vDotW = v.x * w.x + v.y * w.y + v.z * w.z;
    const t = Math.max(0, Math.min(1, vDotW / vDotV));

    const closest = {
      x: lineP1.x + t * v.x,
      y: lineP1.y + t * v.y,
      z: lineP1.z + t * v.z
    };

    return this.calculateDistance(point, closest);
  }

  /**
   * Get all measurements as a formatted report
   */
  getMeasurementReport() {
    const report = {
      timestamp: new Date().toISOString(),
      units: this.units,
      points: this.points.length,
      measurements: this.measurements.length,
      breakdown: {
        distances: [],
        angles: [],
        areas: [],
        volumes: []
      },
      summary: {
        totalDistance: 0,
        averageAngle: 0,
        totalArea: 0
      }
    };

    for (const m of this.measurements) {
      if (m.type === 'distance') {
        report.breakdown.distances.push({
          label: m.label,
          value: m.value.toFixed(this.precision),
          points: m.points
        });
        report.summary.totalDistance += m.value;
      } else if (m.type === 'angle') {
        report.breakdown.angles.push({
          label: m.label,
          value: m.value.toFixed(this.precision) + '°',
          points: m.points
        });
        report.summary.averageAngle += m.value;
      }
    }

    if (report.breakdown.angles.length > 0) {
      report.summary.averageAngle /= report.breakdown.angles.length;
      report.summary.averageAngle = report.summary.averageAngle.toFixed(this.precision);
    }

    report.summary.totalDistance = report.summary.totalDistance.toFixed(this.precision);

    return report;
  }

  /**
   * Export measurements as JSON
   */
  exportMeasurements() {
    return {
      units: this.units,
      points: this.points,
      measurements: this.measurements,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import measurements from JSON
   */
  importMeasurements(data) {
    if (!data.points || !data.measurements) {
      throw new Error('Invalid measurement data format');
    }

    this.points = data.points;
    this.measurements = data.measurements;
    this.units = data.units || 'meters';
    this._saveToHistory();
  }

  /**
   * Clear all measurements and points
   */
  clear() {
    this.points = [];
    this.measurements = [];
    this._saveToHistory();
  }

  /**
   * Undo last action
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this._restoreFromHistory(this.historyIndex);
    }
  }

  /**
   * Redo last undone action
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this._restoreFromHistory(this.historyIndex);
    }
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Get current state size in bytes
   */
  getStateSize() {
    return JSON.stringify(this.exportMeasurements()).length;
  }

  // ============ Private Helpers ============

  _validatePoint(point) {
    return (
      point &&
      typeof point.x === 'number' &&
      typeof point.y === 'number' &&
      typeof point.z === 'number'
    );
  }

  _generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  _convertUnits(meters) {
    const factor = this.conversionFactors[this.units] || 1;
    return meters / factor;
  }

  _calculateCenter(points) {
    return {
      x: points.reduce((s, p) => s + p.x, 0) / points.length,
      y: points.reduce((s, p) => s + p.y, 0) / points.length,
      z: points.reduce((s, p) => s + p.z, 0) / points.length
    };
  }

  _tetrahedronVolume(p1, p2, p3, p4) {
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
    const v2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };
    const v3 = { x: p4.x - p1.x, y: p4.y - p1.y, z: p4.z - p1.z };

    // Scalar triple product
    const determinant =
      v1.x * (v2.y * v3.z - v2.z * v3.y) -
      v1.y * (v2.x * v3.z - v2.z * v3.x) +
      v1.z * (v2.x * v3.y - v2.y * v3.x);

    return determinant / 6;
  }

  _saveToHistory() {
    // Remove any forward history if we're not at the end
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add current state
    this.history.push(this.exportMeasurements());
    this.historyIndex = this.history.length - 1;

    // Limit history to 50 states
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  _restoreFromHistory(index) {
    if (index >= 0 && index < this.history.length) {
      const state = this.history[index];
      this.points = state.points;
      this.measurements = state.measurements;
      this.units = state.units;
    }
  }
}
