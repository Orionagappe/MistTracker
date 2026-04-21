import dgram from 'dgram';
import os from 'os';
import crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * SwarmDiscovery - Automatic peer discovery via UDP multicast or static configuration
 * Uses crypto.randomBytes() for secure peer identification
 */
export class SwarmDiscovery extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      multicastGroup: config.multicastGroup || '224.0.0.251',
      multicastPort: config.multicastPort || 5353,
      heartbeatInterval: config.heartbeatInterval || 5000,
      failureThreshold: config.failureThreshold || 3,
      enableMulticast: config.enableMulticast !== false,
      staticPeers: config.staticPeers || [],
      staticAsBackup: config.staticAsBackup || true,
      ...config
    };
    
    this.peerId = crypto.randomBytes(16).toString('hex');
    this.discoveredPeers = new Map();
    this.peerHeartbeats = new Map();
    this.failureCounts = new Map();
    
    console.log(`🔍 SwarmDiscovery initialized: ${this.peerId.substring(0, 12)}...`);
  }

  /**
   * Start the discovery process
   */
  async start(listeningPort = 5000) {
    this.listeningPort = listeningPort;
    
    if (this.config.enableMulticast) {
      this.startMulticastDiscovery();
    }
    
    if (this.config.staticPeers.length > 0) {
      this.startStaticDiscovery();
    }
    
    if (this.config.enableMulticast || this.config.staticPeers.length > 0) {
      this.startHeartbeatMonitor();
    }
    
    console.log('✅ Peer discovery started');
    return true;
  }

  /**
   * Start UDP multicast discovery
   */
  startMulticastDiscovery() {
    try {
      this.socket = dgram.createSocket('udp4');
      
      this.socket.on('message', (msg, rinfo) => {
        this.handleDiscoveryMessage(msg, rinfo);
      });
      
      this.socket.on('error', (err) => {
        console.error('UDP discovery error:', err);
      });
      
      this.socket.bind(this.config.multicastPort, () => {
        this.socket.addMembership(this.config.multicastGroup);
        console.log(`📡 Listening for multicast on ${this.config.multicastGroup}:${this.config.multicastPort}`);
      });
      
      // Send periodic announcements
      this.startMulticastAnnouncer();
    } catch (err) {
      console.error('Failed to start multicast discovery:', err.message);
      if (this.config.staticAsBackup) {
        console.log('Falling back to static peer configuration');
      }
    }
  }

  /**
   * Broadcast announcement to swarm
   */
  startMulticastAnnouncer() {
    setInterval(() => {
      const announcement = {
        type: 'DISCOVERY_ANNOUNCE',
        peerId: this.peerId,
        port: this.listeningPort,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(8).toString('hex'),
        address: this.getLocalAddress()
      };
      
      const message = Buffer.from(JSON.stringify(announcement));
      
      this.socket.send(
        message,
        0,
        message.length,
        this.config.multicastPort,
        this.config.multicastGroup,
        (err) => {
          if (err && err.code !== 'ENODEV') {
            console.error('Failed to send announcement:', err.message);
          }
        }
      );
    }, this.config.heartbeatInterval);
  }

  /**
   * Start static peer discovery
   */
  startStaticDiscovery() {
    // Register static peers immediately
    for (const peer of this.config.staticPeers) {
      this.registerPeer(
        peer.id || crypto.randomBytes(8).toString('hex'),
        peer.address,
        peer.port
      );
    }
    
    console.log(`📋 Registered ${this.config.staticPeers.length} static peers`);
  }

  /**
   * Handle incoming discovery message
   */
  handleDiscoveryMessage(msg, rinfo) {
    try {
      const announcement = JSON.parse(msg.toString());
      
      if (announcement.peerId === this.peerId) {
        // Ignore own announcements
        return;
      }
      
      if (announcement.type === 'DISCOVERY_ANNOUNCE') {
        this.registerPeer(
          announcement.peerId,
          announcement.address || rinfo.address,
          announcement.port
        );
        
        this.peerHeartbeats.set(announcement.peerId, Date.now());
        this.failureCounts.set(announcement.peerId, 0);
      }
    } catch (err) {
      // Ignore malformed messages
    }
  }

  /**
   * Register a peer as discovered
   */
  registerPeer(peerId, address, port) {
    if (!this.discoveredPeers.has(peerId)) {
      const peer = {
        id: peerId,
        address,
        port,
        discovered: Date.now()
      };
      
      this.discoveredPeers.set(peerId, peer);
      this.emit('peerDiscovered', peer);
      console.log(`✨ Peer discovered: ${peerId.substring(0, 12)}... (${address}:${port})`);
    }
    
    // Update heartbeat
    this.peerHeartbeats.set(peerId, Date.now());
    this.failureCounts.set(peerId, 0);
  }

  /**
   * Monitor peer heartbeats and detect failures
   */
  startHeartbeatMonitor() {
    setInterval(() => {
      const now = Date.now();
      
      for (const [peerId, lastHeartbeat] of this.peerHeartbeats.entries()) {
        const timeSinceHeartbeat = now - lastHeartbeat;
        
        if (timeSinceHeartbeat > this.config.heartbeatInterval * 2) {
          let failures = this.failureCounts.get(peerId) || 0;
          failures++;
          this.failureCounts.set(peerId, failures);
          
          console.warn(`⚠️  Peer ${peerId.substring(0, 12)}... missed heartbeat (${failures}/${this.config.failureThreshold})`);
          
          if (failures >= this.config.failureThreshold) {
            this.removePeer(peerId);
          }
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Remove a failed peer
   */
  removePeer(peerId) {
    if (this.discoveredPeers.has(peerId)) {
      const peer = this.discoveredPeers.get(peerId);
      this.discoveredPeers.delete(peerId);
      this.peerHeartbeats.delete(peerId);
      this.failureCounts.delete(peerId);
      
      this.emit('peerLost', peerId);
      console.log(`❌ Peer removed: ${peerId.substring(0, 12)}... (failed heartbeat)`);
    }
  }

  /**
   * Get local network address (for multicast announcements)
   */
  getLocalAddress() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const addr of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
    
    return '127.0.0.1';
  }

  /**
   * Get all discovered peers
   */
  getPeers() {
    return Array.from(this.discoveredPeers.values());
  }

  /**
   * Get peer by ID
   */
  getPeer(peerId) {
    return this.discoveredPeers.get(peerId);
  }

  /**
   * Check if peer is healthy
   */
  isPeerHealthy(peerId) {
    const failures = this.failureCounts.get(peerId) || 0;
    return failures < this.config.failureThreshold;
  }

  /**
   * Stop discovery
   */
  stop() {
    if (this.socket) {
      this.socket.close();
    }
    console.log('🛑 Peer discovery stopped');
  }
}

export default SwarmDiscovery;
