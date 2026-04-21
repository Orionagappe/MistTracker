import os from 'os';
import crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * SwarmHealth - Monitor health and metrics of all peers in the swarm
 * Uses crypto.randomBytes() for secure metric identifiers
 */
export class SwarmHealth extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      metricsInterval: config.metricsInterval || 5000,
      alertThresholds: {
        cpu: config.alertThresholds?.cpu || 85,
        memory: config.alertThresholds?.memory || 85,
        errorRate: config.alertThresholds?.errorRate || 0.05
      },
      historySize: config.historySize || 100,
      ...config
    };
    
    this.metrics = new Map(); // peerId -> [metrics history]
    this.alerts = new Map(); // peerId -> [active alerts]
    this.history = [];
  }

  /**
   * Start collecting metrics
   */
  start(peerManager) {
    this.peerManager = peerManager;
    
    // Collect local metrics every interval
    this.metricsInterval = setInterval(() => {
      this.collectLocalMetrics();
    }, this.config.metricsInterval);
    
    console.log('📊 Health monitoring started');
    return true;
  }

  /**
   * Collect local system metrics
   */
  collectLocalMetrics() {
    const cpuUsage = this.getCpuUsage();
    const memoryUsage = this.getMemoryUsage();
    
    const metric = {
      timestamp: Date.now(),
      metricId: `metric-${crypto.randomBytes(12).toString('hex')}`,
      cpu: cpuUsage,
      memory: memoryUsage,
      uptime: process.uptime(),
      nodeVersion: process.version
    };
    
    this.recordMetric(this.peerManager?.peerId || 'local', metric);
    this.checkAlerts(metric);
  }

  /**
   * Get CPU usage percentage
   */
  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Get memory usage percentage
   */
  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return (usedMem / totalMem) * 100;
  }

  /**
   * Record metric for a peer
   */
  recordMetric(peerId, metric) {
    if (!this.metrics.has(peerId)) {
      this.metrics.set(peerId, []);
    }
    
    const history = this.metrics.get(peerId);
    history.push(metric);
    
    // Keep only recent history
    if (history.length > this.config.historySize) {
      history.shift();
    }
    
    // Add to global history
    this.history.push({
      ...metric,
      peerId
    });
    
    if (this.history.length > this.config.historySize * 10) {
      this.history.shift();
    }
    
    this.emit('metricRecorded', { peerId, metric });
  }

  /**
   * Check for alerts
   */
  checkAlerts(metric) {
    const alerts = [];
    
    // CPU alert
    if (metric.cpu > this.config.alertThresholds.cpu) {
      alerts.push({
        type: 'HIGH_CPU',
        value: metric.cpu,
        threshold: this.config.alertThresholds.cpu,
        severity: metric.cpu > 95 ? 'critical' : 'warning'
      });
    }
    
    // Memory alert
    if (metric.memory > this.config.alertThresholds.memory) {
      alerts.push({
        type: 'HIGH_MEMORY',
        value: metric.memory,
        threshold: this.config.alertThresholds.memory,
        severity: metric.memory > 95 ? 'critical' : 'warning'
      });
    }
    
    if (alerts.length > 0) {
      this.emit('alerts', {
        peerId: metric.peerId,
        alerts,
        timestamp: metric.timestamp
      });
    }
  }

  /**
   * Get metrics for a specific peer
   */
  getPeerMetrics(peerId) {
    const history = this.metrics.get(peerId) || [];
    
    if (history.length === 0) {
      return null;
    }
    
    // Calculate averages and trends
    const cpuValues = history.map(m => m.cpu);
    const memoryValues = history.map(m => m.memory);
    
    const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const latest = history[history.length - 1];
    
    return {
      peerId,
      current: {
        cpu: latest.cpu,
        memory: latest.memory
      },
      average: {
        cpu: average(cpuValues),
        memory: average(memoryValues)
      },
      min: {
        cpu: Math.min(...cpuValues),
        memory: Math.min(...memoryValues)
      },
      max: {
        cpu: Math.max(...cpuValues),
        memory: Math.max(...memoryValues)
      },
      history: history,
      recordCount: history.length
    };
  }

  /**
   * Get swarm-wide health summary
   */
  getSwarmHealth() {
    const peers = Array.from(this.metrics.keys());
    
    if (peers.length === 0) {
      return null;
    }
    
    const allCpu = [];
    const allMemory = [];
    
    for (const peerId of peers) {
      const metrics = this.getPeerMetrics(peerId);
      if (metrics) {
        allCpu.push(metrics.current.cpu);
        allMemory.push(metrics.current.memory);
      }
    }
    
    const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    
    return {
      totalPeers: peers.length,
      averageCpu: average(allCpu),
      averageMemory: average(allMemory),
      maxCpu: Math.max(...allCpu),
      maxMemory: Math.max(...allMemory),
      minCpu: Math.min(...allCpu),
      minMemory: Math.min(...allMemory),
      healthScore: 100 - (average(allCpu) + average(allMemory)) / 2,
      timestamp: Date.now()
    };
  }

  /**
   * Get health report for all peers
   */
  getHealthReport() {
    const peers = Array.from(this.metrics.keys());
    const peerReports = [];
    
    for (const peerId of peers) {
      const metrics = this.getPeerMetrics(peerId);
      if (metrics) {
        peerReports.push({
          peerId: peerId.substring(0, 12) + '...',
          current: metrics.current,
          average: metrics.average,
          min: metrics.min,
          max: metrics.max,
          recordCount: metrics.recordCount,
          status: this.getPeerStatus(metrics)
        });
      }
    }
    
    return {
      timestamp: Date.now(),
      swarmHealth: this.getSwarmHealth(),
      peers: peerReports,
      alerts: this.getActiveAlerts()
    };
  }

  /**
   * Determine peer status based on metrics
   */
  getPeerStatus(metrics) {
    const cpu = metrics.current.cpu;
    const memory = metrics.current.memory;
    
    if (cpu > 90 || memory > 90) {
      return 'critical';
    } else if (cpu > 75 || memory > 75) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    const activeAlerts = [];
    
    for (const peerId of this.metrics.keys()) {
      const history = this.metrics.get(peerId);
      if (history.length > 0) {
        const latest = history[history.length - 1];
        
        if (latest.cpu > this.config.alertThresholds.cpu) {
          activeAlerts.push({
            peerId,
            type: 'HIGH_CPU',
            value: latest.cpu,
            timestamp: latest.timestamp
          });
        }
        
        if (latest.memory > this.config.alertThresholds.memory) {
          activeAlerts.push({
            peerId,
            type: 'HIGH_MEMORY',
            value: latest.memory,
            timestamp: latest.timestamp
          });
        }
      }
    }
    
    return activeAlerts;
  }

  /**
   * Get recommended actions based on health
   */
  getRecommendations() {
    const health = this.getSwarmHealth();
    const recommendations = [];
    
    if (!health) {
      return recommendations;
    }
    
    if (health.averageCpu > 80) {
      recommendations.push({
        priority: 'high',
        action: 'REDUCE_LOAD',
        reason: `Average CPU usage is ${health.averageCpu.toFixed(1)}%`,
        suggestion: 'Reduce milestone creation rate or add more peers'
      });
    }
    
    if (health.averageMemory > 80) {
      recommendations.push({
        priority: 'high',
        action: 'INCREASE_MEMORY',
        reason: `Average memory usage is ${health.averageMemory.toFixed(1)}%`,
        suggestion: 'Increase memory on peers or enable caching cleanup'
      });
    }
    
    if (health.averageCpu < 30 && health.totalPeers > 1) {
      recommendations.push({
        priority: 'low',
        action: 'REDUCE_PEERS',
        reason: `CPU usage is low (${health.averageCpu.toFixed(1)}%)`,
        suggestion: 'Consider reducing number of peers to lower costs'
      });
    }
    
    return recommendations;
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    console.log('🛑 Health monitoring stopped');
  }

  /**
   * Export metrics to JSON
   */
  exportToJSON() {
    const data = {
      timestamp: Date.now(),
      metrics: {},
      history: this.history
    };
    
    for (const [peerId, history] of this.metrics.entries()) {
      data.metrics[peerId] = history;
    }
    
    return data;
  }

  /**
   * Import metrics from JSON
   */
  importFromJSON(data) {
    if (data.metrics) {
      for (const [peerId, history] of Object.entries(data.metrics)) {
        this.metrics.set(peerId, history);
      }
    }
    
    if (data.history) {
      this.history = data.history;
    }
    
    return true;
  }
}

export default SwarmHealth;
