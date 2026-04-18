// errorHandling.js - Phase 6.5: Error handling utilities and helpers
// Centralized error handling, logging, and recovery strategies

class ErrorHandler {
  constructor() {
    this.listeners = [];
    this.logHistory = [];
    this.maxLogHistory = 100;
  }

  /**
   * Subscribe to error events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Emit error to all listeners
   */
  emit(error, context = {}) {
    const errorEvent = {
      message: error.message || String(error),
      error,
      context,
      timestamp: Date.now(),
      severity: context.severity || 'error'
    };

    // Log history
    this.logHistory.push(errorEvent);
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.shift();
    }

    // Notify listeners
    this.listeners.forEach(callback => {
      try {
        callback(errorEvent);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });

    return errorEvent;
  }

  /**
   * Get error history
   */
  getHistory() {
    return [...this.logHistory];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.logHistory = [];
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

/**
 * Wrap function with error handling
 * Phase 6.5: Catch all silent failures
 */
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      const errorEvent = errorHandler.emit(err, {
        ...context,
        args: args.length > 0 ? `${args.length} args` : 'no args',
        severity: context.severity || 'error'
      });

      console.error(`[${context.name || 'Operation'}] ${err.message}`, err);
      throw err;
    }
  };
}

/**
 * Wrap async operation with timeout and retry
 */
export async function withRetry(operation, options = {}) {
  const {
    maxAttempts = 3,
    delayMs = 100,
    backoffMultiplier = 2,
    timeoutMs = 5000,
    operationName = 'Operation'
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${operationName} timeout (${timeoutMs}ms)`)), timeoutMs)
        )
      ]);
    } catch (err) {
      lastError = err;

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        console.warn(`[${operationName}] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const errorEvent = errorHandler.emit(lastError, {
    name: operationName,
    attempts: maxAttempts,
    severity: 'error'
  });

  throw lastError;
}

/**
 * WebSocket error handler
 * Phase 6.5: Connection retry with exponential backoff
 */
export class WebSocketErrorHandler {
  constructor(wsUrl, options = {}) {
    this.wsUrl = wsUrl;
    this.maxRetries = options.maxRetries || 5;
    this.initialDelayMs = options.initialDelayMs || 1000;
    this.maxDelayMs = options.maxDelayMs || 30000;
    this.retryCount = 0;
    this.listeners = [];
    this.backoffDelay = this.initialDelayMs;
  }

  /**
   * Subscribe to connection events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback({ event, data, timestamp: Date.now() });
      } catch (err) {
        console.error('Error in connection listener:', err);
      }
    });
  }

  /**
   * Handle WebSocket error
   */
  handleError(error) {
    const errorType = this.classifyError(error);

    errorHandler.emit(error, {
      name: 'WebSocket Error',
      type: errorType,
      retryCount: this.retryCount,
      nextRetryMs: this.backoffDelay,
      severity: errorType === 'fatal' ? 'critical' : 'warning'
    });

    console.error(`[WebSocket] ${errorType} error:`, error.message);

    // Emit to listeners
    this.emit('error', { error, type: errorType });

    // Trigger reconnect if appropriate
    if (this.shouldRetry(errorType)) {
      this.emit('reconnect-scheduled', { delayMs: this.backoffDelay });
      this.scheduleReconnect();
    }
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    if (!error.message) return 'unknown';

    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return 'timeout';
    }
    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      return 'connection';
    }
    if (error.message.includes('auth') || error.message.includes('401') || error.message.includes('403')) {
      return 'authentication';
    }
    if (error.message.includes('parser') || error.message.includes('JSON')) {
      return 'parsing';
    }

    return 'unknown';
  }

  /**
   * Determine if error is retryable
   */
  shouldRetry(errorType) {
    // Don't retry auth errors
    if (errorType === 'authentication') return false;

    // Retry connection and timeout errors
    if (errorType === 'timeout' || errorType === 'connection') {
      return this.retryCount < this.maxRetries;
    }

    return false;
  }

  /**
   * Schedule reconnect with exponential backoff
   */
  scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      this.emit('max-retries-exceeded', {
        attempts: this.retryCount,
        totalDelayMs: this.getTotalBackoffMs()
      });
      return;
    }

    this.retryCount++;
    setTimeout(() => {
      this.emit('reconnecting', { attempt: this.retryCount });
    }, this.backoffDelay);

    // Update backoff for next attempt
    this.backoffDelay = Math.min(
      this.backoffDelay * 1.5,
      this.maxDelayMs
    );
  }

  /**
   * Reset state on successful connection
   */
  resetRetry() {
    this.retryCount = 0;
    this.backoffDelay = this.initialDelayMs;
  }

  /**
   * Get total backoff time spent
   */
  getTotalBackoffMs() {
    let total = 0;
    let delay = this.initialDelayMs;
    for (let i = 0; i < this.retryCount; i++) {
      total += delay;
      delay = Math.min(delay * 1.5, this.maxDelayMs);
    }
    return total;
  }
}

/**
 * Physics operation safe wrapper
 * Phase 6.5: Catch all physics operation errors
 */
export function safePhysicsOperation(operation, operationName = 'Physics Operation') {
  try {
    const result = operation();

    // Handle async results
    if (result && typeof result.then === 'function') {
      return result.catch(err => {
        errorHandler.emit(err, {
          name: operationName,
          type: 'async',
          severity: 'error'
        });
        console.error(`[Physics] ${operationName} failed:`, err.message);
        throw err;
      });
    }

    return result;
  } catch (err) {
    errorHandler.emit(err, {
      name: operationName,
      type: 'sync',
      severity: 'error'
    });

    console.error(`[Physics] ${operationName} failed:`, err.message);
    throw err;
  }
}

/**
 * Validation helpers
 */
export const validators = {
  /**
   * Validate physics configuration
   */
  validatePhysicsConfig(config) {
    const errors = [];

    if (!config.position || !Array.isArray(config.position) || config.position.length !== 3) {
      errors.push('position must be [x, y, z]');
    }

    if (config.frequency && (typeof config.frequency !== 'number' || config.frequency <= 0)) {
      errors.push('frequency must be positive number');
    }

    if (config.amplitude && (typeof config.amplitude !== 'number' || config.amplitude < 0)) {
      errors.push('amplitude must be non-negative number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate WebSocket message
   */
  validateMessage(message) {
    const errors = [];

    if (!message.type) {
      errors.push('message must have type');
    }

    if (message.type === 'registerAtom') {
      if (!message.data) errors.push('registerAtom must have data');
      if (!message.data?.atomType) errors.push('atomType required');
      if (!message.data?.atomId) errors.push('atomId required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate particle data
   */
  validateParticleData(particle) {
    const errors = [];

    if (!particle.position || !Array.isArray(particle.position) || particle.position.length !== 3) {
      errors.push('particle position must be [x, y, z]');
    }

    if (particle.energy && typeof particle.energy !== 'number') {
      errors.push('particle energy must be number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Performance monitoring
 * Phase 6.5: Track performance metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.measurements = [];
  }

  /**
   * Start measuring operation
   */
  start(label) {
    return {
      label,
      startTime: performance.now(),
      end: () => {
        const endTime = performance.now();
        const duration = endTime - this.startTime;

        if (!this.metrics[label]) {
          this.metrics[label] = { count: 0, totalMs: 0, minMs: Infinity, maxMs: 0 };
        }

        const metric = this.metrics[label];
        metric.count++;
        metric.totalMs += duration;
        metric.minMs = Math.min(metric.minMs, duration);
        metric.maxMs = Math.max(metric.maxMs, duration);

        this.measurements.push({ label, duration, timestamp: Date.now() });

        return duration;
      }
    };
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const summary = {};

    Object.entries(this.metrics).forEach(([label, metric]) => {
      summary[label] = {
        count: metric.count,
        totalMs: metric.totalMs.toFixed(2),
        avgMs: (metric.totalMs / metric.count).toFixed(2),
        minMs: metric.minMs.toFixed(2),
        maxMs: metric.maxMs.toFixed(2)
      };
    });

    return summary;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {};
    this.measurements = [];
  }

  /**
   * Get recent measurements
   */
  getRecent(n = 10) {
    return this.measurements.slice(-n);
  }
}

// Export instances
export const performanceMonitor = new PerformanceMonitor();
export const wsErrorHandler = new WebSocketErrorHandler('ws://localhost:3000', {
  maxRetries: 5,
  initialDelayMs: 1000
});

/**
 * Export all for convenience
 */
export default {
  errorHandler,
  withErrorHandling,
  withRetry,
  WebSocketErrorHandler,
  wsErrorHandler,
  safePhysicsOperation,
  validators,
  PerformanceMonitor,
  performanceMonitor
};
