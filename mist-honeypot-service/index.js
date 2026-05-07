// mist-honeypot-service/index.js
// MistTracker Honeypot Detection & Response Module
// Integrates Discord event data into MistTracker for threat detection, provenance logging, and automated response.

const config = require('./config');
const {
  startSession,
  createProvenance,
  hashInteraction,
  checkAndSyncEvent,
  cullObject,
  flushUserData,
  eventHorizonUser,
  onEvent,
  emitEvent
} = require('../MistTrackerVulkan'); // Adjust path as needed

// Initialize Mist honeypot session
function initializeHoneypotSession() {
  startSession({
    user: 'mist-honeypot-service',
    mode: 'discord-dm-monitor',
    serverId: config.SERVER_ID,
    provenanceTag: config.HONEYPOT_TAG
  });
  createProvenance({ actor: config.TARGET_ACTOR, vector: 'DM-spread', level: 'full' });
}

// Main detection and response handler
function handleDiscordEvent(event) {
  const sender = event.author || event.actor;
  if (!sender) return;

  if (
    sender.includes(config.TARGET_ACTOR) ||
    (event.content && event.content.match(/invite|session|join|test|mist|tracker/i))
  ) {
    console.log(`[HONEYPOT CAPTURE] ${config.TARGET_ACTOR} / ${config.TARGET_ALIAS} activity detected`);
    const eventData = {
      actor: sender,
      serverId: event.serverId || 'DM',
      content: event.content,
      timestamp: event.timestamp || Date.now()
    };
    hashInteraction(eventData);
    createProvenance(eventData);
    checkAndSyncEvent({
      eventType: 'vqjn-dm-capture',
      actorId: sender,
      serverId: config.SERVER_ID,
      context: 'live-dm-spread',
      captureMode: 'flip'
    });
    // AUTO-FLIP
    cullObject(sender);
    flushUserData(sender);
    eventHorizonUser(sender); // full ban + data vacuum
    // Optionally emit event for further action
    emitEvent('honeypot-capture', eventData);
  }
}

// Register MistTracker event hooks
function registerHooks() {
  onEvent('discord-message', handleDiscordEvent);
  onEvent('peer-join', (data) => {
    emitEvent('honeypot-peer-join', data);
  });
  onEvent('threat-detected', (data) => {
    emitEvent('honeypot-threat-detected', data);
  });
}

module.exports = {
  initializeHoneypotSession,
  handleDiscordEvent,
  registerHooks
};
