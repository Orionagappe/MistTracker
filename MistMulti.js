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
 // Sign a message using the user's private key.
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

// When syncing state:
emitEvent('physicsUpdate', {
  mode: physicsEngine.mode,
  metric: physicsEngine.mode === '3D' ? physicsEngine.metric3D : physicsEngine.metric4D,
  G: physicsEngine.G,
  M: physicsEngine.M
}, senderSessionToken);

// On receiving a physicsUpdate event:
function onPhysicsUpdate(data) {
  physicsEngine.setMode(data.mode);
  if (data.mode === '3D') {
    physicsEngine.metric3D = data.metric;
  } else {
    physicsEngine.metric4D = data.metric;
  }
  physicsEngine.G = data.G;
  physicsEngine.M = data.M;
}
onEvent('physicsUpdate', onPhysicsUpdate);

/*
broadcastToPeers: Use P2P transport libtorrent-inspired method.
Revision: Use a message queue and iterate over all connected peers, sending the message to each.
Assume a global Peers map: peerId -> { send: function(msg) }
*/
const Peers = new Map(); // peerId -> { send: function(msg) }

function broadcastToPeers(message) {
  // Serialize message as JSON
  const serialized = JSON.stringify(message);
  // Iterate over all connected peers and send the message
  for (const [peerId, peer] of Peers.entries()) {
    try {
      peer.send(serialized);
    } catch (err) {
      // Optionally handle peer disconnects or errors
      Peers.delete(peerId);
    }
  }
}

// --- State Sync & Conflict Resolution ---
function mergeState(localState, remoteState) {
  // Merge logic for session state, navigation, opened items, etc.
  // Resolve conflicts (e.g., last-write-wins, vector clocks, CRDTs)
  // Return merged state
}

/*
syncStateWithPeer: Send local state to peer, receive remote state, and merge.
Revision: Use the Peers map to send a SYNC message to a specific peer, and handle incoming SYNC responses.
*/
function syncStateWithPeer(peerSessionToken, state) {
  const peer = Peers.get(peerSessionToken);
  if (!peer) return;
  // Send SYNC message
  const syncMsg = JSON.stringify({ type: 'SYNC', state });
  peer.send(syncMsg);
  // Incoming SYNC messages should be handled in the peer's message handler,
  // calling mergeState(localState, remoteState) as needed.
}

/*
encryptMessage: Use recipient's public key to encrypt the message.
Use elliptic curve cryptography (ECC), curve can be derived from map.png if desired.
*/
const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // Example curve; replace with curve derived from map.png if needed

function encryptMessage(message, recipientPublicKeyHex) {
  // Generate ephemeral key pair
  const ephemeral = ec.genKeyPair();
  const recipientKey = ec.keyFromPublic(recipientPublicKeyHex, 'hex');
  // Derive shared secret
  const shared = ephemeral.derive(recipientKey.getPublic());
  // Use shared secret as AES key
  const key = crypto.createHash('sha256').update(shared.toString(16)).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Return ephemeral public key, iv, and ciphertext
  return {
    ephemeralPub: ephemeral.getPublic('hex'),
    iv: iv.toString('hex'),
    ciphertext: encrypted
  };
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

// Example: In MistMulti.js event handler
function onEvent(type, handler) {
  if (EventHandlers[type]) {
    EventHandlers[type].push((data, senderSessionToken) => {
      // Only process if senderSessionToken matches the current user's session
      if (senderSessionToken !== currentSessionToken) return;
      handler(data, senderSessionToken);
    });
  }
}

function createProvenance(actionType, user, sessionToken, context = {}) {
  return {
    actionType,
    user,
    sessionToken,
    timestamp: new Date().toISOString(),
    context
  };
}

/**
 * grimReaper:
 * Tracks database tensor inputs for the specific tensor in power,
 * based on "How-to-play-notes-from-words-under-the-influence-of-starlight-Worksheet.csv".
 * This function monitors, logs, and can act on anomalous or critical tensor input patterns.
 * 
 * @param {object} db - Database connection or query interface.
 * @param {string} tensorId - The identifier for the tensor in power.
 * @param {function} onAnomaly - Callback for handling detected anomalies.
 * @returns {Promise<Array>} - Returns a promise resolving to the tracked tensor input records.
 */
async function grimReaper(db, tensorId, onAnomaly) {
  // Load tensor input records from the relevant worksheet/table
  // Assume a table "StarlightTensorInputs" with columns: id, tensorId, inputData, timestamp, provenance
  // The CSV "How-to-play-notes-from-words-under-the-influence-of-starlight-Worksheet.csv"
  // should be imported into this table or referenced as needed.

  const rows = await db.query(
    `SELECT * FROM StarlightTensorInputs WHERE tensorId = ? ORDER BY timestamp DESC`,
    [tensorId]
  );

  // Analyze each input for anomalies or critical patterns
  for (const row of rows) {
    // Example: Check for out-of-bounds values, missing provenance, or suspicious patterns
    let anomaly = false;
    let reason = '';

    // Check for missing or malformed provenance
    if (!row.provenance || typeof row.provenance !== 'string' || row.provenance.length < 5) {
      anomaly = true;
      reason = 'Missing or malformed provenance';
    }

    // Example: Check for extreme inputData values (customize as needed)
    try {
      const inputData = JSON.parse(row.inputData);
      if (Array.isArray(inputData)) {
        const maxAbs = Math.max(...inputData.map(x => Math.abs(Number(x) || 0)));
        if (maxAbs > 1e12) {
          anomaly = true;
          reason = 'Tensor input value exceeds safe threshold';
        }
      }
    } catch (e) {
      anomaly = true;
      reason = 'Malformed inputData';
    }

    // If anomaly detected, invoke callback and/or log
    if (anomaly && typeof onAnomaly === 'function') {
      onAnomaly({ row, reason });
    }
  }

  // Return all tracked records for further processing or review
  return rows;
}

// --- Export new multi-user/P2P functions ---
module.exports = {

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
  canSendMessage,
  createProvenance,
  grimReaper
};