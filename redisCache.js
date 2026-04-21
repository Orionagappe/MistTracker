/**
 * Redis Cache Client - Server-side caching layer
 * Provides high-performance distributed caching for queries and metrics
 * 
 * @file services/redisCache.js
 * @version 1.0.0
 */

const redis = require('redis');

class RedisCache {
  constructor() {
    this.client = null;
    this.connected = false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
    this.keyPatterns = new Map(); // Track patterns for mass deletion
  }

  /**
   * Initialize Redis connection
   * @param {Object} options - Redis connection options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    const {
      host = 'localhost',
      port = 6379,
      password = null,
      db = 0,
      retryStrategy = this._defaultRetryStrategy,
      enableOfflineQueue = true,
    } = options;

    try {
      this.client = redis.createClient({
        host,
        port,
        password,
        db,
        retryStrategy,
        enableOfflineQueue,
      });

      // Setup event handlers
      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.connected = true;
      });

      this.client.on('error', (error) => {
        console.error('Redis client error:', error);
        this.stats.errors++;
      });

      this.client.on('reconnecting', () => {
        console.log('Redis client reconnecting...');
      });

      // Test connection
      await this._testConnection();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  /**
   * Test Redis connection
   * @private
   */
  async _testConnection() {
    return new Promise((resolve, reject) => {
      this.client.ping((error, reply) => {
        if (error) {
          reject(error);
        } else {
          console.log('Redis PING:', reply);
          resolve(reply);
        }
      });
    });
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.connected) {
      return null;
    }

    return new Promise((resolve) => {
      this.client.get(key, (error, data) => {
        if (error) {
          console.error('Redis GET error:', error);
          this.stats.errors++;
          resolve(null);
          return;
        }

        if (data) {
          this.stats.hits++;
          try {
            resolve(JSON.parse(data));
          } catch (parseError) {
            resolve(data); // Return raw string if not JSON
          }
        } else {
          this.stats.misses++;
          resolve(null);
        }
      });
    });
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 300) {
    if (!this.connected) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);

        this.client.setex(key, ttl, serialized, (error) => {
          if (error) {
            console.error('Redis SET error:', error);
            this.stats.errors++;
            resolve(false);
          } else {
            this.stats.sets++;
            this._trackKeyPattern(key);
            resolve(true);
          }
        });
      } catch (error) {
        console.error('Redis SET serialization error:', error);
        this.stats.errors++;
        resolve(false);
      }
    });
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key (supports wildcards with*)
   * @returns {Promise<number>} Number of keys deleted
   */
  async delete(key) {
    if (!this.connected) {
      return 0;
    }

    return new Promise((resolve) => {
      // Handle wildcard patterns
      if (key.includes('*')) {
        this.client.keys(key, (error, keys) => {
          if (error || !keys || keys.length === 0) {
            resolve(0);
            return;
          }

          if (keys.length === 1) {
            this.client.del(keys[0], (delError) => {
              this.stats.deletes++;
              resolve(delError ? 0 : 1);
            });
          } else {
            this.client.del(...keys, (delError, count) => {
              if (delError) {
                resolve(0);
              } else {
                this.stats.deletes += count;
                resolve(count || 0);
              }
            });
          }
        });
      } else {
        this.client.del(key, (error, count) => {
          if (error) {
            console.error('Redis DEL error:', error);
            this.stats.errors++;
            resolve(0);
          } else {
            this.stats.deletes++;
            resolve(count || 0);
          }
        });
      }
    });
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    if (!this.connected) {
      return false;
    }

    return new Promise((resolve) => {
      this.client.flushdb((error) => {
        if (error) {
          console.error('Redis FLUSHDB error:', error);
          this.stats.errors++;
          resolve(false);
        } else {
          console.log('Cache cleared');
          this.keyPatterns.clear();
          resolve(true);
        }
      });
    });
  }

  /**
   * Get multiple values
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<Object>} Map of key->value pairs
   */
  async mget(keys) {
    if (!this.connected || !keys || keys.length === 0) {
      return {};
    }

    return new Promise((resolve) => {
      this.client.mget(...keys, (error, values) => {
        if (error) {
          console.error('Redis MGET error:', error);
          resolve({});
          return;
        }

        const result = {};
        keys.forEach((key, index) => {
          const value = values[index];
          if (value) {
            this.stats.hits++;
            try {
              result[key] = JSON.parse(value);
            } catch {
              result[key] = value;
            }
          } else {
            this.stats.misses++;
          }
        });

        resolve(result);
      });
    });
  }

  /**
   * Set multiple values
   * @param {Object} keyValues - Map of key->value pairs
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<number>} Number of keys set
   */
  async mset(keyValues, ttl = 300) {
    if (!this.connected || Object.keys(keyValues).length === 0) {
      return 0;
    }

    let count = 0;
    for (const [key, value] of Object.entries(keyValues)) {
      const success = await this.set(key, value, ttl);
      if (success) count++;
    }

    return count;
  }

  /**
   * Increment numeric value
   * @param {string} key - Cache key
   * @param {number} increment - Increment amount (default: 1)
   * @returns {Promise<number>} New value
   */
  async increment(key, increment = 1) {
    if (!this.connected) {
      return 0;
    }

    return new Promise((resolve) => {
      this.client.incrby(key, increment, (error, newValue) => {
        if (error) {
          console.error('Redis INCRBY error:', error);
          this.stats.errors++;
          resolve(0);
        } else {
          resolve(newValue || 0);
        }
      });
    });
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Existence status
   */
  async exists(key) {
    if (!this.connected) {
      return false;
    }

    return new Promise((resolve) => {
      this.client.exists(key, (error, exists) => {
        if (error) {
          console.error('Redis EXISTS error:', error);
          resolve(false);
        } else {
          resolve(exists === 1);
        }
      });
    });
  }

  /**
   * Get TTL for key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds (-1 if no expiry, -2 if not exists)
   */
  async ttl(key) {
    if (!this.connected) {
      return -2;
    }

    return new Promise((resolve) => {
      this.client.ttl(key, (error, ttl) => {
        if (error) {
          console.error('Redis TTL error:', error);
          resolve(-2);
        } else {
          resolve(ttl || -2);
        }
      });
    });
  }

  /**
   * Set TTL for existing key
   * @param {string} key - Cache key
   * @param {number} seconds - New TTL in seconds
   * @returns {Promise<boolean>} Success status
   */
  async setTTL(key, seconds) {
    if (!this.connected) {
      return false;
    }

    return new Promise((resolve) => {
      this.client.expire(key, seconds, (error, result) => {
        if (error) {
          console.error('Redis EXPIRE error:', error);
          resolve(false);
        } else {
          resolve(result === 1);
        }
      });
    });
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0
      ? ((this.stats.hits / totalRequests) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate}%`,
      connected: this.connected,
    };
  }

  /**
   * Get cache info from Redis
   * @returns {Promise<Object>} Redis server info
   */
  async getInfo() {
    if (!this.connected) {
      return null;
    }

    return new Promise((resolve) => {
      this.client.info('stats', (error, info) => {
        if (error) {
          console.error('Redis INFO error:', error);
          resolve(null);
        } else {
          resolve(info);
        }
      });
    });
  }

  /**
   * Get number of keys in cache
   * @returns {Promise<number>} Number of keys
   */
  async dbSize() {
    if (!this.connected) {
      return 0;
    }

    return new Promise((resolve) => {
      this.client.dbsize((error, size) => {
        if (error) {
          console.error('Redis DBSIZE error:', error);
          resolve(0);
        } else {
          resolve(size || 0);
        }
      });
    });
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Close Redis connection
   */
  close() {
    if (this.client) {
      this.client.quit();
      this.connected = false;
    }
  }

  // ============= Private Methods =============

  /**
   * Default retry strategy
   * @private
   */
  _defaultRetryStrategy(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('End-of-retry reached: the server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('End-of-retry reached: retried for 1 hour');
    }
    if (options.attempt > 10) {
      return undefined;
    }

    // Exponential backoff
    return Math.min(options.attempt * 100, 3000);
  }

  /**
   * Track key patterns for bulk operations
   * @private
   */
  _trackKeyPattern(key) {
    // Extract pattern (e.g., "query:*" from "query:abc123")
    const pattern = key.split(':')[0] + ':*';
    if (!this.keyPatterns.has(pattern)) {
      this.keyPatterns.set(pattern, 0);
    }
    this.keyPatterns.set(pattern, this.keyPatterns.get(pattern) + 1);
  }
}

module.exports = new RedisCache();
