/**
 * Analytics Dashboard API Endpoints
 * Phase 17.2.6: Analytics & Reporting
 * 
 * REST API endpoints for:
 * - Event statistics
 * - Webhook health
 * - Performance metrics
 * - Historical trends
 * - Forecasting
 */

import express from 'express';
import { authenticateToken } from '../auth/middleware.js';
import { getEventStatistics } from './event-statistics.js';
import { getPerformanceMetrics } from './performance-metrics.js';
import { getWebhookHealthMonitor } from './webhook-health.js';
import { getAnalyticsCollector } from './analytics-collector.js';

const router = express.Router();

// Middleware
router.use(authenticateToken);

// ============================================================================
// EVENT STATISTICS ENDPOINTS
// ============================================================================

/**
 * GET /analytics/events/volume
 * Get event volume for date range
 * Query: start_date, end_date
 */
router.get('/events/volume', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const userId = req.user.id;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'Missing required query parameters: start_date, end_date',
      });
    }

    const statistics = getEventStatistics();
    const volume = await statistics.getEventVolume(userId, start_date, end_date);

    res.json({
      user_id: userId,
      period: { start: start_date, end: end_date },
      data: volume,
    });
  } catch (err) {
    console.error('Error getting event volume:', err);
    res.status(500).json({ error: 'Failed to retrieve event volume' });
  }
});

/**
 * GET /analytics/events/daily
 * Get daily event volume breakdown
 * Query: start_date, end_date
 */
router.get('/events/daily', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const userId = req.user.id;

    const statistics = getEventStatistics();
    const daily = await statistics.getEventVolumeByDay(
      userId,
      start_date,
      end_date
    );

    res.json({
      user_id: userId,
      period: { start: start_date, end: end_date },
      data: daily,
    });
  } catch (err) {
    console.error('Error getting daily events:', err);
    res.status(500).json({ error: 'Failed to retrieve daily events' });
  }
});

/**
 * GET /analytics/events/types
 * Get event type distribution
 * Query: date (optional, defaults to today)
 */
router.get('/events/types', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().substring(0, 10);
    const userId = req.user.id;

    const statistics = getEventStatistics();
    const types = await statistics.getEventTypeDistribution(userId, date);

    res.json({
      user_id: userId,
      date,
      data: types,
    });
  } catch (err) {
    console.error('Error getting event types:', err);
    res.status(500).json({ error: 'Failed to retrieve event types' });
  }
});

/**
 * GET /analytics/events/top
 * Get top event types
 * Query: limit (optional, default 10)
 */
router.get('/events/top', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const userId = req.user.id;

    const statistics = getEventStatistics();
    const topTypes = await statistics.getTopEventTypes(userId, limit);

    res.json({
      user_id: userId,
      limit,
      data: topTypes,
    });
  } catch (err) {
    console.error('Error getting top event types:', err);
    res.status(500).json({ error: 'Failed to retrieve top event types' });
  }
});

/**
 * GET /analytics/events/success-rates
 * Get success rates by event type
 * Query: date (optional, defaults to today)
 */
router.get('/events/success-rates', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().substring(0, 10);
    const userId = req.user.id;

    const statistics = getEventStatistics();
    const rates = await statistics.getEventSuccessRates(userId, date);

    res.json({
      user_id: userId,
      date,
      data: rates,
    });
  } catch (err) {
    console.error('Error getting success rates:', err);
    res.status(500).json({ error: 'Failed to retrieve success rates' });
  }
});

/**
 * GET /analytics/events/trends
 * Get event trends
 * Query: days (optional, default 30)
 */
router.get('/events/trends', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const userId = req.user.id;

    const statistics = getEventStatistics();
    const trends = await statistics.getTrends(userId, days);

    res.json({
      user_id: userId,
      days,
      ...trends,
    });
  } catch (err) {
    console.error('Error getting trends:', err);
    res.status(500).json({ error: 'Failed to retrieve trends' });
  }
});

/**
 * GET /analytics/events/forecast
 * Forecast event volume
 * Query: days_ahead (optional, default 7)
 */
router.get('/events/forecast', async (req, res) => {
  try {
    const daysAhead = req.query.days_ahead ? parseInt(req.query.days_ahead) : 7;
    const userId = req.user.id;

    const statistics = getEventStatistics();
    const forecast = await statistics.forecastEventVolume(userId, daysAhead);

    res.json({
      user_id: userId,
      days_ahead: daysAhead,
      ...forecast,
    });
  } catch (err) {
    console.error('Error getting forecast:', err);
    res.status(500).json({ error: 'Failed to retrieve forecast' });
  }
});

/**
 * GET /analytics/events/hourly
 * Get hourly pattern for event type
 * Query: event_type, days (optional, default 7)
 */
router.get('/events/hourly', async (req, res) => {
  try {
    const { event_type } = req.query;
    const days = req.query.days ? parseInt(req.query.days) : 7;
    const userId = req.user.id;

    if (!event_type) {
      return res.status(400).json({ error: 'Missing event_type query parameter' });
    }

    const statistics = getEventStatistics();
    const hourly = await statistics.getHourlyPattern(userId, event_type, days);

    res.json({
      user_id: userId,
      event_type,
      days,
      data: hourly,
    });
  } catch (err) {
    console.error('Error getting hourly pattern:', err);
    res.status(500).json({ error: 'Failed to retrieve hourly pattern' });
  }
});

// ============================================================================
// WEBHOOK HEALTH ENDPOINTS
// ============================================================================

/**
 * GET /analytics/webhooks/health/:webhookId
 * Get health status of specific webhook
 */
router.get('/webhooks/health/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user.id;

    const monitor = getWebhookHealthMonitor();
    const status = await monitor.getWebhookStatus(webhookId);

    res.json({
      user_id: userId,
      ...status,
    });
  } catch (err) {
    console.error('Error getting webhook health:', err);
    res.status(500).json({ error: 'Failed to retrieve webhook health' });
  }
});

/**
 * GET /analytics/webhooks/health
 * Get health status of all webhooks
 */
router.get('/webhooks/health', async (req, res) => {
  try {
    const userId = req.user.id;

    const monitor = getWebhookHealthMonitor();
    const teamStatus = await monitor.getTeamStatus(userId);

    res.json(teamStatus);
  } catch (err) {
    console.error('Error getting team health:', err);
    res.status(500).json({ error: 'Failed to retrieve team health' });
  }
});

/**
 * GET /analytics/webhooks/recommendations/:webhookId
 * Get health recommendations for webhook
 */
router.get('/webhooks/recommendations/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;

    const monitor = getWebhookHealthMonitor();
    const recommendations = await monitor.getRecommendations(webhookId);

    res.json({
      webhook_id: webhookId,
      recommendations,
    });
  } catch (err) {
    console.error('Error getting recommendations:', err);
    res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
});

/**
 * GET /analytics/webhooks/anomalies/:webhookId
 * Get detected anomalies for webhook
 */
router.get('/webhooks/anomalies/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;

    const monitor = getWebhookHealthMonitor();
    const anomalies = await monitor.detectAnomalies(webhookId);

    res.json({
      webhook_id: webhookId,
      anomalies,
      detected_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error getting anomalies:', err);
    res.status(500).json({ error: 'Failed to retrieve anomalies' });
  }
});

/**
 * GET /analytics/webhooks/alerts
 * Get all active alerts
 */
router.get('/webhooks/alerts', (req, res) => {
  try {
    const userId = req.user.id;
    const monitor = getWebhookHealthMonitor();
    const alerts = monitor.getAlertsByUser(userId);

    res.json({
      user_id: userId,
      total: alerts.length,
      alerts,
    });
  } catch (err) {
    console.error('Error getting alerts:', err);
    res.status(500).json({ error: 'Failed to retrieve alerts' });
  }
});

/**
 * POST /analytics/webhooks/alerts/:webhookId/acknowledge
 * Acknowledge an alert
 */
router.post('/webhooks/alerts/:webhookId/acknowledge', (req, res) => {
  try {
    const { webhookId } = req.params;

    const monitor = getWebhookHealthMonitor();
    monitor.acknowledgeAlert(webhookId);

    res.json({ success: true, message: 'Alert acknowledged' });
  } catch (err) {
    console.error('Error acknowledging alert:', err);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// ============================================================================
// PERFORMANCE METRICS ENDPOINTS
// ============================================================================

/**
 * GET /analytics/performance/metrics/:webhookId
 * Get performance metrics for webhook
 * Query: date (optional, defaults to today)
 */
router.get('/performance/metrics/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;
    const date = req.query.date || new Date().toISOString().substring(0, 10);

    const metrics = getPerformanceMetrics();
    const stats = await metrics.getDeliveryStats(webhookId, date);

    res.json({
      webhook_id: webhookId,
      date,
      ...stats,
    });
  } catch (err) {
    console.error('Error getting performance metrics:', err);
    res.status(500).json({ error: 'Failed to retrieve performance metrics' });
  }
});

/**
 * GET /analytics/performance/trend/:webhookId
 * Get performance trend for webhook
 * Query: days (optional, default 7)
 */
router.get('/performance/trend/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;
    const days = req.query.days ? parseInt(req.query.days) : 7;

    const metrics = getPerformanceMetrics();
    const trend = await metrics.getPerformanceTrend(webhookId, days);

    res.json({
      webhook_id: webhookId,
      days,
      data: trend,
    });
  } catch (err) {
    console.error('Error getting performance trend:', err);
    res.status(500).json({ error: 'Failed to retrieve performance trend' });
  }
});

/**
 * GET /analytics/performance/errors/:webhookId
 * Get error breakdown for webhook
 * Query: date (optional, defaults to today)
 */
router.get('/performance/errors/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;
    const date = req.query.date || new Date().toISOString().substring(0, 10);

    const metrics = getPerformanceMetrics();
    const errors = await metrics.getErrorBreakdown(webhookId, date);

    res.json({
      webhook_id: webhookId,
      date,
      errors,
    });
  } catch (err) {
    console.error('Error getting error breakdown:', err);
    res.status(500).json({ error: 'Failed to retrieve error breakdown' });
  }
});

// ============================================================================
// DASHBOARD OVERVIEW
// ============================================================================

/**
 * GET /analytics/dashboard
 * Get complete dashboard overview for user
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    const statistics = getEventStatistics();
    const metrics = getPerformanceMetrics();
    const monitor = getWebhookHealthMonitor();

    const today = new Date().toISOString().substring(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10);

    // Gather all data in parallel
    const [volume, dailyVolume, eventTypes, trends, teamHealth, topErrors] =
      await Promise.all([
        statistics.getEventVolume(userId, sevenDaysAgo, today),
        statistics.getEventVolumeByDay(userId, sevenDaysAgo, today),
        statistics.getTopEventTypes(userId, 5),
        statistics.getTrends(userId, 7),
        monitor.getTeamStatus(userId),
        metrics.getTopErrors(userId, 5),
      ]);

    res.json({
      user_id: userId,
      generated_at: new Date().toISOString(),
      period: {
        start: sevenDaysAgo,
        end: today,
      },
      summary: {
        total_events: volume.total_events,
        total_deliveries: volume.total_deliveries,
        avg_daily_events: volume.avg_events_per_day,
        webhook_health: teamHealth.summary,
      },
      charts: {
        daily_volume: dailyVolume,
        event_types: eventTypes,
        trends: trends.summary,
      },
      top_errors: topErrors,
      health_summary: teamHealth.summary,
    });
  } catch (err) {
    console.error('Error getting dashboard:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard' });
  }
});

// ============================================================================
// EXPORT
// ============================================================================

export default router;
