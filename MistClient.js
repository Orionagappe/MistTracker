import x11 from 'node-x11';
import { MistIllum } from './MistIllum.js';
import * as MistCore from './MistCore.js';
import * as MistTracker from './MistTrackerVulkan.js';

const Exposure = x11.eventMask.Exposure;
const KeyPress = x11.eventMask.KeyPress;
const ButtonPress = x11.eventMask.ButtonPress;
const PointerMotion = x11.eventMask.PointerMotion;

// Initialize X11 client and create main window
x11.createClient((err, display) => {
  if (err) {
    console.error('Failed to create X11 client:', err);
    return;
  }

  const X = display.client;
  const root = display.screen[0].root;
  const wid = X.AllocID();

  // Create main window
  X.CreateWindow(
    wid, root, 0, 0, 800, 600, 0, 0, 0, 0,
    { eventMask: Exposure | KeyPress | ButtonPress | PointerMotion }
  );
  X.MapWindow(wid);

  // Initialize modules
  let mistIllum, mistCore, mistTracker;
  try {
    mistIllum = new MistIllum({ display, windowId: wid }); // Pass X11 display and window for rendering
    mistCore = new MistCore(); // Initialize data and session management
    mistTracker = new MistTracker(); // Initialize tracking
  } catch (initErr) {
    console.error('Module initialization failed:', initErr);
    X.DestroyWindow(wid);
    X.close();
    return;
  }

  // Event handling
  X.on('event', (ev) => {
    try {
      if (ev.type === 12) { // Exposure event
        mistIllum.render(); // Trigger rendering in MistIllum
      } else if (ev.type === 2) { // KeyPress
        mistCore.handleKeyPress?.(ev); // Handle key input in MistCore
      } else if (ev.type === 4) { // ButtonPress
        mistTracker.handleMouseClick?.(ev); // Handle mouse click in MistTracker
      } else if (ev.type === 6) { // PointerMotion
        mistTracker.handleMouseMove?.(ev); // Handle mouse movement in MistTracker
      }
    } catch (eventErr) {
      console.error('Event handling error:', eventErr);
    }
  });

  // Error handling
  X.on('error', (e) => {
    console.error('X11 error:', e);
  });

  // Cleanup on exit
  process.on('SIGINT', () => {
    try {
      X.DestroyWindow(wid);
      X.close();
      console.log('Application closed cleanly');
    } catch (closeErr) {
      console.error('Error during cleanup:', closeErr);
    }
    process.exit();
  });
});