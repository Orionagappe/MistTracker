/**
 * Performance Tracker - Real-time API and component performance metrics
 * Tracks response times, latency, errors, and resource usage
 * 
 * @file client/src/services/performanceTracker.js
 * @version 1.0.0
 */

class PerformanceTracker {
  constructor() {
    this.metrics = {
      apiCalls: [],
      componentRenders: [],
      errors: [],
      resources: {
        memory: [],
        network: [],
      },
    };
    
    this.config = {
      maxHistorySize: 1000, // Keep last 1000 entries
      samplingInterval: 5000, // Sample every 5 seconds
      enableResourceMonitoring: true,
    };

    this.aggregatedMetrics = {
      apiPerformance: {},
      componentPerformance: {},
      errorRate: 0,
      systemHealth: 'healthy',
    };

    // Initialize monitoring
    this.initPerformanceObserver();
    this.initResourceMonitoring();
  }

  /**
   * Initialize Performance Observer API
   */
  initPerformanceObserver() {
    if (window.PerformanceObserver) {
      try {
        // Observe navigation timing
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.recordNavigation(entry);
            } else if (entry.entryType === 'resource') {
              this.recordResourceTiming(entry);
            }
          }
        });

        observer.observe({ 
          entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint']
        });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }
    }
  }

  /**
   * Initialize resource monitoring (memory, battery, etc.)
   */
  initResourceMonitoring() {
    if (!this.config.enableResourceMonitoring) return;

    // Monitor memory if available
    if (performance.memory) {
      setInterval(() => {
        this.metrics.resources.memory.push({
          timestamp: Date.now(),
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        });

        // Keep only recent entries
        if (this.metrics.resources.memory.length > this.config.maxHistorySize) {
          this.metrics.resources.memory.shift();
        }
      }, this.config.samplingInterval);
    }

    // Monitor connection
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this.recordConnectionChange();
      });
    }
  }

  /**
   * Record API call performance
   */
  recordAPICall(endpoint, method, duration, status, size = 0) {
    const call = {
      timestamp: Date.now(),
      endpoint,
      method,
      duration,
      status,
      size,
      success: status >= 200 && status < 300,
    };

    this.metrics.apiCalls.push(call);

    // Keep history limited
    if (this.metrics.apiCalls.length > this.config.maxHistorySize) {
      this.metrics.apiCalls.shift();
    }

    // Update aggregated metrics
    this.updateAPIMetrics(endpoint, duration, status);
  }

  /**
   * Record component render
   */
  recordComponentRender(componentName, duration, renderType = 'mount') {
    const render = {
      timestamp: Date.now(),
      componentName,
      duration,
      renderType, // 'mount', 'update', 'memo-skip'
    };

    this.metrics.componentRenders.push(render);

    if (this.metrics.componentRenders.length > this.config.maxHistorySize) {
      this.metrics.componentRenders.shift();
    }

    this.updateComponentMetrics(componentName, duration);
  }

  /**
   * Record error
   */
  recordError(errorType, message, stack = '', context = {}) {
    const error = {
      timestamp: Date.now(),
      type: errorType,
      message,
      stack,
      context,
    };

    this.metrics.errors.push(error);

    if (this.metrics.errors.length > this.config.maxHistorySize) {
      this.metrics.errors.shift();
    }

    this.updateErrorMetrics();
  }

  /**
   * Record navigation timing (page load)
   */
  recordNavigation(entry) {
    const metrics = {
      timestamp: Date.now(),
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnection: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart,
      contentDownload: entry.responseEnd - entry.responseStart,
      domParsing: entry.domInteractive - entry.domLoading,
      domInteractive: entry.domInteractive,
      domComplete: entry.domComplete,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      totalPageLoad: entry.loadEventEnd - entry.fetchStart,
    };

    this.metrics.apiCalls.push({
      ...metrics,
      endpoint: 'pageLoad',
      type: 'navigation',
    });
  }

  /**
   * Record resource timing (API calls, images, etc.)
   */
  recordResourceTiming(entry) {
    const metrics = {
      timestamp: Date.now(),
      resource: entry.name,
      type: entry.initiatorType,
      duration: entry.duration,
      size: entry.transferSize || 0,
      encoded: entry.encodedBodySize || 0,
      decoded: entry.decodedBodySize || 0,
    };

    if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
      this.metrics.apiCalls.push(metrics);
    }
  }

  /**
   * Record connection change
   */
  recordConnectionChange() {
    const connection = navigator.connection;
    if (!connection) return;

    this.metrics.resources.network.push({
      timestamp: Date.now(),
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    });
  }

  /**
   * Update aggregated API metrics
   */
  updateAPIMetrics(endpoint, duration, status) {
    if (!this.aggregatedMetrics.apiPerformance[endpoint]) {
      this.aggregatedMetrics.apiPerformance[endpoint] = {
        calls: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errors: 0,
        successRate: 100,
        lastCall: Date.now(),
      };
    }

    const metric = this.aggregatedMetrics.apiPerformance[endpoint];
    metric.calls++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.avgDuration = metric.totalDuration / metric.calls;
    metric.lastCall = Date.now();

    if (status >= 400) {
      metric.errors++;
      metric.successRate = ((metric.calls - metric.errors) / metric.calls * 100).toFixed(2);
    }

    // Calculate percentiles
    this.calculatePercentiles(endpoint);
  }

  /**
   * Update aggregated component metrics
   */
  updateComponentMetrics(componentName, duration) {
    if (!this.aggregatedMetrics.componentPerformance[componentName]) {
      this.aggregatedMetrics.componentPerformance[componentName] = {
        renders: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        slowRenders: 0,
        lastRender: Date.now(),
      };
    }

    const metric = this.aggregatedMetrics.componentPerformance[componentName];
    metric.renders++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.avgDuration = metric.totalDuration / metric.renders;
    metric.lastRender = Date.now();

    // Track slow renders (>100ms)
    if (duration > 100) {
      metric.slowRenders++;
    }
  }

  /**
   * Update error metrics
   */
  updateErrorMetrics() {
    const total = this.metrics.apiCalls.length + 1; // +1 for new error
    const errorCount = this.metrics.errors.length;
    this.aggregatedMetrics.errorRate = (errorCount / total * 100).toFixed(2);

    // Determine system health
    if (this.aggregatedMetrics.errorRate > 5) {
      this.aggregatedMetrics.systemHealth = 'critical';
    } else if (this.aggregatedMetrics.errorRate > 2) {
      this.aggregatedMetrics.systemHealth = 'warning';
    } else {
      this.aggregatedMetrics.systemHealth = 'healthy';
    }
  }

  /**
   * Calculate percentiles for API performance
   */
  calculatePercentiles(endpoint) {
    const calls = this.metrics.apiCalls
      .filter(c => c.endpoint === endpoint)
      .map(c => c.duration)
      .sort((a, b) => a - b);

    if (calls.length === 0) return;

    const metric = this.aggregatedMetrics.apiPerformance[endpoint];
    metric.p95Duration = this.getPercentile(calls, 95);
    metric.p99Duration = this.getPercentile(calls, 99);
  }

  /**
   * Calculate percentile value
   */
  getPercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  /**
   * Get API performance summary
   */
  getAPIPerformance(endpoint = null) {
    if (endpoint) {
      return this.aggregatedMetrics.apiPerformance[endpoint] || null;
    }
    return this.aggregatedMetrics.apiPerformance;
  }

  /**
   * Get component performance summary
   */
  getComponentPerformance(component = null) {
    if (component) {
      return this.aggregatedMetrics.componentPerformance[component] || null;
    }
    return this.aggregatedMetrics.componentPerformance;
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit = 10) {
    return Object.entries(this.aggregatedMetrics.apiPerformance)
      .sort(([, a], [, b]) => b.avgDuration - a.avgDuration)
      .slice(0, limit)
      .map(([endpoint, metrics]) => ({ endpoint, ...metrics }));
  }

  /**
   * Get slowest components
   */
  getSlowestComponents(limit = 10) {
    return Object.entries(this.aggregatedMetrics.componentPerformance)
      .sort(([, a], [, b]) => b.avgDuration - a.avgDuration)
      .slice(0, limit)
      .map(([component, metrics]) => ({ component, ...metrics }));
  }

  /**
   * Get most rendered components
   */
  getMostRenderedComponents(limit = 10) {
    return Object.entries(this.aggregatedMetrics.componentPerformance)
      .sort(([, a], [, b]) => b.renders - a.renders)
      .slice(0, limit)
      .map(([component, metrics]) => ({ component, ...metrics }));
  }

  /**
   * Get endpoints with highest error rates
   */
  getErrorProneEndpoints(limit = 10) {
    return Object.entries(this.aggregatedMetrics.apiPerformance)
      .filter(([, metrics]) => metrics.errors > 0)
      .sort(([, a], [, b]) => b.errors - a.errors)
      .slice(0, limit)
      .map(([endpoint, metrics]) => ({ endpoint, ...metrics }));
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 50) {
    return this.metrics.errors
      .slice(-limit)
      .reverse();
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    if (this.metrics.resources.memory.length === 0) {
      return null;
    }

    const latest = this.metrics.resources.memory[this.metrics.resources.memory.length - 1];
    const usagePercent = (latest.usedJSHeapSize / latest.jsHeapSizeLimit * 100).toFixed(2);

    return {
      usedMB: (latest.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (latest.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limitMB: (latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      usagePercent,
    };
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData,
      };
    }
    return null;
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      systemHealth: this.aggregatedMetrics.systemHealth,
      errorRate: this.aggregatedMetrics.errorRate,
      summary: {
        totalAPICalls: this.metrics.apiCalls.length,
        totalComponentRenders: this.metrics.componentRenders.length,
        totalErrors: this.metrics.errors.length,
      },
      apiPerformance: this.aggregatedMetrics.apiPerformance,
      componentPerformance: this.aggregatedMetrics.componentPerformance,
      slowestEndpoints: this.getSlowestEndpoints(5),
      slowestComponents: this.getSlowestComponents(5),
      mostRenderedComponents: this.getMostRenderedComponents(5),
      errorProneEndpoints: this.getErrorProneEndpoints(5),
      recentErrors: this.getRecentErrors(10),
      memory: this.getMemoryUsage(),
      network: this.getNetworkInfo(),
    };
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = {
      apiCalls: [],
      componentRenders: [],
      errors: [],
      resources: {
        memory: [],
        network: [],
      },
    };
    this.aggregatedMetrics = {
      apiPerformance: {},
      componentPerformance: {},
      errorRate: 0,
      systemHealth: 'healthy',
    };
  }

  /**
   * Export metrics as JSON
   */
  export() {
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      metrics: this.metrics,
      aggregated: this.aggregatedMetrics,
    };
  }
}

// Create singleton instance
let performanceTracker = null;

/**
 * Get or create performance tracker singleton
 */
export function getPerformanceTracker() {
  if (!performanceTracker) {
    performanceTracker = new PerformanceTracker();
  }
  return performanceTracker;
}

export default PerformanceTracker;
