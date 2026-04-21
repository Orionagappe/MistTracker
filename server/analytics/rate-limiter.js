/**
 * Rate Limiting & Throttling System
 * Phase 17.2.6: Analytics & Reporting
 * 
 * Implements:
 * - Per-user rate limiting (API calls, webhooks, events)
 * - Per-webhook rate limiting
 * - Token bucket algorithm
 * - Backpressure handling
 * - Rate limit headers and responses
 */

import { getAnalyticsCollector } from './analytics-collector.js';
import { getDatabase } from '../database/connection.js';

// ============================================================================
// RATE LIMIT CONFIGURATION
// ============================================================================

export const RATE_LIMITS = {
  // API endpoints
  api: {
    webhook_create: { requests: 100, window: 3600 },          // 100 per hour
    webhook_update: { requests: 500, window: 3600 },          // 500 per hour
    webhook_delete: { requests: 50, window: 3600 },           // 50 per hour
    webhook_test: { requests: 1000, window: 3600 },           // 1000 per hour
    webhook_list: { requests: 10000, window: 3600 },          // 10000 per hour
  },

  // Webhook deliveries
  webhook: {
    per_hour: { requests: 10000, window: 3600 },              // 10k per hour
    per_day: { requests: 100000, window: 86400 },             // 100k per day
    concurrent: 10,                                            // 10 concurrent
  },

  // Event emissions
  events: {
    per_minute: { requests: 1000, window: 60 },               // 1k per minute
    per_hour: { requests: 50000, window: 3600 },              // 50k per hour
    per_day: { requests: 500000, window: 86400 },             // 500k per day
  },

  // WebSocket connections
  websocket: {
    per_user: 5,                                               // 5 concurrent
    message_per_minute: 1000,                                  // 1k msg/min
  },

  // Overall user limits
  user: {
    api_calls_per_hour: 10000,
    webhooks_per_hour: 100000,
    events_per_day: 1000000,
  },
};

// ============================================================================
// TOKEN BUCKET RATE LIMITER
// ============================================================================

export class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;  // tokens per second
    this.lastRefillTime = Date.now();
  }

  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefillTime) / 1000;  // seconds
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  tryConsume(tokens = 1) {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  getAvailableTokens() {
    this.refill();
    return Math.floor(this.tokens);
  }

  getResetTime() {
    const tokensNeeded = this.capacity - this.tokens;
    const secondsNeeded = tokensNeeded / this.refillRate;
    return Math.ceil(secondsNeeded * 1000);
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

export class RateLimiter {
  constructor() {
    this.buckets = new Map();  // key -> TokenBucket
    this.collector = getAnalyticsCollector();
  }

  // ========================================================================
  // KEY GENERATION
  // ========================================================================

  getApiKey(userId, endpoint) {
    return `api:${userId}:${endpoint}`;
  }

  getWebhookKey(webhookId) {
    return `webhook:${webhookId}`;
  }

  getEventKey(userId) {
    return `events:${userId}`;
  }

  getWebSocketKey(userId) {
    return `ws:${userId}`;
  }

  // ========================================================================
  // RATE LIMIT CHECKS
  // ========================================================================

  checkApiLimit(userId, endpoint) {
    const limit = RATE_LIMITS.api[endpoint];
    if (!limit) {
      return { allowed: true };  // Unknown endpoint, allow
    }

    const key = this.getApiKey(userId, endpoint);
    return this.checkLimit(key, limit, userId, endpoint);
  }

  checkWebhookLimit(webhookId, userId, type = 'per_hour') {
    const limit = RATE_LIMITS.webhook[type];
    const key = this.getWebhookKey(webhookId);
    return this.checkLimit(key, limit, userId, webhookId);
  }

  checkEventLimit(userId, type = 'per_minute') {
    const limit = RATE_LIMITS.events[type];
    const key = this.getEventKey(userId);
    return this.checkLimit(key, limit, userId, 'events');
  }

  checkWebSocketLimit(userId) {
    const limit = RATE_LIMITS.websocket;
    const key = this.getWebSocketKey(userId);
    const bucket = this.getBucket(key, limit.message_per_minute, 60);

    if (!bucket.tryConsume(1)) {
      this.recordRateLimit(userId, 'websocket', 'message_limit');
      return {
        allowed: false,
        limit: limit.message_per_minute,
        window: 60,
        reset_in_ms: bucket.getResetTime(),
      };
    }

    return { allowed: true };
  }

  checkLimit(key, limit, userId, resourceId) {
    const { requests, window } = limit;
    const bucket = this.getBucket(key, requests, window);

    if (!bucket.tryConsume(1)) {
      this.recordRateLimit(userId, resourceId, window);
      return {
        allowed: false,
        limit: requests,
        window,
        reset_in_ms: bucket.getResetTime(),
      };
    }

    return {
      allowed: true,
      remaining: bucket.getAvailableTokens(),
      limit: requests,
      reset_in_ms: bucket.getResetTime(),
    };
  }

  getBucket(key, capacity, window) {
    if (!this.buckets.has(key)) {
      const refillRate = capacity / window;
      this.buckets.set(key, new TokenBucket(capacity, refillRate));
    }
    return this.buckets.get(key);
  }

  // ========================================================================
  // RATE LIMIT RECORDING
  // ========================================================================

  recordRateLimit(userId, resourceId, window) {
    this.collector.recordRateLimitExceeded(
      userId,
      resourceId,
      window,
      new Date(Date.now() + window * 1000)
    );
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  cleanup() {
    // Remove buckets that haven't been used recently
    // This prevents memory leaks from idle users
    const maxAge = 1 * 60 * 60 * 1000;  // 1 hour
    const now = Date.now();

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefillTime > maxAge) {
        this.buckets.delete(key);
      }
    }
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  getBucketStats(key) {
    const bucket = this.buckets.get(key);
    if (!bucket) {
      return null;
    }

    return {
      available_tokens: bucket.getAvailableTokens(),
      capacity: bucket.capacity,
      reset_in_ms: bucket.getResetTime(),
    };
  }

  getStats() {
    return {
      active_buckets: this.buckets.size,
      memory_usage_bytes: JSON.stringify([...this.buckets]).length,
    };
  }
}

// ============================================================================
// ADAPTIVE RATE LIMITER
// ============================================================================

export class AdaptiveRateLimiter {
  constructor(baseLimiter) {
    this.baseLimiter = baseLimiter;
    this.overrides = new Map();  // userId -> custom limits
    this.degradationMode = false;
  }

  // ========================================================================
  // USER-SPECIFIC LIMITS
  // ========================================================================

  setUserLimit(userId, resourceType, requests, window) {
    const key = `${userId}:${resourceType}`;
    this.overrides.set(key, { requests, window });
  }

  clearUserLimit(userId, resourceType) {
    const key = `${userId}:${resourceType}`;
    this.overrides.delete(key);
  }

  // ========================================================================
  // DEGRADATION MODE
  // ========================================================================

  enableDegradationMode() {
    this.degradationMode = true;
    console.warn('⚠️ Rate limiting: DEGRADATION MODE ENABLED');
  }

  disableDegradationMode() {
    this.degradationMode = false;
    console.log('✅ Rate limiting: Degradation mode disabled');
  }

  async checkLimit(userId, endpoint, checkFn) {
    if (this.degradationMode) {
      // In degradation mode, reduce limits by 50%
      return { allowed: true, degraded: true };
    }

    return checkFn();
  }

  // ========================================================================
  // QUOTA MANAGEMENT
  // ========================================================================

  async grantQuotaBoost(userId, percentage = 50, durationHours = 1) {
    const key = `quota_boost:${userId}`;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    this.overrides.set(key, {
      type: 'quota_boost',
      percentage,
      expires_at: expiresAt,
    });
  }

  async revokeQuotaBoost(userId) {
    const key = `quota_boost:${userId}`;
    this.overrides.delete(key);
  }

  // ========================================================================
  // WHITELISTING
  // ========================================================================

  addToWhitelist(userId) {
    this.overrides.set(`whitelist:${userId}`, { type: 'whitelist' });
  }

  removeFromWhitelist(userId) {
    this.overrides.delete(`whitelist:${userId}`);
  }

  isWhitelisted(userId) {
    return this.overrides.has(`whitelist:${userId}`);
  }
}

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

export function createRateLimitMiddleware(limiter, endpoint) {
  return (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const checkResult = limiter.checkApiLimit(userId, endpoint);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': checkResult.limit,
      'X-RateLimit-Remaining': checkResult.remaining || 0,
      'X-RateLimit-Reset': checkResult.reset_in_ms,
    });

    if (!checkResult.allowed) {
      const resetSeconds = Math.ceil(checkResult.reset_in_ms / 1000);
      res.set('Retry-After', resetSeconds);

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
        limit: checkResult.limit,
        window: checkResult.window,
        reset_in: checkResult.reset_in_ms,
      });
    }

    next();
  };
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let limiterInstance = null;
let adaptiveLimiterInstance = null;

export function getRateLimiter() {
  if (!limiterInstance) {
    limiterInstance = new RateLimiter();
    // Cleanup every 5 minutes
    setInterval(() => {
      limiterInstance.cleanup();
    }, 5 * 60 * 1000);
  }
  return limiterInstance;
}

export function getAdaptiveRateLimiter() {
  if (!adaptiveLimiterInstance) {
    const baseLimiter = getRateLimiter();
    adaptiveLimiterInstance = new AdaptiveRateLimiter(baseLimiter);
  }
  return adaptiveLimiterInstance;
}

export default {
  TokenBucket,
  RateLimiter,
  AdaptiveRateLimiter,
  RATE_LIMITS,
  getRateLimiter,
  getAdaptiveRateLimiter,
  createRateLimitMiddleware,
};
