/**
 * Event System & Event Types
 * Phase 17.2.5: Webhooks and Real-time Notifications
 * 
 * Defines all events that can trigger webhooks:
 * - Session events (started, completed, stopped, failed)
 * - Milestone events (created, convergence detected)
 * - Performance events (accuracy threshold, loss spike)
 * - System events (health check, error)
 * - User events (login, logout, profile update)
 */

// ============================================================================
// EVENT TYPES & SCHEMAS
// ============================================================================

export const EVENT_TYPES = {
  // Session events
  'session.started': 'Training session started',
  'session.completed': 'Training session completed',
  'session.stopped': 'Training session manually stopped',
  'session.failed': 'Training session failed',
  'session.paused': 'Training session paused',
  'session.resumed': 'Training session resumed',

  // Milestone events
  'milestone.created': 'New milestone recorded',
  'milestone.batch_complete': 'Batch of milestones processed',

  // Convergence events
  'convergence.detected': 'Convergence detected for atom',
  'convergence.threshold_reached': 'Convergence threshold reached',

  // Performance events
  'performance.accuracy_high': 'High accuracy milestone reached',
  'performance.loss_low': 'Low loss milestone reached',
  'performance.accuracy_low': 'Accuracy dropped below threshold',
  'performance.loss_high': 'Loss spiked above threshold',

  // Training events
  'training.epoch_complete': 'Epoch completed',
  'training.accuracy_improved': 'Accuracy improved',
  'training.accuracy_degraded': 'Accuracy degraded',

  // System events
  'system.health_check': 'System health status',
  'system.node_online': 'Training node came online',
  'system.node_offline': 'Training node went offline',
  'system.alert': 'System alert triggered',

  // User events
  'user.login': 'User logged in',
  'user.logout': 'User logged out',
  'user.api_key_created': 'API key created',
  'user.export_complete': 'Data export completed',

  // Admin events
  'admin.webhook_failed': 'Webhook delivery failed',
  'admin.rate_limit_exceeded': 'Rate limit exceeded',
};

// ============================================================================
// EVENT PAYLOAD SCHEMAS
// ============================================================================

export const eventSchemas = {
  'session.started': {
    session_id: 'string (uuid)',
    user_id: 'string (uuid)',
    atoms: 'array[string]',
    config: 'object',
    started_at: 'date',
    timestamp: 'date',
  },

  'session.completed': {
    session_id: 'string (uuid)',
    user_id: 'string (uuid)',
    status: 'string (completed)',
    final_accuracy: 'number (0-1)',
    final_loss: 'number',
    total_epochs: 'number',
    duration_ms: 'number',
    timestamp: 'date',
  },

  'milestone.created': {
    milestone_id: 'string (uuid)',
    session_id: 'string (uuid)',
    node_id: 'string',
    atom: 'string',
    epoch: 'number',
    accuracy: 'number (0-1)',
    loss: 'number',
    timestamp: 'date',
  },

  'convergence.detected': {
    session_id: 'string (uuid)',
    atom: 'string',
    convergence_epoch: 'number',
    final_accuracy: 'number (0-1)',
    final_loss: 'number',
    convergence_time_ms: 'number',
    timestamp: 'date',
  },

  'performance.accuracy_high': {
    session_id: 'string (uuid)',
    atom: 'string',
    epoch: 'number',
    accuracy: 'number (0-1)',
    threshold: 'number (0-1)',
    timestamp: 'date',
  },

  'performance.loss_high': {
    session_id: 'string (uuid)',
    atom: 'string',
    epoch: 'number',
    loss: 'number',
    threshold: 'number',
    previous_loss: 'number',
    spike_percentage: 'number',
    timestamp: 'date',
  },

  'system.node_offline': {
    node_id: 'string',
    last_heartbeat: 'date',
    downtime_ms: 'number',
    active_sessions: 'number',
    timestamp: 'date',
  },

  'user.export_complete': {
    export_id: 'string (uuid)',
    user_id: 'string (uuid)',
    session_id: 'string (uuid)',
    export_type: 'string (csv|json|pdf)',
    file_size_bytes: 'number',
    download_url: 'string',
    timestamp: 'date',
  },
};

// ============================================================================
// EVENT EMITTER CLASS
// ============================================================================

export class EventEmitter {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 10000;
  }

  // Subscribe to events
  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  // Subscribe once
  once(eventType, handler) {
    const unsubscribe = this.on(eventType, async (...args) => {
      await handler(...args);
      unsubscribe();
    });
    return unsubscribe;
  }

  // Emit event
  async emit(eventType, payload) {
    if (!EVENT_TYPES[eventType]) {
      console.warn(`Unknown event type: ${eventType}`);
    }

    // Add timestamp if not present
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }

    // Store in history
    this.addToHistory({
      type: eventType,
      payload,
      emittedAt: new Date(),
    });

    // Call all listeners
    const handlers = this.listeners.get(eventType) || [];
    const results = await Promise.allSettled(
      handlers.map(handler => handler(payload))
    );

    // Log failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Error in event handler for ${eventType}:`,
          result.reason
        );
      }
    });

    return results;
  }

  // Get event history
  getHistory(eventType, limit = 100) {
    if (eventType) {
      return this.eventHistory
        .filter(e => e.type === eventType)
        .slice(-limit);
    }
    return this.eventHistory.slice(-limit);
  }

  // Add to history with size limit
  addToHistory(event) {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  // Clear history
  clearHistory() {
    this.eventHistory = [];
  }
}

// ============================================================================
// PREDEFINED EVENTS
// ============================================================================

export function createSessionStartedEvent(session) {
  return {
    session_id: session._id || session.id,
    user_id: session.user_id,
    atoms: session.atoms,
    config: session.config,
    started_at: session.started_at,
  };
}

export function createSessionCompletedEvent(session) {
  return {
    session_id: session._id || session.id,
    user_id: session.user_id,
    status: 'completed',
    final_accuracy: session.metrics?.final_accuracy,
    final_loss: session.metrics?.final_loss,
    total_epochs: session.metrics?.total_epochs_completed,
    duration_ms: session.duration_ms,
  };
}

export function createMilestoneCreatedEvent(milestone) {
  return {
    milestone_id: milestone._id,
    session_id: milestone.session_id,
    node_id: milestone.node_id,
    atom: milestone.atom,
    epoch: milestone.epoch,
    accuracy: milestone.accuracy,
    loss: milestone.loss,
  };
}

export function createConvergenceDetectedEvent(session, atom, convergenceData) {
  return {
    session_id: session._id || session.id,
    atom,
    convergence_epoch: convergenceData.convergence_epoch,
    final_accuracy: convergenceData.final_accuracy,
    final_loss: convergenceData.final_loss,
    convergence_time_ms: convergenceData.convergence_time_ms,
  };
}

export function createPerformanceAlert(eventType, session, atom, metrics) {
  return {
    session_id: session._id || session.id,
    atom,
    epoch: metrics.epoch,
    accuracy: metrics.accuracy,
    loss: metrics.loss,
    threshold: metrics.threshold,
    timestamp: new Date().toISOString(),
  };
}

export function createSystemAlert(nodeId, status, details) {
  return {
    node_id: nodeId,
    status,
    ...details,
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let emitterInstance = null;

export function getEventEmitter() {
  if (!emitterInstance) {
    emitterInstance = new EventEmitter();
  }
  return emitterInstance;
}

export default EventEmitter;
