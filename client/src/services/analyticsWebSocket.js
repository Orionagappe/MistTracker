/**
 * Real-time WebSocket Service
 * Phase 17.2.7: Real-time Analytics UI Components
 * 
 * Manages WebSocket connections for real-time analytics updates
 */

class AnalyticsWebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;  // 3 seconds
    this.listeners = new Map();
    this.messageQueue = [];
    this.isConnecting = false;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/analytics?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to analytics WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Process queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          this.ws.send(JSON.stringify(msg));
        }

        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', { error });
      };

      this.ws.onclose = () => {
        console.log('❌ Disconnected from analytics WebSocket');
        this.isConnecting = false;
        this.emit('disconnected', {});
        this.attemptReconnect(token);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      this.isConnecting = false;
      this.attemptReconnect(token);
    }
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        this.connect(token);
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnection_failed', {});
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(data) {
    const { type, payload } = data;

    switch (type) {
      case 'ALERT':
        this.emit('alert', payload);
        break;

      case 'ALERT_ACKNOWLEDGED':
        this.emit('alert_acknowledged', payload);
        break;

      case 'HEALTH_UPDATE':
        this.emit('health_update', payload);
        break;

      case 'METRICS_UPDATE':
        this.emit('metrics_update', payload);
        break;

      case 'ANOMALY_DETECTED':
        this.emit('anomaly', payload);
        break;

      case 'STATUS':
        console.log('WebSocket status:', payload);
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }

  /**
   * Subscribe to event
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }

  /**
   * Send message to server
   */
  send(type, payload = {}) {
    const message = { type, payload };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  /**
   * Subscribe to webhook alerts
   */
  subscribeToAlerts(webhookId) {
    this.send('SUBSCRIBE_ALERTS', { webhook_id: webhookId });
  }

  /**
   * Subscribe to webhook health updates
   */
  subscribeToHealth(webhookId) {
    this.send('SUBSCRIBE_HEALTH', { webhook_id: webhookId });
  }

  /**
   * Subscribe to all alerts for team
   */
  subscribeToTeamAlerts() {
    this.send('SUBSCRIBE_TEAM_ALERTS');
  }

  /**
   * Unsubscribe from webhook
   */
  unsubscribe(webhookId) {
    this.send('UNSUBSCRIBE', { webhook_id: webhookId });
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.messageQueue = [];
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let wsInstance = null;

export function getAnalyticsWebSocket() {
  if (!wsInstance) {
    wsInstance = new AnalyticsWebSocketService();
  }
  return wsInstance;
}

export default AnalyticsWebSocketService;
