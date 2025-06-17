// --- Multi-User, P2P, and Real-Time Collaboration Additions ---

// --- User Session Table and Presence ---
const ActiveUsers = new Map(); // sessionToken -> { userName, publicKey, lastSeen, state }

function addUserSession(sessionToken, userName, publicKey) {
  ActiveUsers.set(sessionToken, {
    userName,
    publicKey,
    lastSeen: Date.now(),
    state: {}
  });
}

function removeUserSession(sessionToken) {
  ActiveUsers.delete(sessionToken);
}

function updateUserPresence(sessionToken, state) {
  if (ActiveUsers.has(sessionToken)) {
    ActiveUsers.get(sessionToken).lastSeen = Date.now();
    ActiveUsers.get(sessionToken).state = state;
  }
}

// --- Host Announcement & Client Discovery (DHT/Torrent-inspired) ---
async function announceHostSession(publicKey, dht) {
  // dht: DHT client instance (e.g., from a libtorrent-compatible library)
  // Publish the host's public key and session info to the DHT
  await dht.put({ publicKey, type: 'MistSession', timestamp: Date.now() });
}

async function discoverHostSession(publicKey, dht) {
  // Search the DHT for the host's public key
  return await dht.get(publicKey);
}

// --- Authentication & Secure Communication ---
const crypto = require('crypto');

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function signMessage(message, privateKey) {
  // message: Buffer or string
  // privateKey: PEM or Buffer
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

function verifyMessage(message, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(message);
  verify.end();
  return verify.verify(publicKey, signature, 'hex');
}

// --- Real-Time Event Handling (P2P) ---
const EventHandlers = {
  selection: [],
  navigation: [],
  edit: [],
  presence: []
};

function onEvent(type, handler) {
  if (EventHandlers[type]) EventHandlers[type].push(handler);
}

function emitEvent(type, data, senderSessionToken) {
  // Rate limit outgoing events per user
  // (Implement a per-user rate limiter here)
  if (EventHandlers[type]) {
    EventHandlers[type].forEach(handler => handler(data, senderSessionToken));
  }
  // Broadcast to peers (P2P)
  broadcastToPeers({ type, data, senderSessionToken });
}

function broadcastToPeers(message) {
  // Use P2P transport (e.g., WebRTC, libtorrent, or custom UDP/TCP)
  // Serialize and send message to all connected peers
  // Optionally encrypt/sign the message
}

// --- State Sync & Conflict Resolution ---
function mergeState(localState, remoteState) {
  // Merge logic for session state, navigation, opened items, etc.
  // Resolve conflicts (e.g., last-write-wins, vector clocks, CRDTs)
  // Return merged state
}

function syncStateWithPeer(peerSessionToken, state) {
  // Send local state to peer, receive remote state, and merge
}

// --- End-to-End Encryption Utilities ---
function encryptMessage(message, recipientPublicKey) {
  // Use recipient's public key to encrypt the message
  // (e.g., RSA, ECIES, or hybrid with AES)
}

function decryptMessage(encryptedMessage, privateKey) {
  // Use own private key to decrypt the message
}

// --- Rate Limiting ---
const userRateLimits = new Map(); // sessionToken -> { lastSent: timestamp, bytesSent: count }

function canSendMessage(sessionToken, messageSize) {
  // Limit to 50kbps per user (as per MistMulti.md)
  const now = Date.now();
  const windowMs = 1000;
  const maxBytes = 50 * 1024 / 8; // 50kbps in bytes per second
  let rate = userRateLimits.get(sessionToken) || { lastSent: now, bytesSent: 0 };
  if (now - rate.lastSent > windowMs) {
    rate.lastSent = now;
    rate.bytesSent = 0;
  }
  if (rate.bytesSent + messageSize > maxBytes) return false;
  rate.bytesSent += messageSize;
  userRateLimits.set(sessionToken, rate);
  return true;
}

// --- Example: Handling a Selection Event ---
onEvent('selection', (data, senderSessionToken) => {
  // Validate, merge, and broadcast selection
  // Update in-memory state
  updateUserPresence(senderSessionToken, { selection: data });
  // Optionally, sync state with other peers
});

// --- Export new multi-user/P2P functions ---
module.exports = {
  // ...existing exports,
  addUserSession,
  removeUserSession,
  updateUserPresence,
  announceHostSession,
  discoverHostSession,
  generateSessionToken,
  signMessage,
  verifyMessage,
  onEvent,
  emitEvent,
  broadcastToPeers,
  mergeState,
  syncStateWithPeer,
  encryptMessage,
  decryptMessage,
  canSendMessage
};