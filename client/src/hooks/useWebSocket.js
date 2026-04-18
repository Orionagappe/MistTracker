import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { MessageTypes } from '../../../websocket-protocol.js';

/**
 * useWebSocket - React Hook for WebSocket Real-Time Synchronization
 * 
 * Manages WebSocket connection, message handling, and auto-reconnection
 * 
 * @param {string} token - JWT authentication token
 * @param {function} onMessageCallback - Callback when message received
 * @param {function} onError - Callback when error occurs
 * @param {object} options - Configuration options
 * @returns {object} WebSocket interface with send, reconnect, and status
 */
export function useWebSocket(token, onMessageCallback, onError, options = {}) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef(null);
  const messageHandlersRef = useRef(new Map());
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [userId, setUserId] = useState(null);
  const [presenceMap, setPresenceMap] = useState(new Map());

  // Configuration
  const {
    wsUrl = typeof window !== 'undefined' && window.location && 
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3000` ||
      'ws://localhost:3000',
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    exponentialBackoff = true,
    pingInterval = 30000,
    onConnect = null,
    onDisconnect = null,
    onPresenceChange = null
  } = options;

  /**
   * Send a message through WebSocket
   */
  const send = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, message not sent');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      if (onError) onError(err);
      return false;
    }
  }, [onError]);

  /**
   * Send mutation message (item changed)
   */
  const sendMutation = useCallback((itemId, action, value, oldValue = null) => {
    return send({
      type: MessageTypes.MUTATION,
      itemId,
      userId,
      action,
      value,
      oldValue,
      timestamp: Date.now()
    });
  }, [send, userId]);

  /**
   * Send presence update
   */
  const sendPresence = useCallback((status = 'online', currentView = null) => {
    return send({
      type: MessageTypes.PRESENCE,
      userId,
      status,
      currentView,
      timestamp: Date.now()
    });
  }, [send, userId]);

  /**
   * Request full state sync
   */
  const requestSync = useCallback((timelineId = null, afterTimestamp = null) => {
    return send({
      type: MessageTypes.SYNC_REQUEST,
      timelineId,
      afterTimestamp,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Register a type-specific message handler
   * Used by hooks like useVisualization to subscribe to specific message types
   */
  const setMessageHandler = useCallback((type, handler) => {
    messageHandlersRef.current.set(type, handler);
  }, []);

  /**
   * Unregister a type-specific message handler
   */
  const offMessage = useCallback((type) => {
    messageHandlersRef.current.delete(type);
  }, []);

  /**
   * Send a geometry create message
   */
  const sendGeometryCreate = useCallback((itemId, type, position = null, scale = null, rotation = null, color = '#FF6B6B', properties = {}) => {
    return send({
      type: MessageTypes.GEOMETRY_CREATE,
      itemId,
      geometryType: type,
      position: position || { x: 0, y: 0, z: 0 },
      scale: scale || { x: 1, y: 1, z: 1 },
      rotation: rotation || { x: 0, y: 0, z: 0 },
      color,
      properties,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Send a geometry update message
   */
  const sendGeometryUpdate = useCallback((itemId, updates = {}) => {
    return send({
      type: MessageTypes.GEOMETRY_UPDATE,
      itemId,
      ...updates,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Send a geometry delete message
   */
  const sendGeometryDelete = useCallback((itemId) => {
    return send({
      type: MessageTypes.GEOMETRY_DELETE,
      itemId,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Request scene state snapshot from server
   */
  const requestSceneState = useCallback((timelineId = null) => {
    return send({
      type: MessageTypes.SCENE_STATE,
      timelineId,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Send a tensor create message
   */
  const sendTensorCreate = useCallback((itemId, d0, d1, intensity = 1.0, frequency = 1.0, phase = 0) => {
    return send({
      type: MessageTypes.TENSOR_CREATE,
      itemId,
      d0,
      d1,
      intensity,
      frequency,
      phase,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Send physics configuration message
   */
  const sendPhysicsConfig = useCallback((config = {}) => {
    return send({
      type: MessageTypes.PHYSICS_CONFIG,
      timeStep: config.timeStep,
      gravityStrength: config.gravityStrength,
      lightSpeed: config.lightSpeed,
      waveSpeedMultiplier: config.waveSpeedMultiplier,
      dimensionalCouplingStrength: config.dimensionalCouplingStrength,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Send wave emitter creation/update message
   */
  const sendWaveEmitter = useCallback((emitterId, type = 'light', position = null, frequency = 440, amplitude = 1.0, intensity = 1.0) => {
    return send({
      type: MessageTypes.WAVE_EMITTER,
      emitterId,
      emitterType: type,
      position: position || [0, 0, 0],
      frequency,
      amplitude,
      intensity,
      isActive: true,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Request full physics state snapshot from server
   */
  const requestPhysicsState = useCallback(() => {
    return send({
      type: MessageTypes.PHYSICS_STATE,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Enable/disable dimensional coupling between 3D and 4D
   */
  const setDimensionalCoupling = useCallback((enabled = true, couplingStrength = 0.5) => {
    return send({
      type: MessageTypes.DIMENSIONAL_COUPLING,
      enabled,
      couplingStrength,
      timestamp: Date.now()
    });
  }, [send]);

  /**
   * Get current users online
   */
  const getOnlineUsers = useCallback(() => {
    const onlineUsers = [];
    presenceMap.forEach((presence, userId) => {
      if (presence.status === 'online') {
        onlineUsers.push({ userId, ...presence });
      }
    });
    return onlineUsers;
  }, [presenceMap]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data);

      // Handle hello message (connection confirmation)
      if (message.type === MessageTypes.HELLO) {
        if (message.userId) {
          setUserId(message.userId);
          console.log(`✓ Connected to WebSocket as ${message.userId}`);
        }
        return;
      }

      // Handle presence updates
      if (message.type === MessageTypes.PRESENCE) {
        setPresenceMap(prev => {
          const newMap = new Map(prev);
          newMap.set(message.userId, {
            status: message.status,
            currentView: message.currentView,
            timestamp: message.timestamp
          });
          return newMap;
        });
        
        if (onPresenceChange) {
          onPresenceChange(message.userId, message.status, message.currentView);
        }
        return;
      }

      // Handle pong (keepalive)
      if (message.type === MessageTypes.PONG) {
        return;
      }

      // Handle rate limiting
      if (message.type === MessageTypes.RATE_LIMIT) {
        console.warn(`Rate limited: ${message.currentUsage}/${message.limit} bytes used`);
        if (onError) {
          onError(new Error(`Rate limited. Retry after ${message.retryAfterMs}ms`));
        }
        return;
      }

      // Handle errors
      if (message.type === MessageTypes.ERROR) {
        const error = new Error(`WebSocket Error: ${message.errorMessage}`);
        error.code = message.errorCode;
        error.details = message.details;
        if (onError) onError(error);
        return;
      }

      // Pass other messages to caller
      // First check type-specific registered handlers (e.g. from useVisualization)
      if (messageHandlersRef.current.has(message.type)) {
        messageHandlersRef.current.get(message.type)(message);
        return;
      }

      if (onMessageCallback) {
        onMessageCallback(message);
      }
    } catch (err) {
      console.error('Failed to handle message:', err);
      if (onError) onError(err);
    }
  }, [onMessageCallback, onError, onPresenceChange]);

  /**
   * Try to reconnect
   */
  const reconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      setConnectionStatus('failed');
      return;
    }

    reconnectAttemptsRef.current++;
    
    const delay = exponentialBackoff
      ? reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1)
      : reconnectDelay;

    console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
    setConnectionStatus('reconnecting');

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [maxReconnectAttempts, reconnectDelay, exponentialBackoff]);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (!token) {
      console.error('No authentication token provided');
      if (onError) onError(new Error('No authentication token'));
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      const url = `${wsUrl}?token=${token}`;
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('✓ WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Send initial presence
        send({
          type: MessageTypes.PRESENCE,
          status: 'online',
          timestamp: Date.now()
        });

        if (onConnect) onConnect();

        // Start keepalive ping
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            send({
              type: MessageTypes.PING,
              timestamp: Date.now()
            });
          }
        }, pingInterval);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        console.error('✗ WebSocket error:', event);
        setConnectionStatus('error');
        if (onError) {
          onError(new Error('WebSocket connection error'));
        }
      };

      ws.onclose = () => {
        console.log('✓ WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Send offline presence
        setPresenceMap(new Map());

        if (onDisconnect) onDisconnect();

        // Try to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnect();
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect:', err);
      setConnectionStatus('error');
      if (onError) onError(err);
    }
  }, [token, wsUrl, send, handleMessage, reconnect, maxReconnectAttempts, pingInterval, onConnect, onDisconnect, onError]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  /**
   * Effect: Connect on mount with token
   */
  useEffect(() => {
    if (token && !isConnected && connectionStatus !== 'connecting') {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token]);

  // Memoize the returned object so consumers don't get a new reference on every
  // render. Effects that list wsConnection in their deps won't re-fire unless
  // the actual connection state or methods change.
  return useMemo(() => ({
    // Status
    isConnected,
    connectionStatus,
    userId,
    presenceMap,
    
    // Core methods
    send,
    sendMutation,
    sendPresence,
    requestSync,
    getOnlineUsers,
    connect,
    disconnect,
    reconnect,

    // Type-based message handler registry
    setMessageHandler,
    offMessage,

    // Geometry methods
    sendGeometryCreate,
    sendGeometryUpdate,
    sendGeometryDelete,
    requestSceneState,
    sendTensorCreate,
    
    // Physics methods
    sendPhysicsConfig,
    sendWaveEmitter,
    requestPhysicsState,
    setDimensionalCoupling,
    
    // WebSocket ref
    ws: wsRef.current
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isConnected, connectionStatus, userId, presenceMap, send, sendMutation,
    sendPresence, requestSync, getOnlineUsers, connect, disconnect, reconnect,
    setMessageHandler, offMessage, sendGeometryCreate, sendGeometryUpdate,
    sendGeometryDelete, requestSceneState, sendTensorCreate, sendPhysicsConfig,
    sendWaveEmitter, requestPhysicsState, setDimensionalCoupling]);
}

export default useWebSocket;
