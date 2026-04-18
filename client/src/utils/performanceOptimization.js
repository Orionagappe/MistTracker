// performanceOptimization.js - Phase 6.5: Performance optimizations
// Mesh pooling, message batching, and performance monitoring

/**
 * Mesh Pool - Reusable Three.js mesh instances (Phase 6.5: Memory optimization)
 * Reduces GC pressure by reusing mesh objects instead of creating/destroying
 */
export class MeshPool {
  constructor(capacity = 1000, geometry, material) {
    this.capacity = capacity;
    this.available = [];
    this.inUse = new Set();
    this.geometry = geometry;
    this.material = material;
    this.stats = {
      created: 0,
      reused: 0,
      returned: 0,
      peakUsage: 0
    };

    // Pre-allocate meshes
    this.initialize();
  }

  initialize() {
    for (let i = 0; i < Math.min(100, this.capacity); i++) {
      const mesh = new window.THREE.Mesh(this.geometry, this.material.clone());
      mesh.visible = false;
      this.available.push(mesh);
      this.stats.created++;
    }
  }

  /**
   * Get a mesh from pool or create new one
   */
  acquire() {
    let mesh;

    if (this.available.length > 0) {
      mesh = this.available.pop();
      this.stats.reused++;
    } else if (this.inUse.size < this.capacity) {
      mesh = new window.THREE.Mesh(this.geometry, this.material.clone());
      this.stats.created++;
    } else {
      console.warn('[MeshPool] Pool capacity exceeded, reusing oldest mesh');
      mesh = this.available.pop() || [...this.inUse][0];
    }

    this.inUse.add(mesh);
    mesh.visible = true;

    // Track peak usage
    this.stats.peakUsage = Math.max(this.stats.peakUsage, this.inUse.size);

    return mesh;
  }

  /**
   * Return mesh to pool
   */
  release(mesh) {
    if (!this.inUse.has(mesh)) {
      console.warn('[MeshPool] Attempted to return mesh not from this pool');
      return;
    }

    this.inUse.delete(mesh);
    mesh.visible = false;
    mesh.position.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.rotation.set(0, 0, 0);

    if (this.available.length < this.capacity) {
      this.available.push(mesh);
      this.stats.returned++;
    }
  }

  /**
   * Release all meshes
   */
  releaseAll() {
    [...this.inUse].forEach(mesh => this.release(mesh));
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      available: this.available.length,
      inUse: this.inUse.size,
      utilizationRatio: (this.inUse.size / this.capacity * 100).toFixed(1) + '%'
    };
  }

  /**
   * Dispose pool resources
   */
  dispose() {
    this.releaseAll();
    this.available.forEach(mesh => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.available = [];
    this.inUse.clear();
  }
}

/**
 * WebSocket Message Batcher - Phase 6.5: Reduce network overhead
 * Batches multiple physics operations into single WebSocket message
 */
export class WebSocketBatcher {
  constructor(wsConnection, batchSize = 10, batchTimeoutMs = 50) {
    this.ws = wsConnection;
    this.batchSize = batchSize;
    this.batchTimeoutMs = batchTimeoutMs;
    this.batch = [];
    this.batchTimer = null;
    this.stats = {
      batchesSent: 0,
      messagesSent: 0,
      messagesQueued: 0,
      averageBatchSize: 0
    };
  }

  /**
   * Queue message for batching
   */
  queue(type, data) {
    this.batch.push({ type, data });
    this.stats.messagesQueued++;

    // Send immediately if batch full
    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      // Schedule flush after timeout
      this.batchTimer = setTimeout(() => this.flush(), this.batchTimeoutMs);
    }
  }

  /**
   * Send batched messages
   */
  flush() {
    if (this.batch.length === 0) return;

    try {
      if (this.batch.length === 1) {
        // Single message - send directly
        this.ws?.send(JSON.stringify(this.batch[0]));
      } else {
        // Multiple messages - send as batch
        this.ws?.send(JSON.stringify({
          type: 'batch',
          messages: this.batch
        }));
      }

      this.stats.batchesSent++;
      this.stats.messagesSent += this.batch.length;

      // Update average batch size
      if (this.stats.batchesSent > 0) {
        this.stats.averageBatchSize = (this.stats.messagesSent / this.stats.batchesSent).toFixed(2);
      }
    } catch (err) {
      console.error('[WebSocketBatcher] Error sending batch:', err);
    }

    this.batch = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Get batcher statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      batchesSent: 0,
      messagesSent: 0,
      messagesQueued: 0,
      averageBatchSize: 0
    };
  }

  /**
   * Dispose batcher
   */
  dispose() {
    this.flush();
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
  }
}

/**
 * Frame Rate Limiter - Phase 6.5: Prevent excessive updates
 */
export class FrameRateLimiter {
  constructor(maxFps = 60) {
    this.maxFps = maxFps;
    this.frameTime = 1000 / maxFps;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.stats = {
      fps: 0,
      droppedFrames: 0,
      skippedUpdates: 0
    };
  }

  /**
   * Check if frame should be processed
   */
  shouldProcess() {
    const now = performance.now();
    const timeSinceLastFrame = now - this.lastFrameTime;

    if (timeSinceLastFrame >= this.frameTime) {
      this.lastFrameTime = now;
      this.frameCount++;
      return true;
    } else {
      this.stats.skippedUpdates++;
      return false;
    }
  }

  /**
   * Get current FPS
   */
  getFps() {
    return this.stats.fps;
  }

  /**
   * Call this every actual frame to update FPS counter
   */
  recordFrame() {
    this.frameCount++;
  }

  /**
   * Update FPS statistics (call periodically, e.g. every 1000ms)
   */
  updateStats() {
    this.stats.fps = this.frameCount;
    this.frameCount = 0;
  }

  /**
   * Get limiter statistics
   */
  getStats() {
    return { ...this.stats, maxFps: this.maxFps };
  }
}

/**
 * Object Pooling Utility - Generic pool for any object type
 */
export class ObjectPool {
  constructor(factory, reset, capacity = 1000) {
    this.factory = factory;
    this.reset = reset;
    this.capacity = capacity;
    this.available = [];
    this.inUse = new Set();

    // Pre-allocate
    for (let i = 0; i < Math.min(50, capacity); i++) {
      this.available.push(factory());
    }
  }

  acquire() {
    let object;

    if (this.available.length > 0) {
      object = this.available.pop();
    } else if (this.inUse.size < this.capacity) {
      object = this.factory();
    } else {
      object = this.available.pop() || [...this.inUse][0];
    }

    this.inUse.add(object);
    return object;
  }

  release(object) {
    if (!this.inUse.has(object)) return;

    this.inUse.delete(object);
    this.reset(object);

    if (this.available.length < this.capacity) {
      this.available.push(object);
    }
  }

  releaseAll() {
    [...this.inUse].forEach(obj => this.release(obj));
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      capacity: this.capacity
    };
  }

  dispose() {
    this.releaseAll();
    this.available = [];
    this.inUse.clear();
  }
}

/**
 * Lazy Loading Helper - Phase 6.5: Defer non-critical work
 */
export class LazyQueue {
  constructor(maxItemsPerFrame = 5) {
    this.queue = [];
    this.maxItemsPerFrame = maxItemsPerFrame;
    this.processing = false;
  }

  queue(work) {
    this.queue.push(work);
    this.scheduleProcessing();
  }

  scheduleProcessing() {
    if (!this.processing) {
      this.processing = true;
      requestAnimationFrame(() => this.processFrame());
    }
  }

  processFrame() {
    let processed = 0;

    while (processed < this.maxItemsPerFrame && this.queue.length > 0) {
      const work = this.queue.shift();

      try {
        work();
        processed++;
      } catch (err) {
        console.error('[LazyQueue] Error processing work:', err);
      }
    }

    if (this.queue.length === 0) {
      this.processing = false;
    } else {
      requestAnimationFrame(() => this.processFrame());
    }
  }

  clear() {
    this.queue = [];
    this.processing = false;
  }
}

export default {
  MeshPool,
  WebSocketBatcher,
  FrameRateLimiter,
  ObjectPool,
  LazyQueue
};
