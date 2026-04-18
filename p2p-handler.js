// p2p-handler.js
// Manages P2P peer discovery, encrypted messaging, and mesh formation

import { P2PCollaborator } from './P2PCollaborator.js';

export class P2PHandler {
  constructor() {
    this.peerCollaborators = new Map(); // userId -> P2PCollaborator instance
    this.peerConnections = new Map(); // userId -> { peer: P2PCollaborator, status, lastSeen }
    this.encryptedMessageLog = []; // Audit trail of encrypted messages
    this.peerMesh = new Map(); // userId -> Set of connected peers
    this.meshStability = new Map(); // userId -> stability score
  }

  /**
   * Initialize or get P2PCollaborator for a user
   */
  initializePeer(userId, sessionToken) {
    if (this.peerCollaborators.has(userId)) {
      return this.peerCollaborators.get(userId);
    }

    const collaborator = new P2PCollaborator(userId, sessionToken);
    this.peerCollaborators.set(userId, collaborator);
    
    // Initialize mesh and stability
    this.peerMesh.set(userId, new Set());
    this.meshStability.set(userId, 100); // Start at 100% stability
    
    return collaborator;
  }

  /**
   * Discover peer from online users
   * Called when a user connects
   */
  discoverPeer(userId, sessionToken, onlineUsers = []) {
    const collaborator = this.initializePeer(userId, sessionToken);
    const { publicKey } = collaborator;
    
    // Add all online users as peers
    const discoveredPeers = [];
    for (const onlineUser of onlineUsers) {
      if (onlineUser.userId === userId) continue; // Skip self
      
      if (this.peerCollaborators.has(onlineUser.userId)) {
        const peerCollaborator = this.peerCollaborators.get(onlineUser.userId);
        collaborator.addPeer(
          onlineUser.userId,
          peerCollaborator.publicKey,
          { status: onlineUser.status, view: onlineUser.currentView }
        );
        
        // Add to mesh
        const userMesh = this.peerMesh.get(userId) || new Set();
        userMesh.add(onlineUser.userId);
        this.peerMesh.set(userId, userMesh);
        
        discoveredPeers.push({
          userId: onlineUser.userId,
          publicKey: peerCollaborator.publicKey
        });
      }
    }
    
    return {
      userId,
      publicKey,
      discoveredPeers,
      meshSize: discoveredPeers.length
    };
  }

  /**
   * Create encrypted message for peer
   */
  createEncryptedMessage(fromUserId, toUserId, messageData, messageType = 'P2P_DATA') {
    const fromCollaborator = this.peerCollaborators.get(fromUserId);
    if (!fromCollaborator) {
      throw new Error(`Peer ${fromUserId} not initialized`);
    }

    const toPeer = fromCollaborator.peers.get(toUserId);
    if (!toPeer) {
      throw new Error(`Peer ${toUserId} not known to ${fromUserId}`);
    }

    // Create signed message first
    const signedMessage = fromCollaborator.createSignedMessage({
      type: messageType,
      payload: messageData,
      timestamp: Date.now()
    });

    // Encrypt for recipient
    const encryptedContent = fromCollaborator.encryptForPeer(
      signedMessage,
      toPeer.publicKey
    );

    const message = {
      from: fromUserId,
      to: toUserId,
      type: 'P2P_ENCRYPTED',
      encrypted: encryptedContent,
      timestamp: Date.now()
    };

    // Log for audit trail
    this.encryptedMessageLog.push({
      from: fromUserId,
      to: toUserId,
      messageType,
      timestamp: Date.now(),
      success: true
    });

    return message;
  }

  /**
   * Decrypt and verify received message
   */
  decryptMessage(toUserId, encryptedMessage) {
    const toCollaborator = this.peerCollaborators.get(toUserId);
    if (!toCollaborator) {
      throw new Error(`Peer ${toUserId} not initialized`);
    }

    const fromUserId = encryptedMessage.from;
    const fromPeer = toCollaborator.peers.get(fromUserId);
    if (!fromPeer) {
      throw new Error(`Peer ${fromUserId} not known to ${toUserId}`);
    }

    try {
      // Decrypt message
      const decrypted = toCollaborator.decryptMessage(
        encryptedMessage.encrypted,
        fromPeer.publicKey
      );

      // Verify signature
      const isValid = toCollaborator.verifySignedMessage(decrypted);

      if (!isValid) {
        throw new Error('Message signature verification failed');
      }

      // Log successful decryption
      this.encryptedMessageLog.push({
        from: fromUserId,
        to: toUserId,
        messageType: decrypted.data.type,
        timestamp: Date.now(),
        success: true,
        verified: true
      });

      return {
        success: true,
        from: fromUserId,
        messageType: decrypted.data.type,
        payload: decrypted.data.payload,
        sender: decrypted.sender
      };
    } catch (err) {
      // Log failed decryption
      this.encryptedMessageLog.push({
        from: fromUserId,
        to: toUserId,
        timestamp: Date.now(),
        success: false,
        error: err.message
      });

      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Handle peer going offline
   */
  removePeer(userId) {
    const collaborator = this.peerCollaborators.get(userId);
    if (!collaborator) return;

    // Remove from all other peers' mesh
    for (const [peerId, mesh] of this.peerMesh.entries()) {
      mesh.delete(userId);
    }

    // Remove this user's mesh
    this.peerMesh.delete(userId);

    // Update stability
    this.meshStability.delete(userId);

    // Can optionally keep collaborator for history/audit
    // or delete: this.peerCollaborators.delete(userId);
  }

  /**
   * Update peer presence in mesh
   */
  updatePeerPresence(userId, presenceData) {
    const collaborator = this.peerCollaborators.get(userId);
    if (!collaborator) return;

    collaborator.updatePeerPresence(userId, presenceData);
  }

  /**
   * Get mesh topology for user
   */
  getMeshTopology(userId) {
    const mesh = this.peerMesh.get(userId);
    const collaborator = this.peerCollaborators.get(userId);

    if (!mesh || !collaborator) {
      return null;
    }

    return {
      userId,
      meshSize: mesh.size,
      connectedPeers: Array.from(mesh),
      stability: this.meshStability.get(userId) || 0,
      peers: collaborator.getPeers().map(p => ({
        userId: p.userId,
        lastSeen: p.lastSeen,
        state: p.state
      }))
    };
  }

  /**
   * Broadcast encrypted message to multiple peers
   */
  broadcastEncrypted(fromUserId, toUserIds, messageData, messageType = 'P2P_BROADCAST') {
    const messages = [];
    const errors = [];

    for (const toUserId of toUserIds) {
      try {
        const message = this.createEncryptedMessage(
          fromUserId,
          toUserId,
          messageData,
          messageType
        );
        messages.push(message);
      } catch (err) {
        errors.push({
          toUserId,
          error: err.message
        });
      }
    }

    return {
      broadcastFrom: fromUserId,
      messagesSent: messages.length,
      messagesTotal: toUserIds.length,
      errors,
      messages
    };
  }

  /**
   * Calculate mesh stability score
   * Stability = (connected peers / total known peers) * 100
   */
  calculateStability(userId) {
    const collaborator = this.peerCollaborators.get(userId);
    if (!collaborator) return 0;

    const mesh = this.peerMesh.get(userId);
    const allPeers = collaborator.getPeers();

    if (allPeers.length === 0) return 100;

    const stability = (mesh.size / allPeers.length) * 100;
    this.meshStability.set(userId, Math.round(stability));

    return Math.round(stability);
  }

  /**
   * Get P2P statistics
   */
  getStatistics() {
    const stats = {
      totalPeers: this.peerCollaborators.size,
      totalMeshes: this.peerMesh.size,
      encryptedMessagesLogged: this.encryptedMessageLog.length,
      averageMeshSize: 0,
      averageStability: 0,
      meshes: {}
    };

    let totalSize = 0;
    let totalStability = 0;

    for (const [userId, mesh] of this.peerMesh.entries()) {
      totalSize += mesh.size;
      const stability = this.meshStability.get(userId) || 0;
      totalStability += stability;

      stats.meshes[userId] = {
        peerCount: mesh.size,
        stability
      };
    }

    if (this.peerMesh.size > 0) {
      stats.averageMeshSize = Math.round(totalSize / this.peerMesh.size);
      stats.averageStability = Math.round(totalStability / this.peerMesh.size);
    }

    return stats;
  }

  /**
   * Get encryption audit trail for user
   */
  getEncryptionAuditTrail(userId = null) {
    if (!userId) {
      return this.encryptedMessageLog;
    }

    return this.encryptedMessageLog.filter(
      log => log.from === userId || log.to === userId
    );
  }

  /**
   * Clear old message logs (maintenance)
   */
  pruneMessageLogs(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    const oldLength = this.encryptedMessageLog.length;

    this.encryptedMessageLog = this.encryptedMessageLog.filter(
      log => (now - log.timestamp) <= maxAge
    );

    return {
      removed: oldLength - this.encryptedMessageLog.length,
      remaining: this.encryptedMessageLog.length
    };
  }
}
