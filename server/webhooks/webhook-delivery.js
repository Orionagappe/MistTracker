/**
 * Webhook Delivery Engine
 * Phase 17.2.5: Webhooks and Real-time Notifications
 * 
 * Handles webhook delivery with:
 * - HMAC signature verification
 * - Exponential backoff retry logic
 * - Timeout management
 * - Event batching
 * - Failure handling
 */

import crypto from 'crypto';
import { getDatabase } from '../database/connection.js';
import { getWebhookRegistry } from './webhook-registry.js';

// ============================================================================
// WEBHOOK DELIVERY ENGINE
// ============================================================================

export class WebhookDeliveryEngine {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 10;
    this.batchSize = 100;
    this.flushInterval = 5000; // 5 seconds
  }

  // ========================================================================
  // SIGNATURE GENERATION & VERIFICATION
  // ========================================================================

  generateSignature(payload, secret) {
    const payloadStr = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadStr);
    return hmac.digest('hex');
  }

  verifySignature(payload, signature, secret) {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  // ========================================================================
  // DELIVERY ATTEMPT
  // ========================================================================

  async deliverWebhook(webhook, eventType, payload, attempt = 1) {
    const startTime = Date.now();
    let response = null;
    let error = null;

    try {
      // Generate signature
      const signature = this.generateSignature(payload, webhook.secret);

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-ID': webhook._id,
        'X-Event-Type': eventType,
        'X-Signature': `sha256=${signature}`,
        'X-Delivery-Attempt': attempt.toString(),
        'X-Timestamp': new Date().toISOString(),
        ...webhook.headers,
      };

      // Make request
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        webhook.retry_policy.timeout_ms
      );

      response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          delivery_id: `${webhook._id}-${Date.now()}`,
          attempt,
          data: payload,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check response
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        status: response.status,
        responseTime: Date.now() - startTime,
        attempt,
        error: null,
      };
    } catch (err) {
      error = err.message;

      return {
        success: false,
        status: 0,
        responseTime: Date.now() - startTime,
        attempt,
        error: error,
      };
    }
  }

  // ========================================================================
  // RETRY LOGIC
  // ========================================================================

  calculateBackoff(attempt, multiplier = 2) {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(multiplier, attempt - 1), 60000);
  }

  async retryWebhook(webhook, eventType, payload, attempt = 1) {
    const maxAttempts = webhook.retry_policy.max_attempts;
    const multiplier = webhook.retry_policy.backoff_multiplier;

    let lastResult = null;

    for (let i = attempt; i <= maxAttempts; i++) {
      // Attempt delivery
      const result = await this.deliverWebhook(webhook, eventType, payload, i);
      lastResult = result;

      // Log event
      await getWebhookRegistry().logEvent(webhook._id, eventType, payload, result);

      if (result.success) {
        console.log(`✅ Webhook ${webhook._id} delivered on attempt ${i}`);
        return result;
      }

      // Don't retry if at max attempts
      if (i >= maxAttempts) {
        console.error(
          `❌ Webhook ${webhook._id} failed after ${maxAttempts} attempts: ${result.error}`
        );

        // Disable webhook after repeated failures
        if (maxAttempts >= 5) {
          await getWebhookRegistry().disableWebhook(
            webhook._id,
            `Failed after ${maxAttempts} delivery attempts`
          );
        }

        return result;
      }

      // Wait before retry
      const backoff = this.calculateBackoff(i, multiplier);
      console.log(
        `🔄 Retrying webhook ${webhook._id} in ${backoff}ms (attempt ${i + 1})`
      );
      await new Promise(resolve => setTimeout(resolve, backoff));
    }

    return lastResult;
  }

  // ========================================================================
  // QUEUE MANAGEMENT
  // ========================================================================

  async queueEvent(webhook, eventType, payload) {
    this.queue.push({
      webhook,
      eventType,
      payload,
      queuedAt: Date.now(),
    });

    // Process if queue is full or enough time passed
    if (this.queue.length >= this.batchSize) {
      await this.flushQueue();
    }
  }

  async flushQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      // Process events in batches
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.maxConcurrent);

        await Promise.allSettled(
          batch.map(item =>
            this.retryWebhook(item.webhook, item.eventType, item.payload)
          )
        );
      }
    } finally {
      this.processing = false;
    }
  }

  startAutoFlush() {
    setInterval(() => {
      this.flushQueue().catch(err =>
        console.error('Error flushing webhook queue:', err)
      );
    }, this.flushInterval);
  }

  // ========================================================================
  // EVENT DELIVERY
  // ========================================================================

  async deliverEvent(eventType, payload) {
    const registry = getWebhookRegistry();

    // Find matching webhooks
    const webhooks = await registry.getMatchingWebhooks(eventType, payload);

    if (webhooks.length === 0) {
      console.log(`No webhooks registered for event: ${eventType}`);
      return { delivered: 0, queued: 0 };
    }

    let delivered = 0;
    let queued = 0;

    // Queue events for delivery
    for (const webhook of webhooks) {
      try {
        await this.queueEvent(webhook, eventType, payload);
        queued++;
      } catch (err) {
        console.error(`Error queueing webhook ${webhook._id}:`, err);
      }
    }

    return { delivered, queued };
  }

  // ========================================================================
  // SYNCHRONOUS DELIVERY (FOR CRITICAL EVENTS)
  // ========================================================================

  async deliverEventSync(eventType, payload) {
    const registry = getWebhookRegistry();

    // Find matching webhooks
    const webhooks = await registry.getMatchingWebhooks(eventType, payload);

    const results = await Promise.allSettled(
      webhooks.map(webhook =>
        this.retryWebhook(webhook, eventType, payload)
      )
    );

    return {
      total: webhooks.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let deliveryEngine = null;

export function getDeliveryEngine() {
  if (!deliveryEngine) {
    deliveryEngine = new WebhookDeliveryEngine();
    deliveryEngine.startAutoFlush();
  }
  return deliveryEngine;
}

export default WebhookDeliveryEngine;
