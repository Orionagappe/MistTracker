User Session Table: Extend the database schema to track all active users and their states.
Real-Time Server: Build a WebSocket server to handle multi-user events.
Event Handlers: Add functions to process and broadcast user actions (selection, navigation, edits).
Shared State Sync: Functions to merge and synchronize state between users.
User Presence Tracking: Add data structures and UI hooks for user presence.
Host Announcement: The host (game creator) announces the session/game using a public key (as a unique identifier) on a distributed hash table (DHT), similar to how torrents are discovered.
Client Discovery: Clients search the DHT for the host’s public key, then connect directly to the host (and/or other peers).
Authentication: Clients send a unique hash session token and user name to the host for authentication.
Communication: All game state changes (selections, navigation, edits) are sent as signed/encrypted messages between peers, using the P2P network for transport.
State Sync: The host (or a consensus of peers) maintains the authoritative state and broadcasts updates to all connected clients.
Rate Limit: Limit the number of updates per second to less than 50 kbps.
End to end encryption: Suggest strategy within bounds of Rate Limit.

### Update Requirements
Shifting key encryption: peer to peer protocol for changing and updating session keys on from session host.
Pit Boss: Handles bans on swarm.
Rate Limit Warn: Used by client to determine violations of rate limiting and issue warnings to user.