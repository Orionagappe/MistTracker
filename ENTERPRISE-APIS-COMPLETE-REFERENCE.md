# Phase 17.4 Week 3 Enterprise APIs - Complete Reference

**Phase:** 17.4 Week 3 - Enterprise Features  
**Status:** ✅ Complete and Production-Ready  
**Version:** 1.0.0  
**Total Endpoints:** 54+  

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Multi-Tenancy APIs](#multi-tenancy-apis)
3. [Dashboard & Reporting APIs](#dashboard--reporting-apis)
4. [Compliance APIs](#compliance-apis)
5. [Billing APIs](#billing-apis)
6. [Workflow APIs](#workflow-apis)
7. [System APIs](#system-apis)
8. [Error Handling](#error-handling)
9. [Integration Patterns](#integration-patterns)

---

## Getting Started

### Authentication

```
All enterprise endpoints require tenant context:

Header: X-Tenant-ID: {tenantId}
Header: Authorization: Bearer {token}
```

### Base URL

```
https://api.example.com/api/v1
```

### Response Format

```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": {},
    "timestamp": "2026-04-20T10:30:00Z"
  }
}
```

---

## Multi-Tenancy APIs

### Create Tenant

**POST** `/tenants`

Creates new tenant with isolated workspace.

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "owner": "john@acme.com",
  "tier": "STANDARD",
  "metadata": {
    "industry": "Technology",
    "region": "US-EAST"
  }
}
```

**Response:** `201 Created`
```json
{
  "tenantId": "tenant-a1b2c3d4",
  "namespace": "acme-corporation",
  "status": "ACTIVE",
  "features": {
    "multiTenancy": true,
    "customWorkflows": true,
    "billingIntegration": true
  },
  "tier": "STANDARD"
}
```

---

### Get Tenant

**GET** `/tenants/{tenantId}`

Retrieve tenant information and configuration.

**Response:** `200 OK`
```json
{
  "tenantInfo": {
    "tenantId": "tenant-a1b2c3d4",
    "name": "Acme Corporation",
    "namespace": "acme-corporation",
    "status": "ACTIVE",
    "tier": "STANDARD",
    "createdAt": "2026-04-20T10:00:00Z",
    "metadata": {}
  },
  "quotas": {
    "apiCalls": 1000000,
    "storage": 104857600,
    "workflows": 100
  },
  "config": {}
}
```

---

### Update Tenant

**PUT** `/tenants/{tenantId}`

Modify tenant settings and metadata.

**Request Body:**
```json
{
  "metadata": {
    "contact": "admin@acme.com",
    "tags": ["enterprise", "verified"]
  },
  "customConfig": {
    "timezone": "EST"
  }
}
```

**Response:** `200 OK`

---

### List Tenants

**GET** `/tenants?tier=STANDARD&status=ACTIVE`

List all tenants with optional filtering.

**Query Parameters:**
- `tier` - Filter by tier (STANDARD, PREMIUM, ENTERPRISE)
- `status` - Filter by status (ACTIVE, SUSPENDED)
- `since` - Filter by creation date
- `limit` - Max results (default: 100)

**Response:** `200 OK`
```json
[
  {
    "tenantId": "tenant-a1b2c3d4",
    "name": "Acme Corp",
    "namespace": "acme-corp",
    "status": "ACTIVE",
    "tier": "STANDARD",
    "createdAt": "2026-04-20T10:00:00Z"
  }
]
```

---

### Manage Tenant Status

**POST** `/tenants/{tenantId}/activate`

Activate suspended tenant.

**POST** `/tenants/{tenantId}/suspend`

Suspend active tenant.

**Request Body:**
```json
{
  "reason": "Maintenance window"
}
```

---

### Quotas Management

**GET** `/tenants/{tenantId}/quotas`

Get current quota usage.

**Response:**
```json
{
  "resources": {
    "apiCalls": {
      "current": 400000,
      "limit": 1000000,
      "percentage": 40,
      "remaining": 600000
    },
    "storage": {
      "current": 42949672,
      "limit": 104857600,
      "percentage": 41,
      "remaining": 61907928
    }
  }
}
```

**PUT** `/tenants/{tenantId}/quotas/{resource}`

Set resource quota limit.

**Request Body:**
```json
{
  "limit": 2000000
}
```

---

## Dashboard & Reporting APIs

### Report Management

**POST** `/reports`

Create new report template.

**Request Body:**
```json
{
  "title": "Performance Dashboard",
  "type": "DASHBOARD",
  "description": "Real-time performance metrics",
  "metrics": ["cpu_usage", "memory_usage", "request_latency"],
  "filters": {
    "timeRange": "24h",
    "environment": "production"
  },
  "format": "JSON",
  "refreshInterval": 300000
}
```

**Response:** `201 Created`

**GET** `/reports/{reportId}`

Retrieve report with data.

**PUT** `/reports/{reportId}`

Update report definition.

**DELETE** `/reports/{reportId}`

Delete report and all associated data.

---

### Metrics

**POST** `/metrics`

Define custom metric.

**Request Body:**
```json
{
  "name": "custom_requests_per_second",
  "type": "GAUGE",
  "unit": "rps",
  "description": "Requests per second",
  "aggregationFunc": "SUM"
}
```

**POST** `/metrics/{metricId}/record`

Record metric value.

**Request Body:**
```json
{
  "value": 1250.5
}
```

**GET** `/metrics/{metricId}?startDate=2026-04-19&endDate=2026-04-20`

Get metric values over time range.

**POST** `/metrics/query`

Query metrics with filtering.

**Request Body:**
```json
{
  "query": "SELECT metric_cpu_usage, metric_memory_usage WHERE timestamp > now() - 1h",
  "timeRange": {
    "start": "2026-04-20T09:00:00Z",
    "end": "2026-04-20T10:00:00Z"
  }
}
```

---

### Report Generation

**POST** `/reports/{reportId}/generate`

Generate report in specified format.

**Request Body:**
```json
{
  "format": "PDF"
}
```

**Response:** `200 OK`
```json
{
  "content": "... PDF content ...",
  "format": "PDF",
  "filename": "Performance-Dashboard-20260420.pdf",
  "generatedAt": "2026-04-20T10:30:00Z"
}
```

**POST** `/reports/{reportId}/schedule`

Schedule recurring report generation.

**Request Body:**
```json
{
  "interval": "DAILY",
  "startTime": "2026-04-20T09:00:00Z",
  "frequency": 1
}
```

---

### Real-Time Dashboards

**GET** `/tenants/{tenantId}/metrics`

Get real-time metrics snapshot.

**Response:**
```json
{
  "metrics": {
    "cpu_usage": {
      "value": 45.2,
      "unit": "%",
      "timestamp": "2026-04-20T10:30:00Z",
      "trend": "UP"
    },
    "memory_usage": {
      "value": 62.1,
      "unit": "%",
      "timestamp": "2026-04-20T10:30:00Z",
      "trend": "STABLE"
    }
  }
}
```

---

## Compliance APIs

### Policy Management

**POST** `/policies`

Create compliance policy.

**Request Body:**
```json
{
  "name": "Data Protection Policy",
  "description": "Enforce data encryption and access controls",
  "rules": [
    "encrypt_data_at_rest",
    "encrypt_data_in_transit",
    "access_control_enabled",
    "audit_logging_enabled"
  ],
  "scope": "TENANT",
  "severity": "CRITICAL"
}
```

**POST** `/tenants/{tenantId}/policies/{policyId}/enforce`

Enforce policy for tenant.

**GET** `/policies/{policyId}/status`

Get policy enforcement status.

**Response:**
```json
{
  "status": "ENFORCED",
  "enforced": true,
  "violations": 0,
  "stats": {
    "ruleCount": 4,
    "violationCount": 0,
    "scope": "TENANT"
  }
}
```

---

### Access Control

**POST** `/access`

Grant access to user.

**Request Body:**
```json
{
  "userId": "john@example.com",
  "resource": "dashboard",
  "role": "ADMIN"
}
```

**Response:** `201 Created`
```json
{
  "accessId": "access-abc123def456"
}
```

**POST** `/access/check`

Verify user permissions.

**Request Body:**
```json
{
  "userId": "john@example.com",
  "resource": "dashboard",
  "action": "write"
}
```

**Response:**
```json
{
  "allowed": true,
  "reason": "Access granted"
}
```

**DELETE** `/access/{accessId}`

Revoke user access.

---

### Audit Trail

**GET** `/audit?action=POLICY_ENFORCED&limit=100`

Retrieve audit log entries.

**Query Parameters:**
- `action` - Filter by action type
- `resourceType` - Filter by resource
- `tenantId` - Filter by tenant
- `since` - Filter by date
- `limit` - Max results

**POST** `/audit/verify`

Verify audit trail integrity.

**Request Body:**
```json
{
  "startId": "audit-001",
  "endId": "audit-100"
}
```

**Response:**
```json
{
  "valid": true,
  "verification": {
    "entriesVerified": 100,
    "timestamp": "2026-04-20T10:30:00Z"
  }
}
```

---

### Compliance Reporting

**GET** `/tenants/{tenantId}/compliance/{framework}`

Get compliance status for framework.

**Frameworks:** GDPR, HIPAA, SOC2, ISO27001

**Response:**
```json
{
  "status": "COMPLIANT",
  "framework": "SOC2",
  "gaps": [],
  "gapCount": 0,
  "requirementCount": 15,
  "compliancePercent": 100
}
```

**POST** `/tenants/{tenantId}/compliance/{framework}/report`

Generate compliance report.

**Response:**
```json
{
  "framework": "SOC2",
  "reportDate": "2026-04-20T10:30:00Z",
  "status": "COMPLIANT",
  "summary": {
    "policies": 5,
    "auditEntries": 1250,
    "gaps": 0,
    "compliancePercent": 100
  },
  "details": {
    "policies": [...],
    "gaps": []
  }
}
```

---

### Retention Policies

**POST** `/retention-policies`

Set data retention policy.

**Request Body:**
```json
{
  "dataType": "LOGS",
  "duration": 365
}
```

**POST** `/retention/enforce`

Execute retention enforcement.

---

## Billing APIs

### Usage Tracking

**POST** `/usage`

Record resource usage.

**Request Body:**
```json
{
  "tenantId": "tenant-a1b2c3d4",
  "metric": "api_calls",
  "quantity": 1500
}
```

**GET** `/tenants/{tenantId}/usage?startDate=2026-04-01&endDate=2026-04-30`

Get usage summary.

**GET** `/tenants/{tenantId}/usage/stats`

Get usage statistics and trends.

**Response:**
```json
{
  "total": 45230.50,
  "byService": {
    "api_calls": 15000.00,
    "storage": 20230.50,
    "compute": 10000.00
  },
  "trend": "+23.5%"
}
```

---

### Pricing & Cost

**POST** `/tenants/{tenantId}/pricing`

Set pricing model for tenant.

**Request Body:**
```json
{
  "type": "TIERED",
  "tiers": [
    {
      "level": 1,
      "upTo": 1000,
      "pricePerUnit": 0.01
    },
    {
      "level": 2,
      "upTo": 10000,
      "pricePerUnit": 0.008
    }
  ]
}
```

**GET** `/tenants/{tenantId}/cost?startDate=2026-04-01&endDate=2026-04-30`

Calculate cost for period.

**Response:**
```json
{
  "total": 523.45,
  "breakdown": {
    "api_calls": 150.00,
    "storage": 203.45,
    "compute": 170.00
  },
  "currency": "USD"
}
```

---

### Billing Cycles

**POST** `/tenants/{tenantId}/billing-cycle`

Start new billing cycle.

**Response:**
```json
{
  "cycleId": "cycle-abc123",
  "startDate": "2026-04-20T00:00:00Z",
  "endDate": "2026-05-20T00:00:00Z"
}
```

**POST** `/tenants/{tenantId}/invoices`

Generate invoice for cycle.

**Request Body:**
```json
{
  "cycleId": "cycle-abc123"
}
```

**Response:** `201 Created`
```json
{
  "invoiceId": "INV-2026-04-001",
  "content": "INVOICE...",
  "status": "ISSUED"
}
```

**GET** `/tenants/{tenantId}/invoices`

Get invoice history.

---

### Optimization

**GET** `/tenants/{tenantId}/recommendations`

Get cost optimization recommendations.

**Response:**
```json
[
  {
    "priority": "HIGH",
    "type": "SCALING",
    "message": "Consider upgrading to higher tier",
    "estimatedSavings": 1500
  },
  {
    "priority": "MEDIUM",
    "type": "SERVICE_OPTIMIZATION",
    "service": "api_calls",
    "message": "API calls represent 40% of costs",
    "estimatedSavings": 600
  }
]
```

**POST** `/tenants/{tenantId}/cost/estimate`

Estimate cost for projected usage.

**Request Body:**
```json
{
  "usage": {
    "api_calls": 5000,
    "storage": 500,
    "compute": 100
  }
}
```

---

## Workflow APIs

### Workflow Management

**POST** `/workflows`

Create workflow definition.

**Request Body:**
```json
{
  "name": "Data Processing Pipeline",
  "description": "ETL workflow for daily data sync",
  "steps": [
    {
      "name": "extract",
      "action": "http_request",
      "config": {
        "url": "https://api.source.com/data",
        "method": "GET"
      }
    },
    {
      "name": "transform",
      "action": "transform",
      "config": {}
    },
    {
      "name": "load",
      "action": "http_request",
      "config": {
        "url": "https://api.dest.com/data",
        "method": "POST"
      }
    }
  ],
  "triggers": [
    {
      "type": "TIME",
      "config": { "cron": "0 2 * * *" }
    }
  ]
}
```

**GET** `/workflows/{workflowId}`

Get workflow definition.

**PUT** `/workflows/{workflowId}`

Update workflow (creates new version).

**DELETE** `/workflows/{workflowId}`

Delete workflow.

---

### Workflow Execution

**POST** `/workflows/{workflowId}/execute`

Execute workflow with context.

**Request Body:**
```json
{
  "context": {
    "date": "2026-04-20",
    "tenant": "acme-corp"
  }
}
```

**Response:**
```json
{
  "executionId": "exec-xyz789",
  "workflowId": "workflow-123",
  "status": "RUNNING"
}
```

**GET** `/executions/{executionId}`

Get execution status and results.

**Response:**
```json
{
  "status": "COMPLETED",
  "progress": 100,
  "results": {
    "extract": { "records": 1500 },
    "transform": { "processed": 1500 },
    "load": { "inserted": 1500 }
  },
  "errors": [],
  "startTime": "2026-04-20T02:00:00Z",
  "endTime": "2026-04-20T02:15:00Z"
}
```

**DELETE** `/executions/{executionId}`

Cancel running execution.

---

### Rules & Policies

**POST** `/rules`

Create rule for event matching.

**Request Body:**
```json
{
  "name": "High CPU Alert",
  "description": "Trigger alert when CPU > 80%",
  "condition": "cpu_usage > 80",
  "actions": [
    { "type": "alert", "severity": "HIGH" },
    { "type": "scale_up", "increment": 2 }
  ],
  "priority": 10
}
```

**GET** `/rules/{ruleId}/stats`

Get rule execution statistics.

**POST** `/rules/evaluate`

Evaluate rules against context.

**Request Body:**
```json
{
  "context": {
    "cpu_usage": 85,
    "memory_usage": 60
  }
}
```

---

### Triggers

**POST** `/triggers`

Register trigger.

**Request Body:**
```json
{
  "name": "Daily Sync",
  "type": "TIME",
  "config": {
    "cron": "0 2 * * *"
  },
  "workflowIds": ["workflow-123"]
}
```

**GET** `/tenants/{tenantId}/triggers`

List active triggers.

---

### Templates

**GET** `/templates?category=APPROVAL`

List workflow templates.

**Query Parameters:**
- `category` - Filter by category (APPROVAL, SYNC, NOTIFICATION, etc.)

**POST** `/templates/{templateId}/instantiate`

Create workflow from template.

**Request Body:**
```json
{
  "name": "My Approval Workflow",
  "config": {
    "approvers": ["admin@example.com"]
  }
}
```

---

## System APIs

### Health & Status

**GET** `/health`

System health check.

**Response:**
```json
{
  "status": "HEALTHY",
  "timestamp": "2026-04-20T10:30:00Z",
  "services": {
    "multiTenancy": { "status": "HEALTHY" },
    "dashboard": { "status": "HEALTHY" },
    "compliance": { "status": "HEALTHY" },
    "billing": { "status": "HEALTHY" },
    "workflows": { "status": "HEALTHY" }
  }
}
```

**GET** `/summary`

System summary with metrics.

**GET** `/metrics`

Detailed metrics and statistics.

**GET** `/api/status`

API operational status.

---

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: name",
    "details": {
      "field": "name",
      "reason": "required"
    }
  },
  "timestamp": "2026-04-20T10:30:00Z"
}
```

### Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Internal error |
| 503 | Service Unavailable | Circuit breaker open |

---

## Integration Patterns

### Pattern 1: Multi-Tenant Workflow with Billing

```javascript
// 1. Create tenant
const tenant = await POST('/tenants', {
  name: 'Customer Corp',
  owner: 'admin@customer.com'
});

// 2. Create workflow
const workflow = await POST('/workflows', {
  name: 'Daily Report',
  steps: [...]
});

// 3. Execute workflow
const execution = await POST(`/workflows/${workflow.workflowId}/execute`, {
  context: { tenantId: tenant.tenantId }
});

// 4. Record usage
await POST('/usage', {
  tenantId: tenant.tenantId,
  metric: 'workflow_executions',
  quantity: 1
});

// 5. Get costs
const cost = await GET(`/tenants/${tenant.tenantId}/cost`);
```

### Pattern 2: Compliance & Audit

```javascript
// 1. Enforce policy
await POST(`/tenants/${tenantId}/policies/${policyId}/enforce`);

// 2. Log audit event (automatic)
// Audit events logged automatically for all policy actions

// 3. Verify integrity
const verification = await POST('/audit/verify', {
  startId: 'audit-001',
  endId: 'audit-100'
});

// 4. Generate report
const report = await POST(`/tenants/${tenantId}/compliance/SOC2/report`);
```

### Pattern 3: Usage & Billing Cycle

```javascript
// 1. Record usage throughout month
await POST('/usage', {
  tenantId,
  metric: 'api_calls',
  quantity: 1500
});

// 2. Start billing cycle
const cycle = await POST(`/tenants/${tenantId}/billing-cycle`);

// 3. Generate invoice
const invoice = await POST(`/tenants/${tenantId}/invoices`, {
  cycleId: cycle.cycleId
});

// 4. Get recommendations
const recommendations = await GET(`/tenants/${tenantId}/recommendations`);
```

---

## Rate Limits

- **API Calls:** 1000 per minute per tenant
- **Batch Operations:** 100 per minute
- **Report Generation:** 10 per hour
- **Workflow Execution:** 100 per hour

---

## Pagination

List endpoints support pagination:

```
GET /tenants?page=1&pageSize=50&sort=createdAt&order=desc
```

**Response Headers:**
```
X-Total-Count: 150
X-Page: 1
X-Page-Size: 50
X-Total-Pages: 3
```

---

## Versioning

- Current API Version: `v1`
- Endpoint Format: `/api/v1/...`
- Backwards compatibility guaranteed within major version

---

## Support

For API support:
- Documentation: See this guide
- Issues: GitHub Issues
- Contact: support@example.com

---

**Phase 17.4 Week 3 Enterprise APIs - Complete ✅**
