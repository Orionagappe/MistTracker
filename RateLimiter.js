// RateLimiter.js
// Implements rate limiting for preventing abuse and managing bandwidth

export class RateLimiter {
  constructor(maxBytesPerSecond = 50 * 1024, windowMs = 1000) {
    this.maxBytesPerSecond = maxBytesPerSecond;
    this.windowMs = windowMs;
    this.limits = new Map(); // userId -> { lastReset, bytesSent }
  }

  // Check if message can be sent and track bytes
  canSendMessage(userId, messageSize) {
    const now = Date.now();
    let limit = this.limits.get(userId);

    if (!limit) {
      limit = { lastReset: now, bytesSent: 0 };
      this.limits.set(userId, limit);
    }

    // Reset window if expired
    if (now - limit.lastReset > this.windowMs) {
      limit.lastReset = now;
      limit.bytesSent = 0;
    }

    // Check if message fits in budget
    if (limit.bytesSent + messageSize > this.maxBytesPerSecond) {
      return {
        allowed: false,
        reason: 'rate-limit-exceeded',
        retryAfterMs: this.windowMs - (now - limit.lastReset)
      };
    }

    // Update bytes sent
    limit.bytesSent += messageSize;
    this.limits.set(userId, limit);

    return { allowed: true };
  }

  // Get current usage for a user
  getUsage(userId) {
    const limit = this.limits.get(userId);
    if (!limit) {
      return { bytesSent: 0, percentUsed: 0 };
    }

    const percentUsed = (limit.bytesSent / this.maxBytesPerSecond) * 100;
    return {
      bytesSent: limit.bytesSent,
      maxBytes: this.maxBytesPerSecond,
      percentUsed: Math.min(100, percentUsed),
      windowResetMs: this.windowMs - (Date.now() - limit.lastReset)
    };
  }

  // Reset limits for a user
  reset(userId) {
    this.limits.delete(userId);
  }

  // Reset all limits
  resetAll() {
    this.limits.clear();
  }

  // Clean up stale entries
  cleanup() {
    const now = Date.now();
    for (const [userId, limit] of this.limits.entries()) {
      if (now - limit.lastReset > this.windowMs * 10) {
        this.limits.delete(userId);
      }
    }
  }

  // Get statistics
  getStatistics() {
    const stats = {
      totalUsers: this.limits.size,
      users: []
    };

    for (const [userId, limit] of this.limits.entries()) {
      stats.users.push({
        userId,
        bytesSent: limit.bytesSent,
        percentUsed: (limit.bytesSent / this.maxBytesPerSecond) * 100
      });
    }

    return stats;
  }
}

export default RateLimiter;
