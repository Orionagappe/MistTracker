/**
 * MistImpulse.js
 * Haptic Multi-Cursor Input Device integration for the Mist Solution.
 * Enables multiple simultaneous pointer/touch inputs with digital haptic feedback.
 * Designed for collaborative or advanced single-user interaction in 3D/nD environments.
 */

// --- 1. Device & OS Integration ---

/**
 * Receives and dispatches multi-pointer events from the OS/device layer.
 * Each event should include: pointerId, type, x, y, pressure, [hapticRequest].
 * Example event: { pointerId: 3, type: 'touchmove', x: 120, y: 340, pressure: 0.8, hapticRequest: { intensity: 0.5, duration: 100 } }
 * @param {Array<Object>} pointerEvents
 */
function handleMultiPointerInput(pointerEvents) {
  pointerEvents.forEach(event => {
    // Process each pointer independently
    // e.g., select, drag, manipulate, or trigger haptic feedback
    if (event.hapticRequest) {
      requestHapticFeedback(event.pointerId, event.hapticRequest.intensity, event.hapticRequest.duration);
    }
    // Forward event to MistCore/MistIllum for further processing
    if (typeof globalThis.handleMistPointerEvent === 'function') {
      globalThis.handleMistPointerEvent(event);
    }
  });
}

/**
 * Sends a haptic feedback command to the device driver or OS for a specific pointer.
 * @param {number} pointerId
 * @param {number} intensity - 0.0 to 1.0
 * @param {number} duration - milliseconds
 */
function requestHapticFeedback(pointerId, intensity, duration) {
  // Implementation depends on hardware/OS:
  // - Native addon (C++/Rust binding)
  // - WebUSB/WebHID
  // - Custom X11 extension or Windows Pointer API
  // Here, we emit an event for the device layer to handle.
  if (typeof globalThis.emitHapticFeedback === 'function') {
    globalThis.emitHapticFeedback({ pointerId, intensity, duration });
  }
}

// --- 2. Mist Solution Integration ---

/**
 * Integrate with MistCore/MistIllum for pointer abstraction.
 * Each pointer event is mapped to a user or tool for collaborative or advanced input.
 * @param {Object} session - Mist session object
 * @param {Array<Object>} pointerEvents
 */
function handleMistPointerEvents(session, pointerEvents) {
  pointerEvents.forEach(event => {
    // Map pointer to user/tool if needed
    // Update session state, trigger selection, manipulation, etc.
    if (session && session.multiPointerMap) {
      session.multiPointerMap[event.pointerId] = event;
    }
    // Example: trigger selection or manipulation in Mist environment
    if (typeof globalThis.handleSelection === 'function') {
      globalThis.handleSelection(session, event);
    }
  });
}

// --- 3. UI/UX Integration ---

/**
 * Render multiple cursors or touch indicators in the Mist UI.
 * Each pointer can have a unique color or label.
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
 * Recognize and handle multi-finger gestures for navigation/manipulation.
 * Supports pinch (zoom), rotate, and swipe gestures for nD/3D navigation and object manipulation.
 * Integrates with MistIllum.js and MistCore.js for camera and object control.
 * @param {Array<Object>} pointerEvents - Array of current pointer/touch events.
 * @param {Object} session - Mist session object.
 */
function handleMultiGesture(pointerEvents, session) {
  if (!pointerEvents || pointerEvents.length < 2) return;

  // Example: Pinch-to-zoom (distance between two pointers)
  const [p1, p2] = pointerEvents;
  const prevDistance = session.prevGestureDistance || null;
  const currDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  // Pinch gesture: zoom camera or scale object
  if (prevDistance !== null) {
    const delta = currDistance - prevDistance;
    if (Math.abs(delta) > 2) {
      // Call MistIllum/MistCore camera zoom or object scale
      if (typeof globalThis.zoomCamera === 'function') {
        globalThis.zoomCamera(delta > 0 ? 1.05 : 0.95);
      }
    }
  }
  session.prevGestureDistance = currDistance;

  // Example: Rotate gesture (angle between two pointers)
  const prevAngle = session.prevGestureAngle || null;
  const currAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  if (prevAngle !== null) {
    const angleDelta = currAngle - prevAngle;
    if (Math.abs(angleDelta) > 0.05) {
      // Call MistIllum/MistCore camera or object rotate
      if (typeof globalThis.rotateCamera === 'function') {
        globalThis.rotateCamera(angleDelta);
      }
    }
  }
  session.prevGestureAngle = currAngle;

  // Example: Swipe gesture (move both pointers in same direction)
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
 * Broadcast pointer events to other users via MistMulti for collaborative interaction.
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
 * Handle AR pointer input, mapping device coordinates to world/model coordinates.
 * @param {Object} session
 * @param {Array<Object>} pointerEvents
 */
function handleARPointerInput(session, pointerEvents) {
  pointerEvents.forEach(event => {
    // Transform pointer position to AR world coordinates using head pose
    if (session.headPosition && session.headOrientation) {
      const worldPos = transformToWorld(event.x, event.y, session.headPosition, session.headOrientation);
      handleMultiPointerInput([{ ...event, worldPos }]);
    } else {
      handleMultiPointerInput([event]);
    }
  });
}

/**
 * Map 2D screen/touch coordinates to 3D world coordinates using session's camera and projection.
 * Uses MistIllum.js projectItemsTo3D and getMapModeProjection if available.
 * @param {number} x - Screen/touch X coordinate.
 * @param {number} y - Screen/touch Y coordinate.
 * @param {Array<number>} headPosition - AR/VR headset position in world space.
 * @param {Array|Object} headOrientation - AR/VR headset orientation (quaternion or Euler).
 * @returns {Object} 3D world coordinate {x, y, z}
 */
function transformToWorld(x, y, headPosition, headOrientation) {
  // Example: Use MistIllum's projection logic if available
  if (typeof globalThis.getMapModeProjection === 'function') {
    // Map screen (x, y) to normalized device coordinates
    const ndcX = (x / globalThis.viewportWidth) * 2 - 1;
    const ndcY = 1 - (y / globalThis.viewportHeight) * 2;
    // Use projection to get world coordinates
    const world = globalThis.getMapModeProjection(ndcX, ndcY, headPosition, headOrientation);
    return world;
  }
  // Fallback: simple mapping with head position as origin
  return {
    x: headPosition[0] + x * 0.01,
    y: headPosition[1] + y * 0.01,
    z: headPosition[2]
  };
}

module.exports = {
  handleMultiPointerInput,
  requestHapticFeedback,
  handleMistPointerEvents,
  renderMultiCursorUI,
  handleMultiGesture,
  broadcastPointerEvents,
  handleARPointerInput,
  transformToWorld
};