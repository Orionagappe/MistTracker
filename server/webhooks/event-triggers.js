/**
 * Event Triggers & Integration
 * Phase 17.2.5: Webhooks and Real-time Notifications
 * 
 * Integrates event emissions with core MistTracker modules:
 * - Session lifecycle events
 * - Milestone creation events
 * - Convergence detection events
 * - Performance threshold events
 * - System health events
 * 
 * Usage:
 * import { initializeEventTriggers, triggerEvent } from './event-triggers.js';
 * 
 * // In your application startup:
 * await initializeEventTriggers();
 * 
 * // In session module:
 * await triggerEvent('session.started', session);
 * 
 * // In milestone module:
 * await triggerEvent('milestone.created', milestone);
 */

import { getEventEmitter, createSessionStartedEvent, createSessionCompletedEvent, createMilestoneCreatedEvent, createConvergenceDetectedEvent, createPerformanceAlert, createSystemAlert } from './event-system.js';
import { getDeliveryEngine } from './webhook-delivery.js';
import { getWebhookRegistry } from './webhook-registry.js';

// ============================================================================
// EVENT TRIGGER FUNCTIONS
// ============================================================================

export async function triggerEvent(eventType, data) {
  try {
    const emitter = getEventEmitter();
    const engine = getDeliveryEngine();

    // Emit to local listeners
    await emitter.emit(eventType, data);

    // Queue webhook deliveries
    await engine.deliverEvent(eventType, data);

    console.log(`✅ Event triggered: ${eventType}`);
  } catch (err) {
    console.error(`Error triggering event ${eventType}:`, err);
  }
}

// ============================================================================
// SESSION EVENTS
// ============================================================================

export async function onSessionStarted(session) {
  const payload = createSessionStartedEvent(session);
  await triggerEvent('session.started', payload);
}

export async function onSessionCompleted(session) {
  const payload = createSessionCompletedEvent(session);
  await triggerEvent('session.completed', payload);
}

export async function onSessionStopped(session, reason) {
  await triggerEvent('session.stopped', {
    session_id: session._id || session.id,
    user_id: session.user_id,
    reason,
    stopped_at: new Date().toISOString(),
  });
}

export async function onSessionFailed(session, error) {
  await triggerEvent('session.failed', {
    session_id: session._id || session.id,
    user_id: session.user_id,
    error: error.message,
    failed_at: new Date().toISOString(),
  });
}

export async function onSessionPaused(session) {
  await triggerEvent('session.paused', {
    session_id: session._id || session.id,
    user_id: session.user_id,
    paused_at: new Date().toISOString(),
  });
}

export async function onSessionResumed(session) {
  await triggerEvent('session.resumed', {
    session_id: session._id || session.id,
    user_id: session.user_id,
    resumed_at: new Date().toISOString(),
  });
}

// ============================================================================
// MILESTONE EVENTS
// ============================================================================

export async function onMilestoneCreated(milestone) {
  const payload = createMilestoneCreatedEvent(milestone);
  await triggerEvent('milestone.created', payload);
}

export async function onMilestoneBatchComplete(batchData) {
  await triggerEvent('milestone.batch_complete', {
    batch_id: batchData.batch_id,
    session_id: batchData.session_id,
    milestone_count: batchData.milestones.length,
    avg_accuracy: batchData.avg_accuracy,
    avg_loss: batchData.avg_loss,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// CONVERGENCE EVENTS
// ============================================================================

export async function onConvergenceDetected(session, atom, convergenceData) {
  const payload = createConvergenceDetectedEvent(session, atom, convergenceData);
  await triggerEvent('convergence.detected', payload);
}

export async function onConvergenceThresholdReached(session, threshold) {
  await triggerEvent('convergence.threshold_reached', {
    session_id: session._id || session.id,
    threshold,
    atoms_converged: session.convergence_data?.atoms_converged || [],
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// PERFORMANCE EVENTS
// ============================================================================

export async function onAccuracyHigh(session, atom, epoch, accuracy) {
  const payload = createPerformanceAlert('performance.accuracy_high', session, atom, {
    epoch,
    accuracy,
    threshold: 0.9,
  });
  await triggerEvent('performance.accuracy_high', payload);
}

export async function onLossLow(session, atom, epoch, loss) {
  const payload = createPerformanceAlert('performance.loss_low', session, atom, {
    epoch,
    loss,
    threshold: 0.1,
  });
  await triggerEvent('performance.loss_low', payload);
}

export async function onAccuracyDegraded(session, atom, epoch, accuracy, previousAccuracy) {
  const payload = createPerformanceAlert('performance.accuracy_low', session, atom, {
    epoch,
    accuracy,
    threshold: 0.5,
  });
  payload.previous_accuracy = previousAccuracy;
  payload.degradation_percentage = Math.round(
    ((previousAccuracy - accuracy) / previousAccuracy) * 100
  );
  await triggerEvent('performance.accuracy_low', payload);
}

export async function onLossSpiked(session, atom, epoch, loss, previousLoss) {
  const payload = createPerformanceAlert('performance.loss_high', session, atom, {
    epoch,
    loss,
    threshold: 1.0,
  });
  payload.previous_loss = previousLoss;
  payload.spike_percentage = Math.round(
    ((loss - previousLoss) / previousLoss) * 100
  );
  await triggerEvent('performance.loss_high', payload);
}

// ============================================================================
// TRAINING EVENTS
// ============================================================================

export async function onEpochComplete(session, epochData) {
  await triggerEvent('training.epoch_complete', {
    session_id: session._id || session.id,
    epoch: epochData.epoch,
    accuracy: epochData.accuracy,
    loss: epochData.loss,
    timestamp: new Date().toISOString(),
  });
}

export async function onAccuracyImproved(session, atom, improvement) {
  await triggerEvent('training.accuracy_improved', {
    session_id: session._id || session.id,
    atom,
    improvement_percentage: Math.round(improvement * 100),
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// SYSTEM EVENTS
// ============================================================================

export async function onSystemHealthCheck(health) {
  await triggerEvent('system.health_check', {
    status: health.status,
    uptime_ms: health.uptime_ms,
    active_sessions: health.active_sessions,
    memory_usage_mb: health.memory_usage_mb,
    timestamp: new Date().toISOString(),
  });
}

export async function onNodeOnline(nodeId, nodeInfo) {
  const payload = createSystemAlert(nodeId, 'online', {
    last_heartbeat: new Date().toISOString(),
    capacity: nodeInfo.capacity,
  });
  await triggerEvent('system.node_online', payload);
}

export async function onNodeOffline(nodeId, downtimeMs, activeSessions) {
  const payload = createSystemAlert(nodeId, 'offline', {
    last_heartbeat: new Date(Date.now() - downtimeMs).toISOString(),
    downtime_ms: downtimeMs,
    active_sessions: activeSessions,
  });
  await triggerEvent('system.node_offline', payload);
}

export async function onSystemAlert(alertType, details) {
  await triggerEvent('system.alert', {
    type: alertType,
    severity: details.severity || 'warning',
    message: details.message,
    details,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// USER EVENTS
// ============================================================================

export async function onUserLogin(userId, loginDetails) {
  await triggerEvent('user.login', {
    user_id: userId,
    ip_address: loginDetails.ip_address,
    user_agent: loginDetails.user_agent,
    timestamp: new Date().toISOString(),
  });
}

export async function onUserLogout(userId) {
  await triggerEvent('user.logout', {
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
}

export async function onApiKeyCreated(userId, keyName) {
  await triggerEvent('user.api_key_created', {
    user_id: userId,
    key_name: keyName,
    timestamp: new Date().toISOString(),
  });
}

export async function onExportComplete(exportData) {
  await triggerEvent('user.export_complete', {
    export_id: exportData.id,
    user_id: exportData.user_id,
    session_id: exportData.session_id,
    export_type: exportData.format,
    file_size_bytes: exportData.file_size,
    download_url: exportData.download_url,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// ADMIN EVENTS
// ============================================================================

export async function onWebhookFailed(webhookId, failureData) {
  await triggerEvent('admin.webhook_failed', {
    webhook_id: webhookId,
    attempts: failureData.attempts,
    final_error: failureData.final_error,
    event_type: failureData.event_type,
    timestamp: new Date().toISOString(),
  });
}

export async function onRateLimitExceeded(userId, limit) {
  await triggerEvent('admin.rate_limit_exceeded', {
    user_id: userId,
    limit,
    reset_at: new Date(Date.now() + 60000).toISOString(),
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// GLOBAL EVENT LISTENER SETUP
// ============================================================================

export async function initializeEventTriggers() {
  const emitter = getEventEmitter();
  const registry = getWebhookRegistry();

  console.log('📡 Initializing event triggers...');

  // Setup global error handler for webhook delivery
  emitter.on('admin.webhook_failed', async (data) => {
    // Auto-disable webhook after repeated failures
    const webhook = await registry.getWebhook(data.webhook_id);
    if (webhook && data.attempts >= 5) {
      await registry.disableWebhook(
        data.webhook_id,
        `Webhook failed after ${data.attempts} delivery attempts`
      );
      console.warn(
        `⚠️ Webhook ${data.webhook_id} disabled due to repeated failures`
      );
    }
  });

  console.log('✅ Event triggers initialized');
}

// ============================================================================
// EXPORT FOR MIDDLEWARE INTEGRATION
// ============================================================================

export const eventTriggers = {
  session: {
    started: onSessionStarted,
    completed: onSessionCompleted,
    stopped: onSessionStopped,
    failed: onSessionFailed,
    paused: onSessionPaused,
    resumed: onSessionResumed,
  },
  milestone: {
    created: onMilestoneCreated,
    batchComplete: onMilestoneBatchComplete,
  },
  convergence: {
    detected: onConvergenceDetected,
    thresholdReached: onConvergenceThresholdReached,
  },
  performance: {
    accuracyHigh: onAccuracyHigh,
    lossLow: onLossLow,
    accuracyDegraded: onAccuracyDegraded,
    lossSpiked: onLossSpiked,
  },
  training: {
    epochComplete: onEpochComplete,
    accuracyImproved: onAccuracyImproved,
  },
  system: {
    healthCheck: onSystemHealthCheck,
    nodeOnline: onNodeOnline,
    nodeOffline: onNodeOffline,
    alert: onSystemAlert,
  },
  user: {
    login: onUserLogin,
    logout: onUserLogout,
    apiKeyCreated: onApiKeyCreated,
    exportComplete: onExportComplete,
  },
  admin: {
    webhookFailed: onWebhookFailed,
    rateLimitExceeded: onRateLimitExceeded,
  },
};

export default {
  triggerEvent,
  eventTriggers,
  initializeEventTriggers,
};
