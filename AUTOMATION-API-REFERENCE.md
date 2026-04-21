# Automation Engine API Reference

**Phase 17.4 Week 2 - Complete API Documentation**  
**Version:** 1.0.0  
**Status:** Production Ready  

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Auto-Remediation API](#auto-remediation-api)
3. [Webhook Routing API](#webhook-routing-api)
4. [Circuit Breaker API](#circuit-breaker-api)
5. [Bulkhead API](#bulkhead-api)
6. [Alert API](#alert-api)
7. [Escalation API](#escalation-api)
8. [System API](#system-api)

---

## Getting Started

### Installation

```javascript
// Import all services
const AutoRemediationEngine = require('./auto-remediation');
const IntelligentWebhookRouter = require('./intelligent-router');
const CircuitBreaker = require('./circuit-breaker');
const BulkheadManager = require('./bulkhead-manager');
const AlertManager = require('./alert-manager');
const EscalationEngine = require('./escalation-engine');
const AutomationRoutes = require('./automation-routes');

// Initialize
const remediation = new AutoRemediationEngine();
const router = new IntelligentWebhookRouter();
const breaker = new CircuitBreaker();
const bulkhead = new BulkheadManager();
const alerts = new AlertManager();
const escalation = new EscalationEngine();

// Setup routes
const routes = new AutomationRoutes({
  autoRemediation: remediation,
  intelligentRouter: router,
  circuitBreaker: breaker,
  bulkheadManager: bulkhead,
  alertManager: alerts,
  escalationEngine: escalation
});
```

### Configuration

```javascript
// Auto-Remediation
const remediation = new AutoRemediationEngine({
  enabled: true,
  maxRetries: 3,
  decayFactor: 0.8,
  timeout: 30000,
  parallelExecutions: 3
});

// Router
const router = new IntelligentWebhookRouter({
  healthCheckInterval: 30000,
  weightingStrategy: 'combined',
  maxHistorySize: 50000
});

// Circuit Breaker
const breaker = new CircuitBreaker({
  failureThreshold: 50,
  successThreshold: 5,
  timeout: 60000,
  halfOpenMaxCalls: 3
});

// Bulkhead
const bulkhead = new BulkheadManager({
  defaultMaxConcurrent: 10,
  defaultQueueSize: 100,
  defaultTimeout: 30000
});

// Alert Manager
const alerts = new AlertManager({
  maxHistorySize: 50000
});

// Escalation Engine
const escalation = new EscalationEngine({
  maxHistorySize: 10000,
  notificationDelay: 1000
});
```

---

## Auto-Remediation API

### executeRemediation(issue, context)

Execute automatic remediation for detected issue.

**Parameters:**
- `issue` (Object): Issue details
  - `id` (string): Unique issue identifier
  - `type` (string): Issue type (HIGH_LATENCY, HIGH_ERROR_RATE, DATABASE_OVERLOAD, etc.)
  - `severity` (string): CRITICAL, HIGH, MEDIUM, LOW
  - `affectedService` (string): Service identifier
- `context` (Object, optional): Additional context
  - `mlPrediction` (Object): ML-guided recommendations
  - `metadata` (Object): Custom metadata

**Returns:** Promise<Object>
- `success` (boolean): Execution success
- `remediationId` (string): Unique remediation identifier
- `strategy` (string): Selected remediation strategy
- `actions` (Array): Executed actions
- `duration` (number): Execution time in ms
- `recoveryConfidence` (number): 0-1 confidence score

**Example:**
```javascript
const result = await remediation.executeRemediation({
  id: 'issue-1',
  type: 'HIGH_LATENCY',
  severity: 'HIGH',
  affectedService: 'api-v2'
}, {
  mlPrediction: { recommendedActions: ['scale_up'] }
});
```

---

### selectRemediationStrategy(issue, context)

Select best remediation strategy without executing.

**Parameters:**
- `issue` (Object): Issue object
- `context` (Object, optional): Additional context

**Returns:** Object
- `name` (string): Strategy name
- `actions` (Array): Action names
- `confidence` (number): Success confidence
- `score` (number): Calculated score

**Example:**
```javascript
const strategy = remediation.selectRemediationStrategy({
  type: 'HIGH_ERROR_RATE',
  severity: 'HIGH'
});

console.log(strategy);
// {
//   name: 'fallback_service',
//   actions: ['fallback'],
//   confidence: 0.8,
//   score: 0.84
// }
```

---

### getRemediationHistory(filters)

Get historical remediation attempts.

**Parameters:**
- `filters` (Object, optional)
  - `issueType` (string): Filter by issue type
  - `successful` (boolean): Filter by success
  - `since` (Date): Filter by date
  - `limit` (number): Maximum results

**Returns:** Array of remediation records

**Example:**
```javascript
const history = remediation.getRemediationHistory({
  issueType: 'HIGH_LATENCY',
  successful: true,
  limit: 10
});
```

---

### getMetrics()

Get auto-remediation metrics.

**Returns:** Object
- `totalAttempted` (number)
- `totalSuccessful` (number)
- `totalFailed` (number)
- `successRate` (number): Percentage
- `averageRecoveryTime` (number): Milliseconds

**Example:**
```javascript
const metrics = remediation.getMetrics();
// {
//   totalAttempted: 45,
//   totalSuccessful: 38,
//   totalFailed: 7,
//   successRate: 84.44,
//   averageRecoveryTime: 245
// }
```

---

## Webhook Routing API

### registerEndpoint(id, config)

Register webhook endpoint.

**Parameters:**
- `id` (string): Endpoint identifier
- `config` (Object)
  - `url` (string): Endpoint URL
  - `weight` (number, optional): 0.1-10.0, default 1.0
  - `priority` (number, optional): 1-10, default 5

**Returns:** Object with success status

**Example:**
```javascript
router.registerEndpoint('api-1', {
  url: 'https://api1.company.com/webhooks',
  weight: 1.0,
  priority: 10
});
```

---

### routeWebhook(webhook, context)

Route webhook to best endpoint.

**Parameters:**
- `webhook` (Object)
  - `id` (string): Webhook identifier
  - `data` (Object): Webhook payload
- `context` (Object, optional): Routing context

**Returns:** Object
- `success` (boolean)
- `selectedEndpoint` (string)
- `url` (string)
- `estimatedSuccessRate` (number): Percentage
- `estimatedLatency` (string): "120ms"

**Example:**
```javascript
const routing = router.routeWebhook({ id: 'wh-1' });

if (routing.success) {
  await fetch(routing.url, {
    method: 'POST',
    body: JSON.stringify(webhookData)
  });
}
```

---

### recordDelivery(delivery)

Record webhook delivery outcome.

**Parameters:**
- `delivery` (Object)
  - `endpointId` (string): Endpoint identifier
  - `webhookId` (string): Webhook identifier
  - `successful` (boolean): Delivery success
  - `latency` (number): Response time in ms
  - `statusCode` (number): HTTP status

**Example:**
```javascript
router.recordDelivery({
  endpointId: 'api-1',
  webhookId: 'wh-1',
  successful: true,
  latency: 145,
  statusCode: 200
});
```

---

### checkAllEndpointsHealth()

Health check all registered endpoints.

**Returns:** Promise<Array>
- Per endpoint:
  - `endpointId` (string)
  - `healthy` (boolean)
  - `statusCode` (number)
  - `latency` (number)

**Example:**
```javascript
const results = await router.checkAllEndpointsHealth();

results.forEach(check => {
  console.log(`${check.endpointId}: ${check.healthy ? 'UP' : 'DOWN'}`);
});
```

---

### setRoutingStrategy(strategy)

Set routing algorithm.

**Parameters:**
- `strategy` (string): 'success_rate', 'latency', 'combined', 'round_robin'

**Returns:** Object with success status

**Example:**
```javascript
router.setRoutingStrategy('combined'); // Uses 60% success, 40% latency
```

---

### getRoutingMetrics()

Get routing statistics.

**Returns:** Object
- `totalRequests` (number)
- `totalSuccessful` (number)
- `totalFailed` (number)
- `successRate` (number): Percentage
- `averageLatency` (number): Milliseconds

---

## Circuit Breaker API

### createCircuit(serviceId, config)

Create circuit breaker for service.

**Parameters:**
- `serviceId` (string): Service identifier
- `config` (Object, optional)
  - `failureThreshold` (number): 0-100, default 50
  - `successThreshold` (number): default 5
  - `timeout` (number): Milliseconds before HALF_OPEN
  - `service` (string): Service name

**Returns:** Object
- `success` (boolean)
- `circuitId` (string)
- `state` (string): 'CLOSED'

**Example:**
```javascript
breaker.createCircuit('api-service', {
  failureThreshold: 50,
  successThreshold: 5,
  timeout: 60000
});
```

---

### execute(circuitId, fn, context)

Execute function with circuit protection.

**Parameters:**
- `circuitId` (string): Circuit identifier
- `fn` (Function): Async function to execute
- `context` (Object, optional): Execution context

**Returns:** Promise
- Resolves with function result
- Rejects if circuit is OPEN

**Example:**
```javascript
try {
  const result = await breaker.execute('api-service', async () => {
    return await apiCall();
  });
} catch (error) {
  // Circuit OPEN or function failed
  console.log('Request rejected:', error.message);
}
```

---

### getCircuitStatus(circuitId)

Get circuit state and metrics.

**Returns:** Object
- `id` (string)
- `state` (string): CLOSED, OPEN, HALF_OPEN
- `failureCount` (number)
- `successCount` (number)
- `totalRequests` (number)
- `failureRate` (string): Percentage

**Example:**
```javascript
const status = breaker.getCircuitStatus('api-service');

console.log(`Circuit: ${status.state}`);
console.log(`Failure Rate: ${status.failureRate}`);
```

---

### resetCircuit(circuitId)

Force circuit to CLOSED state.

**Returns:** Object with success status

**Example:**
```javascript
breaker.resetCircuit('api-service');
```

---

## Bulkhead API

### createBulkhead(bulkheadId, config)

Create resource isolation pool.

**Parameters:**
- `bulkheadId` (string): Bulkhead identifier
- `config` (Object, optional)
  - `maxConcurrent` (number): Default 10
  - `maxQueue` (number): Default 100
  - `timeout` (number): Milliseconds

**Returns:** Object with success status

**Example:**
```javascript
bulkhead.createBulkhead('api-queue', {
  maxConcurrent: 20,
  maxQueue: 100,
  timeout: 30000
});
```

---

### submitTask(bulkheadId, task, options)

Submit task for execution in bulkhead.

**Parameters:**
- `bulkheadId` (string): Bulkhead identifier
- `task` (Function): Async function
- `options` (Object, optional)
  - `priority` (number): 0-10, default 0

**Returns:** Promise
- Resolves with task result
- Rejects if queue full or timeout

**Example:**
```javascript
try {
  const result = await bulkhead.submitTask(
    'api-queue',
    async () => {
      return await heavyComputation();
    },
    { priority: 5 }
  );
} catch (error) {
  console.log('Task rejected:', error.message);
}
```

---

### getBulkheadStatus(bulkheadId)

Get bulkhead utilization.

**Returns:** Object
- `id` (string)
- `config` (Object): maxConcurrent, maxQueue, timeout
- `current` (Object)
  - `activeCount` (number)
  - `queuedCount` (number)
  - `utilizationPercent` (number)

**Example:**
```javascript
const status = bulkhead.getBulkheadStatus('api-queue');

console.log(`Utilization: ${status.current.utilizationPercent}%`);
console.log(`Queued: ${status.current.queuedCount}`);
```

---

### adjustCapacity(bulkheadId, config)

Dynamically adjust bulkhead capacity.

**Parameters:**
- `bulkheadId` (string)
- `config` (Object)
  - `maxConcurrent` (number)
  - `maxQueue` (number)
  - `timeout` (number)

**Example:**
```javascript
bulkhead.adjustCapacity('api-queue', {
  maxConcurrent: 30,
  maxQueue: 150
});
```

---

## Alert API

### createAlert(alertData)

Create new alert.

**Parameters:**
- `alertData` (Object)
  - `title` (string): Alert title
  - `description` (string, optional)
  - `severity` (string): CRITICAL, HIGH, MEDIUM, LOW
  - `source` (string): Alert source
  - `service` (string): Affected service
  - `tags` (Array, optional)

**Returns:** Object
- `id` (string): Alert identifier
- `status` (string): 'OPEN'
- `suppressed` (boolean)

**Example:**
```javascript
const alert = alerts.createAlert({
  title: 'High CPU Usage',
  severity: 'HIGH',
  source: 'monitor',
  service: 'api-v2'
});
```

---

### addSuppressionRule(ruleData)

Add alert suppression rule.

**Parameters:**
- `ruleData` (Object)
  - `name` (string): Rule name
  - `severity` (Array, optional): ['HIGH', 'CRITICAL']
  - `service` (string, optional)
  - `tags` (Array, optional)
  - `titlePattern` (string, optional): Regex pattern
  - `duration` (number, optional): Milliseconds

**Example:**
```javascript
alerts.addSuppressionRule({
  name: 'Dev Maintenance',
  severity: ['HIGH', 'CRITICAL'],
  service: 'dev-api',
  duration: 3600000 // 1 hour
});
```

---

### acknowledgeAlert(alertId, ackData)

Acknowledge alert.

**Parameters:**
- `alertId` (string)
- `ackData` (Object)
  - `acknowledgedBy` (string)
  - `comment` (string, optional)

**Returns:** Object with success status

**Example:**
```javascript
alerts.acknowledgeAlert(alert.id, {
  acknowledgedBy: 'ops-team',
  comment: 'Investigating'
});
```

---

### resolveAlert(alertId, resolveData)

Resolve alert.

**Parameters:**
- `alertId` (string)
- `resolveData` (Object)
  - `resolvedBy` (string)
  - `resolution` (string)

**Example:**
```javascript
alerts.resolveAlert(alert.id, {
  resolvedBy: 'ops-team',
  resolution: 'Restarted service'
});
```

---

### getActiveAlerts(filters)

Get active alerts.

**Parameters:**
- `filters` (Object, optional)
  - `severity` (string)
  - `service` (string)
  - `suppressed` (boolean)

**Returns:** Array of alerts

**Example:**
```javascript
const criticalAlerts = alerts.getActiveAlerts({
  severity: 'CRITICAL'
});
```

---

### getMetrics()

Get alert metrics.

**Returns:** Object
- `totalAlerts` (number)
- `suppressedAlerts` (number)
- `activeAlerts` (number)
- `resolvedAlerts` (number)

---

## Escalation API

### createEscalationChain(chainId, config)

Create escalation chain.

**Parameters:**
- `chainId` (string): Chain identifier
- `config` (Object)
  - `name` (string)
  - `levels` (Array)
    - `level` (number): 0-N
    - `delay` (number): Milliseconds
    - `teams` (Array): Team names
    - `repeat` (boolean, optional)

**Example:**
```javascript
escalation.createEscalationChain('critical', {
  name: 'Critical Response',
  levels: [
    { level: 0, delay: 0, teams: ['ops'] },
    { level: 1, delay: 300000, teams: ['ops-lead'] },
    { level: 2, delay: 900000, teams: ['director'] }
  ]
});
```

---

### startEscalation(alert, chainId)

Start escalation for alert.

**Parameters:**
- `alert` (Object)
  - `id` (string)
  - `severity` (string)
- `chainId` (string)

**Returns:** Object
- `success` (boolean)
- `escalationId` (string)
- `notificationsScheduled` (number)

**Example:**
```javascript
const esc = escalation.startEscalation(
  { id: 'alert-1', severity: 'CRITICAL' },
  'critical'
);
```

---

### escalateToNextLevel(escalationId, chainId)

Manually escalate to next level.

**Parameters:**
- `escalationId` (string)
- `chainId` (string)

**Example:**
```javascript
escalation.escalateToNextLevel(esc.escalationId, 'critical');
// Immediately notifies next level team
```

---

### getEscalationStatus(escalationId)

Get escalation status.

**Returns:** Object
- `id` (string)
- `alertId` (string)
- `currentLevel` (number)
- `status` (string): 'ACTIVE', 'COMPLETED'
- `notifications` (Object)
  - `total` (number)
  - `sent` (number)
  - `scheduled` (number)

---

### startProcessing()

Start processing notification queue.

**Example:**
```javascript
escalation.startProcessing();
// Notifications sent as scheduled times arrive
```

---

## System API

### healthCheck()

Get system health status.

**Returns:** Object
- `status` (string): 'HEALTHY', 'DEGRADED', 'CRITICAL'
- `timestamp` (Date)
- `services` (Object): Service availability
- `metrics` (Object): Performance metrics per service

**Example:**
```javascript
const health = routes.healthCheck();

if (health.status !== 'HEALTHY') {
  console.log('System degraded:', health);
}
```

---

### getSummary()

Get full system summary.

**Returns:** Object with summary of all services and metrics

---

## Common Response Codes

```
200 OK
201 Created
204 No Content
400 Bad Request (missing required field)
403 Forbidden (service disabled)
404 Not Found (resource doesn't exist)
429 Too Many Requests (queue full)
500 Internal Server Error
503 Service Unavailable (circuit open)
```

---

## Error Handling

```javascript
try {
  const result = await remediation.executeRemediation(issue);
  
  if (!result.success) {
    console.log('Remediation failed:', result.error);
    
    // Check metrics for alternative action
    const metrics = remediation.getMetrics();
    if (metrics.successRate < 70) {
      console.log('Low success rate, consider manual intervention');
    }
  }
} catch (error) {
  console.log('Service error:', error.message);
  
  // Graceful degradation
  // Use backup service or manual process
}
```

---

## Performance Tuning

### For High Throughput
```javascript
// Increase bulkhead capacity
bulkhead.adjustCapacity('api-queue', {
  maxConcurrent: 50,
  maxQueue: 500
});

// Use combined routing strategy
router.setRoutingStrategy('combined');
```

### For Low Latency
```javascript
// Reduce timeouts
const breaker = new CircuitBreaker({
  timeout: 30000 // 30 seconds
});

// Use round-robin routing
router.setRoutingStrategy('round_robin');
```

### For Reliability
```javascript
// Strict circuit settings
const breaker = new CircuitBreaker({
  failureThreshold: 30, // Lower threshold
  successThreshold: 10, // Higher recovery requirement
  halfOpenMaxCalls: 1 // Very conservative
});
```

---

## Integration Examples

### With Express.js
```javascript
const express = require('express');
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  const health = routes.healthCheck();
  res.status(health.status === 'HEALTHY' ? 200 : 503).json(health);
});

// Remediation endpoint
app.post('/api/remediation/execute', async (req, res) => {
  const result = await remediation.executeRemediation(req.body.issue);
  res.json(result);
});

// Alert endpoint
app.post('/api/alerts/create', (req, res) => {
  const alert = alerts.createAlert(req.body);
  res.json(alert);
});
```

### With Event Emitter
```javascript
const EventEmitter = require('events');

// React to alerts
alerts.on('alert:created', (alert) => {
  if (alert.severity === 'CRITICAL') {
    escalation.startEscalation(alert, 'critical');
  }
});

// React to remediation completion
remediation.on('remediation:completed', (result) => {
  if (!result.success) {
    alerts.createAlert({
      title: `Remediation Failed: ${result.remediationId}`,
      severity: 'HIGH'
    });
  }
});
```

---

## Troubleshooting

**Issue: High latency in routing**
- Check health of all endpoints: `await router.checkAllEndpointsHealth()`
- Switch to latency-based routing: `router.setRoutingStrategy('latency')`
- Increase endpoint count

**Issue: Circuit breaker frequently opening**
- Check actual service health
- Increase failure threshold: `failureThreshold: 70`
- Increase timeout: `timeout: 120000`

**Issue: Bulkhead queue filling up**
- Reduce task processing time
- Increase `maxConcurrent` capacity
- Check for slow tasks: `getBulkheadStatus()`

**Issue: Alerts being suppressed**
- Check suppression rules: `getSuppressionRules()`
- Review rule patterns and durations
- Temporarily disable rules if needed

---

**End of API Reference**

**For support:** See PHASE-17.4-WEEK2-AUTOMATION-COMPLETE.md for detailed examples
