# MistMulti API Documentation

## Overview

This document details the API for `MistMulti.js`, which enables multi-user collaboration, peer-to-peer communication, and secure event handling in the Mist application.

### User Session Management

- **`addUserSession(sessionToken, userName, publicKey)`**: Registers a new user session with the provided token, username, and public key.
- **`removeUserSession(sessionToken)`**: Removes a user session based on the session token.
- **`updateUserPresence(sessionToken, state)`**: Updates the presence and state of a user in the active sessions.

### Host Announcement and Discovery

- **`announceHostSession(publicKey, dht)`**: Announces the host's session to the distributed hash table (DHT) for peer discovery.
- **`discoverHostSession(publicKey, dht)`**: Searches the DHT to discover a host's session using their public key.

### Authentication and Security

- **`generateSessionToken()`**: Generates a secure, random session token for user authentication.
- **`signMessage(message, privateKey)`**: Signs a message using the user's private key for secure communication.
- **`verifyMessage(message, signature, publicKey)`**: Verifies the authenticity of a signed message using the sender's public key.

### Event Handling

- **`onEvent(type, handler)`**: Registers an event handler for a specific event type (e.g., 'selection', 'navigation').
- **`emitEvent(type, data, senderSessionToken)`**: Emits an event to all registered handlers and broadcasts it to connected peers.

### State Synchronization

- **`mergeState(localState, remoteState)`**: Merges the local session state with the remote state received from a peer, resolving any conflicts.
- **`syncStateWithPeer(peerSessionToken, state)`**: Synchronizes the local state with a specific peer by sending the current state.

### Utility Functions

- **`encryptMessage(message, recipientPublicKeyHex)`**: Encrypts a message using the recipient's public key for secure transmission.
- **`decryptMessage(encryptedMessage, privateKey)`**: Decrypts a received message using the user's private key.
- **`canSendMessage(sessionToken, messageSize)`**: Checks if a user can send a message based on rate limiting rules to prevent abuse.
- **`createProvenance(actionType, user, sessionToken, context)`**: Creates provenance metadata for user actions, ensuring traceability.
- **`grimReaper(db, tensorId, onAnomaly)`**: Monitors database tensor inputs for anomalies, triggering callbacks on detection.

### Forward Error Correction (FEC) for Message Reliability

- **`encodeMessageFEC(message, dataShards, parityShards)`**: Encodes a message with Reed-Solomon FEC to ensure reliability over unreliable networks.
- **`decodeMessageFEC(shards, dataShards, parityShards)`**: Decodes and recovers the original message from received FEC shards.
- **`sendReliableMessageToPeers(message, dataShards, parityShards)`**: Sends a message with FEC shards to all connected peers.
- **`onFECShardMessage(msg, messageId)`**: Handles incoming FEC shards and attempts to reconstruct the original message.