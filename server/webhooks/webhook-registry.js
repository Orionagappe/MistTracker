/**
 * Webhook Registry & Management
 * Phase 17.2.5: Webhooks and Real-time Notifications
 * 
 * Manages webhook registration, validation, and lifecycle
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDatabase } from '../database/connection.js';

// ============================================================================
// WEBHOOK SCHEMA
// ============================================================================

export const webhookSchema = {
  _id: { type: String, primary: true },           // UUID
  user_id: { type: String, required: true, index: true },
  url: { type: String, required: true },
  events: { type: Array, required: true },        // ['session.started', 'session.completed', ...]
  secret: { type: String, required: true },       // For HMAC signature
  secret_prefix: { type: String },                // First 8 chars (shown to user)
  name: { type: String },
  description: String,
  headers: { type: Object, default: {} },         // Custom headers to include
  status: {
    type: String,
    enum: ['active', 'inactive', 'disabled'],
    default: 'active',
  },
  retry_policy: {
    max_attempts: { type: Number, default: 5 },
    backoff_multiplier: { type: Number, default: 2 },
    timeout_ms: { type: Number, default: 30000 },
  },
  filters: {
    sessions: { type: Array },                    // Filter by session_id patterns
    atoms: { type: Array },                        // Filter by atoms
    metrics_threshold: {
      min_accuracy: Number,
      max_loss: Number,
    },
  },
  test_payload: { type: Object },
  stats: {
    total_deliveries: { type: Number, default: 0 },
    successful: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    last_delivery_at: Date,
    last_delivery_status: String,
  },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
};

export const webhookIndexes = [
  { fields: { user_id: 1 } },
  { fields: { user_id: 1, status: 1 } },
  { fields: { secret: 1 }, unique: true },
  { fields: { created_at: 1 } },
];

export const eventLogSchema = {
  _id: { type: String, primary: true },
  webhook_id: { type: String, required: true, index: true },
  event_type: { type: String, required: true },
  payload: { type: Object, required: true },
  http_status: Number,
  response_time_ms: Number,
  attempt: Number,
  error_message: String,
  retry_count: Number,
  timestamp: { type: Date, default: () => new Date(), index: true },
};

// ============================================================================
// WEBHOOK REGISTRY CLASS
// ============================================================================

export class WebhookRegistry {
  constructor() {
    this.webhooks = new Map();    // In-memory cache
    this.eventListeners = new Map(); // Event listeners
  }

  // ========================================================================
  // WEBHOOK REGISTRATION
  // ========================================================================

  async registerWebhook(userId, webhookData) {
    if (!webhookData.url || !webhookData.events) {
      throw new Error('URL and events are required');
    }

    if (!Array.isArray(webhookData.events) || webhookData.events.length === 0) {
      throw new Error('At least one event must be specified');
    }

    // Validate URL
    try {
      new URL(webhookData.url);
    } catch (err) {
      throw new Error('Invalid webhook URL');
    }

    // Generate secret
    const secret = `wh_${crypto.randomBytes(32).toString('hex')}`;
    const secretPrefix = secret.substring(0, 8);

    const db = getDatabase();
    const webhookId = uuidv4();

    const webhook = {
      _id: webhookId,
      user_id: userId,
      url: webhookData.url,
      events: webhookData.events,
      secret,
      secret_prefix: secretPrefix,
      name: webhookData.name || 'Webhook',
      description: webhookData.description,
      headers: webhookData.headers || {},
      status: 'active',
      retry_policy: webhookData.retry_policy || {
        max_attempts: 5,
        backoff_multiplier: 2,
        timeout_ms: 30000,
      },
      filters: webhookData.filters || {},
      stats: {
        total_deliveries: 0,
        successful: 0,
        failed: 0,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Store in database
    if (db.provider === 'mongodb') {
      await db.db.collection('webhooks').insertOne(webhook);
    } else {
      await db.connection.query(
        `INSERT INTO webhooks (id, user_id, url, events, secret, name, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          webhook._id,
          userId,
          webhook.url,
          webhook.events.join(','),
          webhook.secret,
          webhook.name,
          webhook.status,
          webhook.created_at,
        ]
      );
    }

    // Cache in memory
    this.webhooks.set(webhookId, webhook);

    return {
      id: webhookId,
      secret: secret,  // Only shown once
      prefix: secretPrefix,
      name: webhook.name,
    };
  }

  // ========================================================================
  // WEBHOOK RETRIEVAL & MANAGEMENT
  // ========================================================================

  async getWebhook(webhookId) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db.collection('webhooks').findOne({ _id: webhookId });
    } else {
      const result = await db.connection.query(
        'SELECT * FROM webhooks WHERE id = $1',
        [webhookId]
      );
      return result.rows[0];
    }
  }

  async getUserWebhooks(userId) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('webhooks')
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        'SELECT * FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    }
  }

  async updateWebhook(webhookId, updates) {
    const db = getDatabase();
    updates.updated_at = new Date();

    if (db.provider === 'mongodb') {
      await db.db.collection('webhooks').updateOne(
        { _id: webhookId },
        { $set: updates }
      );
    } else {
      const fields = Object.keys(updates)
        .map((k, i) => `${k} = $${i + 1}`)
        .join(', ');
      const values = Object.values(updates);
      values.push(webhookId);

      await db.connection.query(
        `UPDATE webhooks SET ${fields} WHERE id = $${values.length}`,
        values
      );
    }

    // Update cache
    const webhook = await this.getWebhook(webhookId);
    this.webhooks.set(webhookId, webhook);
  }

  async deleteWebhook(webhookId) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      await db.db.collection('webhooks').deleteOne({ _id: webhookId });
    } else {
      await db.connection.query('DELETE FROM webhooks WHERE id = $1', [webhookId]);
    }

    this.webhooks.delete(webhookId);
  }

  // ========================================================================
  // WEBHOOK ACTIVATION/DEACTIVATION
  // ========================================================================

  async activateWebhook(webhookId) {
    await this.updateWebhook(webhookId, { status: 'active' });
  }

  async deactivateWebhook(webhookId) {
    await this.updateWebhook(webhookId, { status: 'inactive' });
  }

  async disableWebhook(webhookId, reason) {
    await this.updateWebhook(webhookId, {
      status: 'disabled',
      disabled_reason: reason,
    });
  }

  // ========================================================================
  // WEBHOOK VALIDATION
  // ========================================================================

  async validateWebhook(webhookId) {
    const webhook = await this.getWebhook(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (webhook.status === 'disabled') {
      throw new Error('Webhook is disabled');
    }

    return webhook;
  }

  // ========================================================================
  // EVENT LOGGING
  // ========================================================================

  async logEvent(webhookId, eventType, payload, result) {
    const db = getDatabase();

    const eventLog = {
      _id: uuidv4(),
      webhook_id: webhookId,
      event_type: eventType,
      payload,
      http_status: result.status,
      response_time_ms: result.responseTime,
      attempt: result.attempt,
      error_message: result.error,
      retry_count: result.retries,
      timestamp: new Date(),
    };

    if (db.provider === 'mongodb') {
      await db.db.collection('webhook_events').insertOne(eventLog);
    } else {
      await db.connection.query(
        `INSERT INTO webhook_events (id, webhook_id, event_type, http_status, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          eventLog._id,
          webhookId,
          eventType,
          result.status,
          eventLog.timestamp,
        ]
      );
    }

    // Update webhook stats
    const webhook = await this.getWebhook(webhookId);
    const stats = webhook.stats || {
      total_deliveries: 0,
      successful: 0,
      failed: 0,
    };

    stats.total_deliveries++;
    if (result.status >= 200 && result.status < 300) {
      stats.successful++;
    } else {
      stats.failed++;
    }
    stats.last_delivery_at = new Date();
    stats.last_delivery_status = result.status;

    await this.updateWebhook(webhookId, { stats });
  }

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  on(eventType, listener) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(listener);
  }

  off(eventType, listener) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  async emit(eventType, payload) {
    const listeners = this.eventListeners.get(eventType) || [];
    for (const listener of listeners) {
      try {
        await listener(payload);
      } catch (err) {
        console.error(`Error in webhook listener for ${eventType}:`, err);
      }
    }
  }

  // ========================================================================
  // WEBHOOK FILTERING
  // ========================================================================

  async getMatchingWebhooks(eventType, payload) {
    const db = getDatabase();

    // Get all active webhooks for this event type
    let webhooks;
    if (db.provider === 'mongodb') {
      webhooks = await db.db
        .collection('webhooks')
        .find({
          events: eventType,
          status: 'active',
        })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT * FROM webhooks WHERE status = 'active' AND events LIKE $1`,
        [`%${eventType}%`]
      );
      webhooks = result.rows;
    }

    // Filter based on webhook-specific filters
    return webhooks.filter(webhook => {
      if (!webhook.filters) return true;

      // Filter by session
      if (webhook.filters.sessions && payload.session_id) {
        if (!webhook.filters.sessions.includes(payload.session_id)) {
          return false;
        }
      }

      // Filter by atoms
      if (webhook.filters.atoms && payload.atoms) {
        const webhookAtoms = webhook.filters.atoms;
        const payloadAtoms = Array.isArray(payload.atoms) ? payload.atoms : [payload.atoms];
        if (!payloadAtoms.some(a => webhookAtoms.includes(a))) {
          return false;
        }
      }

      // Filter by metrics threshold
      if (webhook.filters.metrics_threshold) {
        const threshold = webhook.filters.metrics_threshold;
        if (threshold.min_accuracy && payload.accuracy < threshold.min_accuracy) {
          return false;
        }
        if (threshold.max_loss && payload.loss > threshold.max_loss) {
          return false;
        }
      }

      return true;
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let registryInstance = null;

export function getWebhookRegistry() {
  if (!registryInstance) {
    registryInstance = new WebhookRegistry();
  }
  return registryInstance;
}

export default WebhookRegistry;
