# Mist Honeypot Service — Documentation

## Overview
The Mist Honeypot Service is a modular detection and response system for integrating Discord event data into MistTracker. It is designed to identify, log, and neutralize malicious actors (e.g., token replay, brute force, or DM spam attacks) by leveraging MistTracker’s provenance, event, and response infrastructure.

## Features
- Monitors Discord event streams for targeted actors and suspicious keywords
- Logs provenance and hashes interactions for audit and analysis
- Triggers automated response actions (auto-flip, cull, data vacuum) on detection
- Emits MistTracker events for further orchestration and alerting
- Fully modular and extensible for new threat vectors

## File Structure
```
mist-honeypot-service/
├── index.js         # Main detection/response logic
├── config.js        # Configuration (targets, tags, server IDs)
```

## Configuration (`config.js`)
- `TARGET_ACTOR`: Discord username/alias to monitor (e.g., RoyalThighAirforce)
- `TARGET_ALIAS`: Honeypot code for provenance tagging (e.g., VQJNS)
- `SERVER_ID`: Discord server or node ID
- `HONEYPOT_TAG`: Unique tag for provenance and event tracking

## Usage
1. Import and initialize the honeypot session in your MistTracker main process:
   ```js
   const honeypot = require('./mist-honeypot-service');
   honeypot.initializeHoneypotSession();
   honeypot.registerHooks();
   ```
2. Ensure Discord event data is piped into MistTracker as `discord-message` events.
3. On detection, the service will log, respond, and emit events for further action.

## Extending
- Add new detection patterns or actors in `config.js`.
- Extend `handleDiscordEvent` for more complex logic or additional response actions.
- Wire additional MistTracker events as needed for your operational workflow.

## Security Notes
- All actions are logged for audit and rollback.
- Test in a sandbox before production deployment.
- Update detection logic as attacker tactics evolve.

## Example Event Flow
1. Discord message event ingested by MistTracker.
2. Honeypot service detects target actor or keyword.
3. Provenance and hash logged; event captured.
4. Automated response (auto-flip, cull, data vacuum) executed.
5. Event emitted for further orchestration or alerting.

---
For questions or integration support, contact the MistTracker security team.
