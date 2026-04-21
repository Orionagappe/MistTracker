# MistTracker Analytics & Reporting System
## Phase 17.2.6: Complete Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Analytics Collector](#analytics-collector)
5. [Performance Metrics](#performance-metrics)
6. [Event Statistics](#event-statistics)
7. [Webhook Health Monitoring](#webhook-health-monitoring)
8. [API Reference](#api-reference)
9. [Dashboard Integration](#dashboard-integration)
10. [Best Practices](#best-practices)
11. [Deployment](#deployment)

---

## Overview

The MistTracker Analytics & Reporting System provides comprehensive monitoring, analysis, and insights into webhook delivery performance. It includes:

- **Real-time metrics collection** from all webhook deliveries
- **Performance analysis** including latency, success rates, and error patterns
- **Event statistics** with trends, forecasting, and comparisons
- **Webhook health monitoring** with anomaly detection and alerting
- **REST API** for programmatic access to all analytics data
- **Dashboard integration** for visual analytics and insights

### Key Features

✅ **Automatic Data Collection**: All delivery metrics captured automatically  
✅ **Real-time Monitoring**: Live health status and anomaly detection  
✅ **Historical Analysis**: Trends, patterns, and forecasting  
✅ **Performance Optimization**: Latency analysis and recommendations  
✅ **Error Tracking**: Detailed error breakdown and root cause analysis  
✅ **Team Health Overview**: Aggregate metrics across all webhooks  
✅ **Alerting System**: Configurable alerts for anomalies and critical issues  

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    REST API Endpoints                       │
│              (/api/v1/analytics/*)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌──────────┐
   │Dashboard│ │Analytics │ │  Client  │
   │Frontend │ │ Reports  │ │   Apps   │
   └────┬────┘ └────┬─────┘ └────┬─────┘
        │           │            │
        └───────────┼────────────┘
                    │
        ┌───────────▼──────────────────────┐
        │  Analytics API Router            │
        │  (server/routes/analytics.js)    │
        └───────┬──────────────────────────┘
                │
    ┌───────────┼───────────┬──────────────┐
    ▼           ▼           ▼              ▼
┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
│Analytics│ │Perf.    │ │Webhook   │ │Event     │
│Collector│ │Metrics  │ │Health    │ │Stats     │
└────┬────┘ └────┬────┘ └────┬─────┘ └────┬─────┘
     │           │           │           │
     └───────────┼───────────┼───────────┘
                 │
        ┌────────▼──────────────────┐
        │   Database                │
        │   (MongoDB/PostgreSQL)    │
        │                           │
        │  Collections/Tables:      │
        │  - webhook_metrics        │
        │  - event_stats            │
        │  - performance_trend      │
        │  - error_tracking         │
        └────────────────────────────┘
```

### Data Flow

1. **Collection**: Webhook deliveries → Analytics Collector captures metrics
2. **Storage**: Raw metrics stored in database (time-series optimized)
3. **Analysis**: Real-time and historical analysis performed on demand
4. **Delivery**: Results served via REST API and dashboard

---

## Core Components

### 1. Analytics Collector (`analytics-collector.js`)

Captures and stores all delivery metrics automatically.

**Responsibilities:**
- Intercept webhook deliveries before execution
- Capture timing, headers, payload size, response
- Track delivery outcome (success/failure)
- Calculate metrics (latency, retry count, etc.)
- Store in database with proper indexing

**Key Methods:**

```javascript
// Capture a delivery attempt
collector.recordDelivery({
  webhook_id: string,
  event_type: string,
  attempt: number,
  request_size_bytes: number,
  response_time_ms: number,
  http_status: number,
  success: boolean,
  error: string|null,
  retry_after: number|null,
  timestamp: ISO8601
})

// Get collection statistics
collector.getStatistics(userId, startDate, endDate)

// Aggregate by event type
collector.getEventTypeStats(userId, date)
```

### 2. Performance Metrics (`performance-metrics.js`)

Analyzes delivery performance and generates insights.

**Responsibilities:**
- Calculate success rates and latency percentiles
- Generate performance trends
- Track error patterns
- Compute health scores
- Compare performance across webhooks

**Key Methods:**

```javascript
// Get delivery statistics for a day
metrics.getDeliveryStats(webhookId, date)

// Calculate health score
metrics.getWebhookHealthScore(webhookId)

// Get percentile latencies (p50, p95, p99)
metrics.getLatencyPercentiles(webhookId, date)

// Break down errors by type
metrics.getErrorBreakdown(webhookId, date)

// Compare performance across webhooks
metrics.compareWebhooks(userId)
```

### 3. Event Statistics (`event-statistics.js`)

Analyzes event volume trends and patterns.

**Responsibilities:**
- Track event volume over time
- Analyze event type distribution
- Calculate success rates by event type
- Identify peak activity times
- Generate forecasts

**Key Methods:**

```javascript
// Get event volume for date range
statistics.getEventVolume(userId, startDate, endDate)

// Daily breakdown
statistics.getEventVolumeByDay(userId, startDate, endDate)

// Event type distribution
statistics.getEventTypeDistribution(userId, date)

// Hourly activity pattern
statistics.getHourlyPattern(userId, eventType, days)

// Forecast future volume
statistics.forecastEventVolume(userId, daysAhead)
```

### 4. Webhook Health Monitor (`webhook-health.js`)

Monitors webhook health and detects anomalies.

**Responsibilities:**
- Real-time health status monitoring
- Anomaly detection (success rate drops, latency spikes)
- Alert generation and management
- Health recommendations
- Continuous monitoring loop

**Key Methods:**

```javascript
// Get webhook health status
monitor.getWebhookStatus(webhookId)

// Get team-wide health
monitor.getTeamStatus(userId)

// Detect anomalies
monitor.detectAnomalies(webhookId)

// Get recommendations
monitor.getRecommendations(webhookId)

// Start continuous monitoring
monitor.startMonitoring()
```

---

## Analytics Collector

### Data Collection Flow

```
Webhook Delivery Request
         │
         ▼
  [Hook: Before Send]
  ├─ Record start time
  ├─ Capture request details
  └─ Note event metadata
         │
         ▼
  [Webhook HTTP Call]
  ├─ Record response time
  ├─ Capture response code
  ├─ Handle retry logic
  └─ Track attempt count
         │
         ▼
  [Hook: After Send]
  ├─ Calculate metrics
  ├─ Determine success
  ├─ Store in database
  └─ Update statistics
```

### Metrics Captured

For each delivery attempt, we capture:

```javascript
{
  // Identifiers
  webhook_id: string,
  user_id: string,
  event_type: string,
  
  // Timing
  timestamp: ISO8601,
  response_time_ms: number,
  
  // Request/Response
  request_size_bytes: number,
  response_size_bytes: number,
  http_status: number,
  
  // Status
  success: boolean,
  error: string|null,
  error_code: string|null,
  
  // Retry
  attempt: number,
  retry_after: number|null,
  
  // Performance
  connect_time_ms: number,
  ttfb_ms: number,  // Time to first byte
}
```

### Using the Collector

```javascript
import { getAnalyticsCollector } from './analytics/analytics-collector.js';

const collector = getAnalyticsCollector();

// Record a delivery
await collector.recordDelivery({
  webhook_id: webhook.id,
  event_type: 'user.created',
  attempt: 1,
  request_size_bytes: 1024,
  response_time_ms: 250,
  http_status: 200,
  success: true,
  error: null,
  timestamp: new Date().toISOString(),
});
```

---

## Performance Metrics

### Metrics Calculated

#### Delivery Statistics

```javascript
{
  total: 1000,              // Total deliveries
  successful: 950,          // Successful
  failed: 50,               // Failed
  pending: 0,               // Pending/queued
  success_rate: 95.0,       // Percentage
  
  // Latency
  min_latency_ms: 10,
  max_latency_ms: 5000,
  avg_latency_ms: 250,
  median_latency_ms: 200,
  p95_latency_ms: 800,
  p99_latency_ms: 2000,
}
```

#### Health Score

```
Health Score = (40 * success_rate) 
             + (30 * latency_score)  // 100 if < 500ms, down to 0 at 5000ms
             + (30 * availability)   // % of time endpoint responding

Score Ranges:
- 95+:  Excellent (✅)
- 85+:  Good (✅)
- 70+:  Fair (⚠️)
- 50+:  Poor (⚠️)
- <50:  Critical (❌)
```

#### Percentile Latencies

- **p50**: Median latency (50th percentile)
- **p95**: 95% of requests complete within this time
- **p99**: 99% of requests complete within this time

These help identify tail latencies and occasional slow requests.

### Error Classification

Errors are categorized as:

```javascript
{
  'timeout': 30,                // Request timeout
  'connection_refused': 15,     // Can't connect
  'certificate_error': 5,       // SSL/TLS error
  '500': 20,                    // Server error
  '429': 10,                    // Rate limited
  '404': 0,                     // Not found (usually fatal)
  'other': 0,                   // Other errors
}
```

### Accessing Metrics

```javascript
import { getPerformanceMetrics } from './analytics/performance-metrics.js';

const metrics = getPerformanceMetrics();

// Get stats for a webhook on a specific date
const stats = await metrics.getDeliveryStats('webhook-123', '2024-04-15');
console.log(`Success rate: ${stats.success_rate}%`);

// Get health score
const health = await metrics.getWebhookHealthScore('webhook-123');
console.log(`Status: ${health.status}`);

// Get trend over 7 days
const trend = await metrics.getPerformanceTrend('webhook-123', 7);
trend.forEach(day => {
  console.log(`${day.date}: ${day.success_rate}% success`);
});
```

---

## Event Statistics

### Event Volume Analysis

Track total events being delivered across all webhook deliveries:

```javascript
import { getEventStatistics } from './analytics/event-statistics.js';

const stats = getEventStatistics();

// Total volume for a date range
const volume = await stats.getEventVolume(
  userId,
  '2024-04-01',
  '2024-04-30'
);
// Returns: { total_events: 100000, avg_events_per_day: 3333 }

// Daily breakdown
const daily = await stats.getEventVolumeByDay(
  userId,
  '2024-04-01',
  '2024-04-30'
);
// Returns: [
//   { date: '2024-04-01', events: 3000 },
//   { date: '2024-04-02', events: 3500 },
//   ...
// ]
```

### Event Type Analysis

Understand which event types are most popular:

```javascript
// Get distribution for a date
const types = await stats.getEventTypeDistribution(
  userId,
  '2024-04-15'
);
// Returns: [
//   { event_type: 'user.created', total_count: 5000, success_rate: 98% },
//   { event_type: 'order.placed', total_count: 3000, success_rate: 95% },
//   ...
// ]

// Get top event types
const top = await stats.getTopEventTypes(userId, 10);
```

### Hourly Patterns

Identify when events peak:

```javascript
// Get hourly pattern for an event type (last 7 days)
const hourly = await stats.getHourlyPattern(
  userId,
  'user.created',
  7
);
// Returns: [
//   { hour: '00', count: 100, success_rate: 95 },
//   { hour: '01', count: 120, success_rate: 94 },
//   { hour: '09', count: 5000, success_rate: 98 },  // Peak hour
//   ...
// ]
```

### Forecasting

Predict future event volumes:

```javascript
// Forecast 7 days ahead
const forecast = await stats.forecastEventVolume(userId, 7);
// Returns: {
//   forecast: [
//     { day: 1, predicted_events: 3400, confidence: 'high' },
//     { day: 2, predicted_events: 3600, confidence: 'high' },
//     ...
//   ],
//   model: 'linear_regression',
//   confidence_level: 'high'
// }
```

---

## Webhook Health Monitoring

### Real-time Status

Get instant health snapshot:

```javascript
import { getWebhookHealthMonitor } from './analytics/webhook-health.js';

const monitor = getWebhookHealthMonitor();

const status = await monitor.getWebhookStatus('webhook-123');
// Returns:
// {
//   webhook_id: 'webhook-123',
//   status: 'good',  // excellent|good|fair|poor|critical
//   health_score: 87,
//   metrics: {
//     success_rate: 95.0,
//     avg_latency_ms: 250,
//     p95_latency_ms: 800,
//   },
//   top_errors: [
//     { error: 'timeout', count: 5 }
//   ],
//   alert: null  // or alert object if issues detected
// }
```

### Anomaly Detection

Automatically detect performance issues:

```javascript
const anomalies = await monitor.detectAnomalies('webhook-123');
// Returns:
// [
//   {
//     type: 'success_rate_drop',
//     severity: 'warning',
//     message: 'Success rate dropped from 98% to 78%',
//     threshold: 20  // Alert if drop > 20%
//   },
//   {
//     type: 'latency_spike',
//     severity: 'info',
//     message: 'Average latency increased from 250ms to 1500ms',
//     yesterday_ms: 250,
//     today_ms: 1500
//   }
// ]
```

### Health Recommendations

Get actionable advice:

```javascript
const recommendations = await monitor.getRecommendations('webhook-123');
// Returns:
// [
//   {
//     priority: 'high',
//     category: 'reliability',
//     title: 'Improve Success Rate',
//     message: 'Success rate is only 75%. Consider:',
//     actions: [
//       'Review most common errors',
//       'Increase retry attempts',
//       'Check if endpoint is accessible',
//       'Verify webhook secret matches your system'
//     ]
//   },
//   ...
// ]
```

### Alert Management

```javascript
// Get all active alerts
const alerts = monitor.getAllAlerts();

// Acknowledge an alert
monitor.acknowledgeAlert('webhook-123');

// Clear an alert
monitor.clearAlert('webhook-123');

// Get alerts for specific user
const userAlerts = monitor.getAlertsByUser(userId);
```

### Continuous Monitoring

Monitoring starts automatically when the monitor is initialized:

```javascript
// Called once on server startup
monitor.startMonitoring();

// Runs continuously:
// - Every 60 seconds, checks all active webhooks
// - Detects anomalies
// - Stores alerts
// - Emits warnings for critical issues
```

---

## API Reference

### Base URL

```
GET/POST /api/v1/analytics/...
```

**Authentication**: All endpoints require valid JWT token

### Event Statistics Endpoints

#### Get Event Volume

```
GET /api/v1/analytics/events/volume?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

**Response:**
```json
{
  "user_id": "user-123",
  "period": {
    "start": "2024-04-01",
    "end": "2024-04-30"
  },
  "data": {
    "total_events": 100000,
    "total_deliveries": 100000,
    "avg_events_per_day": 3333
  }
}
```

#### Get Daily Volume

```
GET /api/v1/analytics/events/daily?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

**Response:**
```json
{
  "user_id": "user-123",
  "period": { "start": "...", "end": "..." },
  "data": [
    { "date": "2024-04-01", "events": 3000, "webhooks": 2800 },
    { "date": "2024-04-02", "events": 3500, "webhooks": 3200 },
    ...
  ]
}
```

#### Get Event Types

```
GET /api/v1/analytics/events/types?date=YYYY-MM-DD
```

**Response:**
```json
{
  "user_id": "user-123",
  "date": "2024-04-15",
  "data": [
    {
      "event_type": "user.created",
      "total_count": 5000,
      "successful_deliveries": 4900,
      "failed_deliveries": 100
    },
    ...
  ]
}
```

#### Get Top Event Types

```
GET /api/v1/analytics/events/top?limit=10
```

#### Get Success Rates

```
GET /api/v1/analytics/events/success-rates?date=YYYY-MM-DD
```

#### Get Trends

```
GET /api/v1/analytics/events/trends?days=30
```

**Response:**
```json
{
  "user_id": "user-123",
  "days": 30,
  "period": { "start": "...", "end": "..." },
  "data": [ /* daily volumes */ ],
  "summary": {
    "first_period_avg_events": 3300,
    "second_period_avg_events": 3400,
    "trend": "increasing",
    "change_percent": 3.03
  }
}
```

#### Get Forecast

```
GET /api/v1/analytics/events/forecast?days_ahead=7
```

**Response:**
```json
{
  "user_id": "user-123",
  "days_ahead": 7,
  "forecast": [
    { "day": 1, "predicted_events": 3400, "confidence": "high" },
    { "day": 2, "predicted_events": 3600, "confidence": "high" },
    ...
  ],
  "model": "linear_regression",
  "confidence_level": "high"
}
```

#### Get Hourly Pattern

```
GET /api/v1/analytics/events/hourly?event_type=user.created&days=7
```

**Response:**
```json
{
  "user_id": "user-123",
  "event_type": "user.created",
  "days": 7,
  "data": [
    { "hour": "00", "count": 100, "success_rate": 95 },
    { "hour": "01", "count": 120, "success_rate": 94 },
    { "hour": "09", "count": 5000, "success_rate": 98 },
    ...
  ]
}
```

### Webhook Health Endpoints

#### Get Webhook Health

```
GET /api/v1/analytics/webhooks/health/:webhookId
```

**Response:**
```json
{
  "user_id": "user-123",
  "webhook_id": "webhook-123",
  "status": "good",
  "health_score": 87,
  "last_updated": "2024-04-15T10:30:00Z",
  "metrics": {
    "success_rate": 95.0,
    "total_deliveries": 1000,
    "successful": 950,
    "failed": 50,
    "avg_latency_ms": 250,
    "p95_latency_ms": 800,
    "p99_latency_ms": 2000
  },
  "top_errors": [
    { "error": "timeout", "count": 30 }
  ],
  "trend": "stable",
  "alert": null
}
```

#### Get Team Health

```
GET /api/v1/analytics/webhooks/health
```

**Response:**
```json
{
  "user_id": "user-123",
  "total_webhooks": 5,
  "webhooks": [ /* array of webhook statuses */ ],
  "summary": {
    "excellent": 2,
    "good": 2,
    "fair": 1,
    "poor": 0,
    "critical": 0,
    "avg_health_score": 85,
    "overall_health": "good"
  }
}
```

#### Get Recommendations

```
GET /api/v1/analytics/webhooks/recommendations/:webhookId
```

**Response:**
```json
{
  "webhook_id": "webhook-123",
  "recommendations": [
    {
      "priority": "high",
      "category": "reliability",
      "title": "Improve Success Rate",
      "message": "Success rate is only 75%. Consider:",
      "actions": [
        "Review most common errors",
        "Increase retry attempts",
        "Check if endpoint is accessible"
      ]
    },
    ...
  ]
}
```

#### Get Anomalies

```
GET /api/v1/analytics/webhooks/anomalies/:webhookId
```

**Response:**
```json
{
  "webhook_id": "webhook-123",
  "anomalies": [
    {
      "type": "success_rate_drop",
      "severity": "warning",
      "message": "Success rate dropped from 98% to 78%",
      "yesterday": 98,
      "today": 78,
      "threshold": 20
    }
  ],
  "detected_at": "2024-04-15T10:30:00Z"
}
```

#### Get Alerts

```
GET /api/v1/analytics/webhooks/alerts
```

**Response:**
```json
{
  "user_id": "user-123",
  "total": 2,
  "alerts": [
    {
      "webhook_id": "webhook-123",
      "user_id": "user-123",
      "anomalies": [ /* array of anomalies */ ],
      "detected_at": "2024-04-15T10:30:00Z",
      "acknowledged": false
    },
    ...
  ]
}
```

#### Acknowledge Alert

```
POST /api/v1/analytics/webhooks/alerts/:webhookId/acknowledge
```

**Response:**
```json
{
  "success": true,
  "message": "Alert acknowledged"
}
```

### Performance Metrics Endpoints

#### Get Performance Metrics

```
GET /api/v1/analytics/performance/metrics/:webhookId?date=YYYY-MM-DD
```

#### Get Performance Trend

```
GET /api/v1/analytics/performance/trend/:webhookId?days=7
```

#### Get Error Breakdown

```
GET /api/v1/analytics/performance/errors/:webhookId?date=YYYY-MM-DD
```

### Dashboard Overview

#### Get Complete Dashboard

```
GET /api/v1/analytics/dashboard
```

**Response:**
```json
{
  "user_id": "user-123",
  "generated_at": "2024-04-15T10:30:00Z",
  "period": {
    "start": "2024-04-08",
    "end": "2024-04-15"
  },
  "summary": {
    "total_events": 25000,
    "total_deliveries": 25000,
    "avg_daily_events": 3125,
    "webhook_health": {
      "excellent": 3,
      "good": 5,
      "fair": 1,
      "poor": 0,
      "critical": 0,
      "avg_health_score": 87,
      "overall_health": "good"
    }
  },
  "charts": {
    "daily_volume": [ /* 7 days of data */ ],
    "event_types": [ /* top event types */ ],
    "trends": {
      "first_period_avg_events": 3100,
      "second_period_avg_events": 3150,
      "trend": "stable",
      "change_percent": 1.61
    }
  },
  "top_errors": [ /* 5 most common errors */ ],
  "health_summary": { /* summary from above */ }
}
```

---

## Dashboard Integration

### Frontend Component Integration

```javascript
import axios from 'axios';

// Initialize analytics client
const analytics = {
  async getDashboard() {
    const response = await axios.get('/api/v1/analytics/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getWebhookStatus(webhookId) {
    const response = await axios.get(
      `/api/v1/analytics/webhooks/health/${webhookId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getEventTrends(days = 30) {
    const response = await axios.get(
      `/api/v1/analytics/events/trends?days=${days}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};

// Use in React component
export function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    analytics.getDashboard().then(setData);
  }, []);

  return (
    <div>
      <h1>Webhook Analytics Dashboard</h1>
      {data && (
        <>
          <HealthSummary health={data.health_summary} />
          <VolumeChart data={data.charts.daily_volume} />
          <EventTypeBreakdown data={data.charts.event_types} />
          <ErrorsList errors={data.top_errors} />
        </>
      )}
    </div>
  );
}
```

### Visualization Recommendations

**Charts to Display:**
- **Line Chart**: Daily event volume trend
- **Pie Chart**: Event type distribution
- **Bar Chart**: Error breakdown
- **Gauge/Radial**: Health score
- **Heat Map**: Hourly activity patterns
- **Sparkline**: Recent trend

**Real-time Updates:**
- Use WebSocket for live health status
- Poll `/webhooks/alerts` every 30 seconds
- Update anomaly indicators in real-time

---

## Best Practices

### 1. Data Retention

```javascript
// Archive old metrics monthly
const archiveMetrics = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Archive or delete
  await db.collection('webhook_metrics')
    .deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
};
```

### 2. Performance Optimization

**Index Strategy:**
```javascript
// Create indexes for fast queries
db.collection('webhook_metrics').createIndex({ user_id: 1, day: 1 });
db.collection('webhook_metrics').createIndex({ webhook_id: 1, timestamp: -1 });
db.collection('event_stats').createIndex({ user_id: 1, date: 1 });
```

**Query Optimization:**
```javascript
// Use aggregation pipeline for complex queries
const result = await db.collection('webhook_metrics')
  .aggregate([
    { $match: { user_id: userId, day: targetDate } },
    { $group: { _id: '$webhook_id', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ])
  .toArray();
```

### 3. Alert Fatigue Prevention

```javascript
const alertThresholds = {
  success_rate_drop: 0.20,       // 20% drop
  latency_spike: 2.0,            // 2x increase
  error_rate_increase: 0.15,     // 15% increase
  min_samples: 100               // Need 100+ samples before alerting
};

// Only alert if sufficient samples
if (stats.total < alertThresholds.min_samples) {
  return null;  // Not enough data
}
```

### 4. Caching Strategy

```javascript
const cache = new Map();
const CACHE_TTL = 60000;  // 1 minute

async function getCachedStats(key) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Fetch fresh data
  const data = await fetchStats(key);
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 5. Metric Aggregation

```javascript
// Aggregate metrics at different time scales
const aggregations = {
  // 1-minute buckets (realtime)
  minute: { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$timestamp' } },
  
  // 1-hour buckets (trends)
  hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } },
  
  // Daily buckets (historical)
  day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
};
```

---

## Deployment

### Environment Configuration

```javascript
// .env
ANALYTICS_ENABLED=true
ANALYTICS_COLLECTION_INTERVAL=1000    // 1 second
ANALYTICS_AGGREGATION_INTERVAL=300000 // 5 minutes
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_ALERT_CHECK_INTERVAL=60000   // 1 minute
ANALYTICS_DB_POOL_SIZE=20
```

### Database Setup

**MongoDB:**
```javascript
// Initialize collections and indexes
const initMongoDB = async (db) => {
  // Create collections
  await db.createCollection('webhook_metrics', {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'minutes'
    }
  });

  // Create indexes
  await db.collection('webhook_metrics')
    .createIndex({ 'metadata.user_id': 1, 'metadata.webhook_id': 1 });
  
  await db.collection('event_stats')
    .createIndex({ user_id: 1, date: 1 });
};
```

**PostgreSQL:**
```sql
-- Create tables
CREATE TABLE webhook_metrics (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  webhook_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  response_time_ms INT,
  http_status INT,
  success BOOLEAN,
  error VARCHAR(255)
);

CREATE TABLE event_stats (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_count INT,
  successful_deliveries INT,
  failed_deliveries INT
);

-- Create indexes
CREATE INDEX idx_webhook_metrics_user_day 
  ON webhook_metrics(user_id, DATE(timestamp));

CREATE INDEX idx_event_stats_user_date 
  ON event_stats(user_id, date);
```

### Server Integration

```javascript
// server.js
import express from 'express';
import analyticsRouter from './routes/analytics.js';
import { getAnalyticsCollector } from './analytics/analytics-collector.js';
import { getWebhookHealthMonitor } from './analytics/webhook-health.js';

const app = express();

// Mount analytics routes
app.use('/api/v1/analytics', analyticsRouter);

// Start analytics services on server startup
app.listen(3000, async () => {
  console.log('Server started');
  
  // Initialize analytics
  const collector = getAnalyticsCollector();
  await collector.initialize();
  
  const monitor = getWebhookHealthMonitor();
  // monitor.startMonitoring();  // Starts automatically in constructor
  
  console.log('✅ Analytics system initialized');
});
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server

ENV NODE_ENV=production
ENV ANALYTICS_ENABLED=true
ENV ANALYTICS_RETENTION_DAYS=90

EXPOSE 3000

CMD ["node", "server/index.js"]
```

### Monitoring the Analytics System

```javascript
// Health check endpoint
app.get('/health/analytics', async (req, res) => {
  try {
    const collector = getAnalyticsCollector();
    const monitor = getWebhookHealthMonitor();
    
    const status = {
      collector: {
        active: true,
        queued_items: collector.getQueueSize(),
        last_flush: collector.getLastFlushTime()
      },
      monitor: {
        active: true,
        active_alerts: monitor.getAllAlerts().length,
        monitored_webhooks: await collector.getWebhookCount()
      }
    };
    
    res.json({ status: 'ok', analytics: status });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});
```

---

## Performance Considerations

### Database Query Optimization

**Slow Query Patterns to Avoid:**
```javascript
// ❌ BAD: Full collection scan
await collection.find({ success: true }).toArray();

// ✅ GOOD: Use indexed fields
await collection.find({
  user_id: userId,
  webhook_id: webhookId,
  timestamp: { $gte: startTime, $lte: endTime }
}).toArray();
```

### Aggregation Pipeline Performance

```javascript
// ✅ GOOD: Filter early, group efficiently
const result = await collection.aggregate([
  // 1. Filter on indexed fields first
  { $match: { user_id, timestamp: { $gte, $lte } } },
  
  // 2. Project only needed fields
  { $project: { webhook_id: 1, response_time: 1, success: 1 } },
  
  // 3. Group
  { $group: { _id: '$webhook_id', count: { $sum: 1 } } },
  
  // 4. Sort
  { $sort: { count: -1 } },
  
  // 5. Limit
  { $limit: 10 }
]).toArray();
```

---

## Troubleshooting

### High Memory Usage

**Cause**: Large result sets loaded into memory  
**Solution**: Use pagination and streaming

```javascript
async function* streamMetrics(userId) {
  const cursor = collection.find({ user_id: userId }).batchSize(1000);
  for await (const doc of cursor) {
    yield doc;
  }
}
```

### Slow Analytics Queries

**Cause**: Missing indexes or scanning large collections  
**Solution**: Add appropriate indexes

```javascript
// Add missing index
db.collection('webhook_metrics').createIndex({
  user_id: 1,
  webhook_id: 1,
  timestamp: -1
});
```

### Anomaly Alerts Not Triggering

**Cause**: Insufficient historical data  
**Solution**: Check min_samples threshold

```javascript
// Ensure sufficient data before alerting
if (stats.samples < 100) {
  console.log('Not enough data for reliable anomaly detection');
  return [];
}
```

---

## Summary

The MistTracker Analytics & Reporting System provides:

✅ **Comprehensive metrics collection** from all webhook deliveries  
✅ **Real-time health monitoring** with anomaly detection  
✅ **Historical analysis** for trends and patterns  
✅ **Predictive forecasting** for capacity planning  
✅ **REST API** for programmatic access  
✅ **Dashboard integration** for visual analytics  
✅ **Alert management** for proactive monitoring  

For questions or issues, refer to the main MistTracker documentation.
