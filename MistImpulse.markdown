# MistImpulse API Documentation

## Overview

This document details the API for `MistImpulse.js`, which integrates haptic multi-cursor input devices with the Mist application, enabling advanced interaction capabilities.

### Device and OS Integration

- **`initializeX11Input(config)`**: Initializes XInput2 for multi-pointer support on X11-based systems.
- **`mapXIEventType(xiType)`**: Maps XInput2 event types to standardized Mist event types for consistent handling.

### Input Handling

- **`handleMultiPointerInput(pointerEvents)`**: Processes input events from multiple pointers or touch inputs.
- **`requestHapticFeedback(pointerId, intensity, duration)`**: Requests haptic feedback for a specific pointer, providing tactile response to user actions.

### Mist Solution Integration

- **`handleMistPointerEvents(session, pointerEvents)`**: Integrates multi-pointer events with the Mist session, updating the application state accordingly.

### UI/UX Integration

- **`renderMultiCursorUI(pointerStates, uiRenderer)`**: Renders visual indicators for multiple cursors or touch points in the user interface.
- **`handleMultiGesture(pointerEvents, session)`**: Recognizes and processes multi-finger gestures for actions like zooming or rotating the view.

### Multi-User and AR/VR Support

- **`broadcastPointerEvents(pointerEvents, mistMulti)`**: Broadcasts pointer events to other users in a multi-user environment.
- **`handleARPointerInput(session, pointerEvents)`**: Handles pointer input in augmented reality (AR) mode, mapping 2D inputs to 3D world coordinates.
- **`transformToWorld(x, y, headPosition, headOrientation)`**: Transforms 2D screen coordinates to 3D world coordinates based on the user's head position and orientation in AR/VR setups.