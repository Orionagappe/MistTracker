# MistTracker Analytics System - Quick Reference
## Phase 17.2.6: Implementation Guide

---

## 🚀 Quick Start

### Initialize Analytics

```javascript
import { getAnalyticsCollector } from './analytics/analytics-collector.js';
import { getPerformanceMetrics } from './analytics/performance-metrics.js';
import { getEventStatistics } from './analytics/event-statistics.js';
import { getWebhookHealthMonitor } from './analytics/webhook-health.js';

// Start collecting metrics (automatic)
const collector = getAnalyticsCollector();

// Enable health monitoring (automatic)
const monitor = getWebhookHealthMonitor();

// Access statistics and metrics on demand
const metrics = getPerformanceMetrics();
const stats = getEventStatistics();
```

### Setup Routes

```javascript
import analyticsRouter from './routes/analytics.js';

app.use('/api/v1/analytics', analyticsRouter);
```

---

## 📊 Core Metrics at a Glance

| Metric | Description | Example |
|--------|-------------|---------|
| **Success Rate** | % of successful deliveries | 95.5% |
| **Avg Latency** | Mean response time | 250ms |
| **P95 Latency** | 95th percentile response time | 800ms |
| **Health Score** | Overall webhook health (0-100) | 87/100 |
| **Error Rate** | % of failed deliveries | 4.5% |
| **Throughput** | Events per second | 100 eps |

---

## 🎯 Common Use Cases

### 1. Get Webhook Status

```javascript
const status = await monitor.getWebhookStatus('webhook-123');
console.log(`Status: ${status.status}, Score: ${status.health_score}`);
```

**Response:**
```javascript
{
  webhook_id: 'webhook-123',
  status: 'good',
  health_score: 87,
  metrics: {
    success_rate: 95.0,
    avg_latency_ms: 250,
    p95_latency_ms: 800
  }
}
```

### 2. Check for Issues

```javascript
const anomalies = await monitor.detectAnomalies('webhook-123');
if (anomalies.length > 0) {
  console.warn('Issues detected:', anomalies);
}
```

### 3. Get Team Overview

```javascript
const health = await monitor.getTeamStatus(userId);
console.log(`${health.summary.excellent} webhooks in excellent condition`);
console.log(`Overall health: ${health.summary.overall_health}`);
```

### 4. Analyze Event Trends

```javascript
const trends = await stats.getTrends(userId, 30);
console.log(`30-day trend: ${trends.summary.trend}`);
console.log(`Change: ${trends.summary.change_percent}%`);
```

### 5. Forecast Volume

```javascript
const forecast = await stats.forecastEventVolume(userId, 7);
forecast.forecast.forEach(day => {
  console.log(`Day ${day.day}: ~${day.predicted_events} events`);
});
```

### 6. Identify Peak Times

```javascript
const hourly = await stats.getHourlyPattern(userId, 'user.created', 7);
const peak = hourly.reduce((max, curr) => 
  curr.count > max.count ? curr : max
);
console.log(`Peak hour: ${peak.hour}:00 (${peak.count} events)`);
```

### 7. Get Recommendations

```javascript
const recommendations = await monitor.getRecommendations('webhook-123');
recommendations.forEach(rec => {
  console.log(`[${rec.priority}] ${rec.title}`);
  rec.actions.forEach(action => console.log(`  - ${action}`));
});
```

---

## 📈 API Endpoint Cheat Sheet

### Events
```
GET /api/v1/analytics/events/volume?start_date=2024-04-01&end_date=2024-04-30
GET /api/v1/analytics/events/daily?start_date=2024-04-01&end_date=2024-04-30
GET /api/v1/analytics/events/types?date=2024-04-15
GET /api/v1/analytics/events/top?limit=10
GET /api/v1/analytics/events/success-rates?date=2024-04-15
GET /api/v1/analytics/events/trends?days=30
GET /api/v1/analytics/events/forecast?days_ahead=7
GET /api/v1/analytics/events/hourly?event_type=user.created&days=7
```

### Health
```
GET /api/v1/analytics/webhooks/health/:webhookId
GET /api/v1/analytics/webhooks/health
GET /api/v1/analytics/webhooks/recommendations/:webhookId
GET /api/v1/analytics/webhooks/anomalies/:webhookId
GET /api/v1/analytics/webhooks/alerts
POST /api/v1/analytics/webhooks/alerts/:webhookId/acknowledge
```

### Performance
```
GET /api/v1/analytics/performance/metrics/:webhookId?date=2024-04-15
GET /api/v1/analytics/performance/trend/:webhookId?days=7
GET /api/v1/analytics/performance/errors/:webhookId?date=2024-04-15
```

### Dashboard
```
GET /api/v1/analytics/dashboard
```

---

## 🔔 Alert Types & Thresholds

| Alert Type | Threshold | Severity | Action |
|-----------|-----------|----------|--------|
| Success Rate Drop | >20% drop | ⚠️ Warning | Review errors, check endpoint |
| Latency Spike | 2x increase | ℹ️ Info | Check server resources |
| Error Rate Increase | >15% increase | ⚠️ Warning | Investigate error type |
| Endpoint Timeout | Repeated | ❌ Critical | May need deactivation |

---

## 💾 Data Retention & Archival

```javascript
// Keep metrics for 90 days
const RETENTION_DAYS = 90;

// Archive older data monthly
const archiveDate = new Date();
archiveDate.setDate(archiveDate.getDate() - RETENTION_DAYS);

await collection.deleteMany({
  timestamp: { $lt: archiveDate }
});
```

---

## 🔧 Database Indexes (Critical for Performance)

### MongoDB
```javascript
// Create these indexes immediately
db.webhook_metrics.createIndex({ user_id: 1, day: 1 });
db.webhook_metrics.createIndex({ webhook_id: 1, timestamp: -1 });
db.event_stats.createIndex({ user_id: 1, date: 1 });
```

### PostgreSQL
```sql
CREATE INDEX idx_webhook_metrics_user_day 
  ON webhook_metrics(user_id, DATE(timestamp));

CREATE INDEX idx_event_stats_user_date 
  ON event_stats(user_id, date);
```

---

## 🎨 Dashboard Component Examples

### React Hook for Dashboard Data

```javascript
function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/v1/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(await response.json());
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);  // Refresh every minute
    return () => clearInterval(interval);
  }, [token]);

  return { data, loading };
}
```

### Health Status Badge

```javascript
function HealthBadge({ status }) {
  const colors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-orange-500',
    critical: 'bg-red-500'
  };

  const icons = {
    excellent: '✅',
    good: '✅',
    fair: '⚠️',
    poor: '⚠️',
    critical: '❌'
  };

  return (
    <span className={`${colors[status]} px-3 py-1 rounded-full`}>
      {icons[status]} {status.toUpperCase()}
    </span>
  );
}
```

### Performance Chart

```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function PerformanceChart({ data }) {
  return (
    <LineChart data={data} width={800} height={300}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line 
        type="monotone" 
        dataKey="events" 
        stroke="#8884d8" 
        dot={false}
      />
    </LineChart>
  );
}
```

---

## 🧪 Testing Analytics

### Unit Test Example

```javascript
import { getEventStatistics } from '../analytics/event-statistics.js';

describe('EventStatistics', () => {
  const stats = getEventStatistics();

  test('should calculate event volume correctly', async () => {
    const volume = await stats.getEventVolume(
      'test-user',
      '2024-04-01',
      '2024-04-30'
    );
    
    expect(volume).toHaveProperty('total_events');
    expect(volume).toHaveProperty('avg_events_per_day');
  });

  test('should detect trends', async () => {
    const trends = await stats.getTrends('test-user', 30);
    
    expect(trends).toHaveProperty('summary');
    expect(['increasing', 'decreasing', 'stable']).toContain(
      trends.summary.trend
    );
  });
});
```

### Integration Test Example

```javascript
describe('Analytics API', () => {
  test('GET /api/v1/analytics/webhooks/health', async () => {
    const response = await request(app)
      .get('/api/v1/analytics/webhooks/health/webhook-123')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('health_score');
    expect(response.body).toHaveProperty('metrics');
  });
});
```

---

## 📋 Troubleshooting Guide

### Issue: Alerts Not Showing

**Diagnosis:**
```javascript
const monitor = getWebhookHealthMonitor();
const alerts = monitor.getAllAlerts();
console.log(`Active alerts: ${alerts.length}`);
```

**Solution:**
- Ensure monitoring has started: `monitor.startMonitoring()`
- Check webhook has enough delivery history (>100 samples)
- Verify thresholds in `anomalyThresholds` object

### Issue: Slow Analytics Queries

**Diagnosis:**
```javascript
// Check if indexes exist
db.collection('webhook_metrics').getIndexes()
```

**Solution:**
- Create missing indexes (see Database Indexes above)
- Reduce date range in queries
- Aggregate data at lower frequency (hourly vs. minute)

### Issue: High Memory Usage

**Diagnosis:**
```javascript
console.log('Memory usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
```

**Solution:**
- Enable data archival/cleanup
- Use pagination with `.limit()` and `.skip()`
- Stream large result sets instead of loading all at once

### Issue: Missing Data

**Diagnosis:**
```javascript
const stats = await metrics.getDeliveryStats('webhook-123', '2024-04-15');
console.log('Total deliveries recorded:', stats.total);
```

**Solution:**
- Verify analytics collector is running
- Check webhook is marked as active
- Ensure database connection is working
- Look for collection errors in logs

---

## 🔐 Security Considerations

### Authentication
- All analytics endpoints require valid JWT token
- Analytics data scoped to authenticated user

### Authorization
- Users can only access their own analytics
- No cross-user data leakage possible

### Data Protection
- Sensitive data (error messages, payloads) should be truncated
- Consider encryption for sensitive metrics
- Audit access to analytics data

---

## 📊 Performance Tips

### 1. Use Aggregation Pipeline
```javascript
// ✅ Fast - aggregates on server
const result = await collection.aggregate(pipeline).toArray();

// ❌ Slow - aggregates in Node.js
const all = await collection.find().toArray();
const result = aggregateInJs(all);
```

### 2. Pre-aggregate at Collection Time
```javascript
// Store pre-aggregated hourly stats
const hourlyStats = {
  hour: '2024-04-15T10:00:00Z',
  total_count: 1000,
  success_count: 950,
  avg_latency: 250
};
```

### 3. Use Caching
```javascript
const cache = new Map();

async function getCachedStatus(webhookId) {
  if (cache.has(webhookId)) {
    const { data, time } = cache.get(webhookId);
    if (Date.now() - time < 60000) return data;  // 1 min cache
  }
  
  const data = await fetchStatus(webhookId);
  cache.set(webhookId, { data, time: Date.now() });
  return data;
}
```

---

## 📚 File Structure

```
server/
├── analytics/
│   ├── analytics-collector.js      # Main collection engine
│   ├── performance-metrics.js      # Performance analysis
│   ├── event-statistics.js         # Event volume analysis
│   ├── webhook-health.js           # Health monitoring
│   └── config.js                   # Configuration
├── routes/
│   └── analytics.js                # REST API endpoints
└── database/
    └── schema/
        └── analytics-schema.js     # Database schema
```

---

## 🚢 Deployment Checklist

- [ ] Create database indexes
- [ ] Set `ANALYTICS_ENABLED=true` in environment
- [ ] Configure retention period (typically 90 days)
- [ ] Mount analytics router in Express app
- [ ] Start health monitoring service
- [ ] Configure alerts and notification channels
- [ ] Set up data archival/cleanup jobs
- [ ] Test analytics endpoints
- [ ] Monitor memory usage
- [ ] Set up analytics API rate limiting
- [ ] Document custom metrics for team
- [ ] Configure dashboard visualizations

---

## 📞 Support & Resources

**Documentation Files:**
- [ANALYTICS-DOCUMENTATION.md](./ANALYTICS-DOCUMENTATION.md) - Comprehensive guide
- [database-schema.sql](./database-schema.sql) - SQL schema
- [docker-compose.yml](./docker-compose.yml) - Docker setup

**Source Files:**
- `server/analytics/analytics-collector.js`
- `server/analytics/performance-metrics.js`
- `server/analytics/event-statistics.js`
- `server/analytics/webhook-health.js`
- `server/routes/analytics.js`

**API Playground:**
```bash
# Get dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/analytics/dashboard

# Get webhook health
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/analytics/webhooks/health/webhook-123

# Get event trends
curl -H "Authorization: Bearer $TOKEN" \
  'http://localhost:3000/api/v1/analytics/events/trends?days=30'
```

---

## 🎓 Learning Path

1. **Start**: Read API endpoint cheat sheet
2. **Explore**: Test endpoints in API playground
3. **Integrate**: Add analytics to dashboard
4. **Optimize**: Implement caching and pre-aggregation
5. **Monitor**: Set up alerts and dashboards
6. **Scale**: Archive old data and optimize queries

---

Last Updated: Phase 17.2.6  
Version: 1.0.0  
Status: Production Ready ✅
