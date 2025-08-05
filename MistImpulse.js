/**
 * MistImpulse.js
 * Haptic Multi-Cursor Input Device integration for the Mist Solution.
 * Enables multiple simultaneous pointer/touch inputs with digital haptic feedback.
 * Designed for collaborative or advanced single-user interaction in 3D/nD environments.
 * Revised for X11Libre-based Linux distributions using XInput2 and evdev.
 */

const X11 = require('node-x11'); // For X11/XInput2 integration
const Evdev = require('node-evdev'); // For evdev-based haptic feedback
const { EventEmitter } = require('events');
const inputEmitter = new EventEmitter();

// --- 1. Device & OS Integration ---

/**
 * Initialize XInput2 for multi-pointer support on X11Libre.
 * Sets up event listeners for pointer devices.
 * @param {Object} config - Configuration object with display settings
 * @returns {Promise<void>}
 */
async function initializeX11Input(config = {}) {
  return new Promise((resolve, reject) => {
    const client = X11.createClient((err, display) => {
      if (err) return reject(err);

      // Select XInput2 events for multi-pointer devices
      const xiOpcode = display.client.opcodes['XInputExtension'];
      if (!xiOpcode) throw new Error('XInput2 extension not available');

      // Enable XInput2 for all pointer devices
      client.XISelectEvents(display.screen[0].root, [
        {
          deviceid: X11.XIAllDevices,
          mask: [
            X11.XI.RawMotion,
            X11.XI.RawButtonPress,
            X11.XI.RawButtonRelease,
            X11.XI.RawTouchBegin,
            X11.XI.RawTouchUpdate,
            X11.XI.RawTouchEnd
          ]
        }
      ]);

      // Listen for XInput2 events
      client.on('event', event => {
        if (event.opcode === xiOpcode) {
          const pointerEvent = {
            pointerId: event.deviceid,
            type: mapXIEventType(event.name),
            x: event.x || 0,
            y: event.y || 0,
            pressure: event.valuators?.pressure || 0.5,
            hapticRequest: event.haptic ? { intensity: event.haptic.intensity, duration: event.haptic.duration } : null
          };
          inputEmitter.emit('pointerEvent', pointerEvent);
        }
      });

      resolve();
    });
  });
}

/**
 * Map XInput2 event types to Mist-compatible types.
 * @param {string} xiType - XInput2 event name
 * @returns {string} Mist event type
 */
function mapXIEventType(xiType) {
  const typeMap = {
    'RawMotion': 'pointermove',
    'RawButtonPress': 'pointerdown',
    'RawButtonRelease': 'pointerup',
    'RawTouchBegin': 'touchstart',
    'RawTouchUpdate': 'touchmove',
    'RawTouchEnd': 'touchend'
  };
  return typeMap[xiType] || 'unknown';
}

/**
 * Receives and dispatches multi-pointer events from X11Libre.
 * Each event includes: pointerId, type, x, y, pressure, [hapticRequest].
 * @param {Array<Object>} pointerEvents
 */
function handleMultiPointerInput(pointerEvents) {
  pointerEvents.forEach(event => {
    // Process each pointer independently
    if (event.hapticRequest) {
      requestHapticFeedback(event.pointerId, event.hapticRequest.intensity, event.hapticRequest.duration);
    }
    // Forward to MistCore/MistIllum
    if (typeof globalThis.handleMistPointerEvent === 'function') {
      globalThis.handleMistPointerEvent(event);
    }
  });
}

/**
 * Sends a haptic feedback command to the device via evdev.
 * Falls back to visual feedback if haptic hardware is unavailable.
 * @param {number} pointerId - Device ID
 * @param {number} intensity - 0.0 to 1.0
 * @param {number} duration - milliseconds
 */
async function requestHapticFeedback(pointerId, intensity, duration) {
  try {
    const device = Evdev.findDeviceById(pointerId); // Find evdev device by ID
    if (device && device.hasForceFeedback) {
      await device.uploadEffect({
        type: 'FF_RUMBLE',
        strong_magnitude: Math.round(intensity * 0xFFFF),
        duration_ms: duration
      });
      await device.playEffect();
    } else {
      // Fallback: Visual feedback (e.g., pulse cursor)
      if (typeof globalThis.renderVisualFeedback === 'function') {
        globalThis.renderVisualFeedback({ pointerId, intensity, duration });
      }
    }
  } catch (err) {
    console.error(`Haptic feedback failed for pointer ${pointerId}:`, err);
    // Fallback to visual feedback
    if (typeof globalThis.renderVisualFeedback === 'function') {
      globalThis.renderVisualFeedback({ pointerId, intensity, duration });
    }
  }
}

// --- 2. Mist Solution Integration ---

/**
 * Integrate with MistCore/MistIllum for pointer abstraction.
 * @param {Object} session - Mist session object
 * @param {Array<Object>} pointerEvents
 */
function handleMistPointerEvents(session, pointerEvents) {
  pointerEvents.forEach(event => {
    if (session && session.multiPointerMap) {
      session.multiPointerMap[event.pointerId] = event;
    }
    if (typeof globalThis.handleSelection === 'function') {
      globalThis.handleSelection(session, event);
    }
  });
}

// --- 3. UI/UX Integration ---

/**
 * Render multiple cursors or touch indicators in the Mist UI.
 * @param {Array<Object>} pointerStates
 * @param {Object} uiRenderer
 */
function renderMultiCursorUI(pointerStates, uiRenderer) {
  pointerStates.forEach(event => {
    uiRenderer.drawCursor({
      x: event.x,
      y: event.y,
      pointerId: event.pointerId,
      color: event.color || `hsl(${event.pointerId * 60},80%,60%)`
    });
  });
}

/**
 * Recognize and handle multi-finger gestures.
 * @param {Array<Object>} pointerEvents
 * @param {Object} session
 */
function handleMultiGesture(pointerEvents, session) {
  if (!pointerEvents || pointerEvents.length < 2) return;

  const [p1, p2] = pointerEvents;
  const prevDistance = session.prevGestureDistance || null;
  const currDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  if (prevDistance !== null) {
    const delta = currDistance - prevDistance;
    if (Math.abs(delta) > 2) {
      if (typeof globalThis.zoomCamera === 'function') {
        globalThis.zoomCamera(delta > 0 ? 1.05 : 0.95);
      }
    }
  }
  session.prevGestureDistance = currDistance;

  const prevAngle = session.prevGestureAngle || null;
  const currAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  if (prevAngle !== null) {
    const angleDelta = currAngle - prevAngle;
    if (Math.abs(angleDelta) > 0.05) {
      if (typeof globalThis.rotateCamera === 'function') {
        globalThis.rotateCamera(angleDelta);
      }
    }
  }
  session.prevGestureAngle = currAngle;

  if (pointerEvents.every(e => e.type === 'touchmove')) {
    const avgDx = (p1.dx + p2.dx) / 2;
    const avgDy = (p1.dy + p2.dy) / 2;
    if (Math.abs(avgDx) > 2 || Math.abs(avgDy) > 2) {
      if (typeof globalThis.panCamera === 'function') {
        globalThis.panCamera(avgDx, avgDy);
      }
    }
  }
}

// --- 4. Multi-User/Collaboration Support ---

/**
 * Broadcast pointer events to other users via MistMulti.
 * @param {Array<Object>} pointerEvents
 * @param {Object} mistMulti
 */
function broadcastPointerEvents(pointerEvents, mistMulti) {
  if (mistMulti && typeof mistMulti.emitEvent === 'function') {
    mistMulti.emitEvent('pointerEvents', pointerEvents);
  }
}

// --- 5. AR/VR Integration ---

/**
 * Handle AR pointer input, mapping to world coordinates.
 * @param {Object} session
 * @param {Array<Object>} pointerEvents
 */
function handleARPointerInput(session, pointerEvents) {
  pointerEvents.forEach(event => {
    if (session.headPosition && session.headOrientation) {
      const worldPos = transformToWorld(event.x, event.y, session.headPosition, session.headOrientation);
      handleMultiPointerInput([{ ...event, worldPos }]);
    } else {
      handleMultiPointerInput([event]);
    }
  });
}

/**
 * Map 2D coordinates to 3D world coordinates.
 * @param {number} x
 * @param {number} y
 * @param {Array<number>} headPosition
 * @param {Array|Object} headOrientation
 * @returns {Object} 3D world coordinate {x, y, z}
 */
function transformToWorld(x, y, headPosition, headOrientation) {
  if (!headPosition || !headOrientation) {
    console.warn("Head position or orientation not available for AR mapping");
    return null;
  }
  if (typeof globalThis.getMapModeProjection === 'function') {
    const ndcX = (x / globalThis.viewportWidth) * 2 - 1;
    const ndcY = 1 - (y / globalThis.viewportHeight) * 2;
    return globalThis.getMapModeProjection(ndcX, ndcY, headPosition, headOrientation);
  } else {
    // Fallback: simple linear mapping centered on viewport
    const dx = (x - globalThis.viewportWidth / 2) * 0.01;
    const dy = (y - globalThis.viewportHeight / 2) * 0.01;
    return {
      x: headPosition[0] + dx,
      y: headPosition[1] + dy,
      z: headPosition[2]
    };
  }
}

// Start XInput2 event listener
initializeX11Input().catch(err => console.error('Failed to initialize XInput2:', err));

// Forward XInput2 events to Mist
inputEmitter.on('pointerEvent', event => {
  handleMultiPointerInput([event]);
});

module.exports = {
  initializeX11Input,
  handleMultiPointerInput,
  requestHapticFeedback,
  handleMistPointerEvents,
  renderMultiCursorUI,
  handleMultiGesture,
  broadcastPointerEvents,
  handleARPointerInput,
  transformToWorld
};