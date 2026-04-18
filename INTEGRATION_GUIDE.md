# Integration Guide: Demo Configurations UI

## Overview

This guide explains how to integrate the demo configuration system into your AtomBuilder component for end-to-end regression testing via the client interface.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         DemoConfigSelector (UI)             │
│  - Lists 8 available configurations         │
│  - Shows atom/emitter counts               │
│  - Displays details on click               │
└───────────────────┬───────────────────────┘
                    │ onConfigLoaded(config)
                    ↓
┌─────────────────────────────────────────────┐
│        useDemoConfigs Hook (Data)           │
│  - loadConfig(name)                         │
│  - getConfigDetails(name)                   │
│  - exportForPhysicsEngine(name)             │
│  - getScenarioInfo(name)                    │
└───────────────────┬───────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────┐
│  DEMO_PHYSICS_CONFIGS.js (Definitions)     │
│  - 8 scenario definitions                   │
│  - Unified atom models                      │
│  - Wave emitter specs                       │
└─────────────────────────────────────────────┘
```

## Step 1: Import Components

In your `AtomBuilder.jsx`, add imports at the top:

```jsx
import DemoConfigSelector from './DemoConfigSelector';
import useDemoConfigs from '../hooks/useDemoConfigs';
```

## Step 2: Add Hook to Component

If your AtomBuilder uses functional component, the hook is already available:

```jsx
function AtomBuilder() {
  // Existing state...
  const [atoms, setAtoms] = useState([]);
  const [visualizationMode, setVisualizationMode] = useState('select');
  
  // ADD THIS:
  const demoConfigs = useDemoConfigs();
  
  // Rest of component...
}
```

## Step 3: Create Config Loader Callback

Add this function to handle when user selects a demo config:

```jsx
const handleDemoConfigLoaded = (config) => {
  try {
    // Convert demo config format to AtomBuilder format
    const atomsForBuilder = config.atoms.map((atom, index) => ({
      id: atom.id || `demo-atom-${index}`,
      orbital_name: atom.orbital_name,
      orbital: atom.orbital,
      position: atom.position,
      orbitalAmplitude: atom.orbitalAmplitude,
      orbitalFrequency: atom.orbitalFrequency,
      orbitalIntensity: atom.orbitalIntensity,
      nucleusAmplitude: atom.nucleusAmplitude,
      nucleusFrequency: atom.nucleusFrequency,
      nucleusIntensity: atom.nucleusIntensity,
      selected: false
    }));

    // Update atoms state
    setAtoms(atomsForBuilder);
    
    // Optionally switch to visualization mode
    setVisualizationMode('atom');
    
    // Log for debugging
    console.log('Demo config loaded:', {
      configName: config.name,
      atomCount: atomsForBuilder.length,
      emitterCount: config.waveEmitters.length
    });
    
  } catch (error) {
    console.error('Error loading demo config:', error);
  }
};
```

## Step 4: Integrate UI Component

Add the DemoConfigSelector to your UI layout. Example placement in sidebar/control panel:

```jsx
return (
  <div className="atom-builder-container">
    {/* Existing controls */}
    <div className="control-panel">
      
      {/* ADD THIS SECTION */}
      <div className="demo-section">
        <h3>🧪 Physics Test Scenarios</h3>
        <DemoConfigSelector 
          onConfigLoaded={handleDemoConfigLoaded}
          className="demo-selector"
        />
      </div>

      {/* Existing buttons and controls */}
      <button onClick={addAtom}>Add Atom</button>
      <button onClick={removeAtom}>Remove Atom</button>
      
    </div>

    {/* Visualization area */}
    <div className="visualization-area">
      {/* Your 3D visualization or canvas */}
    </div>
  </div>
);
```

## Step 5: Add CSS Integration (Optional)

Make sure your CSS doesn't conflict. You can scope the demo section:

```css
.demo-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #00d4ff;
  border-radius: 4px;
  background: rgba(0, 212, 255, 0.05);
}

.demo-section h3 {
  color: #00d4ff;
  margin: 0 0 10px 0;
  font-size: 14px;
}

.demo-selector {
  /* Styled by DemoConfigSelector.css */
}
```

## Usage Workflow

### For End Users

1. **Load Demo Configuration**
   - Click expansion button in "🧪 Physics Test Scenarios" panel
   - See list of 8 scenarios with descriptions
   - Click desired configuration name
   - Atoms appear in builder workspace

2. **Review Configuration Details**
   - Click "ℹ️" info button next to config name
   - Modal shows all atoms, emitters, and parameters
   - See recommended tests for validation
   - Review frequencies and positions

3. **Export for Physics Engine**
   - Click "📤 Export to Physics" button in details
   - Configuration copied to clipboard
   - Use clipboard content to configure backend simulation

4. **Run Regression Tests**
   - Open terminal: `node regression-test-runner.js --config=HYDROGEN_SIMPLE`
   - Test runner uses same configuration as UI
   - Compare results with visual simulation

### For Developers

#### Access Configuration Programmatically

```jsx
// Get list of available configs
const configNames = demoConfigs.availableConfigs.map(c => c.name);
console.log('Available:', configNames);

// Get specific config
const config = demoConfigs.getDemoConfig('HYDROGEN_SIMPLE');
console.log('Config:', config);

// Get details for display
const details = demoConfigs.getConfigDetails('HYDROGEN_SIMPLE');
console.log('Atoms:', details.atoms);
console.log('Emitters:', details.emitters);

// Export for physics engine (different format)
const physicsConfig = demoConfigs.exportForPhysicsEngine('HYDROGEN_SIMPLE');
// Send to backend WebSocket:
websocket.send(physicsConfig);

// Get test recommendations
const tests = demoConfigs.getRecommendedTests('HYDROGEN_SIMPLE');
console.log('Run these tests:', tests);
```

#### Add Configuration Persistence (Optional)

```jsx
// Save current config to localStorage
const saveCurrentConfig = () => {
  localStorage.setItem('lastDemoConfig', JSON.stringify(atoms));
  console.log('Config saved');
};

// Load on component mount
useEffect(() => {
  const saved = localStorage.getItem('lastDemoConfig');
  if (saved) {
    try {
      setAtoms(JSON.parse(saved));
    } catch (e) {
      console.warn('Could not load saved config');
    }
  }
}, []);
```

## Data Flow Example

### Scenario: User loads RESONANCE_CASCADE config

```
User clicks "RESONANCE_CASCADE" in DemoConfigSelector
         ↓
DemoConfigSelector.jsx:
  - Calls useDemoConfigs.loadConfig('RESONANCE_CASCADE')
         ↓
useDemoConfigs hook:
  - getDemoConfig('RESONANCE_CASCADE') from DEMO_PHYSICS_CONFIGS
  - Converts to AtomBuilder format
  - Sets selectedConfig state
  - Returns config object
         ↓
DemoConfigSelector calls onConfigLoaded(config)
         ↓
AtomBuilder.jsx handleDemoConfigLoaded():
  - Extracts atoms array from config
  - Maps to local state format
  - setAtoms([atom1, atom2, atom3])
  - Switches visualization mode if desired
         ↓
UI renders new atoms in 3D workspace
```

## Testing the Integration

### Step 1: Start Development Server
```bash
npm start
# or
npm run dev
```

### Step 2: Open AtomBuilder
Navigate to AtomBuilder component in your application

### Step 3: Locate Demo Panel
Scroll to find "🧪 Physics Test Scenarios" panel

### Step 4: Load Configuration
Click on "HYDROGEN_SIMPLE" configuration name

### Step 5: Verify Atoms Load
Check that:
- 1 hydrogen atom displays in workspace
- Atom shows position [0, 0, 0]
- Orbital and nuclear frequencies are visible
- No console errors

### Step 6: Review Details
Click ℹ️ button to see:
- Full atom properties
- Wave emitter specifications
- Simulation parameters
- Recommended tests

### Step 7: Export Test
Click "📤 Export to Physics" button
- Config should copy to clipboard
- Paste in terminal to verify format

## Advanced Integration

### Send Config Directly to Physics Engine

```jsx
const handleSendToPhysicsEngine = async (configName) => {
  try {
    // Get physics format config
    const config = demoConfigs.exportForPhysicsEngine(configName);
    
    // Connect to physics engine via WebSocket
    const ws = new WebSocket('ws://localhost:3000?token=dev-token');
    
    ws.onopen = () => {
      // Send atom registrations
      config.atoms.forEach(atom => {
        ws.send(JSON.stringify({
          type: 'registerAtom',
          data: atom
        }));
      });
      
      // Send wave emitters
      config.waveEmitters.forEach(emitter => {
        ws.send(JSON.stringify({
          type: 'createWaveEmitter',
          data: emitter
        }));
      });
      
      console.log('Configuration sent to physics engine');
    };
    
    ws.onerror = (err) => {
      console.error('Physics engine connection failed:', err);
    };
  } catch (error) {
    console.error('Failed to send config:', error);
  }
};
```

### Real-time Test Monitoring

```jsx
const [testResults, setTestResults] = useState(null);
const [isTestRunning, setIsTestRunning] = useState(false);

const runRegressionTests = async (configName) => {
  setIsTestRunning(true);
  try {
    const response = await fetch('/api/regression-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: configName })
    });
    
    const results = await response.json();
    setTestResults(results);
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    setIsTestRunning(false);
  }
};

return (
  <div>
    <button 
      onClick={() => runRegressionTests('HYDROGEN_SIMPLE')}
      disabled={isTestRunning}
    >
      {isTestRunning ? 'Testing...' : 'Run Tests'}
    </button>
    
    {testResults && (
      <div className="test-results">
        <p>✅ Pass: {testResults.passed}</p>
        <p>❌ Fail: {testResults.failed}</p>
        <p>⏱️  Time: {testResults.duration}ms</p>
      </div>
    )}
  </div>
);
```

## Troubleshooting

### Issue: "Cannot find module 'useDemoConfigs'"
**Solution:** Verify file path in import statement
```jsx
// Correct:
import useDemoConfigs from '../hooks/useDemoConfigs';

// Check that file exists at:
client/src/hooks/useDemoConfigs.js
```

### Issue: DemoConfigSelector not rendering
**Solution:** Verify component import and check browser console
```jsx
// Add error boundary
<ErrorBoundary fallback={<div>Config selector error</div>}>
  <DemoConfigSelector onConfigLoaded={handleDemoConfigLoaded} />
</ErrorBoundary>
```

### Issue: Atoms not appearing after loading config
**Solution:** Verify callback is updating state correctly
```jsx
const handleDemoConfigLoaded = (config) => {
  console.log('Callback fired with:', config);
  console.log('Atoms count:', config.atoms.length);
  setAtoms(config.atoms); // Make sure you're calling setAtoms
};
```

### Issue: Configuration frequencies don't match backend
**Solution:** Verify exportForPhysicsEngine conversion
```jsx
const physicsConfig = demoConfigs.exportForPhysicsEngine('HYDROGEN_SIMPLE');
console.log('Physics format:', JSON.stringify(physicsConfig, null, 2));
// Compare with what backend expects
```

## Next Steps

1. ✅ **Integration:** Add DemoConfigSelector to AtomBuilder.jsx
2. ✅ **Testing:** Load HYDROGEN_SIMPLE and verify atoms render
3. ✅ **Integration:** Verify config details modal displays correctly
4. ✅ **Validation:** Run regression tests with loaded config
5. ✅ **Enhancement:** Add localStorage persistence (later phase)
6. ✅ **Dashboard:** Create test results visualization (later phase)

## Related Files

- `client/src/config/DEMO_PHYSICS_CONFIGS.js` - Configuration definitions
- `client/src/hooks/useDemoConfigs.js` - State management hook
- `client/src/components/DemoConfigSelector.jsx` - UI component
- `client/src/styles/DemoConfigSelector.css` - Styling
- `regression-test-runner.js` - Test orchestration script
- `PHYSICS_REGRESSION_TESTING.md` - Testing documentation

## Questions?

Refer to the comprehensive test scenarios in DEMO_PHYSICS_CONFIGS.js or PHYSICS_REGRESSION_TESTING.md for detailed parameter explanations.
