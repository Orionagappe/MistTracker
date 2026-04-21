/**
 * Automation Routes
 * API endpoints for the automation engine
 * 
 * @file automation-routes.js
 * @version 1.0.0
 */

class AutomationRoutes {
  constructor(services = {}) {
    this.autoRemediation = services.autoRemediation || null;
    this.remediationActions = services.remediationActions || null;
    this.intelligentRouter = services.intelligentRouter || null;
    this.circuitBreaker = services.circuitBreaker || null;
    this.bulkheadManager = services.bulkheadManager || null;
    this.alertManager = services.alertManager || null;
    this.escalationEngine = services.escalationEngine || null;
  }

  /**
   * Initialize all route handlers
   * @returns {Object} All route handlers
   */
  initializeRoutes() {
    return {
      // Auto-remediation endpoints
      '/api/remediation/execute': this.executeRemediation.bind(this),
      '/api/remediation/history': this.getRemediationHistory.bind(this),
      '/api/remediation/metrics': this.getRemediationMetrics.bind(this),
      '/api/remediation/status/:id': this.getRemediationStatus.bind(this),

      // Routing endpoints
      '/api/routing/route-webhook': this.routeWebhook.bind(this),
      '/api/routing/endpoints': this.getEndpoints.bind(this),
      '/api/routing/health': this.checkEndpointHealth.bind(this),
      '/api/routing/metrics': this.getRoutingMetrics.bind(this),

      // Circuit breaker endpoints
      '/api/circuit-breaker/create': this.createCircuit.bind(this),
      '/api/circuit-breaker/status': this.getCircuitStatus.bind(this),
      '/api/circuit-breaker/all': this.getAllCircuits.bind(this),
      '/api/circuit-breaker/reset/:id': this.resetCircuit.bind(this),

      // Bulkhead endpoints
      '/api/bulkhead/create': this.createBulkhead.bind(this),
      '/api/bulkhead/status': this.getBulkheadStatus.bind(this),
      '/api/bulkhead/all': this.getAllBulkheads.bind(this),
      '/api/bulkhead/queue/:id': this.getBulkheadQueue.bind(this),

      // Alert endpoints
      '/api/alerts/create': this.createAlert.bind(this),
      '/api/alerts/list': this.listAlerts.bind(this),
      '/api/alerts/acknowledge/:id': this.acknowledgeAlert.bind(this),
      '/api/alerts/resolve/:id': this.resolveAlert.bind(this),
      '/api/alerts/metrics': this.getAlertMetrics.bind(this),

      // Escalation endpoints
      '/api/escalation/start': this.startEscalation.bind(this),
      '/api/escalation/status/:id': this.getEscalationStatus.bind(this),
      '/api/escalation/chains': this.getEscalationChains.bind(this),
      '/api/escalation/metrics': this.getEscalationMetrics.bind(this),

      // System endpoints
      '/api/automation/health': this.healthCheck.bind(this),
      '/api/automation/summary': this.getSummary.bind(this),
    };
  }

  // ===== Auto-Remediation Endpoints =====

  async executeRemediation(request) {
    if (!this.autoRemediation) {
      return { success: false, error: 'Auto-remediation service not available' };
    }

    const { issue, context } = request.body;

    if (!issue) {
      return { success: false, error: 'Issue is required' };
    }

    try {
      const result = await this.autoRemediation.executeRemediation(issue, context);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getRemediationHistory(request) {
    if (!this.autoRemediation) {
      return { success: false, error: 'Auto-remediation service not available' };
    }

    const { issueType, successful, limit } = request.query;

    const filters = {};
    if (issueType) filters.issueType = issueType;
    if (successful !== undefined) filters.successful = successful === 'true';
    if (limit) filters.limit = parseInt(limit, 10);

    return this.autoRemediation.getRemediationHistory(filters);
  }

  getRemediationMetrics(request) {
    if (!this.autoRemediation) {
      return { success: false, error: 'Auto-remediation service not available' };
    }

    return this.autoRemediation.getMetrics();
  }

  getRemediationStatus(request) {
    if (!this.autoRemediation) {
      return { success: false, error: 'Auto-remediation service not available' };
    }

    const { id } = request.params;
    return this.autoRemediation.getRemediationStatus(id);
  }

  // ===== Routing Endpoints =====

  routeWebhook(request) {
    if (!this.intelligentRouter) {
      return { success: false, error: 'Router service not available' };
    }

    const { webhook, context } = request.body;

    if (!webhook) {
      return { success: false, error: 'Webhook is required' };
    }

    const routing = this.intelligentRouter.routeWebhook(webhook, context);

    if (routing.success) {
      // Record delivery stats
      const delivery = {
        endpointId: routing.selectedEndpoint,
        webhookId: webhook.id,
        successful: true,
        latency: Math.random() * 500 + 50,
        statusCode: 200,
      };

      this.intelligentRouter.recordDelivery(delivery);
    }

    return routing;
  }

  getEndpoints(request) {
    if (!this.intelligentRouter) {
      return { success: false, error: 'Router service not available' };
    }

    return this.intelligentRouter.getAllEndpointsStats();
  }

  async checkEndpointHealth(request) {
    if (!this.intelligentRouter) {
      return { success: false, error: 'Router service not available' };
    }

    try {
      const results = await this.intelligentRouter.checkAllEndpointsHealth();
      return { success: true, healthChecks: results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getRoutingMetrics(request) {
    if (!this.intelligentRouter) {
      return { success: false, error: 'Router service not available' };
    }

    return this.intelligentRouter.getRoutingMetrics();
  }

  // ===== Circuit Breaker Endpoints =====

  createCircuit(request) {
    if (!this.circuitBreaker) {
      return { success: false, error: 'Circuit breaker service not available' };
    }

    const { serviceId, config } = request.body;

    if (!serviceId) {
      return { success: false, error: 'Service ID is required' };
    }

    return this.circuitBreaker.createCircuit(serviceId, config);
  }

  getCircuitStatus(request) {
    if (!this.circuitBreaker) {
      return { success: false, error: 'Circuit breaker service not available' };
    }

    const { circuitId } = request.query;

    if (circuitId) {
      return this.circuitBreaker.getCircuitStatus(circuitId);
    }

    return this.circuitBreaker.getAllCircuitsStatus();
  }

  getAllCircuits(request) {
    if (!this.circuitBreaker) {
      return { success: false, error: 'Circuit breaker service not available' };
    }

    return this.circuitBreaker.getMetrics();
  }

  resetCircuit(request) {
    if (!this.circuitBreaker) {
      return { success: false, error: 'Circuit breaker service not available' };
    }

    const { id } = request.params;
    return this.circuitBreaker.resetCircuit(id);
  }

  // ===== Bulkhead Endpoints =====

  createBulkhead(request) {
    if (!this.bulkheadManager) {
      return { success: false, error: 'Bulkhead manager service not available' };
    }

    const { bulkheadId, config } = request.body;

    if (!bulkheadId) {
      return { success: false, error: 'Bulkhead ID is required' };
    }

    return this.bulkheadManager.createBulkhead(bulkheadId, config);
  }

  getBulkheadStatus(request) {
    if (!this.bulkheadManager) {
      return { success: false, error: 'Bulkhead manager service not available' };
    }

    const { bulkheadId } = request.query;

    if (bulkheadId) {
      return this.bulkheadManager.getBulkheadStatus(bulkheadId);
    }

    return this.bulkheadManager.getAllBulkheadsStatus();
  }

  getAllBulkheads(request) {
    if (!this.bulkheadManager) {
      return { success: false, error: 'Bulkhead manager service not available' };
    }

    return this.bulkheadManager.getMetrics();
  }

  getBulkheadQueue(request) {
    if (!this.bulkheadManager) {
      return { success: false, error: 'Bulkhead manager service not available' };
    }

    const { id } = request.params;
    return this.bulkheadManager.getQueueDepth(id);
  }

  // ===== Alert Endpoints =====

  createAlert(request) {
    if (!this.alertManager) {
      return { success: false, error: 'Alert manager service not available' };
    }

    const alertData = request.body;

    if (!alertData.title) {
      return { success: false, error: 'Alert title is required' };
    }

    return this.alertManager.createAlert(alertData);
  }

  listAlerts(request) {
    if (!this.alertManager) {
      return { success: false, error: 'Alert manager service not available' };
    }

    const { severity, service, suppressed, limit } = request.query;

    const filters = {};
    if (severity) filters.severity = severity;
    if (service) filters.service = service;
    if (suppressed !== undefined) filters.suppressed = suppressed === 'true';

    const alerts = this.alertManager.getActiveAlerts(filters);

    if (limit) {
      return alerts.slice(0, parseInt(limit, 10));
    }

    return alerts;
  }

  acknowledgeAlert(request) {
    if (!this.alertManager) {
      return { success: false, error: 'Alert manager service not available' };
    }

    const { id } = request.params;
    const ackData = request.body || {};

    return this.alertManager.acknowledgeAlert(id, ackData);
  }

  resolveAlert(request) {
    if (!this.alertManager) {
      return { success: false, error: 'Alert manager service not available' };
    }

    const { id } = request.params;
    const resolveData = request.body || {};

    return this.alertManager.resolveAlert(id, resolveData);
  }

  getAlertMetrics(request) {
    if (!this.alertManager) {
      return { success: false, error: 'Alert manager service not available' };
    }

    return this.alertManager.getMetrics();
  }

  // ===== Escalation Endpoints =====

  startEscalation(request) {
    if (!this.escalationEngine) {
      return { success: false, error: 'Escalation engine service not available' };
    }

    const { alertId, chainId } = request.body;

    if (!alertId || !chainId) {
      return { success: false, error: 'Alert ID and Chain ID are required' };
    }

    const alert = { id: alertId, severity: request.body.severity || 'HIGH' };
    return this.escalationEngine.startEscalation(alert, chainId);
  }

  getEscalationStatus(request) {
    if (!this.escalationEngine) {
      return { success: false, error: 'Escalation engine service not available' };
    }

    const { id } = request.params;
    return this.escalationEngine.getEscalationStatus(id);
  }

  getEscalationChains(request) {
    if (!this.escalationEngine) {
      return { success: false, error: 'Escalation engine service not available' };
    }

    return this.escalationEngine.getAllChains();
  }

  getEscalationMetrics(request) {
    if (!this.escalationEngine) {
      return { success: false, error: 'Escalation engine service not available' };
    }

    return this.escalationEngine.getMetrics();
  }

  // ===== System Endpoints =====

  healthCheck(request) {
    const health = {
      status: 'HEALTHY',
      timestamp: new Date(),
      services: {
        autoRemediation: this.autoRemediation ? 'available' : 'unavailable',
        router: this.intelligentRouter ? 'available' : 'unavailable',
        circuitBreaker: this.circuitBreaker ? 'available' : 'unavailable',
        bulkhead: this.bulkheadManager ? 'available' : 'unavailable',
        alerts: this.alertManager ? 'available' : 'unavailable',
        escalation: this.escalationEngine ? 'available' : 'unavailable',
      },
      metrics: {
        remediation: this.autoRemediation ? this.autoRemediation.getMetrics() : null,
        routing: this.intelligentRouter ? this.intelligentRouter.getRoutingMetrics() : null,
        alerts: this.alertManager ? this.alertManager.getMetrics() : null,
        escalation: this.escalationEngine ? this.escalationEngine.getMetrics() : null,
      },
    };

    return health;
  }

  getSummary(request) {
    return {
      timestamp: new Date(),
      autoRemediation: this.autoRemediation ? this.autoRemediation.getSummary() : null,
      routing: this.intelligentRouter ? this.intelligentRouter.getSummary() : null,
      circuitBreaker: this.circuitBreaker ? this.circuitBreaker.getSummary() : null,
      bulkhead: this.bulkheadManager ? this.bulkheadManager.getSummary() : null,
      alerts: this.alertManager ? this.alertManager.getSummary() : null,
      escalation: this.escalationEngine ? this.escalationEngine.getSummary() : null,
    };
  }
}

module.exports = AutomationRoutes;
