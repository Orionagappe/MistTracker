/**
 * performanceMonitor.js
 * Phase 8.2: Performance profiling and benchmarking
 * 
 * Tracks operation timings for storage, calculations, and renders
 * Helps identify performance bottlenecks and regressions
 */

class PerformanceMonitor {
  constructor() {
    this.timings = new Map();
    this.enabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Start measuring an operation
   */
  start(operationName) {
    if (!this.enabled) return;
    const key = `op_${operationName}_${Date.now()}_${Math.random()}`;
    this.timings.set(key, { name: operationName, start: performance.now() });
    return key;
  }

  /**
   * End measuring an operation and log result
   */
  end(timingKey, options = {}) {
    if (!this.enabled || !this.timings.has(timingKey)) return;

    const timing = this.timings.get(timingKey);
    const duration = performance.now() - timing.start;
    
    const { threshold = 100, logAlways = false } = options;

    if (logAlways || duration > threshold) {
      console.log(
        `⏱️  ${timing.name}: ${duration.toFixed(2)}ms`,
        duration > threshold ? '⚠️ SLOW' : ''
      );
    }

    this.timings.delete(timingKey);
    return duration;
  }

  /**
   * Measure a synchronous function
   */
  measure(operationName, fn, options = {}) {
    const timingKey = this.start(operationName);
    try {
      const result = fn();
      this.end(timingKey, options);
      return result;
    } catch (error) {
      this.end(timingKey, { logAlways: true });
      throw error;
    }
  }

  /**
   * Measure an async function
   */
  async measureAsync(operationName, asyncFn, options = {}) {
    const timingKey = this.start(operationName);
    try {
      const result = await asyncFn();
      this.end(timingKey, options);
      return result;
    } catch (error) {
      this.end(timingKey, { logAlways: true });
      throw error;
    }
  }

  /**
   * Get all recorded timings
   */
  getStats() {
    const stats = {};
    for (const [, timing] of this.timings) {
      const name = timing.name;
      if (!stats[name]) {
        stats[name] = { count: 0, total: 0, min: Infinity, max: 0 };
      }
      // Note: This is incomplete timings, only for reference
    }
    return stats;
  }

  /**
   * Reset all timings
   */
  reset() {
    this.timings.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Singleton instance
export const perf = new PerformanceMonitor();

export default perf;
