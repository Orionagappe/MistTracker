/**
 * WebSocket Real-time Streaming
 * Phase 17.2.5: Webhooks and Real-time Notifications
 * 
 * Extends Phase 17.2.1 WebSocket server with:
 * - Real-time event broadcasting
 * - Client subscription management
 * - Connection lifecycle management
 * - Message filtering and routing
 * 
 * Usage (in main server file):
 * import { initializeWebSocketEvents } from './websocket-events.js';
 * 
 * io.on('connection', (socket) => {
 *   initializeWebSocketEvents(socket);
 * });
 */

import { getEventEmitter } from './event-system.js';
import { getWebhookRegistry } from './webhook-registry.js';

// ============================================================================
// WEBSOCKET EVENT BROADCASTING
// ============================================================================

export class WebSocketEventBroadcaster {
  constructor(io) {
    this.io = io;
    this.userSessions = new Map();  // user_id -> [socket_ids]
    this.sessionSubscriptions = new Map();  // session_id -> [user_ids]
    this.topicSubscriptions = new Map();  // topic -> [socket_ids]
  }

  // ========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ========================================================================

  registerSocket(socket, userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }

    this.userSessions.get(userId).push(socket.id);

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      const sessions = this.userSessions.get(userId) || [];
      const index = sessions.indexOf(socket.id);
      if (index > -1) {
        sessions.splice(index, 1);
      }

      // Clean up topic subscriptions
      for (const [topic, sockets] of this.topicSubscriptions.entries()) {
        const idx = sockets.indexOf(socket.id);
        if (idx > -1) {
          sockets.splice(idx, 1);
        }
      }
    });
  }

  subscribeToSession(socket, sessionId) {
    if (!this.sessionSubscriptions.has(sessionId)) {
      this.sessionSubscriptions.set(sessionId, new Set());
    }
    this.sessionSubscriptions.get(sessionId).add(socket.id);

    socket.join(`session:${sessionId}`);
  }

  subscribeToTopic(socket, topic) {
    if (!this.topicSubscriptions.has(topic)) {
      this.topicSubscriptions.set(topic, []);
    }
    this.topicSubscriptions.get(topic).push(socket.id);

    socket.join(topic);
  }

  unsubscribeFromSession(socket, sessionId) {
    const subscribers = this.sessionSubscriptions.get(sessionId);
    if (subscribers) {
      subscribers.delete(socket.id);
    }
    socket.leave(`session:${sessionId}`);
  }

  unsubscribeFromTopic(socket, topic) {
    const sockets = this.topicSubscriptions.get(topic) || [];
    const index = sockets.indexOf(socket.id);
    if (index > -1) {
      sockets.splice(index, 1);
    }
    socket.leave(topic);
  }

  // ========================================================================
  // MESSAGE BROADCASTING
  // ========================================================================

  broadcastToUser(userId, eventType, payload) {
    const sockets = this.userSessions.get(userId) || [];
    for (const socketId of sockets) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(eventType, payload);
      }
    }
  }

  broadcastToSession(sessionId, eventType, payload) {
    this.io.to(`session:${sessionId}`).emit(eventType, payload);
  }

  broadcastToTopic(topic, eventType, payload) {
    this.io.to(topic).emit(eventType, payload);
  }

  broadcastToAll(eventType, payload) {
    this.io.emit(eventType, payload);
  }

  // ========================================================================
  // EVENT-SPECIFIC BROADCASTS
  // ========================================================================

  broadcastSessionStarted(sessionData) {
    this.broadcastToUser(sessionData.user_id, 'session:started', {
      session_id: sessionData.session_id,
      atoms: sessionData.atoms,
      config: sessionData.config,
      started_at: sessionData.started_at,
    });

    this.broadcastToSession(sessionData.session_id, 'session:started', sessionData);
    this.broadcastToTopic('sessions', 'session:started', sessionData);
  }

  broadcastSessionProgress(sessionData) {
    this.broadcastToSession(sessionData.session_id, 'session:progress', {
      session_id: sessionData.session_id,
      current_epoch: sessionData.current_epoch,
      total_epochs: sessionData.total_epochs,
      accuracy: sessionData.accuracy,
      loss: sessionData.loss,
      convergence_status: sessionData.convergence_status,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastMilestoneCreated(milestoneData) {
    this.broadcastToSession(milestoneData.session_id, 'milestone:created', {
      milestone_id: milestoneData.milestone_id,
      node_id: milestoneData.node_id,
      atom: milestoneData.atom,
      epoch: milestoneData.epoch,
      accuracy: milestoneData.accuracy,
      loss: milestoneData.loss,
      timestamp: new Date().toISOString(),
    });

    this.broadcastToTopic('milestones', 'milestone:created', milestoneData);
  }

  broadcastConvergenceDetected(convergenceData) {
    this.broadcastToSession(convergenceData.session_id, 'convergence:detected', {
      atom: convergenceData.atom,
      convergence_epoch: convergenceData.convergence_epoch,
      final_accuracy: convergenceData.final_accuracy,
      final_loss: convergenceData.final_loss,
      convergence_time_ms: convergenceData.convergence_time_ms,
      timestamp: new Date().toISOString(),
    });

    this.broadcastToTopic('convergence', 'convergence:detected', convergenceData);
  }

  broadcastSessionCompleted(sessionData) {
    this.broadcastToUser(sessionData.user_id, 'session:completed', {
      session_id: sessionData.session_id,
      status: 'completed',
      final_accuracy: sessionData.final_accuracy,
      final_loss: sessionData.final_loss,
      total_epochs: sessionData.total_epochs,
      duration_ms: sessionData.duration_ms,
      timestamp: new Date().toISOString(),
    });

    this.broadcastToSession(sessionData.session_id, 'session:completed', sessionData);
    this.broadcastToTopic('sessions', 'session:completed', sessionData);
  }

  broadcastSystemAlert(alert) {
    this.broadcastToAll('system:alert', {
      type: alert.type,
      severity: alert.severity || 'warning',
      message: alert.message,
      details: alert.details,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// SOCKET EVENT HANDLERS
// ============================================================================

export function initializeWebSocketEvents(socket, io = null) {
  const userId = socket.handshake.auth?.userId;

  if (!userId) {
    console.warn('Socket connected without userId');
    socket.disconnect();
    return;
  }

  console.log(`✅ Socket connected: ${socket.id} (user: ${userId})`);

  // ========================================================================
  // SUBSCRIPTION HANDLERS
  // ========================================================================

  socket.on('subscribe:session', ({ sessionId }) => {
    console.log(`User ${userId} subscribed to session ${sessionId}`);
    socket.join(`session:${sessionId}`);

    socket.emit('subscribe:session:ack', {
      session_id: sessionId,
      status: 'subscribed',
    });
  });

  socket.on('unsubscribe:session', ({ sessionId }) => {
    console.log(`User ${userId} unsubscribed from session ${sessionId}`);
    socket.leave(`session:${sessionId}`);

    socket.emit('unsubscribe:session:ack', {
      session_id: sessionId,
      status: 'unsubscribed',
    });
  });

  socket.on('subscribe:topic', ({ topic }) => {
    // Only allow specific topics for security
    const allowedTopics = [
      'sessions',
      'milestones',
      'convergence',
      'performance',
      'system',
    ];

    if (!allowedTopics.includes(topic)) {
      socket.emit('error', {
        message: `Topic '${topic}' not allowed`,
      });
      return;
    }

    console.log(`User ${userId} subscribed to topic ${topic}`);
    socket.join(topic);

    socket.emit('subscribe:topic:ack', {
      topic,
      status: 'subscribed',
    });
  });

  socket.on('unsubscribe:topic', ({ topic }) => {
    console.log(`User ${userId} unsubscribed from topic ${topic}`);
    socket.leave(topic);

    socket.emit('unsubscribe:topic:ack', {
      topic,
      status: 'unsubscribed',
    });
  });

  // ========================================================================
  // PING/HEARTBEAT HANDLERS
  // ========================================================================

  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date().toISOString(),
      latency_ms: Date.now(),
    });
  });

  socket.on('heartbeat', (data, callback) => {
    if (callback) {
      callback({
        received_at: data.timestamp,
        server_time: new Date().toISOString(),
        latency_ms: Date.now() - new Date(data.timestamp).getTime(),
      });
    }
  });

  // ========================================================================
  // NOTIFICATION PREFERENCES
  // ========================================================================

  socket.on('preferences:update', (preferences) => {
    socket.data.preferences = {
      ...socket.data.preferences,
      ...preferences,
    };

    socket.emit('preferences:updated', {
      preferences: socket.data.preferences,
    });
  });

  socket.on('notification:mute', ({ eventType }) => {
    if (!socket.data.mutedEvents) {
      socket.data.mutedEvents = new Set();
    }
    socket.data.mutedEvents.add(eventType);

    socket.emit('notification:muted', {
      event_type: eventType,
    });
  });

  socket.on('notification:unmute', ({ eventType }) => {
    if (socket.data.mutedEvents) {
      socket.data.mutedEvents.delete(eventType);
    }

    socket.emit('notification:unmuted', {
      event_type: eventType,
    });
  });

  // ========================================================================
  // DISCONNECT HANDLER
  // ========================================================================

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id} (user: ${userId})`);
  });
}

// ============================================================================
// EVENT SYSTEM INTEGRATION
// ============================================================================

export function setupEventBroadcasting(io) {
  const emitter = getEventEmitter();
  const broadcaster = new WebSocketEventBroadcaster(io);

  console.log('📡 Setting up event broadcasting to WebSocket clients...');

  // ========================================================================
  // SESSION EVENTS
  // ========================================================================

  emitter.on('session.started', (data) => {
    broadcaster.broadcastSessionStarted(data);
  });

  emitter.on('session.completed', (data) => {
    broadcaster.broadcastSessionCompleted(data);
  });

  emitter.on('training.epoch_complete', (data) => {
    broadcaster.broadcastSessionProgress(data);
  });

  // ========================================================================
  // MILESTONE EVENTS
  // ========================================================================

  emitter.on('milestone.created', (data) => {
    broadcaster.broadcastMilestoneCreated(data);
  });

  // ========================================================================
  // CONVERGENCE EVENTS
  // ========================================================================

  emitter.on('convergence.detected', (data) => {
    broadcaster.broadcastConvergenceDetected(data);
  });

  // ========================================================================
  // SYSTEM EVENTS
  // ========================================================================

  emitter.on('system.alert', (data) => {
    broadcaster.broadcastSystemAlert(data);
  });

  emitter.on('system.node_offline', (data) => {
    broadcaster.broadcastSystemAlert({
      type: 'node_offline',
      severity: 'critical',
      message: `Node ${data.node_id} went offline`,
      details: data,
    });
  });

  console.log('✅ Event broadcasting configured');

  return broadcaster;
}

export default {
  WebSocketEventBroadcaster,
  initializeWebSocketEvents,
  setupEventBroadcasting,
};
