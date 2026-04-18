import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PhysicsVisualization from '../components/PhysicsVisualization';
import PhysicsControlPanel from '../components/PhysicsControlPanel';
import AtomBuilder from '../components/AtomBuilder';
import DemoTimelineManager from '../components/DemoTimelineManager';
import PreviewPanel from '../components/PreviewPanel';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';
import { usePhysics } from '../hooks/usePhysics';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAtomBuilder } from '../hooks/useAtomBuilder';
import { useBuilderStorage } from '../hooks/useBuilderStorage';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import '../styles/PhysicsPage.css';

/**
 * PhysicsPage Component
 * Full-page physics simulation with visualization and controls
 * Phase 7.3: Includes builder mode with atom configuration UI
 * Phase 7.4: Persistent storage integration
 */
function PhysicsPage({ timeline, onBack }) {
  const saveDebounceRef = useRef(null);
  const storageRef = useRef(null); // Initialize as null, updated in useEffect
  const configLoadedRef = useRef(false); // Prevent load effect from re-firing after initial load

  const [activeTab, setActiveTab] = useState('simulate'); // 'build' | 'simulate'
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlacingEmitter, setIsPlacingEmitter] = useState(false);
  const [builderAtoms, setBuilderAtoms] = useState([]);
  const [builderEmitters, setBuilderEmitters] = useState([]);
  const [emitterSettings, setEmitterSettings] = useState({
    type: 'light',
    frequency: 5000,
    amplitude: 2.0,
    intensity: 1.0
  });

  // Get authentication token from localStorage for WebSocket connection
  const [token, setToken] = useState(null);
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setToken(authToken);
    }
  }, []);

  const wsConnection = useWebSocket(token);
  
  // Physics object for control panel (PhysicsVisualization creates its own with scene)
  const physics = usePhysics(null, null, wsConnection, { enableVisualization: false });

  // Live predictions from atom builder configuration
  const { predictions, warnings } = useAtomBuilder(builderAtoms, builderEmitters);

  // Use timeline-keyed builder storage so config persists across page refreshes
  const storage = useBuilderStorage(timeline?.id);

  // Keep storage ref in sync
  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  /**
   * Load stored configuration once when storage finishes loading.
   * Using configLoadedRef prevents this from re-firing after the user places atoms
   * (which would overwrite their work when background server sync updates storage.config).
   */
  useEffect(() => {
    if (!storage.loading && storage.config && !configLoadedRef.current) {
      configLoadedRef.current = true;
      console.log('Loading config from storage:', storage.config);
      setBuilderAtoms(storage.config.atoms || []);
      setBuilderEmitters(storage.config.emitters || []);
    }
  }, [storage.loading, storage.config]);

  /**
   * Auto-save builder config to storage on changes
   * Phase 14: Only auto-save after initial load completes and when there's actual content
   */
  useEffect(() => {
    // Don't auto-save while storage is still initializing
    if (storage.loading) {
      console.log('⏳ Waiting for storage to initialize before enabling auto-save');
      return;
    }

    // Only auto-save if in build tab AND there's actual content
    if (activeTab === 'build' && (builderAtoms.length > 0 || builderEmitters.length > 0)) {
      const config = {
        atoms: builderAtoms,
        emitters: builderEmitters,
        simulationParams: { timestamp: new Date().toISOString() },
      };
      
      // Debounced save (save after 1 second of inactivity)
      const timer = setTimeout(() => {
        console.log('💾 Auto-saving config to storage');
        storageRef.current.saveConfig(config)
          .catch((err) => {
            console.error('Auto-save failed:', err);
          });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [builderAtoms, builderEmitters, activeTab, storage.loading]);

  /**
   * CRITICAL: Memoize save configuration callback to prevent infinite loop
   * Phase 14: AtomBuilder has useEffect that depends on this callback
   * Without memoization, callback recreates every render → effect triggers → new render
   * Uses debouncing to prevent rapid successive saves
   */
  const handleSaveConfiguration = useCallback((config) => {
    // Update local state immediately
    setBuilderAtoms(config.atoms || []);
    setBuilderEmitters(config.emitters || []);
    
    // Debounce storage save to prevent rapid successive calls
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = setTimeout(async () => {
      try {
        await storageRef.current.saveConfig(config);
        console.log('✓ Configuration saved successfully');
        if (window.showToastSuccess) {
          window.showToastSuccess('Configuration saved', 2000);
        }
      } catch (err) {
        console.error('Failed to save configuration:', err);
        if (window.showToastError) {
          window.showToastError('Failed to save configuration: ' + err.message);
        }
      }
    }, 500); // Wait 500ms after last save attempt
  }, []); // Empty dependency array - callback is stable

  // Memoize initialConfig so AtomBuilder doesn't get a new object reference every render
  const initialConfig = useMemo(() => ({
    atoms: builderAtoms,
    emitters: builderEmitters,
  }), [builderAtoms, builderEmitters]);

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, []);

  /**
   * Define keyboard shortcut handlers for current tab
   */
  const keyboardHandlers = useCallback(() => {
    const handlers = {};

    // Global tab switching
    handlers['tab_builder'] = () => setActiveTab('build');
    handlers['tab_simulator'] = () => setActiveTab('simulate');

    // Builder-specific hotkeys
    if (activeTab === 'build') {
      handlers['mode_select'] = () => console.log('Select mode');
      handlers['mode_atom'] = () => console.log('Atom placement mode');
      handlers['mode_emitter'] = () => console.log('Emitter placement mode');
      handlers['mode_observer'] = () => console.log('Observer mode');
      handlers['mode_measure'] = () => console.log('Measurement mode');
      handlers['save'] = () => {
        const config = {
          atoms: builderAtoms,
          emitters: builderEmitters,
          simulationParams: { timestamp: new Date().toISOString() }
        };
        storage.saveConfig(config);
        console.log('✓ Configuration saved (Ctrl+S)');
      };
      handlers['zoom_reset'] = () => console.log('Zoom reset');
    }

    // Simulator-specific hotkeys
    if (activeTab === 'simulate') {
      handlers['play_pause'] = () => console.log('Play/Pause simulation');
      handlers['reset'] = () => console.log('Reset simulation');
      handlers['toggle_measure'] = () => console.log('Toggle measurement tool');
      handlers['reset_view'] = () => console.log('Reset camera view');
    }

    return handlers;
  }, [activeTab, builderAtoms, builderEmitters, storage]);

  /**
   * Setup keyboard shortcuts
   */
  useKeyboardShortcuts(activeTab === 'build' ? 'builder' : 'simulator', keyboardHandlers());

  /**
   * Handle fullscreen toggle
   */
  const handleToggleFullscreen = () => {
    const elem = document.documentElement;
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`physics-page ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="physics-page-header">
        <div className="header-left">
          <button onClick={onBack} className="btn-back">
            ← Back to Timeline
          </button>
          <span className="timeline-name">{timeline?.value}</span>
        </div>

        <div className="header-center">
          <div className="tab-selector">
            <button
              className={`tab-btn ${activeTab === 'build' ? 'active' : ''}`}
              onClick={() => setActiveTab('build')}
            >
              🔨 Build
            </button>
            <button
              className={`tab-btn ${activeTab === 'simulate' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulate')}
            >
              ▶️ Simulate
            </button>
          </div>
        </div>

        <div className="header-right">
          <button
            onClick={() => setShowControlPanel(!showControlPanel)}
            className="btn-header"
            title="Toggle control panel"
          >
            {showControlPanel ? '🔍 Hide Controls' : '⚙️ Show Controls'}
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="btn-header"
            title="Toggle fullscreen"
          >
            {isFullscreen ? '↙ Exit Fullscreen' : '↗ Fullscreen'}
          </button>
        </div>
      </div>

      <div className="physics-page-content">
        {activeTab === 'build' ? (
          // Build mode
          <div className="builder-layout">
            <div className="builder-left">
              <ComponentErrorBoundary 
                name="Demo Timeline Manager"
                fallback="Failed to load demo timelines. Using empty builder."
              >
                <DemoTimelineManager
                  onLoadDemo={(config) => {
                    setBuilderAtoms(config.atoms || []);
                    setBuilderEmitters(config.emitters || []);
                  }}
                />
              </ComponentErrorBoundary>
            </div>
            <div className="builder-center">
              <ComponentErrorBoundary 
                name="Atom Builder"
                fallback="Canvas rendering failed. Try refreshing the page."
              >
                <AtomBuilder
                  onSaveConfiguration={handleSaveConfiguration}
                  initialConfig={initialConfig}
                />
              </ComponentErrorBoundary>
            </div>
            <div className="builder-right">
              <ComponentErrorBoundary 
                name="Preview Panel"
                fallback="Prediction calculations temporarily unavailable."
              >
                <PreviewPanel
                  predictions={predictions}
                  warnings={warnings}
                  atoms={builderAtoms}
                  emitters={builderEmitters}
                />
              </ComponentErrorBoundary>
            </div>
          </div>
        ) : (
          // Simulate mode
          <div className="simulation-layout">
            <div className="visualization-area">
              <ComponentErrorBoundary 
                name="Physics Visualization"
                fallback="3D visualization failed. Restart simulator."
              >
                <PhysicsVisualization 
                  timeline={timeline}
                  isPlacingEmitter={isPlacingEmitter}
                  emitterSettings={emitterSettings}
                  builderAtoms={builderAtoms}
                  builderEmitters={builderEmitters}
                />
              </ComponentErrorBoundary>
            </div>

            {showControlPanel && (
              <div className="control-area">
                <ComponentErrorBoundary 
                  name="Physics Control Panel"
                  fallback="Controls unavailable. Simulator still running."
                >
                  <PhysicsControlPanel
                    physics={physics}
                    onClose={() => setShowControlPanel(false)}
                    isPlacingEmitter={isPlacingEmitter}
                    setIsPlacingEmitter={setIsPlacingEmitter}
                    emitterSettings={emitterSettings}
                    setEmitterSettings={setEmitterSettings}
                  />
                </ComponentErrorBoundary>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="physics-page-info">
        <p className="info-text">
          {activeTab === 'build' ? (
            <>
              💡 <strong>Build Mode:</strong> Create custom atomic models. Use the demos as reference,
              drag to place atoms, configure emitters, and see live predictions.
            </>
          ) : (
            <>
              💡 <strong>Simulate Mode:</strong> Run physics simulations. Use the controls panel to create
              wave emitters, configure physics, and adjust dimensional coupling.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default PhysicsPage;
