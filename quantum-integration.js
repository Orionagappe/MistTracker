/**
 * Quantum Integration Layer
 * Phase 55: Quantum Computing Simulation & Adaptive Security
 * 
 * Bridges quantum systems with Phase 17.4 enterprise platform:
 * - Integration with alert manager
 * - Webhook/event system integration
 * - Compliance & governance updates
 * - REST API endpoints
 * - Service adapters
 * - Event emission for real-time notifications
 * 
 * @module quantum-integration
 */

const EventEmitter = require('events');
const { QuantumCircuit } = require('./quantum-simulator');
const { QuantumKeyGenerator, QuantumAccessControl, QuantumIntrusionDetectionSystem } = require('./quantum-security-engine');
const { LogicalQubit } = require('./quantum-error-correction');
const { QuantumMonitoringDashboard } = require('./quantum-metrics');

/**
 * Quantum Service - Main quantum system service
 */
class QuantumService extends EventEmitter {
  constructor() {
    super();
    this.keyGenerator = new QuantumKeyGenerator();
    this.accessControl = new QuantumAccessControl();
    this.ids = new QuantumIntrusionDetectionSystem();
    this.monitoring = new QuantumMonitoringDashboard();
    this.activeCircuits = new Map();
    this.logicalQubits = new Map();
  }

  /**
   * Create quantum circuit for computation
   */
  createCircuit(circuitId, numQubits) {
    const circuit = new QuantumCircuit(numQubits);
    this.activeCircuits.set(circuitId, circuit);
    this.monitoring.createCollector(circuitId);

    this.emit('circuit-created', {
      circuitId,
      numQubits,
      timestamp: Date.now()
    });

    return circuit;
  }

  /**
   * Create logical qubit with error correction
   */
  createLogicalQubit(qubitId, code = 'shor') {
    const logicalQubit = new LogicalQubit(code);
    const numQubits = code === 'shor' ? 9 : 3;
    logicalQubit.initialize(numQubits);

    this.logicalQubits.set(qubitId, logicalQubit);

    this.emit('logical-qubit-created', {
      qubitId,
      code,
      numQubits,
      timestamp: Date.now()
    });

    return logicalQubit;
  }

  /**
   * Generate encryption key
   */
  generateKey(keyId, length = 32) {
    const key = this.keyGenerator.generateQuantumKey(length);

    this.emit('key-generated', {
      keyId,
      length,
      timestamp: Date.now()
    });

    return key.toString('hex');
  }

  /**
   * Generate session key
   */
  generateSessionKey(sessionId, length = 32) {
    const key = this.keyGenerator.generateSessionKey(sessionId, length);

    this.emit('session-key-generated', {
      sessionId,
      length,
      timestamp: Date.now()
    });

    return key.toString('hex');
  }

  /**
   * Check access with quantum metrics
   */
  checkAccess(userId, resource, action) {
    const decision = this.accessControl.checkAccess(userId, resource, action);

    this.emit('access-decision', {
      userId,
      resource,
      action,
      decision,
      timestamp: Date.now()
    });

    return decision;
  }

  /**
   * Monitor user action for intrusions
   */
  monitorAction(userId, action, metadata = {}) {
    const result = this.ids.monitorEvent(userId, action, metadata);

    if (result.isAnomaly) {
      this.emit('anomaly-detected', {
        userId,
        action,
        severity: result.severity,
        confidence: result.confidence,
        timestamp: Date.now()
      });
    }

    return result;
  }

  /**
   * Get quantum state probabilities
   */
  getCircuitProbabilities(circuitId) {
    const circuit = this.activeCircuits.get(circuitId);
    if (!circuit) {
      throw new Error(`Circuit not found: ${circuitId}`);
    }

    return circuit.getProbabilities();
  }

  /**
   * Perform measurement on circuit
   */
  measureCircuit(circuitId, qubit) {
    const circuit = this.activeCircuits.get(circuitId);
    if (!circuit) {
      throw new Error(`Circuit not found: ${circuitId}`);
    }

    const result = circuit.measure(qubit);

    this.emit('measurement-result', {
      circuitId,
      qubit,
      result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Perform error correction
   */
  correctErrors(qubitId) {
    const logicalQubit = this.logicalQubits.get(qubitId);
    if (!logicalQubit) {
      throw new Error(`Logical qubit not found: ${qubitId}`);
    }

    const result = logicalQubit.correctErrors();

    this.emit('error-correction-performed', {
      qubitId,
      errorDetected: result.errorDetected,
      corrected: result.corrected,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Get monitoring dashboard
   */
  getMonitoringDashboard() {
    return this.monitoring.getSnapshot();
  }

  /**
   * Get access audit trail
   */
  getAuditTrail(userId = null, limit = 100) {
    return this.accessControl.getAuditTrail(userId, limit);
  }

  /**
   * Get IDS status
   */
  getIDSStatus() {
    return this.ids.getStatus();
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    return {
      activeCircuits: this.activeCircuits.size,
      logicalQubits: this.logicalQubits.size,
      accessControl: this.accessControl.getStatistics(),
      idsStatus: this.ids.getStatus(),
      monitoringHealth: this.monitoring.generateHealthReport()
    };
  }
}

/**
 * Quantum Event Handler - processes quantum events for webhook system
 */
class QuantumEventHandler {
  static createEventFromQuantumAction(actionType, data) {
    const baseEvent = {
      timestamp: Date.now(),
      source: 'quantum-system',
      category: 'quantum'
    };

    switch (actionType) {
      case 'key-generated':
        return {
          ...baseEvent,
          type: 'quantum.key_generated',
          payload: {
            keyId: data.keyId,
            keyLength: data.length,
            entropy: 'quantum-derived'
          }
        };

      case 'anomaly-detected':
        return {
          ...baseEvent,
          type: 'quantum.anomaly_detected',
          severity: data.severity >= 7 ? 'critical' : data.severity >= 4 ? 'high' : 'medium',
          payload: {
            userId: data.userId,
            action: data.action,
            severity: data.severity,
            confidence: data.confidence
          }
        };

      case 'access-decision':
        return {
          ...baseEvent,
          type: `quantum.access_${data.decision.accessGranted ? 'granted' : 'denied'}`,
          severity: data.decision.accessGranted ? 'info' : 'warning',
          payload: {
            userId: data.userId,
            resource: data.resource,
            action: data.action,
            reason: data.decision.reason,
            quantumEntropy: data.decision.quantumMetrics?.entropy
          }
        };

      case 'measurement-result':
        return {
          ...baseEvent,
          type: 'quantum.measurement_completed',
          payload: {
            circuitId: data.circuitId,
            qubit: data.qubit,
            result: data.result
          }
        };

      case 'error-correction':
        return {
          ...baseEvent,
          type: data.errorDetected ? 'quantum.error_corrected' : 'quantum.error_check_passed',
          payload: {
            qubitId: data.qubitId,
            errorDetected: data.errorDetected,
            corrected: data.corrected
          }
        };

      default:
        return {
          ...baseEvent,
          type: `quantum.${actionType}`,
          payload: data
        };
    }
  }
}

/**
 * Quantum Alert Manager - integrates with Phase 17.4 alert system
 */
class QuantumAlertManager {
  static createAlertFromAnomaly(anomalyData) {
    return {
      id: `quantum-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'quantum-anomaly',
      severity: anomalyData.severity >= 8 ? 'critical' : anomalyData.severity >= 5 ? 'warning' : 'info',
      title: `Quantum Anomaly Detected - ${anomalyData.action}`,
      description: `Unusual entropy detected for user ${anomalyData.userId}. Entropy deviation: ${anomalyData.entropyDeviation.toFixed(2)}`,
      timestamp: anomalyData.timestamp,
      userId: anomalyData.userId,
      metadata: {
        entropy: anomalyData.entropy,
        entropyDeviation: anomalyData.entropyDeviation,
        confidence: anomalyData.metadata?.confidence || 0
      },
      status: 'active',
      autoResolved: false
    };
  }

  static createAlertFromIDSAlert(idsAlert) {
    return {
      id: `qids-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'quantum-intrusion',
      severity: idsAlert.severity === 'critical' ? 'critical' : idsAlert.severity === 'high' ? 'warning' : 'info',
      title: `Quantum Intrusion Detection: ${idsAlert.type}`,
      description: `${idsAlert.description} for user ${idsAlert.userId}`,
      timestamp: idsAlert.timestamp,
      userId: idsAlert.userId,
      metadata: idsAlert.details,
      status: 'active',
      autoResolved: false,
      escalationLevel: idsAlert.severity === 'critical' ? 2 : 0
    };
  }
}

/**
 * Quantum Compliance Engine - updates compliance tracking for quantum features
 */
class QuantumComplianceEngine {
  /**
   * Create audit log entry for quantum key generation
   */
  static createKeyGenerationAudit(keyId, userId) {
    return {
      timestamp: Date.now(),
      action: 'quantum_key_generated',
      userId,
      resource: `quantum/key/${keyId}`,
      details: {
        keyId,
        source: 'quantum-entropy',
        algorithm: 'quantum-circuit-based'
      },
      ipAddress: 'internal-quantum-service',
      result: 'success'
    };
  }

  /**
   * Create audit log entry for access decision
   */
  static createAccessDecisionAudit(userId, resource, action, granted) {
    return {
      timestamp: Date.now(),
      action: `access_${granted ? 'granted' : 'denied'}`,
      userId,
      resource,
      details: {
        requestedAction: action,
        quantumMetricsUsed: true
      },
      result: granted ? 'success' : 'failure'
    };
  }

  /**
   * Create audit log entry for anomaly detection
   */
  static createAnomalyAudit(userId, action, severity) {
    return {
      timestamp: Date.now(),
      action: 'quantum_anomaly_detected',
      userId,
      resource: `user/${userId}`,
      details: {
        detectedAction: action,
        severity,
        detectionMethod: 'quantum-entropy-analysis'
      },
      result: 'logged'
    };
  }

  /**
   * Create audit log entry for IDS alert
   */
  static createIDSAudit(userId, type) {
    return {
      timestamp: Date.now(),
      action: 'quantum_intrusion_detected',
      userId,
      resource: `user/${userId}`,
      details: {
        intrusionType: type,
        detectionSystem: 'quantum-ids'
      },
      result: 'alert-issued',
      severity: 'high'
    };
  }
}

/**
 * Quantum Workflow Adapter - integrates with Phase 17.4 workflows
 */
class QuantumWorkflowAdapter {
  /**
   * Create workflow action for key generation
   */
  static createKeyGenerationAction(context) {
    return {
      type: 'generate_quantum_key',
      inputs: {
        keyLength: context.keyLength || 32,
        purpose: context.purpose || 'general'
      },
      outputs: {
        keyId: null,
        key: null
      },
      handler: async (quantumService) => {
        const keyId = `key-${Date.now()}`;
        const key = quantumService.generateKey(keyId);
        return { keyId, key };
      }
    };
  }

  /**
   * Create workflow action for access control
   */
  static createAccessControlAction(context) {
    return {
      type: 'quantum_access_control',
      inputs: {
        userId: context.userId,
        resource: context.resource,
        action: context.action
      },
      outputs: {
        accessGranted: null,
        reason: null
      },
      handler: async (quantumService) => {
        return quantumService.checkAccess(
          context.userId,
          context.resource,
          context.action
        );
      }
    };
  }

  /**
   * Create workflow action for threat detection
   */
  static createThreatDetectionAction(context) {
    return {
      type: 'quantum_threat_detection',
      inputs: {
        userId: context.userId,
        action: context.action
      },
      outputs: {
        isAnomaly: null,
        severity: null,
        confidence: null
      },
      handler: async (quantumService) => {
        return quantumService.monitorAction(context.userId, context.action);
      }
    };
  }
}

/**
 * Quantum Dashboard Routes - REST API endpoints for quantum features
 */
class QuantumDashboardRoutes {
  constructor(quantumService) {
    this.quantumService = quantumService;
  }

  /**
   * GET /api/quantum/status
   */
  getStatus() {
    return {
      status: 'operational',
      timestamp: Date.now(),
      metrics: this.quantumService.getStatistics()
    };
  }

  /**
   * POST /api/quantum/key/generate
   */
  generateKey(req) {
    const { keyId, length = 32 } = req.body;
    const key = this.quantumService.generateKey(keyId, length);
    
    return {
      keyId,
      key,
      algorithm: 'quantum-entropy-based',
      length,
      timestamp: Date.now()
    };
  }

  /**
   * POST /api/quantum/circuit/create
   */
  createCircuit(req) {
    const { circuitId, numQubits } = req.body;
    const circuit = this.quantumService.createCircuit(circuitId, numQubits);
    
    return {
      circuitId,
      numQubits,
      status: 'created',
      timestamp: Date.now()
    };
  }

  /**
   * POST /api/quantum/circuit/{circuitId}/measure
   */
  measureCircuit(req) {
    const { circuitId } = req.params;
    const { qubit } = req.body;
    
    const result = this.quantumService.measureCircuit(circuitId, qubit);
    
    return {
      circuitId,
      qubit,
      result,
      timestamp: Date.now()
    };
  }

  /**
   * GET /api/quantum/access-control/audit
   */
  getAccessAudit(req) {
    const { userId, limit = 100 } = req.query;
    return this.quantumService.getAuditTrail(userId, parseInt(limit));
  }

  /**
   * GET /api/quantum/ids/status
   */
  getIDSStatus() {
    return this.quantumService.getIDSStatus();
  }

  /**
   * GET /api/quantum/monitoring/dashboard
   */
  getMonitoringDashboard() {
    return this.quantumService.getMonitoringDashboard();
  }

  /**
   * POST /api/quantum/access/check
   */
  checkAccess(req) {
    const { userId, resource, action } = req.body;
    const decision = this.quantumService.checkAccess(userId, resource, action);
    
    return {
      userId,
      resource,
      action,
      decision,
      timestamp: Date.now()
    };
  }

  /**
   * POST /api/quantum/monitor/action
   */
  monitorAction(req) {
    const { userId, action, metadata = {} } = req.body;
    const result = this.quantumService.monitorAction(userId, action, metadata);
    
    return {
      userId,
      action,
      isAnomaly: result.isAnomaly,
      confidence: result.confidence,
      severity: result.severity,
      timestamp: Date.now()
    };
  }
}

module.exports = {
  QuantumService,
  QuantumEventHandler,
  QuantumAlertManager,
  QuantumComplianceEngine,
  QuantumWorkflowAdapter,
  QuantumDashboardRoutes
};
