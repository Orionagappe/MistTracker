# Phase 17.4 Enterprise Features - Developer Quick Start Guide

**Quick Link:** Use this guide to quickly understand and use the Phase 17.4 enterprise platform.

---

## 5-Minute Overview

Phase 17.4 adds **enterprise capabilities** to MistTracker:

```
┌─────────────────────────────────────────────────┐
│  Multi-Tenant SaaS Platform                      │
├─────────────────────────────────────────────────┤
│ • Multi-Tenancy Engine     → Tenant management   │
│ • Dashboard & Reporting    → Analytics/reports   │
│ • Compliance & Governance  → Policies/audit      │
│ • Billing & Usage Tracking → Cost management     │
│ • Workflow & Automation    → Custom workflows    │
└─────────────────────────────────────────────────┘
```

**Real-world example:**
- SaaS platform with 100 customers
- Each customer (tenant) has isolated data
- Bills calculated automatically based on usage
- Compliance reports generated for audits
- Custom workflows auto-trigger on events

---

## Installation

### 1. Load the Services

```javascript
const MultiTenancyEngine = require('./multi-tenancy-engine');
const DashboardService = require('./dashboard-reporting-service');
const ComplianceEngine = require('./compliance-governance-engine');
const BillingEngine = require('./billing-usage-tracking');
const WorkflowEngine = require('./workflow-automation-engine');
const EnterpriseRoutes = require('./enterprise-routes');

// Initialize
const multiTenancy = new MultiTenancyEngine();
const dashboard = new DashboardService();
const compliance = new ComplianceEngine();
const billing = new BillingEngine();
const workflows = new WorkflowEngine();

// Setup API routes
const routes = new EnterpriseRoutes({
  multiTenancy,
  dashboard,
  compliance,
  billing,
  workflows
}).registerRoutes();
```

---

## Common Tasks

### Task 1: Onboard New Customer

```javascript
// 1. Create tenant
const tenant = multiTenancy.createTenant({
  name: 'Acme Corp',
  owner: 'admin@acme.com',
  tier: 'STANDARD'
});

console.log(`Tenant ID: ${tenant.tenantId}`);
console.log(`Namespace: ${tenant.namespace}`);

// 2. Set quotas
multiTenancy.setQuota(tenant.tenantId, 'apiCalls', 1000000);
multiTenancy.setQuota(tenant.tenantId, 'storage', 104857600); // 100GB

// 3. Enforce compliance policy
const policy = compliance.createPolicy({
  name: 'Data Protection',
  rules: ['encrypt_data', 'audit_logging']
});
compliance.enforcePolicy(tenant.tenantId, policy.policyId);

// 4. Setup billing
billing.setPricingModel(tenant.tenantId, {
  type: 'TIERED',
  tiers: [
    { level: 1, upTo: 10000, pricePerUnit: 0.01 }
  ]
});

console.log('✅ Customer onboarded!');
```

### Task 2: Track Usage & Generate Invoice

```javascript
// Throughout the month, track usage
billing.recordUsage(tenant.tenantId, 'api_calls', 5000);
billing.recordUsage(tenant.tenantId, 'storage_gb', 25);
billing.recordUsage(tenant.tenantId, 'workflow_executions', 50);

// End of month: generate invoice
const cycle = billing.startBillingCycle(tenant.tenantId);
const invoice = billing.generateInvoice(tenant.tenantId, cycle.cycleId);

console.log(`Invoice created: ${invoice.invoiceId}`);
console.log(`Amount: $${invoice.content.total}`);
```

### Task 3: Create Automated Workflow

```javascript
// Define workflow
const workflow = workflows.createWorkflow({
  name: 'Daily Data Sync',
  steps: [
    {
      name: 'extract',
      action: 'http_request',
      config: {
        url: 'https://api.source.com/data',
        method: 'GET'
      }
    },
    {
      name: 'transform',
      action: 'transform',
      config: { mappings: { /* ... */ } }
    },
    {
      name: 'load',
      action: 'http_request',
      config: {
        url: 'https://api.dest.com/data',
        method: 'POST'
      }
    }
  ]
});

// Schedule with trigger
workflows.registerTrigger({
  name: 'Daily 2am',
  type: 'TIME',
  config: { cron: '0 2 * * *' },
  workflowIds: [workflow.workflowId]
});

console.log('✅ Workflow scheduled!');
```

### Task 4: Enforce Access Control

```javascript
// Grant admin access
const adminAccess = compliance.grantAccess(
  'john@acme.com',
  'dashboard',
  'ADMIN'
);

// Grant viewer access
const viewerAccess = compliance.grantAccess(
  'analyst@acme.com',
  'reports',
  'VIEWER'
);

// Check access
const canAccess = compliance.checkAccess(
  'john@acme.com',
  'dashboard',
  'write'
);
console.log(`John can write to dashboard: ${canAccess.allowed}`);

// Later: revoke access
compliance.revokeAccess(adminAccess.accessId);
```

### Task 5: Generate Compliance Report

```javascript
// Enforce policies (automatic audit logging)
const policy = compliance.createPolicy({
  name: 'GDPR Compliance',
  rules: ['data_minimization', 'consent_tracking', 'right_to_deletion']
});
compliance.enforcePolicy(tenant.tenantId, policy.policyId);

// Generate report
const report = compliance.generateComplianceReport(tenant.tenantId, 'GDPR');

console.log(`Framework: ${report.framework}`);
console.log(`Status: ${report.status}`);
console.log(`Compliant: ${report.summary.compliancePercent}%`);
console.log(`Policies: ${report.summary.policies}`);
console.log(`Audit entries: ${report.summary.auditEntries}`);
```

### Task 6: Build Dashboard

```javascript
// Define metrics
const cpuMetric = dashboard.defineMetric({
  name: 'cpu_usage',
  type: 'GAUGE',
  unit: '%'
});

const memoryMetric = dashboard.defineMetric({
  name: 'memory_usage',
  type: 'GAUGE',
  unit: '%'
});

// Record values
dashboard.recordMetric(cpuMetric.metricId, 45.2);
dashboard.recordMetric(memoryMetric.metricId, 62.1);

// Create report
const report = dashboard.createReport({
  title: 'Performance Dashboard',
  type: 'DASHBOARD',
  metrics: [cpuMetric.metricId, memoryMetric.metricId]
});

// Schedule generation
dashboard.scheduleReport(report.reportId, {
  interval: 'DAILY'
});

console.log('✅ Dashboard created!');
```

---

## REST API Quick Reference

### Tenants
```
POST   /tenants                    Create tenant
GET    /tenants/{id}               Get tenant
PUT    /tenants/{id}               Update tenant
DELETE /tenants/{id}               Delete tenant
POST   /tenants/{id}/activate      Activate
POST   /tenants/{id}/suspend       Suspend
GET    /tenants/{id}/quotas        Get quotas
```

### Reports
```
POST   /reports                    Create report
GET    /reports/{id}               Get report
POST   /reports/{id}/generate      Generate
POST   /reports/{id}/schedule      Schedule
```

### Compliance
```
POST   /policies                   Create policy
POST   /tenants/{id}/policies/{p}  Enforce
POST   /access                     Grant access
POST   /access/check               Check permission
GET    /audit                      Get audit trail
POST   /tenants/{id}/compliance/{f} Compliance report
```

### Billing
```
POST   /usage                      Record usage
GET    /tenants/{id}/usage         Get usage
GET    /tenants/{id}/cost          Calculate cost
POST   /tenants/{id}/invoices      Generate invoice
GET    /tenants/{id}/recommendations Get recommendations
```

### Workflows
```
POST   /workflows                  Create workflow
POST   /workflows/{id}/execute     Execute
POST   /rules                      Create rule
POST   /triggers                   Register trigger
GET    /templates                  List templates
```

---

## Integration Examples

### With Week 1 ML Services

```javascript
// Get ML prediction
const prediction = prophetForecaster.forecast('cpu_usage', 7);

// Record as dashboard metric
dashboard.recordMetric(predictionMetricId, prediction.value);

// Track usage of ML service
billing.recordUsage(tenant.tenantId, 'ml_predictions', 1);

// Enforce compliance on ML operations
compliance.logAudit({
  action: 'PREDICTION_GENERATED',
  resourceType: 'ML_MODEL',
  resourceId: 'prophet-cpu'
});
```

### With Week 2 Automation

```javascript
// When anomaly detected
const anomaly = lstmDetector.detectAnomaly(data);

// Create workflow to handle
const remediationWorkflow = workflows.createWorkflow({
  name: 'Anomaly Response',
  steps: [
    { name: 'alert', action: 'send_alert' },
    { name: 'remediate', action: 'auto_remediate' }
  ]
});

// Execute workflow
workflows.executeWorkflow(remediationWorkflow.workflowId, {
  anomalyData: anomaly
});

// Charge for automation execution
billing.recordUsage(tenant.tenantId, 'automation_executions', 1);
```

---

## Configuration Examples

### Multi-Tier Pricing

```javascript
billing.setPricingModel(tenant.tenantId, {
  type: 'TIERED',
  tiers: [
    {
      level: 1,
      upTo: 1000,
      pricePerUnit: 0.10
    },
    {
      level: 2,
      upTo: 10000,
      pricePerUnit: 0.08
    },
    {
      level: 3,
      upTo: 100000,
      pricePerUnit: 0.05
    }
  ]
});
```

### RBAC Setup

```javascript
// Create role with permissions
const adminRole = {
  name: 'ADMIN',
  permissions: [
    'read:all',
    'write:all',
    'delete:all',
    'audit:read'
  ]
};

const operatorRole = {
  name: 'OPERATOR',
  permissions: [
    'read:all',
    'write:resources',
    'audit:read'
  ]
};

const viewerRole = {
  name: 'VIEWER',
  permissions: [
    'read:reports',
    'read:dashboards'
  ]
};

// Assign to users
compliance.grantAccess(userEmail, resource, 'ADMIN');
```

### Compliance Policies

```javascript
// GDPR Policy
const gdprPolicy = compliance.createPolicy({
  name: 'GDPR Compliance',
  rules: [
    'data_minimization',
    'purpose_limitation',
    'storage_limitation',
    'consent_tracking',
    'right_to_deletion',
    'data_portability'
  ]
});

// HIPAA Policy
const hipaaPolicy = compliance.createPolicy({
  name: 'HIPAA Compliance',
  rules: [
    'access_control',
    'audit_controls',
    'encryption',
    'transmission_security',
    'integrity_controls'
  ]
});
```

---

## Monitoring & Health

```javascript
// Check service health
const health = multiTenancy.healthCheck();
console.log(`Multi-Tenancy: ${health.status}`);

const dashHealth = dashboard.healthCheck();
console.log(`Dashboard: ${dashHealth.status}`);

// Get metrics
const metrics = multiTenancy.getMetrics();
console.log(`Active tenants: ${metrics.activeTenants}`);
console.log(`Total users: ${metrics.totalUsers}`);

// System health endpoint
GET /health
// Returns health of all services
```

---

## Testing

Run the comprehensive test suite:

```bash
node phase17.4-enterprise-tests.js
```

Expected output:
```
✅ Multi-Tenancy: 10+ tests passing
✅ Dashboard: 12+ tests passing
✅ Compliance: 15+ tests passing
✅ Billing: 12+ tests passing
✅ Workflows: 16+ tests passing
✅ Integration: 4+ tests passing
✅ Performance: 2+ benchmarks passing

Total: 90+ tests, 100% pass rate
```

---

## Troubleshooting

### Issue: Tenant Creation Fails

**Solution:**
```javascript
// Check if tenant already exists
const existing = multiTenancy.getTenant(tenantId);
if (existing) {
  console.log('Tenant already exists');
} else {
  // Create new
  multiTenancy.createTenant({ name, owner });
}
```

### Issue: Quota Exceeded

**Solution:**
```javascript
// Check remaining quota
const quota = multiTenancy.checkQuota(tenantId, 'apiCalls');
if (quota.percentage > 90) {
  console.log('Near quota limit');
  // Increase limit
  multiTenancy.setQuota(tenantId, 'apiCalls', 2000000);
}
```

### Issue: Workflow Not Executing

**Solution:**
```javascript
// Check workflow status
const workflow = workflows.getWorkflow(workflowId);
console.log(workflow.definition);

// Check execution history
const execution = workflows.getExecutionStatus(executionId);
console.log(execution.status);
console.log(execution.errors);
```

---

## Performance Tips

1. **Batch Operations:** Group operations when possible
2. **Caching:** Use dashboard aggregation caching (1-minute TTL)
3. **Async Workflows:** Use async execution for long-running tasks
4. **Quotas:** Set appropriate quotas to prevent abuse
5. **Monitoring:** Monitor metrics to identify bottlenecks

---

## Security Checklist

- ✅ Always validate tenant ID in requests
- ✅ Check access permissions before operations
- ✅ Log all administrative actions
- ✅ Enforce strong authentication
- ✅ Use TLS for all connections
- ✅ Encrypt sensitive data
- ✅ Validate all inputs
- ✅ Review audit trails regularly

---

## File Structure

```
MistTracker/
├── multi-tenancy-engine.js              (400 LOC)
├── dashboard-reporting-service.js       (450 LOC)
├── compliance-governance-engine.js      (480 LOC)
├── billing-usage-tracking.js            (420 LOC)
├── workflow-automation-engine.js        (500 LOC)
├── enterprise-routes.js                 (350 LOC)
├── phase17.4-enterprise-tests.js        (700+ LOC)
├── ENTERPRISE-APIS-COMPLETE-REFERENCE.md   (API documentation)
├── PHASE-17.4-WEEK3-MASTER-PLAN.md        (Architecture & design)
├── PHASE-17.4-WEEK3-FINAL-STATUS.md       (Final report)
└── ENTERPRISE-QUICK-START.md              (This file)
```

---

## Next Steps

1. **Review** the [ENTERPRISE-APIS-COMPLETE-REFERENCE.md](ENTERPRISE-APIS-COMPLETE-REFERENCE.md) for detailed API docs
2. **Study** the [PHASE-17.4-WEEK3-MASTER-PLAN.md](PHASE-17.4-WEEK3-MASTER-PLAN.md) for architecture
3. **Run** the test suite to validate your setup
4. **Deploy** to your environment following the [PHASE-17.4-WEEK3-FINAL-STATUS.md](PHASE-17.4-WEEK3-FINAL-STATUS.md) checklist
5. **Integrate** with your frontend/client applications

---

## Support

- **Documentation:** See files above
- **Issues:** Review error messages in healthCheck() output
- **Testing:** Run phase17.4-enterprise-tests.js to validate
- **Examples:** See integration examples section above

---

## Key Concepts

### Multi-Tenancy
Each customer is a **tenant** with isolated namespace and data.

### Quotas
Resource limits per tenant (API calls, storage, workflows).

### Policies
Rules enforced across tenants (RBAC, audit logging, compliance).

### Workflows
Automated sequences triggered by events/schedules.

### Billing
Usage-based charges calculated automatically.

### Audit
Immutable log of all actions for compliance.

---

## Quick Command Reference

```javascript
// Tenants
multiTenancy.createTenant({name, owner, tier})
multiTenancy.getTenant(tenantId)
multiTenancy.updateTenant(tenantId, config)
multiTenancy.setQuota(tenantId, resource, limit)
multiTenancy.validateTenantAccess(tenantId, userId)

// Dashboard
dashboard.defineMetric({name, type, unit})
dashboard.recordMetric(metricId, value)
dashboard.createReport({title, type, metrics})
dashboard.generateReport(reportId, format)
dashboard.getRealTimeMetrics(tenantId)

// Compliance
compliance.createPolicy({name, rules, scope})
compliance.enforcePolicy(tenantId, policyId)
compliance.grantAccess(userId, resource, role)
compliance.checkAccess(userId, resource, action)
compliance.logAudit({action, resourceType, resourceId})
compliance.generateComplianceReport(tenantId, framework)

// Billing
billing.recordUsage(tenantId, metric, quantity)
billing.setPricingModel(tenantId, model)
billing.calculateCost(tenantId)
billing.generateInvoice(tenantId, cycleId)
billing.getOptimizationRecommendations(tenantId)

// Workflows
workflows.createWorkflow({name, steps, triggers})
workflows.executeWorkflow(workflowId, context)
workflows.createRule({name, condition, actions})
workflows.registerTrigger({name, type, config})
workflows.instantiateTemplate(templateId, config)
```

---

**Phase 17.4 Enterprise Features - Ready to use! ✅**

Start with Task 1 above to onboard your first customer.
