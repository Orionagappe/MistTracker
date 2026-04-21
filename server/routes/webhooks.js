/**
 * Webhook Management API Endpoints
 * Phase 17.2.5: Webhooks and Real-time Notifications
 * 
 * REST API for:
 * - Creating/managing webhooks
 * - Testing webhooks
 * - Viewing delivery history
 * - Monitoring webhook health
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requirePermission } from '../middleware/auth.js';
import { getWebhookRegistry } from './webhook-registry.js';
import { getDeliveryEngine } from './webhook-delivery.js';
import { EVENT_TYPES } from './event-system.js';

const router = Router();

// ============================================================================
// WEBHOOK CRUD OPERATIONS
// ============================================================================

/**
 * POST /api/webhooks
 * 
 * Create a new webhook
 * 
 * Request Body:
 * {
 *   "url": "https://example.com/webhook",
 *   "events": ["session.completed", "convergence.detected"],
 *   "name": "My Webhook",
 *   "description": "Notifies when sessions complete",
 *   "headers": { "Authorization": "Bearer token" },
 *   "retry_policy": {
 *     "max_attempts": 5,
 *     "backoff_multiplier": 2,
 *     "timeout_ms": 30000
 *   },
 *   "filters": {
 *     "atoms": ["H", "He"],
 *     "metrics_threshold": {
 *       "min_accuracy": 0.8
 *     }
 *   }
 * }
 */
router.post('/webhooks', requirePermission('manage:webhooks'), async (req, res) => {
  try {
    const { url, events, name, description, headers, retry_policy, filters } = req.body;

    // Validation
    if (!url || !events) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'url and events are required',
      });
    }

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one event must be specified',
      });
    }

    // Validate events
    const invalidEvents = events.filter(e => !EVENT_TYPES[e]);
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid events: ${invalidEvents.join(', ')}`,
      });
    }

    const registry = getWebhookRegistry();

    const webhookData = {
      url,
      events,
      name: name || 'Webhook',
      description,
      headers: headers || {},
      retry_policy: retry_policy || {
        max_attempts: 5,
        backoff_multiplier: 2,
        timeout_ms: 30000,
      },
      filters: filters || {},
    };

    const result = await registry.registerWebhook(req.user.id, webhookData);

    res.status(201).json({
      webhook: result,
      message: 'Webhook created successfully. Save the secret - it will not be shown again.',
    });
  } catch (err) {
    console.error('Error creating webhook:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * GET /api/webhooks
 * 
 * List all webhooks for user
 */
router.get('/webhooks', requirePermission('manage:webhooks'), async (req, res) => {
  try {
    const registry = getWebhookRegistry();
    const webhooks = await registry.getUserWebhooks(req.user.id);

    res.json({
      webhooks: webhooks.map(w => ({
        id: w._id || w.id,
        name: w.name,
        url: w.url,
        events: w.events,
        status: w.status,
        secret_prefix: w.secret_prefix,
        stats: w.stats,
        created_at: w.created_at,
      })),
      count: webhooks.length,
    });
  } catch (err) {
    console.error('Error fetching webhooks:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * GET /api/webhooks/:webhook_id
 * 
 * Get details of a specific webhook
 */
router.get('/webhooks/:webhook_id', requirePermission('manage:webhooks'), async (req, res) => {
  try {
    const { webhook_id } = req.params;
    const registry = getWebhookRegistry();

    const webhook = await registry.getWebhook(webhook_id);

    if (!webhook || webhook.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Webhook not found',
      });
    }

    res.json({
      id: webhook._id || webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      status: webhook.status,
      description: webhook.description,
      headers: webhook.headers,
      retry_policy: webhook.retry_policy,
      filters: webhook.filters,
      stats: webhook.stats,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    });
  } catch (err) {
    console.error('Error fetching webhook:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * PUT /api/webhooks/:webhook_id
 * 
 * Update webhook configuration
 */
router.put('/webhooks/:webhook_id', requirePermission('manage:webhooks'), async (req, res) => {
  try {
    const { webhook_id } = req.params;
    const { events, headers, retry_policy, filters, name, description, status } = req.body;

    const registry = getWebhookRegistry();
    const webhook = await registry.getWebhook(webhook_id);

    if (!webhook || webhook.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Webhook not found',
      });
    }

    const updates = {};
    if (events) updates.events = events;
    if (headers) updates.headers = headers;
    if (retry_policy) updates.retry_policy = retry_policy;
    if (filters) updates.filters = filters;
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (status) updates.status = status;

    await registry.updateWebhook(webhook_id, updates);

    res.json({
      message: 'Webhook updated successfully',
    });
  } catch (err) {
    console.error('Error updating webhook:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * DELETE /api/webhooks/:webhook_id
 * 
 * Delete a webhook
 */
router.delete('/webhooks/:webhook_id', requirePermission('manage:webhooks'), async (req, res) => {
  try {
    const { webhook_id } = req.params;
    const registry = getWebhookRegistry();

    const webhook = await registry.getWebhook(webhook_id);

    if (!webhook || webhook.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Webhook not found',
      });
    }

    await registry.deleteWebhook(webhook_id);

    res.json({
      message: 'Webhook deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting webhook:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

// ============================================================================
// WEBHOOK TESTING & ACTIVATION
// ============================================================================

/**
 * POST /api/webhooks/:webhook_id/test
 * 
 * Send a test webhook payload
 */
router.post('/webhooks/:webhook_id/test', requirePermission('manage:webhooks'), async (req, res) => {
  try {
    const { webhook_id } = req.params;
    const registry = getWebhookRegistry();
    const engine = getDeliveryEngine();

    const webhook = await registry.getWebhook(webhook_id);

    if (!webhook || webhook.user_id !== req.user.id) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Webhook not found',
      });
    }

    // Create test payload
    const testPayload = {
      session_id: uuidv4(),
      user_id: req.user.id,
      event_type: webhook.events[0],
      test: true,
      timestamp: new Date().toISOString(),
    };

    // Deliver test
    const result = await engine.retryWebhook(
      webhook,
      webhook.events[0],
      testPayload
    );

    res.json({
      status: result.success ? 'success' : 'failed',
      http_status: result.status,
      response_time_ms: result.responseTime,
      error: result.error,
      message: result.success
        ? 'Test webhook delivered successfully'
        : 'Test webhook delivery failed',
    });
  } catch (err) {
    console.error('Error testing webhook:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

/**
 * POST /api/webhooks/:webhook_id/activate
 * 
 * Activate a webhook
 */
router.post(
  '/webhooks/:webhook_id/activate',
  requirePermission('manage:webhooks'),
  async (req, res) => {
    try {
      const { webhook_id } = req.params;
      const registry = getWebhookRegistry();

      const webhook = await registry.getWebhook(webhook_id);

      if (!webhook || webhook.user_id !== req.user.id) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Webhook not found',
        });
      }

      await registry.activateWebhook(webhook_id);

      res.json({
        message: 'Webhook activated',
      });
    } catch (err) {
      console.error('Error activating webhook:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  }
);

/**
 * POST /api/webhooks/:webhook_id/deactivate
 * 
 * Deactivate a webhook
 */
router.post(
  '/webhooks/:webhook_id/deactivate',
  requirePermission('manage:webhooks'),
  async (req, res) => {
    try {
      const { webhook_id } = req.params;
      const registry = getWebhookRegistry();

      const webhook = await registry.getWebhook(webhook_id);

      if (!webhook || webhook.user_id !== req.user.id) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Webhook not found',
        });
      }

      await registry.deactivateWebhook(webhook_id);

      res.json({
        message: 'Webhook deactivated',
      });
    } catch (err) {
      console.error('Error deactivating webhook:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  }
);

// ============================================================================
// DELIVERY HISTORY & MONITORING
// ============================================================================

/**
 * GET /api/webhooks/:webhook_id/deliveries
 * 
 * Get webhook delivery history
 * 
 * Query Parameters:
 * - limit: Max results (default 100, max 1000)
 * - offset: Pagination offset
 * - status: Filter by status (success, failed, retried)
 */
router.get(
  '/webhooks/:webhook_id/deliveries',
  requirePermission('manage:webhooks'),
  async (req, res) => {
    try {
      const { webhook_id } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      const registry = getWebhookRegistry();

      const webhook = await registry.getWebhook(webhook_id);

      if (!webhook || webhook.user_id !== req.user.id) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Webhook not found',
        });
      }

      // Get from database
      const db = require('../database/connection.js').getDatabase();
      let deliveries;

      if (db.provider === 'mongodb') {
        deliveries = await db.db
          .collection('webhook_events')
          .find({ webhook_id })
          .sort({ timestamp: -1 })
          .limit(parseInt(limit))
          .skip(parseInt(offset))
          .toArray();
      } else {
        const result = await db.connection.query(
          `SELECT * FROM webhook_events WHERE webhook_id = $1
           ORDER BY timestamp DESC LIMIT $2 OFFSET $3`,
          [webhook_id, parseInt(limit), parseInt(offset)]
        );
        deliveries = result.rows;
      }

      res.json({
        webhook_id,
        deliveries: deliveries.map(d => ({
          event_type: d.event_type,
          status: d.http_status >= 200 && d.http_status < 300 ? 'success' : 'failed',
          http_status: d.http_status,
          response_time_ms: d.response_time_ms,
          attempt: d.attempt,
          error: d.error_message,
          timestamp: d.timestamp,
        })),
        count: deliveries.length,
      });
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    }
  }
);

// ============================================================================
// EVENT TYPES DOCUMENTATION
// ============================================================================

/**
 * GET /api/webhooks/events/types
 * 
 * Get all available event types
 */
router.get('/webhooks/events/types', (req, res) => {
  res.json({
    event_types: EVENT_TYPES,
    count: Object.keys(EVENT_TYPES).length,
  });
});

export default router;
