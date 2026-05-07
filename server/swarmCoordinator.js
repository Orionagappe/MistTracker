import crypto from 'crypto';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * SwarmCoordinator - Manages distributed server swarm
 * All random operations use crypto.randomBytes() for security
 */
export class SwarmCoordinator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Server identity - cryptographically secure
    this.peerId = crypto.randomBytes(16).toString('hex');
    this.config = {
      port: config.port || 3000,
      swarmPort: config.swarmPort || 5000,
      heartbeatInterval: config.heartbeatInterval || 5000,
      consensusTimeout: config.consensusTimeout || 5000,
      dataDir: config.dataDir || './swarm-data',
      enableDiscovery: config.enableDiscovery !== false,
      ...config
    };
    
    // Peer registry
    this.peers = new Map(); // peerId -> { id, address, port, lastHeartbeat, metrics }
    this.consensusVotes = new Map(); // dataHash -> [votes]
    this.milestoneCache = new Map(); // milestoneId -> milestone
    
    // Generate secure secret for message signing
    this.serverSecret = crypto.randomBytes(32);
    
    // Metrics
    this.metrics = {
      milestonesCreated: 0,
      milestonesValidated: 0,
      consensusReached: 0,
      consensusFailed: 0,
      peersConnected: 0,
      workItemsProcessed: 0
    };
    
    console.log(`✅ SwarmCoordinator initialized: ${this.peerId.substring(0, 12)}...`);
  }

  /**
   * Initialize the swarm coordinator
   */
  async initialize(discovery, peerNetwork) {
    this.discovery = discovery;
    this.peerNetwork = peerNetwork;
    
    // Start heartbeat monitor
    this.startHeartbeatMonitor();
    
    // Listen for peer events
    this.discovery.on('peerDiscovered', (peer) => this.onPeerDiscovered(peer));
    this.discovery.on('peerLost', (peerId) => this.onPeerLost(peerId));
    
    // Listen for peer messages
    this.peerNetwork.on('message', (msg) => this.onPeerMessage(msg));
    
    return true;
  }

  /**
   * Register a new peer in the swarm
   */
  async registerPeer(peerId, address, port) {
    this.peers.set(peerId, {
      id: peerId,
      address,
      port,
      lastHeartbeat: Date.now(),
      metrics: {
        cpu: 0,
        memory: 0,
        activeConnections: 0,
        processingRate: 0
      },
      healthy: true
    });
    
    this.metrics.peersConnected = this.peers.size;
    this.emit('peerRegistered', { peerId, address, port });
    console.log(`📊 Peer registered: ${peerId.substring(0, 12)}... (${address}:${port})`);
    
    return true;
  }

  /**
   * Unregister a peer from the swarm
   */
  async unregisterPeer(peerId) {
    this.peers.delete(peerId);
    this.metrics.peersConnected = this.peers.size;
    this.emit('peerUnregistered', { peerId });
    console.log(`❌ Peer unregistered: ${peerId.substring(0, 12)}...`);
    
    return true;
  }

  /**
   * Get all peers in the swarm
   */
  getPeers() {
    return Array.from(this.peers.values());
  }

  /**
   * Get a specific peer's status
   */
  getPeerHealth(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return null;
    
    const timeSinceHeartbeat = Date.now() - peer.lastHeartbeat;
    const isHealthy = timeSinceHeartbeat < this.config.heartbeatInterval * 3;
    
    return {
      id: peerId,
      address: peer.address,
      port: peer.port,
      healthy: isHealthy,
      lastHeartbeat: peer.lastHeartbeat,
      timeSinceHeartbeat,
      metrics: peer.metrics
    };
  }

  /**
   * Get overall swarm health
   */
  async getSwarmHealth() {
    const peers = this.getPeers();
    const healthyPeers = peers.filter(p => 
      Date.now() - p.lastHeartbeat < this.config.heartbeatInterval * 3
    );
    
    // Calculate swarm capacity
    const totalCpu = peers.reduce((sum, p) => sum + (100 - p.metrics.cpu), 0);
    const totalMemory = peers.reduce((sum, p) => sum + (100 - p.metrics.memory), 0);
    
    return {
      peerId: this.peerId,
      totalPeers: peers.length,
      healthyPeers: healthyPeers.length,
      failureRate: 1 - (healthyPeers.length / Math.max(peers.length, 1)),
      averageCpuUsage: peers.reduce((sum, p) => sum + p.metrics.cpu, 0) / Math.max(peers.length, 1),
      averageMemoryUsage: peers.reduce((sum, p) => sum + p.metrics.memory, 0) / Math.max(peers.length, 1),
      totalCapacity: {
        cpu: totalCpu,
        memory: totalMemory
      },
      consensusRate: this.metrics.consensusReached / 
        Math.max(this.metrics.consensusReached + this.metrics.consensusFailed, 1),
      metrics: this.metrics,
      timestamp: Date.now()
    };
  }

  /**
   * Distribute a milestone creation task to appropriate peer
   */
  async distributeWorkload(task, preference = null) {
    const peers = this.getPeers().filter(p => 
      Date.now() - p.lastHeartbeat < this.config.heartbeatInterval * 3
    );
    
    if (peers.length === 0) {
      throw new Error('No healthy peers available');
    }
    
    // Prefer specific peer if indicated
    if (preference) {
      const preferredPeer = peers.find(p => p.id === preference);
      if (preferredPeer) {
        return preferredPeer;
      }
    }
    
    // Select least loaded peer
    const selectedPeer = peers.reduce((least, current) => {
      const leastLoad = (least.metrics.cpu + least.metrics.memory) / 2;
      const currentLoad = (current.metrics.cpu + current.metrics.memory) / 2;
      return currentLoad < leastLoad ? current : least;
    });
    
    return selectedPeer;
  }

  /**
   * Submit a milestone to the swarm with consensus
   */
  async submitMilestone(milestone) {
    // Generate cryptographically secure milestone ID if not present
    if (!milestone.id) {
      milestone.id = `milestone-${crypto.randomBytes(12).toString('hex')}`;
    }
    
    // Create signed package
    const package_ = {
      milestone,
      signature: this.signMessage(milestone),
      sourceId: this.peerId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    // Cache locally
    this.milestoneCache.set(milestone.id, milestone);
    
    // Broadcast to all peers
    await this.broadcastMessage({
      type: 'MILESTONE_SYNC',
      payload: package_
    });
    
    this.metrics.milestonesCreated++;
    
    // Wait for consensus
    const consensusResult = await this.waitForConsensus(milestone.id, 
      this.config.consensusTimeout);
    
    if (consensusResult.agreement >= 0.66) { // 2/3 majority
      this.metrics.consensusReached++;
      return { success: true, consensusRate: consensusResult.agreement };
    } else {
      this.metrics.consensusFailed++;
      return { success: false, consensusRate: consensusResult.agreement };
    }
  }

  /**
   * Validate milestone metadata (same as Phase 16.1)
   */
  validateMetadata(definition, metadata = {}) {
    const errors = [];
    
    // Required fields
    const requiredFields = definition.validation_rules?.required_fields || [];
    for (const field of requiredFields) {
      if (!(field in metadata)) {
        errors.push(`Missing required field: '${field}'`);
      }
    }
    
    // Constraints
    const constraints = definition.validation_rules?.constraints || {};
    for (const [field, constraint] of Object.entries(constraints)) {
      if (!(field in metadata)) continue;
      
      const value = metadata[field];
      
      // Range checks
      if (constraint.min !== undefined && value < constraint.min) {
        errors.push(`${field} ${value} below minimum ${constraint.min}`);
      }
      if (constraint.max !== undefined && value > constraint.max) {
        errors.push(`${field} ${value} exceeds maximum ${constraint.max}`);
      }
      
      // Enum validation
      if (constraint.enum && !constraint.enum.includes(value)) {
        errors.push(`Invalid ${field} '${value}'. Must be one of: ${constraint.enum.join(', ')}`);
      }
    }
    
    return errors;
  }

  /**
   * Sign a message with HMAC-SHA256
   */
  signMessage(data) {
    return crypto
      .createHmac('sha256', this.serverSecret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Verify a message signature using timing-safe comparison
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

  /**
   * Generate a cryptographically secure token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Broadcast a message to all peers
   */
  async broadcastMessage(message) {
    const peers = this.getPeers();
    
    const promises = peers.map(peer => 
      this.peerNetwork.sendMessage(peer.id, {
        ...message,
        sourceId: this.peerId,
        timestamp: Date.now()
      }).catch(err => {
        console.error(`Failed to send to ${peer.id}:`, err.message);
      })
    );
    
    return Promise.allSettled(promises);
  }

  /**
   * Wait for consensus on a data item
   */
  async waitForConsensus(dataId, timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConsensus = () => {
        const votes = this.consensusVotes.get(dataId) || [];
        const agreements = votes.filter(v => v.vote === 'ACCEPT').length;
        const total = votes.length;
        
        if (total > 0) {
          const agreement = agreements / total;
          
          if (agreement >= 0.66 || agreement === 0) {
            // Consensus reached or timed out
            resolve({
              agreement,
              votes: agreements,
              total
            });
            return;
          }
        }
        
        if (Date.now() - startTime > timeout) {
          const votes = this.consensusVotes.get(dataId) || [];
          const agreements = votes.filter(v => v.vote === 'ACCEPT').length;
          resolve({
            agreement: agreements / Math.max(votes.length, 1),
            votes: agreements,
            total: votes.length,
            timedOut: true
          });
          return;
        }
        
        setTimeout(checkConsensus, 100);
      };
      
      checkConsensus();
    });
  }

  /**
   * Handle incoming peer message
   */
  onPeerMessage(message) {
    if (message.type === 'CONSENSUS_VOTE') {
      const votes = this.consensusVotes.get(message.dataId) || [];
      votes.push({
        peerId: message.peerId,
        vote: message.vote,
        timestamp: Date.now()
      });
      this.consensusVotes.set(message.dataId, votes);
      
      this.emit('consensusVote', message);
    } else if (message.type === 'MILESTONE_SYNC') {
      const milestone = message.payload.milestone;
      this.milestoneCache.set(milestone.id, milestone);
      this.metrics.milestonesValidated++;
      
      this.emit('milestoneSync', message);
    }
  }

  /**
   * Handle peer discovered event
   */
  onPeerDiscovered(peer) {
    this.registerPeer(peer.id, peer.address, peer.port);
  }

  /**
   * Handle peer lost event
   */
  onPeerLost(peerId) {
    this.unregisterPeer(peerId);
  }

  /**
   * Start monitoring peer heartbeats
   */
  startHeartbeatMonitor() {
    setInterval(() => {
      const peers = this.getPeers();
      
      for (const peer of peers) {
        const timeSinceHeartbeat = Date.now() - peer.lastHeartbeat;
        
        if (timeSinceHeartbeat > this.config.heartbeatInterval * 3) {
          console.warn(`⚠️  Peer ${peer.id.substring(0, 12)}... not responding (${timeSinceHeartbeat}ms)`);
          peer.healthy = false;
          this.emit('peerUnhealthy', { peerId: peer.id, timeSinceHeartbeat });
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Generate a full swarm report
   */
  async generateSwarmReport() {
    const health = await this.getSwarmHealth();
    
    return {
      timestamp: Date.now(),
      coordinatorId: this.peerId,
      swarm: health,
      peers: this.getPeers().map(p => ({
        id: p.id.substring(0, 12) + '...',
        address: p.address,
        port: p.port,
        healthy: Date.now() - p.lastHeartbeat < this.config.heartbeatInterval * 3,
        metrics: p.metrics
      })),
      cache: {
        milestonesStored: this.milestoneCache.size,
        consensusVotesTracked: this.consensusVotes.size
      },
      operations: {
        milestonesCreated: this.metrics.milestonesCreated,
        milestonesValidated: this.metrics.milestonesValidated,
        consensusReached: this.metrics.consensusReached,
        consensusFailed: this.metrics.consensusFailed,
        workItemsProcessed: this.metrics.workItemsProcessed
      }
    };
  }

  /**
   * Export to JSON
   */
  exportToJSON() {
    return {
      peerId: this.peerId,
      peers: Array.from(this.peers.entries()),
      milestones: Array.from(this.milestoneCache.entries()),
      metrics: this.metrics
    };
  }

  /**
   * Import from JSON
   */
  async importFromJSON(data) {
    if (data.peers) {
      for (const [peerId, peerData] of data.peers) {
        this.peers.set(peerId, peerData);
      }
    }
    
    if (data.milestones) {
      for (const [id, milestone] of data.milestones) {
        this.milestoneCache.set(id, milestone);
      }
    }
    
    return true;
  }
}

export default SwarmCoordinator;
