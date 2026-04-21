import crypto from 'crypto';
import net from 'net';
import { EventEmitter } from 'events';

/**
 * SwarmPeer - Direct peer-to-peer communication between servers
 * Uses crypto.randomBytes() for secure nonces and message IDs
 */
export class SwarmPeer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      port: config.port || 5000,
      messageTimeout: config.messageTimeout || 10000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    this.peerId = crypto.randomBytes(16).toString('hex');
    this.peerConnections = new Map();
    this.pendingMessages = new Map();
    
    console.log(`🤝 SwarmPeer initialized: ${this.peerId.substring(0, 12)}...`);
  }

  /**
   * Start the peer server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        this.handleConnection(socket);
      });
      
      this.server.on('error', (err) => {
        console.error('Peer server error:', err);
        reject(err);
      });
      
      this.server.listen(this.config.port, () => {
        console.log(`✅ Peer server listening on port ${this.config.port}`);
        resolve(true);
      });
    });
  }

  /**
   * Handle incoming connection from peer
   */
  handleConnection(socket) {
    let buffer = '';
    
    socket.on('data', (data) => {
      buffer += data.toString();
      
      // Try to parse complete JSON messages
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex);
        buffer = buffer.substring(newlineIndex + 1);
        
        try {
          const message = JSON.parse(line);
          this.handleMessage(message, socket);
        } catch (err) {
          console.error('Failed to parse peer message:', err.message);
        }
      }
    });
    
    socket.on('error', (err) => {
      console.error('Peer connection error:', err.message);
    });
    
    socket.on('end', () => {
      // Connection closed
    });
  }

  /**
   * Handle incoming message
   */
  handleMessage(message, socket) {
    // Handle ACK
    if (message.type === 'ACK') {
      this.handleAck(message);
      return;
    }
    
    // Send ACK
    this.sendAck(message.messageId, socket);
    
    // Emit message event
    this.emit('message', message);
  }

  /**
   * Send ACK for received message
   */
  sendAck(messageId, socket) {
    const ack = {
      type: 'ACK',
      messageId,
      timestamp: Date.now()
    };
    
    try {
      socket.write(JSON.stringify(ack) + '\n');
    } catch (err) {
      console.error('Failed to send ACK:', err.message);
    }
  }

  /**
   * Handle ACK for sent message
   */
  handleAck(ack) {
    const pending = this.pendingMessages.get(ack.messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(true);
      this.pendingMessages.delete(ack.messageId);
    }
  }

  /**
   * Send message to a specific peer
   */
  async sendMessage(peerId, message, retries = 0) {
    try {
      const peer = this.peerConnections.get(peerId);
      if (!peer) {
        throw new Error(`No connection to peer ${peerId.substring(0, 12)}...`);
      }
      
      // Add metadata
      const envelope = {
        ...message,
        messageId: `msg-${crypto.randomBytes(12).toString('hex')}`,
        sourcePeerId: this.peerId,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex')
      };
      
      return new Promise((resolve, reject) => {
        // Register pending message
        this.pendingMessages.set(envelope.messageId, {
          resolve,
          reject,
          timeout: setTimeout(() => {
            this.pendingMessages.delete(envelope.messageId);
            
            if (retries < this.config.maxRetries) {
              // Retry
              setTimeout(() => {
                this.sendMessage(peerId, message, retries + 1)
                  .then(resolve)
                  .catch(reject);
              }, this.config.retryDelay * Math.pow(2, retries)); // Exponential backoff
            } else {
              reject(new Error(`Message timeout to ${peerId.substring(0, 12)}... after ${this.config.maxRetries} retries`));
            }
          }, this.config.messageTimeout)
        });
        
        // Send message
        try {
          peer.socket.write(JSON.stringify(envelope) + '\n');
        } catch (err) {
          this.pendingMessages.delete(envelope.messageId);
          reject(err);
        }
      });
    } catch (err) {
      if (retries < this.config.maxRetries) {
        // Retry with connection establishment
        await this.establishConnection(peerId);
        return this.sendMessage(peerId, message, retries + 1);
      } else {
        throw err;
      }
    }
  }

  /**
   * Establish connection to a peer
   */
  async establishConnection(peerId, address, port) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(port, address, () => {
        this.peerConnections.set(peerId, {
          id: peerId,
          address,
          port,
          socket,
          established: Date.now(),
          messageCount: 0
        });
        
        socket.on('error', (err) => {
          console.error(`Connection to ${peerId.substring(0, 12)}... failed:`, err.message);
          this.peerConnections.delete(peerId);
        });
        
        socket.on('end', () => {
          this.peerConnections.delete(peerId);
        });
        
        console.log(`🔗 Connected to peer ${peerId.substring(0, 12)}... (${address}:${port})`);
        resolve(true);
      });
      
      socket.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Broadcast message to multiple peers
   */
  async broadcastMessage(peerIds, message) {
    const promises = peerIds.map(peerId => 
      this.sendMessage(peerId, message).catch(err => ({
        peerId,
        error: err.message
      }))
    );
    
    const results = await Promise.allSettled(promises);
    
    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  /**
   * Get peer connection status
   */
  getPeerStatus(peerId) {
    const connection = this.peerConnections.get(peerId);
    if (!connection) {
      return { connected: false };
    }
    
    return {
      connected: true,
      address: connection.address,
      port: connection.port,
      established: connection.established,
      uptime: Date.now() - connection.established,
      messageCount: connection.messageCount
    };
  }

  /**
   * Get all peer connection statuses
   */
  getAllPeerStatuses() {
    const statuses = {};
    for (const [peerId, connection] of this.peerConnections.entries()) {
      statuses[peerId] = {
        connected: true,
        address: connection.address,
        port: connection.port,
        uptime: Date.now() - connection.established,
        messageCount: connection.messageCount
      };
    }
    return statuses;
  }

  /**
   * Close connection to a peer
   */
  async closePeerConnection(peerId) {
    const connection = this.peerConnections.get(peerId);
    if (connection) {
      connection.socket.destroy();
      this.peerConnections.delete(peerId);
      console.log(`🔌 Closed connection to ${peerId.substring(0, 12)}...`);
    }
  }

  /**
   * Stop the peer server
   */
  stop() {
    // Close all peer connections
    for (const [peerId, connection] of this.peerConnections.entries()) {
      connection.socket.destroy();
    }
    this.peerConnections.clear();
    
    // Stop listening
    if (this.server) {
      this.server.close();
    }
    
    console.log('🛑 Peer server stopped');
  }

  /**
   * Generate secure message signature
   */
  signMessage(data, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Verify message signature
   */
  verifySignature(data, signature, secret) {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computed),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  }
}

export default SwarmPeer;
