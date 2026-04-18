// websocket-protocol.js
// Defines message types and protocol for real-time WebSocket synchronization

/**
 * Message Types for WebSocket Communication
 * Used by both client and server for real-time synchronization
 */
export const MessageTypes = {
  // Connection & Presence
  HELLO: 'hello',                      // Initial connection handshake
  PRESENCE: 'presence',                // User online/offline status
  PING: 'ping',                        // Keepalive ping
  PONG: 'pong',                        // Keepalive pong
  
  // Data Mutations
  MUTATION: 'mutation',                // Item/timeline change
  BATCH_MUTATION: 'batch-mutation',    // Multiple mutations at once
  
  // Conflict Management
  CONFLICT: 'conflict',                // Concurrent edit conflict detected
  CONFLICT_RESOLUTION: 'conflict-resolution',  // How to resolve conflict
  
  // Synchronization
  SYNC_REQUEST: 'sync-request',        // Request full state sync
  SYNC_RESPONSE: 'sync-response',      // Full state response
  
  // P2P Encryption & Collaboration (Phase 3)
  P2P_DISCOVERY: 'p2p-discovery',      // P2P peer discovery request
  P2P_KEY_EXCHANGE: 'p2p-key-exchange',// Share public key with peer
  P2P_ENCRYPTED: 'p2p-encrypted',      // End-to-end encrypted message
  P2P_MESH: 'p2p-mesh',                // Mesh topology update
  
  // 3D/4D Visualization (Phase 4)
  GEOMETRY_CREATE: 'geometry-create',  // Create 3D geometry for item
  GEOMETRY_UPDATE: 'geometry-update',  // Update 3D geometry transform
  GEOMETRY_DELETE: 'geometry-delete',  // Remove 3D geometry
  GEOMETRY_QUERY: 'geometry-query',    // Query geometries by type/bounds
  TENSOR_CREATE: 'tensor-create',      // Create 4D tensor space
  SCENE_STATE: 'scene-state',          // Full scene state snapshot
  COLLISION_EVENT: 'collision-event',  // 3D collision detected
  
  // Physics Engine (Phase 5)
  PHYSICS_UPDATE: 'physics-update',    // Physics simulation state update
  PHYSICS_CONFIG: 'physics-config',    // Configure physics engine parameters
  WAVE_EMITTER: 'wave-emitter',        // Create/update wave emitter (light/gravity)
  PHYSICS_FORCE: 'physics-force',      // Apply force to geometry
  DIMENSIONAL_COUPLING: 'dimensional-coupling', // Enable/disable 3D↔4D coupling
  PHYSICS_STATE: 'physics-state',      // Full physics state snapshot
  
  // Rate Limiting
  RATE_LIMIT: 'rate-limit',           // Rate limit exceeded notification
  
  // Acknowledgement
  ACK: 'ack',                         // Acknowledge message receipt
  
  // Errors
  ERROR: 'error'                       // Error response
};

/**
 * Message Structure for Mutations
 * Sent when a timeline item is created, updated, or deleted
 */
export class MutationMessage {
  constructor(itemId, userId, sessionToken, action, value, oldValue = null) {
    this.type = MessageTypes.MUTATION;
    this.itemId = itemId;
    this.userId = userId;
    this.sessionToken = sessionToken;
    this.action = action; // 'create', 'update', 'delete'
    this.value = value;
    this.oldValue = oldValue;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      itemId: this.itemId,
      userId: this.userId,
      action: this.action,
      value: this.value,
      oldValue: this.oldValue,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Presence
 * Sent when user comes online/offline or changes what they're viewing
 */
export class PresenceMessage {
  constructor(userId, status = 'online', currentView = null) {
    this.type = MessageTypes.PRESENCE;
    this.userId = userId;
    this.status = status; // 'online', 'offline', 'away'
    this.currentView = currentView; // timeline viewing context
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      userId: this.userId,
      status: this.status,
      currentView: this.currentView,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Conflicts
 * Sent when concurrent edits are detected
 */
export class ConflictMessage {
  constructor(itemId, localChange, remoteChange, conflictType = 'concurrent-edit') {
    this.type = MessageTypes.CONFLICT;
    this.itemId = itemId;
    this.localChange = localChange;
    this.remoteChange = remoteChange;
    this.conflictType = conflictType;
    this.timestamp = Date.now();
    this.requiresResolution = true;
  }

  toJSON() {
    return {
      type: this.type,
      itemId: this.itemId,
      localChange: this.localChange,
      remoteChange: this.remoteChange,
      conflictType: this.conflictType,
      timestamp: this.timestamp,
      requiresResolution: this.requiresResolution
    };
  }
}

/**
 * Message Structure for Sync Requests
 * Request complete state for a timeline or all timelines
 */
export class SyncRequestMessage {
  constructor(timelineId = null, afterTimestamp = null) {
    this.type = MessageTypes.SYNC_REQUEST;
    this.timelineId = timelineId; // null = sync all
    this.afterTimestamp = afterTimestamp; // Only send changes after this timestamp
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      timelineId: this.timelineId,
      afterTimestamp: this.afterTimestamp,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Sync Response
 * Complete state snapshot for timelines
 */
export class SyncResponseMessage {
  constructor(timelines = [], changes = []) {
    this.type = MessageTypes.SYNC_RESPONSE;
    this.timelines = timelines;
    this.changes = changes;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      timelines: this.timelines,
      changes: this.changes,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Acknowledgements
 * Confirm receipt of important messages
 */
export class AckMessage {
  constructor(messageType, messageId, status = 'received') {
    this.type = MessageTypes.ACK;
    this.messageType = messageType;
    this.messageId = messageId;
    this.status = status; // 'received', 'processed', 'error'
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      messageType: this.messageType,
      messageId: this.messageId,
      status: this.status,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Rate Limit Notifications
 * Sent when client exceeds bandwidth limit
 */
export class RateLimitMessage {
  constructor(userId, retryAfterMs = 1000, currentUsage = 0, limit = 50000) {
    this.type = MessageTypes.RATE_LIMIT;
    this.userId = userId;
    this.retryAfterMs = retryAfterMs;
    this.currentUsage = currentUsage;
    this.limit = limit;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      userId: this.userId,
      retryAfterMs: this.retryAfterMs,
      currentUsage: this.currentUsage,
      limit: this.limit,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Errors
 * Sent when an error occurs during processing
 */
export class ErrorMessage {
  constructor(errorCode, errorMessage, details = null) {
    this.type = MessageTypes.ERROR;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.details = details;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Geometry Create
 * Sent when a 3D geometry is created for a timeline item
 */
export class GeometryCreateMessage {
  constructor(itemId, type, position = null, scale = null, rotation = null, color = '#FF6B6B', properties = {}) {
    this.type = MessageTypes.GEOMETRY_CREATE;
    this.itemId = itemId;
    this.geometryType = type;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.scale = scale || { x: 1, y: 1, z: 1 };
    this.rotation = rotation || { x: 0, y: 0, z: 0 };
    this.color = color;
    this.properties = properties;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      itemId: this.itemId,
      geometryType: this.geometryType,
      position: this.position,
      scale: this.scale,
      rotation: this.rotation,
      color: this.color,
      properties: this.properties,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Geometry Update
 * Sent when an existing 3D geometry transform changes
 */
export class GeometryUpdateMessage {
  constructor(itemId, position = null, rotation = null, scale = null, color = null) {
    this.type = MessageTypes.GEOMETRY_UPDATE;
    this.itemId = itemId;
    if (position !== null) this.position = position;
    if (rotation !== null) this.rotation = rotation;
    if (scale !== null) this.scale = scale;
    if (color !== null) this.color = color;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      itemId: this.itemId,
      ...(this.position !== undefined && { position: this.position }),
      ...(this.rotation !== undefined && { rotation: this.rotation }),
      ...(this.scale !== undefined && { scale: this.scale }),
      ...(this.color !== undefined && { color: this.color }),
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Geometry Delete
 * Sent when a 3D geometry is removed
 */
export class GeometryDeleteMessage {
  constructor(itemId) {
    this.type = MessageTypes.GEOMETRY_DELETE;
    this.itemId = itemId;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      itemId: this.itemId,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Tensor Create
 * Sent when a 4D tensor space is created for a timeline item
 */
export class TensorCreateMessage {
  constructor(itemId, d0, d1, intensity = 1.0, frequency = 1.0, phase = 0) {
    this.type = MessageTypes.TENSOR_CREATE;
    this.itemId = itemId;
    this.d0 = d0;
    this.d1 = d1;
    this.intensity = intensity;
    this.frequency = frequency;
    this.phase = phase;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      itemId: this.itemId,
      d0: this.d0,
      d1: this.d1,
      intensity: this.intensity,
      frequency: this.frequency,
      phase: this.phase,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Scene State Request
 * Sent by clients to request the full 3D scene snapshot
 */
export class SceneStateRequestMessage {
  constructor(timelineId = null) {
    this.type = MessageTypes.SCENE_STATE;
    this.timelineId = timelineId;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      timelineId: this.timelineId,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Physics Update
 * Sent when physics engine updates geometry and tensor field states
 */
export class PhysicsUpdateMessage {
  constructor(geometryUpdates = [], tensorUpdates = [], statisticsData = null) {
    this.type = MessageTypes.PHYSICS_UPDATE;
    this.geometryUpdates = geometryUpdates;
    this.tensorUpdates = tensorUpdates;
    this.statistics = statisticsData;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      geometryUpdates: this.geometryUpdates,
      tensorUpdates: this.tensorUpdates,
      statistics: this.statistics,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Physics Configuration
 * Used to configure physics engine parameters (timestep, gravity, wave speed, etc.)
 */
export class PhysicsConfigMessage {
  constructor(config = {}) {
    this.type = MessageTypes.PHYSICS_CONFIG;
    this.timeStep = config.timeStep ?? 0.016;
    this.gravityStrength = config.gravityStrength ?? 9.81;
    this.lightSpeed = config.lightSpeed ?? 299792458;
    this.waveSpeedMultiplier = config.waveSpeedMultiplier ?? 1.0;
    this.dimensionalCouplingStrength = config.dimensionalCouplingStrength ?? 0.5;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      timeStep: this.timeStep,
      gravityStrength: this.gravityStrength,
      lightSpeed: this.lightSpeed,
      waveSpeedMultiplier: this.waveSpeedMultiplier,
      dimensionalCouplingStrength: this.dimensionalCouplingStrength,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Wave Emitter
 * Used to create or update wave emitters (light, gravity waves)
 */
export class WaveEmitterMessage {
  constructor(emitterId, type = 'light', position = null, frequency = 440, amplitude = 1.0, intensity = 1.0) {
    this.type = MessageTypes.WAVE_EMITTER;
    this.emitterId = emitterId;
    this.emitterType = type; // 'light', 'gravity', 'quantum'
    this.position = position || [0, 0, 0];
    this.frequency = frequency;
    this.amplitude = amplitude;
    this.intensity = intensity;
    this.isActive = true;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      emitterId: this.emitterId,
      emitterType: this.emitterType,
      position: this.position,
      frequency: this.frequency,
      amplitude: this.amplitude,
      intensity: this.intensity,
      isActive: this.isActive,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Dimensional Coupling Control
 * Enable/disable 3D↔4D dimensional interactions
 */
export class DimensionalCouplingMessage {
  constructor(enabled = true, couplingStrength = 0.5) {
    this.type = MessageTypes.DIMENSIONAL_COUPLING;
    this.enabled = enabled;
    this.couplingStrength = couplingStrength;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      enabled: this.enabled,
      couplingStrength: this.couplingStrength,
      timestamp: this.timestamp
    };
  }
}

/**
 * Message Structure for Full Physics State
 * Sent when requesting complete physics simulation snapshot
 */
export class PhysicsStateMessage {
  constructor(physicsData = null) {
    this.type = MessageTypes.PHYSICS_STATE;
    this.geometries = physicsData?.geometries || [];
    this.tensorFields = physicsData?.tensorFields || [];
    this.waveEmitters = physicsData?.waveEmitters || [];
    this.statistics = physicsData?.stats || {};
    this.simulationTime = physicsData?.simulationTime || 0;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      type: this.type,
      geometries: this.geometries,
      tensorFields: this.tensorFields,
      waveEmitters: this.waveEmitters,
      statistics: this.statistics,
      simulationTime: this.simulationTime,
      timestamp: this.timestamp
    };
  }
}

/**
 * Parse incoming WebSocket message and return typed message object
 * @param {string|Buffer} rawMessage - Raw WebSocket message
 * @returns {Object} Parsed message object with type and data
 */
export function parseMessage(rawMessage) {
  try {
    const data = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : JSON.parse(rawMessage.toString());
    return {
      success: true,
      type: data.type,
      data: data
    };
  } catch (err) {
    return {
      success: false,
      error: 'Invalid message format',
      type: null,
      data: null
    };
  }
}

/**
 * Validate message has required fields based on type
 * @param {Object} message - Parsed message object
 * @returns {Object} Validation result with success flag and errors
 */
export function validateMessage(message) {
  const errors = [];

  // Check required fields
  if (!message.type) {
    errors.push('Message must have a type field');
  }

  if (!message.timestamp) {
    errors.push('Message must have a timestamp field');
  }

  // Type-specific validation
  switch (message.type) {
    case MessageTypes.MUTATION:
      if (!message.itemId) errors.push('MUTATION must have itemId');
      if (!message.userId) errors.push('MUTATION must have userId');
      if (!message.action) errors.push('MUTATION must have action');
      break;

    case MessageTypes.PRESENCE:
      if (!message.userId) errors.push('PRESENCE must have userId');
      if (!message.status) errors.push('PRESENCE must have status');
      break;

    case MessageTypes.CONFLICT:
      if (!message.itemId) errors.push('CONFLICT must have itemId');
      if (!message.localChange) errors.push('CONFLICT must have localChange');
      if (!message.remoteChange) errors.push('CONFLICT must have remoteChange');
      break;

    case MessageTypes.SYNC_REQUEST:
      // Optional timelineId and afterTimestamp
      break;

    case MessageTypes.ACK:
      if (!message.messageType) errors.push('ACK must have messageType');
      if (!message.messageId) errors.push('ACK must have messageId');
      break;

    case MessageTypes.PING:
    case MessageTypes.PONG:
      // No specific requirements
      break;

    case MessageTypes.P2P_DISCOVERY:
      if (!message.userId) errors.push('P2P_DISCOVERY must have userId');
      if (!message.publicKey) errors.push('P2P_DISCOVERY must have publicKey');
      break;

    case MessageTypes.P2P_KEY_EXCHANGE:
      if (!message.from) errors.push('P2P_KEY_EXCHANGE must have from');
      if (!message.to) errors.push('P2P_KEY_EXCHANGE must have to');
      if (!message.publicKey) errors.push('P2P_KEY_EXCHANGE must have publicKey');
      break;

    case MessageTypes.P2P_ENCRYPTED:
      if (!message.from) errors.push('P2P_ENCRYPTED must have from');
      if (!message.to) errors.push('P2P_ENCRYPTED must have to');
      if (!message.encrypted) errors.push('P2P_ENCRYPTED must have encrypted field');
      if (!message.encrypted.ephemeralPub) errors.push('P2P_ENCRYPTED must have ephemeralPub');
      if (!message.encrypted.iv) errors.push('P2P_ENCRYPTED must have iv');
      if (!message.encrypted.ciphertext) errors.push('P2P_ENCRYPTED must have ciphertext');
      break;

    case MessageTypes.P2P_MESH:
      if (!message.userId) errors.push('P2P_MESH must have userId');
      // mesh topology update
      break;

    case MessageTypes.GEOMETRY_CREATE:
      if (!message.itemId) errors.push('GEOMETRY_CREATE must have itemId');
      if (!message.type) errors.push('GEOMETRY_CREATE must have type');
      break;

    case MessageTypes.GEOMETRY_UPDATE:
      if (!message.itemId) errors.push('GEOMETRY_UPDATE must have itemId');
      // position, rotation, scale optional
      break;

    case MessageTypes.GEOMETRY_DELETE:
      if (!message.itemId) errors.push('GEOMETRY_DELETE must have itemId');
      break;

    case MessageTypes.TENSOR_CREATE:
      if (!message.itemId) errors.push('TENSOR_CREATE must have itemId');
      break;

    case MessageTypes.SCENE_STATE:
      // Response only, no specific requirements
      break;

    case MessageTypes.COLLISION_EVENT:
      if (!message.item1) errors.push('COLLISION_EVENT must have item1');
      if (!message.item2) errors.push('COLLISION_EVENT must have item2');
      break;

    default:
      errors.push(`Unknown message type: ${message.type}`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Create a hello message for client-server handshake
 */
export function createHelloMessage(userId, connectionId) {
  return {
    type: MessageTypes.HELLO,
    userId: userId,
    connectionId: connectionId,
    protocol: 'mist-sync-1.0',
    timestamp: Date.now()
  };
}

/**
 * Create a ping message for keepalive
 */
export function createPingMessage() {
  return {
    type: MessageTypes.PING,
    timestamp: Date.now()
  };
}

/**
 * Create a pong response
 */
export function createPongMessage() {
  return {
    type: MessageTypes.PONG,
    timestamp: Date.now()
  };
}
