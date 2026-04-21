/**
 * Dashboard & Reporting Service
 * Real-time metrics, custom reports, and data visualization
 * 
 * Features:
 * - Report templates and execution
 * - Real-time metrics aggregation
 * - Custom metric definitions
 * - Data export (PDF, CSV, JSON)
 * - Scheduled report generation
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class DashboardReportingService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      metricsRetentionDays: 90,
      maxReports: 1000,
      maxMetricsPerTenant: 500,
      aggregationWindow: 60000, // 1 minute
      ...config
    };

    this.reports = new Map();
    this.metrics = new Map();
    this.dashboards = new Map();
    this.reportSchedules = new Map();
    this.metricsHistory = new Map();
    this.aggregationCache = new Map();
    this.stats = {
      reportsGenerated: 0,
      metricsCollected: 0,
      dashboardsViewed: 0,
      exportsCreated: 0
    };
  }

  /**
   * Create report template
   * @param {Object} reportDef - Report definition
   * @returns {Object} Created report
   */
  createReport(reportDef) {
    if (!reportDef.title || !reportDef.type) {
      throw new Error('Report must have title and type');
    }

    const reportId = this.generateReportId();

    const report = {
      reportId,
      title: reportDef.title,
      type: reportDef.type, // 'DASHBOARD', 'REPORT', 'EXPORT'
      description: reportDef.description || '',
      metrics: reportDef.metrics || [],
      filters: reportDef.filters || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastGenerated: null,
      format: reportDef.format || 'JSON',
      refreshInterval: reportDef.refreshInterval || 300000, // 5 minutes
      enabled: true
    };

    this.reports.set(reportId, report);

    this.emit('report:created', report);

    return {
      reportId,
      status: 'CREATED',
      title: report.title
    };
  }

  /**
   * Get report
   * @param {string} reportId - Report identifier
   * @returns {Object} Report with data
   */
  getReport(reportId) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const data = this.generateReportData(report);

    return {
      definition: report,
      data,
      metadata: {
        generatedAt: new Date(),
        version: '1.0',
        dataPoints: data.length || 0
      }
    };
  }

  /**
   * Update report
   * @param {string} reportId - Report identifier
   * @param {Object} updates - Updates to apply
   * @returns {Object} Result
   */
  updateReport(reportId, updates) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const allowedFields = ['title', 'description', 'metrics', 'filters', 'format', 'refreshInterval', 'enabled'];

    for (const field of allowedFields) {
      if (field in updates) {
        report[field] = updates[field];
      }
    }

    report.updatedAt = new Date();

    this.emit('report:updated', { reportId, updates });

    return { success: true };
  }

  /**
   * Delete report
   * @param {string} reportId - Report identifier
   * @returns {Object} Result
   */
  deleteReport(reportId) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    this.reports.delete(reportId);
    this.reportSchedules.delete(reportId);

    this.emit('report:deleted', { reportId });

    return { success: true };
  }

  /**
   * Define custom metric
   * @param {Object} metricDef - Metric definition
   * @returns {Object} Created metric
   */
  defineMetric(metricDef) {
    if (!metricDef.name || !metricDef.type) {
      throw new Error('Metric must have name and type');
    }

    const metricId = this.generateMetricId();

    const metric = {
      metricId,
      name: metricDef.name,
      type: metricDef.type, // 'GAUGE', 'COUNTER', 'HISTOGRAM'
      unit: metricDef.unit || '',
      description: metricDef.description || '',
      aggregationFunc: metricDef.aggregationFunc || 'SUM',
      createdAt: new Date(),
      enabled: true,
      formula: metricDef.formula // Optional formula for computed metrics
    };

    this.metrics.set(metricId, metric);
    this.metricsHistory.set(metricId, []);

    this.emit('metric:defined', metric);

    return {
      metricId,
      name: metric.name,
      type: metric.type
    };
  }

  /**
   * Get metric data
   * @param {string} metricId - Metric identifier
   * @param {Object} timeRange - Time range { start, end }
   * @returns {Array} Metric values
   */
  getMetric(metricId, timeRange = {}) {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      throw new Error(`Metric ${metricId} not found`);
    }

    const history = this.metricsHistory.get(metricId) || [];
    const now = new Date();
    const start = timeRange.start || new Date(now - 24 * 60 * 60 * 1000); // Default 24h
    const end = timeRange.end || now;

    const filtered = history.filter(point =>
      point.timestamp >= start && point.timestamp <= end
    );

    return {
      values: filtered.map(p => p.value),
      timestamps: filtered.map(p => p.timestamp)
    };
  }

  /**
   * Record metric value
   * @param {string} metricId - Metric identifier
   * @param {number} value - Metric value
   */
  recordMetric(metricId, value) {
    const metric = this.metrics.get(metricId);
    if (!metric || !metric.enabled) {
      return;
    }

    const history = this.metricsHistory.get(metricId);
    history.push({
      value,
      timestamp: new Date()
    });

    // Keep only recent history (last 90 days by config)
    const cutoff = new Date() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    const filtered = history.filter(p => p.timestamp >= cutoff);
    this.metricsHistory.set(metricId, filtered);

    this.stats.metricsCollected++;

    this.emit('metric:recorded', { metricId, value });
  }

  /**
   * Aggregate metrics
   * @param {Array} metricIds - Metric identifiers
   * @param {string} aggregation - Aggregation function (SUM, AVG, MIN, MAX)
   * @returns {Object} Aggregated result
   */
  aggregateMetrics(metricIds, aggregation = 'SUM') {
    if (!Array.isArray(metricIds) || metricIds.length === 0) {
      throw new Error('Must provide metric IDs array');
    }

    const cacheKey = `${metricIds.join(',')}:${aggregation}`;
    if (this.aggregationCache.has(cacheKey)) {
      return this.aggregationCache.get(cacheKey);
    }

    const values = [];

    for (const metricId of metricIds) {
      const history = this.metricsHistory.get(metricId) || [];
      if (history.length > 0) {
        values.push(history[history.length - 1].value);
      }
    }

    let result;

    switch (aggregation) {
      case 'SUM':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'AVG':
        result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        break;
      case 'MIN':
        result = values.length > 0 ? Math.min(...values) : 0;
        break;
      case 'MAX':
        result = values.length > 0 ? Math.max(...values) : 0;
        break;
      default:
        result = 0;
    }

    const response = { result, aggregation, metricCount: metricIds.length };

    // Cache for 1 minute
    this.aggregationCache.set(cacheKey, response);
    setTimeout(() => this.aggregationCache.delete(cacheKey), this.config.aggregationWindow);

    return response;
  }

  /**
   * Get dashboard
   * @param {string} dashboardId - Dashboard identifier
   * @returns {Object} Dashboard layout and data
   */
  getDashboard(dashboardId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const widgets = [];

    for (const widget of dashboard.widgets) {
      const data = this.getMetric(widget.metricId);
      widgets.push({
        ...widget,
        data
      });
    }

    this.stats.dashboardsViewed++;

    return {
      layout: dashboard.layout,
      widgets,
      data: {
        generatedAt: new Date(),
        refreshInterval: dashboard.refreshInterval
      }
    };
  }

  /**
   * Get real-time metrics for tenant
   * @param {string} tenantId - Tenant identifier
   * @returns {Object} Real-time metrics
   */
  getRealTimeMetrics(tenantId) {
    const metrics = {};

    // Simulated real-time data (would aggregate from actual sources)
    const metricsList = Array.from(this.metrics.values())
      .filter(m => m.enabled)
      .slice(0, 10);

    for (const metric of metricsList) {
      const history = this.metricsHistory.get(metric.metricId) || [];
      const latest = history[history.length - 1];

      metrics[metric.name] = {
        value: latest ? latest.value : 0,
        unit: metric.unit,
        timestamp: latest ? latest.timestamp : new Date(),
        trend: this.calculateTrend(history)
      };
    }

    return { metrics };
  }

  /**
   * Generate report output
   * @param {string} reportId - Report identifier
   * @param {string} format - Output format (PDF, CSV, JSON)
   * @returns {Object} Generated report
   */
  generateReport(reportId, format = 'JSON') {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const data = this.generateReportData(report);
    const filename = `${report.title}-${Date.now()}.${format.toLowerCase()}`;

    let content;

    switch (format.toUpperCase()) {
      case 'JSON':
        content = JSON.stringify(data, null, 2);
        break;
      case 'CSV':
        content = this.convertToCSV(data);
        break;
      case 'PDF':
        content = this.convertToPDF(data, report.title);
        break;
      default:
        content = JSON.stringify(data);
    }

    report.lastGenerated = new Date();
    this.stats.reportsGenerated++;

    this.emit('report:generated', { reportId, format, filename });

    return {
      content,
      format,
      filename,
      generatedAt: new Date()
    };
  }

  /**
   * Schedule report generation
   * @param {string} reportId - Report identifier
   * @param {Object} schedule - Schedule config { interval, startTime, endTime }
   * @returns {Object} Schedule result
   */
  scheduleReport(reportId, schedule) {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const scheduleId = this.generateScheduleId();

    const scheduled = {
      scheduleId,
      reportId,
      interval: schedule.interval || 'DAILY',
      startTime: schedule.startTime || new Date(),
      endTime: schedule.endTime,
      frequency: schedule.frequency || 1,
      enabled: true,
      lastRun: null,
      nextRun: this.calculateNextRun(schedule.interval)
    };

    this.reportSchedules.set(scheduleId, scheduled);

    this.emit('report:scheduled', scheduled);

    return {
      scheduleId,
      status: 'SCHEDULED'
    };
  }

  /**
   * Export data
   * @param {string} dataId - Data identifier
   * @param {string} format - Export format
   * @returns {Object} Export URL and info
   */
  exportData(dataId, format = 'CSV') {
    const url = `https://api.example.com/exports/${this.generateExportId()}`;
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

    this.stats.exportsCreated++;

    this.emit('data:exported', { dataId, format, url });

    return {
      url,
      format,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    };
  }

  /**
   * Query metrics with custom SQL-like syntax
   * @param {string} query - Query string
   * @param {Object} timeRange - Time range
   * @returns {Array} Query results
   */
  queryMetrics(query, timeRange = {}) {
    // Simple query parser (SELECT metric1, metric2 WHERE ...)
    // In production, this would be a full query engine

    const results = [];

    // Extract metric names from query
    const metricNames = query
      .match(/metric_\w+/g) || [];

    for (const name of metricNames) {
      const metric = Array.from(this.metrics.values())
        .find(m => m.name === name);

      if (metric) {
        results.push(this.getMetric(metric.metricId, timeRange));
      }
    }

    return results;
  }

  /**
   * Execute custom query
   * @param {string} sql - SQL query
   * @param {string} tenantId - Tenant identifier
   * @returns {Object} Query results
   */
  executeCustomQuery(sql, tenantId) {
    // Security: In production, this would use parameterized queries
    // and validate SQL syntax

    const startTime = Date.now();

    // Simulated execution
    const results = [];
    if (sql.includes('SELECT')) {
      results.push(
        { id: 1, metric: 'cpu_usage', value: 45 },
        { id: 2, metric: 'memory_usage', value: 62 }
      );
    }

    const executionTime = Date.now() - startTime;

    this.emit('custom:query:executed', { tenantId, sql, executionTime });

    return {
      results,
      executionTime,
      rowCount: results.length
    };
  }

  /**
   * Generate report data
   * @private
   */
  generateReportData(report) {
    const data = [];

    for (const metricId of report.metrics) {
      const metric = this.getMetric(metricId);
      if (metric.values.length > 0) {
        data.push({
          metric: metricId,
          values: metric.values,
          summary: {
            min: Math.min(...metric.values),
            max: Math.max(...metric.values),
            avg: metric.values.reduce((a, b) => a + b, 0) / metric.values.length
          }
        });
      }
    }

    return data;
  }

  /**
   * Convert data to CSV
   * @private
   */
  convertToCSV(data) {
    const rows = ['metric,min,max,avg'];

    for (const item of data) {
      rows.push(
        `${item.metric},${item.summary.min},${item.summary.max},${item.summary.avg}`
      );
    }

    return rows.join('\n');
  }

  /**
   * Convert data to PDF
   * @private
   */
  convertToPDF(data, title) {
    return `%PDF-1.4
[PDF content for ${title}]
Data: ${JSON.stringify(data).slice(0, 100)}...
%EOF`;
  }

  /**
   * Calculate trend
   * @private
   */
  calculateTrend(history) {
    if (history.length < 2) return 'STABLE';

    const recent = history.slice(-5);
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    const change = last - first;

    if (change > first * 0.1) return 'UP';
    if (change < -first * 0.1) return 'DOWN';
    return 'STABLE';
  }

  /**
   * Calculate next run time
   * @private
   */
  calculateNextRun(interval) {
    const now = new Date();

    switch (interval) {
      case 'HOURLY':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'DAILY':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'WEEKLY':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Generate report ID
   * @private
   */
  generateReportId() {
    return `report-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate metric ID
   * @private
   */
  generateMetricId() {
    return `metric-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate schedule ID
   * @private
   */
  generateScheduleId() {
    return `schedule-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate export ID
   * @private
   */
  generateExportId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get system statistics
   * @returns {Object} Stats
   */
  getMetrics() {
    return {
      ...this.stats,
      reportsCount: this.reports.size,
      metricsCount: this.metrics.size,
      dashboardsCount: this.dashboards.size
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
        'report_generation',
        'metrics_aggregation',
        'dashboard_rendering',
        'data_export',
        'scheduled_reports'
      ]
    };
  }
}

module.exports = DashboardReportingService;
