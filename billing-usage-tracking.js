/**
 * Billing & Usage Tracking Engine
 * Resource usage tracking, cost calculation, and invoice generation
 * 
 * Features:
 * - Per-tenant usage tracking
 * - Multiple pricing models (pay-per-use, tiered, monthly)
 * - Real-time cost calculation
 * - Invoice generation
 * - Usage-based scaling
 * - Cost optimization recommendations
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class BillingUsageTrackingEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      defaultPricingModel: 'TIERED',
      billingCycleDays: 30,
      invoiceRetentionDays: 2555, // 7 years
      ...config
    };

    this.usageMetrics = new Map();
    this.pricingModels = new Map();
    this.billingCycles = new Map();
    this.invoices = new Map();
    this.resourceLimits = new Map();
    this.costHistory = new Map();
    this.recommendations = new Map();
    this.stats = {
      totalUsageRecorded: 0,
      totalInvoicesGenerated: 0,
      totalCostCalculated: 0,
      recommendationsProvided: 0
    };

    this.initializePricingTiers();
  }

  /**
   * Record usage metric
   * @param {string} tenantId - Tenant identifier
   * @param {string} metric - Metric name
   * @param {number} quantity - Usage quantity
   * @returns {Object} Record result
   */
  recordUsage(tenantId, metric, quantity) {
    const key = `${tenantId}:${metric}`;

    if (!this.usageMetrics.has(key)) {
      this.usageMetrics.set(key, []);
    }

    const entry = {
      timestamp: new Date(),
      metric,
      quantity,
      cost: this.calculateMetricCost(tenantId, metric, quantity)
    };

    this.usageMetrics.get(key).push(entry);

    // Keep only recent usage (30 days by default)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const filtered = this.usageMetrics
      .get(key)
      .filter(e => e.timestamp >= cutoff);
    this.usageMetrics.set(key, filtered);

    this.stats.totalUsageRecorded++;

    this.emit('usage:recorded', entry);

    return { recorded: true };
  }

  /**
   * Get usage for tenant
   * @param {string} tenantId - Tenant identifier
   * @param {Object} timeRange - Time range { start, end }
   * @returns {Object} Usage data
   */
  getUsage(tenantId, timeRange = {}) {
    const now = new Date();
    const start = timeRange.start || new Date(now - 30 * 24 * 60 * 60 * 1000);
    const end = timeRange.end || now;

    const metrics = {};

    for (const [key, entries] of this.usageMetrics) {
      if (key.startsWith(`${tenantId}:`)) {
        const metric = key.split(':')[1];
        const filtered = entries.filter(
          e => e.timestamp >= start && e.timestamp <= end
        );

        if (filtered.length > 0) {
          metrics[metric] = {
            entries: filtered.length,
            totalQuantity: filtered.reduce((sum, e) => sum + e.quantity, 0),
            totalCost: filtered.reduce((sum, e) => sum + e.cost, 0)
          };
        }
      }
    }

    return { metrics };
  }

  /**
   * Get usage statistics
   * @param {string} tenantId - Tenant identifier
   * @returns {Object} Usage stats
   */
  getUsageStats(tenantId) {
    const usage = this.getUsage(tenantId);
    let total = 0;
    const byService = {};

    for (const [metric, data] of Object.entries(usage.metrics)) {
      byService[metric] = data.totalCost;
      total += data.totalCost;
    }

    // Calculate trend
    const lastWeek = this.getUsage(tenantId, {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    let lastWeekTotal = 0;
    for (const data of Object.values(lastWeek.metrics)) {
      lastWeekTotal += data.totalCost;
    }

    const trend = lastWeekTotal > 0
      ? ((total - lastWeekTotal) / lastWeekTotal) * 100
      : 0;

    return {
      total,
      byService,
      trend: trend.toFixed(2) + '%'
    };
  }

  /**
   * Set pricing model
   * @param {string} tenantId - Tenant identifier
   * @param {Object} model - Pricing model
   * @returns {Object} Result
   */
  setPricingModel(tenantId, model) {
    const modelId = this.generateModelId();

    const pricingModel = {
      modelId,
      tenantId,
      type: model.type || 'TIERED', // TIERED, PAY_PER_USE, FIXED
      tiers: model.tiers || this.getDefaultTiers(),
      baseCost: model.baseCost || 0,
      createdAt: new Date()
    };

    this.pricingModels.set(modelId, pricingModel);

    this.emit('pricing:set', pricingModel);

    return { modelId };
  }

  /**
   * Calculate cost
   * @param {string} tenantId - Tenant identifier
   * @param {Object} timeRange - Time range
   * @returns {Object} Cost calculation
   */
  calculateCost(tenantId, timeRange = {}) {
    const usage = this.getUsage(tenantId, timeRange);
    let total = 0;
    const breakdown = {};

    for (const [metric, data] of Object.entries(usage.metrics)) {
      breakdown[metric] = data.totalCost;
      total += data.totalCost;
    }

    this.stats.totalCostCalculated++;

    return {
      total,
      breakdown,
      currency: 'USD',
      timeRange: {
        start: timeRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: timeRange.end || new Date()
      }
    };
  }

  /**
   * Get pricing tiers
   * @param {string} tenantId - Tenant identifier
   * @returns {Array} Pricing tiers
   */
  getPricingTiers(tenantId) {
    const model = Array.from(this.pricingModels.values())
      .find(m => m.tenantId === tenantId);

    return model ? model.tiers : this.getDefaultTiers();
  }

  /**
   * Start billing cycle
   * @param {string} tenantId - Tenant identifier
   * @returns {Object} Billing cycle
   */
  startBillingCycle(tenantId) {
    const cycleId = this.generateCycleId();
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + this.config.billingCycleDays);

    const cycle = {
      cycleId,
      tenantId,
      startDate: now,
      endDate,
      status: 'ACTIVE',
      invoiceGenerated: false,
      totalCost: 0
    };

    this.billingCycles.set(cycleId, cycle);

    this.emit('cycle:started', cycle);

    return {
      cycleId,
      startDate: cycle.startDate,
      endDate: cycle.endDate
    };
  }

  /**
   * Generate invoice
   * @param {string} tenantId - Tenant identifier
   * @param {string} cycleId - Billing cycle ID
   * @returns {Object} Invoice
   */
  generateInvoice(tenantId, cycleId) {
    const cycle = this.billingCycles.get(cycleId);
    if (!cycle || cycle.tenantId !== tenantId) {
      throw new Error(`Billing cycle ${cycleId} not found`);
    }

    const invoiceId = this.generateInvoiceId();
    const cost = this.calculateCost(tenantId, {
      start: cycle.startDate,
      end: cycle.endDate
    });

    const invoice = {
      invoiceId,
      tenantId,
      cycleId,
      amount: cost.total,
      breakdown: cost.breakdown,
      issueDate: new Date(),
      dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'ISSUED',
      items: this.generateInvoiceItems(cost)
    };

    this.invoices.set(invoiceId, invoice);
    cycle.invoiceGenerated = true;
    cycle.status = 'CLOSED';
    cycle.totalCost = cost.total;

    this.stats.totalInvoicesGenerated++;

    this.emit('invoice:generated', invoice);

    return {
      invoiceId,
      content: this.formatInvoice(invoice),
      status: invoice.status
    };
  }

  /**
   * Get invoice history
   * @param {string} tenantId - Tenant identifier
   * @returns {Array} Invoice list
   */
  getInvoiceHistory(tenantId) {
    return Array.from(this.invoices.values())
      .filter(i => i.tenantId === tenantId)
      .map(i => ({
        invoiceId: i.invoiceId,
        amount: i.amount,
        issueDate: i.issueDate,
        status: i.status
      }));
  }

  /**
   * Get optimization recommendations
   * @param {string} tenantId - Tenant identifier
   * @returns {Array} Recommendations
   */
  getOptimizationRecommendations(tenantId) {
    const recommendations = [];
    const stats = this.getUsageStats(tenantId);

    // High usage detection
    const total = stats.total;
    if (total > 10000) {
      recommendations.push({
        priority: 'HIGH',
        type: 'SCALING',
        message: 'Consider upgrading to higher tier for cost savings',
        estimatedSavings: Math.round(total * 0.2)
      });
    }

    // Trend analysis
    const trend = parseFloat(stats.trend);
    if (trend > 50) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'TREND',
        message: 'Usage trending up significantly',
        estimatedSavings: 0
      });
    }

    // Service-specific optimization
    for (const [service, cost] of Object.entries(stats.byService)) {
      if (cost > total * 0.5) {
        recommendations.push({
          priority: 'MEDIUM',
          type: 'SERVICE_OPTIMIZATION',
          service,
          message: `${service} represents ${Math.round((cost / total) * 100)}% of costs`,
          estimatedSavings: Math.round(cost * 0.1)
        });
      }
    }

    this.stats.recommendationsProvided++;

    return recommendations;
  }

  /**
   * Estimate cost
   * @param {string} tenantId - Tenant identifier
   * @param {Object} usage - Usage projection
   * @returns {Object} Cost estimate
   */
  estimateCost(tenantId, usage) {
    let estimated = 0;

    for (const [metric, quantity] of Object.entries(usage)) {
      estimated += this.calculateMetricCost(tenantId, metric, quantity);
    }

    return {
      estimatedCost: estimated,
      currency: 'USD',
      confidence: 0.85
    };
  }

  /**
   * Get metered resources
   * @param {string} tenantId - Tenant identifier
   * @returns {Object} Resources
   */
  getMeteredResources(tenantId) {
    const resources = {};

    for (const [key] of this.usageMetrics) {
      if (key.startsWith(`${tenantId}:`)) {
        const metric = key.split(':')[1];
        const limit = this.resourceLimits.get(`${tenantId}:${metric}`) || null;
        resources[metric] = {
          limit,
          tracked: true
        };
      }
    }

    return { resources };
  }

  /**
   * Set resource limit
   * @param {string} tenantId - Tenant identifier
   * @param {string} resource - Resource name
   * @param {number} limit - Resource limit
   * @returns {Object} Result
   */
  setResourceLimit(tenantId, resource, limit) {
    const limitId = this.generateLimitId();
    const key = `${tenantId}:${resource}`;

    this.resourceLimits.set(key, {
      limitId,
      tenantId,
      resource,
      limit,
      createdAt: new Date()
    });

    this.emit('limit:set', { tenantId, resource, limit });

    return { limitId };
  }

  /**
   * Calculate metric cost
   * @private
   */
  calculateMetricCost(tenantId, metric, quantity) {
    // Simplified pricing: $0.01 per unit
    // In production, would use actual pricing model
    return quantity * 0.01;
  }

  /**
   * Get default pricing tiers
   * @private
   */
  getDefaultTiers() {
    return [
      { level: 1, upTo: 1000, pricePerUnit: 0.01 },
      { level: 2, upTo: 10000, pricePerUnit: 0.008 },
      { level: 3, upTo: 100000, pricePerUnit: 0.005 },
      { level: 4, upTo: Infinity, pricePerUnit: 0.003 }
    ];
  }

  /**
   * Initialize default pricing tiers
   * @private
   */
  initializePricingTiers() {
    this.pricingModels.set('default-tiered', {
      type: 'TIERED',
      tiers: this.getDefaultTiers()
    });
  }

  /**
   * Generate invoice items
   * @private
   */
  generateInvoiceItems(cost) {
    const items = [];

    for (const [service, amount] of Object.entries(cost.breakdown)) {
      items.push({
        description: service,
        amount,
        quantity: 1,
        unitPrice: amount
      });
    }

    return items;
  }

  /**
   * Format invoice for display
   * @private
   */
  formatInvoice(invoice) {
    let content = `INVOICE\n`;
    content += `Invoice ID: ${invoice.invoiceId}\n`;
    content += `Tenant ID: ${invoice.tenantId}\n`;
    content += `Issue Date: ${invoice.issueDate}\n`;
    content += `Due Date: ${invoice.dueDate}\n`;
    content += `\nLineItems:\n`;

    for (const item of invoice.items) {
      content += `  ${item.description}: $${item.amount.toFixed(2)}\n`;
    }

    content += `\nTotal: $${invoice.amount.toFixed(2)}\n`;

    return content;
  }

  /**
   * Generate model ID
   * @private
   */
  generateModelId() {
    return `model-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate cycle ID
   * @private
   */
  generateCycleId() {
    return `cycle-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate invoice ID
   * @private
   */
  generateInvoiceId() {
    return `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Generate limit ID
   * @private
   */
  generateLimitId() {
    return `limit-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Get statistics
   * @returns {Object} Stats
   */
  getMetrics() {
    return {
      ...this.stats,
      invoicesCount: this.invoices.size,
      billingCyclesCount: this.billingCycles.size
    };
  }

  /**
   * Health check
   * @returns {Object} Health status
   */
  healthCheck() {
    return {
      status: 'HEALTHY',
      timestamp: new Date(),
      metrics: this.getMetrics(),
      features: [
        'usage_tracking',
        'cost_calculation',
        'invoice_generation',
        'pricing_models',
        'recommendations'
      ]
    };
  }
}

module.exports = BillingUsageTrackingEngine;
