// P2PCollaborator.js
// Handles P2P peer discovery, encryption, and message signing

import { createHash, createSign, createVerify, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import ellipticPkg from 'elliptic';

const { ec: EC } = ellipticPkg;

export class P2PCollaborator {
  constructor(userId, sessionToken) {
    this.userId = userId;
    this.sessionToken = sessionToken;
    this.peers = new Map(); // userId -> { publicKey, state, lastSeen }
    this.publicKey = null;
    this.privateKey = null;
    this.ec = new EC('secp256k1');
    this.generateKeyPair();
  }

  // Generate elliptic curve key pair
  generateKeyPair() {
    try {
      const keyPair = this.ec.genKeyPair();
      this.publicKey = keyPair.getPublic('hex');
      this.privateKey = keyPair.getPrivate('hex');
      return { publicKey: this.publicKey, privateKey: this.privateKey };
    } catch (err) {
      console.error('Key pair generation failed:', err);
      throw err;
    }
  }

  // Add a discovered peer
  addPeer(userId, publicKey, metadata = {}) {
    this.peers.set(userId, {
      userId,
      publicKey,
      state: metadata,
      lastSeen: Date.now()
    });
  }

  // Remove a peer
  removePeer(userId) {
    this.peers.delete(userId);
  }

  // Get all known peers
  getPeers() {
    return Array.from(this.peers.values());
  }

  // Sign a message with private key
  signMessage(message) {
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      const keyPair = this.ec.keyFromPrivate(this.privateKey, 'hex');
      const signature = keyPair.sign(createHash('sha256').update(messageStr).digest('hex'));
      return signature.toDER('hex');
    } catch (err) {
      console.error('Message signing failed:', err);
      throw err;
    }
  }

  // Verify signature with public key
  verifySignature(message, signature, publicKey) {
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      const keyPair = this.ec.keyFromPublic(publicKey, 'hex');
      return keyPair.verify(createHash('sha256').update(messageStr).digest('hex'), signature);
    } catch (err) {
      console.error('Signature verification failed:', err);
      return false;
    }
  }

  // Encrypt message for peer using ECIES
  encryptForPeer(message, peerPublicKey) {
    try {
      const ephemeralKeyPair = this.ec.genKeyPair();
      const recipientKey = this.ec.keyFromPublic(peerPublicKey, 'hex');
      
      // Derive shared secret
      const shared = ephemeralKeyPair.derive(recipientKey.getPublic());
      const sharedSecret = createHash('sha256').update(shared.toString(16)).digest();
      
      // Encrypt with AES-256-CBC
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', sharedSecret, iv);
      
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      let encrypted = cipher.update(messageStr, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        ephemeralPub: ephemeralKeyPair.getPublic('hex'),
        iv: iv.toString('hex'),
        ciphertext: encrypted
      };
    } catch (err) {
      console.error('Message encryption failed:', err);
      throw err;
    }
  }

  // Decrypt message encrypted for us
  decryptMessage(encryptedMessage, senderPublicKey) {
    try {
      const { ephemeralPub, iv, ciphertext } = encryptedMessage;
      const ephemeralKey = this.ec.keyFromPublic(ephemeralPub, 'hex');
      const privateKey = this.ec.keyFromPrivate(this.privateKey, 'hex');
      
      // Derive shared secret
      const shared = privateKey.derive(ephemeralKey.getPublic());
      const sharedSecret = createHash('sha256').update(shared.toString(16)).digest();
      
      // Decrypt with AES-256-CBC
      const decipher = createDecipheriv('aes-256-cbc', sharedSecret, Buffer.from(iv, 'hex'));
      
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (err) {
      console.error('Message decryption failed:', err);
      throw err;
    }
  }

  // Create signed message
  createSignedMessage(messageData) {
    const message = {
      data: messageData,
      sender: {
        userId: this.userId,
        publicKey: this.publicKey,
        timestamp: Date.now()
      }
    };
    
    const signature = this.signMessage(message);
    
    return {
      ...message,
      signature
    };
  }

  // Verify signed message
  verifySignedMessage(signedMessage) {
    try {
      const { data, sender, signature } = signedMessage;
      const message = { data, sender };
      
      return this.verifySignature(message, signature, sender.publicKey);
    } catch (err) {
      console.error('Signed message verification failed:', err);
      return false;
    }
  }

  // Get peer by user ID
  getPeer(userId) {
    return this.peers.get(userId);
  }

  // Update peer presence
  updatePeerPresence(userId, presenceData) {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.state = { ...peer.state, ...presenceData };
      peer.lastSeen = Date.now();
    }
  }

  // Get active peers (seen in last 30 seconds)
  getActivePeers() {
    const now = Date.now();
    const timeout = 30000;
    
    return Array.from(this.peers.values())
      .filter(peer => now - peer.lastSeen < timeout);
  }

  // Clean up stale peers
  cleanup() {
    const now = Date.now();
    const timeout = 120000; // 2 minutes
    
    for (const [userId, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > timeout) {
        this.peers.delete(userId);
      }
    }
  }
}

export default P2PCollaborator;
