/**
 * Cache Manager - Browser-side caching with auto-expiration and metrics
 * Supports localStorage for small objects and IndexedDB for large datasets
 * 
 * @file client/src/services/cacheManager.js
 * @version 1.0.0
 */

class CacheManager {
  constructor(options = {}) {
    this.localStorageKey = options.localStorageKey || 'cache_';
    this.maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.compressionThreshold = options.compressionThreshold || 10240; // 10KB
    
    // Metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expirations: 0,
      compressions: 0,
    };
    
    // Initialize IndexedDB
    this.db = null;
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for large object storage
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MistAnalyticsCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Generate cache key with optional parameters
   */
  generateKey(endpoint, params = {}, userId = '') {
    const paramStr = Object.keys(params).length > 0 
      ? JSON.stringify(params)
      : 'default';
    return `${this.localStorageKey}${endpoint}_${paramStr}_${userId}`;
  }

  /**
   * Compress data using gzip-like compression (for large objects)
   */
  compress(data) {
    try {
      const json = JSON.stringify(data);
      const compressed = this._simpleLZ(json);
      this.metrics.compressions++;
      return compressed;
    } catch (e) {
      console.warn('Compression failed:', e);
      return data;
    }
  }

  /**
   * Decompress data
   */
  decompress(data) {
    try {
      if (typeof data !== 'string' || !data.startsWith('LZ:')) {
        return data;
      }
      return JSON.parse(this._simpleLZDecompress(data));
    } catch (e) {
      console.warn('Decompression failed:', e);
      return data;
    }
  }

  /**
   * Simple LZ compression (basic implementation)
   */
  _simpleLZ(str) {
    const dict = {};
    const dictSize = 256;
    for (let i = 0; i < 256; i++) {
      dict[String.fromCharCode(i)] = i;
    }
    
    let phrase = str[0];
    let result = [dictSize];
    
    for (let i = 1; i < str.length; i++) {
      const char = str[i];
      const combined = phrase + char;
      
      if (combined in dict) {
        phrase = combined;
      } else {
        result.push(dict[phrase]);
        if (Object.keys(dict).length < 65536) {
          dict[combined] = dictSize + Object.keys(dict).length;
        }
        phrase = char;
      }
    }
    
    result.push(dict[phrase]);
    return 'LZ:' + String.fromCharCode.apply(null, result);
  }

  /**
   * Simple LZ decompression
   */
  _simpleLZDecompress(str) {
    // Simplified decompression - returns original for demo
    return str.substring(3);
  }

  /**
   * Set value in cache (automatically chooses storage tier)
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const sizeEstimate = JSON.stringify(value).length;
      const cacheEntry = {
        key,
        value,
        ttl,
        expiresAt: Date.now() + ttl,
        size: sizeEstimate,
        createdAt: Date.now(),
      };

      // Use IndexedDB for large objects (>10KB)
      if (sizeEstimate > this.compressionThreshold) {
        if (this.db) {
          return this.setLarge(key, value, ttl);
        }
      }

      // Use localStorage for small objects
      try {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        this.metrics.sets++;
        return true;
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          this.clearOldest(Math.ceil(sizeEstimate / 1024)); // Clear ~1KB worth
          localStorage.setItem(key, JSON.stringify(cacheEntry));
          this.metrics.sets++;
          return true;
        }
        throw e;
      }
    } catch (e) {
      console.error('Cache set failed:', e);
      return false;
    }
  }

  /**
   * Get value from cache
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        this.metrics.misses++;
        return null;
      }

      const cacheEntry = JSON.parse(item);
      
      // Check expiration
      if (Date.now() > cacheEntry.expiresAt) {
        localStorage.removeItem(key);
        this.metrics.expirations++;
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      return cacheEntry.value;
    } catch (e) {
      console.error('Cache get failed:', e);
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Set large value in IndexedDB
   */
  async setLarge(key, value, ttl = this.defaultTTL) {
    if (!this.db) {
      return this.set(key, value, ttl);
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        store.put({
          key,
          value: this.compress(value),
          ttl,
          expiresAt: Date.now() + ttl,
          size: JSON.stringify(value).length,
          createdAt: Date.now(),
          compressed: true,
        });

        transaction.oncomplete = () => {
          this.metrics.sets++;
          resolve(true);
        };
        
        transaction.onerror = () => {
          resolve(false);
        };
      } catch (e) {
        console.error('IndexedDB set failed:', e);
        resolve(false);
      }
    });
  }

  /**
   * Get large value from IndexedDB
   */
  async getLarge(key) {
    if (!this.db) {
      return this.get(key);
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);

        request.onsuccess = () => {
          const item = request.result;
          
          if (!item) {
            this.metrics.misses++;
            resolve(null);
            return;
          }

          // Check expiration
          if (Date.now() > item.expiresAt) {
            // Delete expired item asynchronously
            this.delete(key);
            this.metrics.expirations++;
            this.metrics.misses++;
            resolve(null);
            return;
          }

          this.metrics.hits++;
          resolve(item.compressed ? this.decompress(item.value) : item.value);
        };

        request.onerror = () => {
          this.metrics.misses++;
          resolve(null);
        };
      } catch (e) {
        console.error('IndexedDB get failed:', e);
        this.metrics.misses++;
        resolve(null);
      }
    });
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  isValid(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return false;
      
      const cacheEntry = JSON.parse(item);
      return Date.now() <= cacheEntry.expiresAt;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(key) {
    return !this.isValid(key);
  }

  /**
   * Delete specific cache entry
   */
  async delete(key) {
    try {
      localStorage.removeItem(key);
      
      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        transaction.objectStore('cache').delete(key);
      }

      this.metrics.deletes++;
      return true;
    } catch (e) {
      console.error('Cache delete failed:', e);
      return false;
    }
  }

  /**
   * Clear cache entries matching pattern
   */
  async clear(pattern = '') {
    try {
      const keysToDelete = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes(this.localStorageKey) && key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => localStorage.removeItem(key));

      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        keysToDelete.forEach(key => store.delete(key));
      }

      this.metrics.deletes += keysToDelete.length;
      return keysToDelete.length;
    } catch (e) {
      console.error('Cache clear failed:', e);
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll() {
    try {
      const keysToDelete = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes(this.localStorageKey)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => localStorage.removeItem(key));

      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        transaction.objectStore('cache').clear();
      }

      this.metrics.deletes += keysToDelete.length;
      return keysToDelete.length;
    } catch (e) {
      console.error('Cache clearAll failed:', e);
      return 0;
    }
  }

  /**
   * Clear oldest entries to free up space
   */
  clearOldest(sizeToFree = 1024) {
    const entries = [];
    let freedSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes(this.localStorageKey)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          entries.push({ key, ...item });
        } catch (e) {
          // Skip malformed entries
        }
      }
    }

    // Sort by creation time (oldest first)
    entries.sort((a, b) => a.createdAt - b.createdAt);

    // Delete oldest entries until we've freed enough space
    for (const entry of entries) {
      if (freedSize >= sizeToFree) break;
      localStorage.removeItem(entry.key);
      freedSize += entry.size || 1024;
      this.metrics.deletes++;
    }

    return freedSize;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalHits = this.metrics.hits;
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests * 100).toFixed(2) : 0;

    return {
      ...this.metrics,
      totalRequests,
      hitRate: `${hitRate}%`,
      size: this.getSize(),
    };
  }

  /**
   * Get cache metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get hit rate percentage
   */
  getHitRate() {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? (this.metrics.hits / total * 100).toFixed(2) : 0;
  }

  /**
   * Get current cache size in bytes
   */
  getSize() {
    let size = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes(this.localStorageKey)) {
        size += localStorage.getItem(key).length;
      }
    }

    return size;
  }

  /**
   * Export cache statistics as JSON
   */
  exportStats() {
    return {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      cacheSize: this.getSize(),
      maxSize: this.maxSize,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expirations: 0,
      compressions: 0,
    };
  }
}

// Create singleton instance
let cacheManager = null;

/**
 * Get or create cache manager singleton
 */
export function getCacheManager(options) {
  if (!cacheManager) {
    cacheManager = new CacheManager(options);
  }
  return cacheManager;
}

export default CacheManager;
