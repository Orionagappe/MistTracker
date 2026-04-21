/**
 * Event Statistics & Trends Analysis
 * Phase 17.2.6: Analytics & Reporting
 * 
 * Provides:
 * - Event volume trends
 * - Event type breakdowns
 * - Delivery success rates by event type
 * - Peak activity times
 * - Forecasting
 */

import { getDatabase } from '../database/connection.js';

// ============================================================================
// EVENT STATISTICS
// ============================================================================

export class EventStatistics {
  // ========================================================================
  // EVENT VOLUME ANALYSIS
  // ========================================================================

  async getEventVolume(userId, startDate, endDate) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      const result = await db.db
        .collection('event_stats')
        .aggregate([
          {
            $match: {
              user_id: userId,
              date: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total_events: { $sum: '$total_count' },
              total_deliveries: { $sum: '$webhook_count' },
              avg_events_per_day: {
                $avg: '$total_count',
              },
            },
          },
        ])
        .toArray();

      return result[0] || {
        total_events: 0,
        total_deliveries: 0,
        avg_events_per_day: 0,
      };
    } else {
      const result = await db.connection.query(
        `SELECT SUM(total_count) as total_events,
                SUM(webhook_count) as total_deliveries,
                AVG(total_count) as avg_events_per_day
         FROM event_stats 
         WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
        [userId, startDate, endDate]
      );

      return result.rows[0] || {
        total_events: 0,
        total_deliveries: 0,
        avg_events_per_day: 0,
      };
    }
  }

  async getEventVolumeByDay(userId, startDate, endDate) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('event_stats')
        .aggregate([
          {
            $match: {
              user_id: userId,
              date: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: '$date',
              total_count: { $sum: '$total_count' },
              webhook_count: { $sum: '$webhook_count' },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray()
        .then(docs =>
          docs.map(d => ({
            date: d._id,
            events: d.total_count,
            webhooks: d.webhook_count,
          }))
        );
    } else {
      const result = await db.connection.query(
        `SELECT date,
                SUM(total_count) as events,
                SUM(webhook_count) as webhooks
         FROM event_stats 
         WHERE user_id = $1 AND date BETWEEN $2 AND $3
         GROUP BY date
         ORDER BY date ASC`,
        [userId, startDate, endDate]
      );

      return result.rows;
    }
  }

  // ========================================================================
  // EVENT TYPE ANALYSIS
  // ========================================================================

  async getEventTypeDistribution(userId, date) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('event_stats')
        .find({
          user_id: userId,
          date: date,
        })
        .sort({ total_count: -1 })
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT event_type, total_count, successful_deliveries, failed_deliveries
         FROM event_stats 
         WHERE user_id = $1 AND date = $2
         ORDER BY total_count DESC`,
        [userId, date]
      );

      return result.rows;
    }
  }

  async getTopEventTypes(userId, limit = 10) {
    const db = getDatabase();
    const today = new Date().toISOString().substring(0, 10);

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('event_stats')
        .aggregate([
          {
            $match: {
              user_id: userId,
              date: today,
            },
          },
          { $sort: { total_count: -1 } },
          { $limit: limit },
          {
            $project: {
              event_type: 1,
              total_count: 1,
              webhook_count: 1,
              success_rate: {
                $divide: [
                  '$successful_deliveries',
                  '$successful_deliveries + $failed_deliveries',
                ],
              },
            },
          },
        ])
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT event_type, total_count, webhook_count,
                ROUND(100.0 * successful_deliveries / 
                      NULLIF(successful_deliveries + failed_deliveries, 0), 2) 
                as success_rate
         FROM event_stats 
         WHERE user_id = $1 AND date = $2
         ORDER BY total_count DESC
         LIMIT $3`,
        [userId, today, limit]
      );

      return result.rows;
    }
  }

  // ========================================================================
  // SUCCESS RATE BY EVENT TYPE
  // ========================================================================

  async getEventSuccessRates(userId, date) {
    const db = getDatabase();

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('event_stats')
        .aggregate([
          {
            $match: {
              user_id: userId,
              date: date,
            },
          },
          {
            $project: {
              event_type: 1,
              total_count: 1,
              successful_deliveries: 1,
              failed_deliveries: 1,
              success_rate: {
                $cond: [
                  { $eq: ['$webhook_count', 0] },
                  0,
                  {
                    $divide: [
                      '$successful_deliveries',
                      '$successful_deliveries + $failed_deliveries',
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { success_rate: -1 } },
        ])
        .toArray();
    } else {
      const result = await db.connection.query(
        `SELECT event_type, total_count, successful_deliveries, failed_deliveries,
                ROUND(100.0 * successful_deliveries / 
                      NULLIF(successful_deliveries + failed_deliveries, 0), 2) 
                as success_rate
         FROM event_stats 
         WHERE user_id = $1 AND date = $2
         ORDER BY success_rate DESC`,
        [userId, date]
      );

      return result.rows;
    }
  }

  // ========================================================================
  // HOURLY PATTERNS
  // ========================================================================

  async getHourlyPattern(userId, eventType, days = 7) {
    const db = getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().substring(0, 10);

    if (db.provider === 'mongodb') {
      const metrics = await db.db
        .collection('webhook_metrics')
        .aggregate([
          {
            $match: {
              user_id: userId,
              event_type: eventType,
              day: { $gte: startDateStr },
            },
          },
          {
            $group: {
              _id: {
                $substr: ['$timestamp', 11, 2],  // hour
              },
              count: { $sum: 1 },
              success_rate: {
                $avg: {
                  $cond: [{ $eq: ['$success', true] }, 1, 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      return metrics.map(m => ({
        hour: m._id,
        count: m.count,
        success_rate: Math.round(m.success_rate * 100),
      }));
    } else {
      const result = await db.connection.query(
        `SELECT EXTRACT(HOUR FROM timestamp)::int as hour,
                COUNT(*) as count,
                ROUND(100.0 * SUM(CASE WHEN success = true THEN 1 ELSE 0 END) / 
                      COUNT(*), 2) as success_rate
         FROM webhook_metrics 
         WHERE user_id = $1 AND event_type = $2 AND day >= $3
         GROUP BY hour
         ORDER BY hour ASC`,
        [userId, eventType, startDateStr]
      );

      return result.rows;
    }
  }

  // ========================================================================
  // PEAK ACTIVITY ANALYSIS
  // ========================================================================

  async getPeakActivityTimes(userId, days = 7) {
    const db = getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().substring(0, 10);

    if (db.provider === 'mongodb') {
      return await db.db
        .collection('webhook_metrics')
        .aggregate([
          {
            $match: {
              user_id: userId,
              day: { $gte: startDateStr },
            },
          },
          {
            $group: {
              _id: {
                hour: { $substr: ['$timestamp', 11, 2] },
                minute: { $substr: ['$timestamp', 14, 1] },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 24 },
        ])
        .toArray()
        .then(docs =>
          docs.map(d => ({
            time: `${d._id.hour}:${d._id.minute}0`,
            activity_count: d.count,
          }))
        );
    } else {
      const result = await db.connection.query(
        `SELECT 
                EXTRACT(HOUR FROM timestamp)::int || ':' ||
                LPAD((EXTRACT(MINUTE FROM timestamp)::int / 10 * 10)::text, 2, '0') 
                as time,
                COUNT(*) as activity_count
         FROM webhook_metrics 
         WHERE user_id = $1 AND day >= $2
         GROUP BY time
         ORDER BY activity_count DESC
         LIMIT 24`,
        [userId, startDateStr]
      );

      return result.rows;
    }
  }

  // ========================================================================
  // TREND ANALYSIS
  // ========================================================================

  async getTrends(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().substring(0, 10);

    const endDate = new Date();
    const endDateStr = endDate.toISOString().substring(0, 10);

    const volumeByDay = await this.getEventVolumeByDay(
      userId,
      startDateStr,
      endDateStr
    );

    return {
      period: { start: startDateStr, end: endDateStr },
      data: volumeByDay,
      summary: this.calculateTrendSummary(volumeByDay),
    };
  }

  calculateTrendSummary(volumeByDay) {
    if (volumeByDay.length < 2) {
      return {
        trend: 'stable',
        change_percent: 0,
      };
    }

    const firstHalf = volumeByDay.slice(0, Math.floor(volumeByDay.length / 2));
    const secondHalf = volumeByDay.slice(Math.floor(volumeByDay.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, d) => sum + d.events, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, d) => sum + d.events, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
      first_period_avg_events: Math.round(firstAvg),
      second_period_avg_events: Math.round(secondAvg),
      trend: changePercent > 10 ? 'increasing' : changePercent < -10 ? 'decreasing' : 'stable',
      change_percent: Math.round(changePercent * 100) / 100,
    };
  }

  // ========================================================================
  // FORECASTING
  // ========================================================================

  async forecastEventVolume(userId, daysAhead = 7) {
    const volumeByDay = await this.getEventVolumeByDay(
      userId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      new Date().toISOString().substring(0, 10)
    );

    if (volumeByDay.length < 7) {
      return {
        error: 'Insufficient data for forecasting',
        min_required_days: 7,
      };
    }

    // Simple linear regression forecast
    const events = volumeByDay.map(d => d.events);
    const n = events.length;
    const xSum = (n * (n + 1)) / 2;
    const x2Sum = (n * (n + 1) * (2 * n + 1)) / 6;
    const ySum = events.reduce((a, b) => a + b, 0);
    const xySum = events.reduce((sum, y, i) => sum + (i + 1) * y, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    const forecast = [];
    for (let i = 1; i <= daysAhead; i++) {
      const predicted = intercept + slope * (n + i);
      forecast.push({
        day: i,
        predicted_events: Math.max(0, Math.round(predicted)),
        confidence: this.getConfidenceLevel(volumeByDay),
      });
    }

    return {
      forecast,
      model: 'linear_regression',
      confidence_level: this.getConfidenceLevel(volumeByDay),
    };
  }

  getConfidenceLevel(data) {
    // Calculate coefficient of variation
    const mean = data.reduce((sum, d) => sum + d.events, 0) / data.length;
    const variance =
      data.reduce((sum, d) => sum + Math.pow(d.events - mean, 2), 0) /
      data.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    // Lower CV = higher confidence
    if (cv < 0.1) return 'high';
    if (cv < 0.3) return 'medium';
    return 'low';
  }

  // ========================================================================
  // COMPARISON
  // ========================================================================

  async compareEventTypes(userId, date) {
    const stats = await this.getEventTypeDistribution(userId, date);

    return stats.map(s => ({
      event_type: s.event_type,
      total_count: s.total_count,
      successful_deliveries: s.successful_deliveries,
      failed_deliveries: s.failed_deliveries,
      success_rate:
        Math.round(
          (s.successful_deliveries /
            (s.successful_deliveries + s.failed_deliveries)) *
            10000
        ) / 100,
      avg_latency_ms: s.avg_delivery_latency_ms,
    }));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let statisticsInstance = null;

export function getEventStatistics() {
  if (!statisticsInstance) {
    statisticsInstance = new EventStatistics();
  }
  return statisticsInstance;
}

export default {
  EventStatistics,
  getEventStatistics,
};
