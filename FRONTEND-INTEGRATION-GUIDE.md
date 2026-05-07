# Frontend Integration Guide
## Phase 17.2.3: Using API Endpoints with UI Components

### Quick Start

All four UI components from Phase 17.2.2 are designed to work seamlessly with the Phase 17.2.3 API endpoints. This guide shows how to set up and integrate them.

---

## 1. Environment Configuration

### Create .env.local

```env
REACT_APP_COORDINATOR_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=30000
REACT_APP_POLLING_INTERVAL_METRICS=2000
REACT_APP_POLLING_INTERVAL_MILESTONES=5000
REACT_APP_POLLING_INTERVAL_PERFORMANCE=5000
```

### Update App.jsx

```jsx
import Dashboard from './components/Dashboard';

export default function App() {
  const coordinatorUrl = process.env.REACT_APP_COORDINATOR_URL || 'http://localhost:5000';
  
  return (
    <div className="app">
      <Dashboard coordinatorUrl={coordinatorUrl} />
    </div>
  );
}
```

---

## 2. Component Integration Details

### Dashboard Component

**API Calls Made:**
```javascript
// Every 2 seconds
GET /api/cluster/metrics

// Every 2 seconds
GET /api/cluster/session
```

**Data Flow:**
```
API Response → State Update → Re-render Quick Stats
```

**Environment Variables:**
```
REACT_APP_COORDINATOR_URL - Base URL for API
```

**Error Handling:**
```javascript
// If metrics endpoint fails:
const [systemMetrics, setSystemMetrics] = useState({
  status: 'unknown',
  online_nodes: 0,
  offline_nodes: 0,
  // ... other defaults
});

// Component displays defaults, error logged to console
```

**Usage Example:**
```jsx
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Dashboard coordinatorUrl="http://localhost:5000" />
  );
}
```

### ConvergenceAnalysis Component

**API Calls Made:**
```javascript
// Every 3-5 seconds
GET /api/cluster/milestones?session_id={sessionId}
```

**Data Processing:**
```
Raw Milestones → Aggregation by Atom → Analysis → Canvas Render
```

**Convergence Detection Logic:**
```javascript
// For each atom's milestone sequence:
// 1. Extract last 5 losses
// 2. Calculate: (oldest_loss - min_loss) / oldest_loss
// 3. If improvement < 1%, mark as converged
```

**Props Expected:**
```javascript
ConvergenceAnalysis.propTypes = {
  sessionId: PropTypes.string,           // Optional, filters by session
  coordinatorUrl: PropTypes.string.isRequired
}
```

**Usage Example:**
```jsx
import ConvergenceAnalysis from './components/ConvergenceAnalysis';

function MonitoringPage() {
  const sessionId = 'current-session-uuid';
  
  return (
    <ConvergenceAnalysis 
      sessionId={sessionId}
      coordinatorUrl="http://localhost:5000"
    />
  );
}
```

**Data Transformation:**
```javascript
// API Response → Milestones Array
{
  milestones: [
    { atom: "H", epoch: 10, accuracy: 0.85, loss: 0.45 },
    { atom: "H", epoch: 20, accuracy: 0.87, loss: 0.35 },
    // ... more milestones
  ]
}

// Grouped by Atom for Display
{
  H: [milestone1, milestone2, ...],
  He: [milestone1, milestone2, ...],
  // ...
}
```

### MilestoneTimeline Component

**API Calls Made:**
```javascript
// Every 3-5 seconds
GET /api/cluster/milestones?session_id={sessionId}
```

**Data Flow:**
```
Milestones → Sort by Timestamp → Create Timeline → Render
```

**Props Expected:**
```javascript
MilestoneTimeline.propTypes = {
  sessionId: PropTypes.string,
  coordinatorUrl: PropTypes.string.isRequired
}
```

**Usage Example:**
```jsx
import MilestoneTimeline from './components/MilestoneTimeline';

function TimelineView() {
  return (
    <MilestoneTimeline 
      coordinatorUrl="http://localhost:5000"
    />
  );
}
```

**Statistics Calculated:**
```javascript
// For each atom:
{
  milestoneCount: 100,
  latestAccuracy: 0.92,
  bestAccuracy: 0.96,
  averageAccuracy: 0.88,
  averageLoss: 0.15
}
```

### ClusterPerformanceComparison Component

**API Calls Made:**
```javascript
// Every 5 seconds
GET /api/cluster/performance
```

**Data Processing:**
```
Sessions × Atoms → Calculate Metrics → Heatmap Generation
```

**Props Expected:**
```javascript
ClusterPerformanceComparison.propTypes = {
  coordinatorUrl: PropTypes.string.isRequired
}
```

**Usage Example:**
```jsx
import ClusterPerformanceComparison from './components/ClusterPerformanceComparison';

function ComparisonView() {
  return (
    <ClusterPerformanceComparison 
      coordinatorUrl="http://localhost:5000"
    />
  );
}
```

**Heatmap Color Mapping:**
```javascript
// Linear interpolation from min to max accuracy
// Red (low) → Yellow → Green (high)

function getHeatmapColor(value, min, max) {
  const normalized = (value - min) / (max - min);
  
  if (normalized < 0.5) {
    const r = 255;
    const g = Math.floor(255 * (normalized * 2));
    return `rgb(${r}, ${g}, 0)`;
  } else {
    const r = Math.floor(255 * (2 - normalized * 2));
    const g = 255;
    return `rgb(${r}, ${g}, 0)`;
  }
}
```

---

## 3. Complete Integration Example

### Full Application Setup

```jsx
// App.jsx
import React from 'react';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const coordinatorUrl = process.env.REACT_APP_COORDINATOR_URL || 'http://localhost:5000';
  
  return (
    <div className="app">
      <Dashboard coordinatorUrl={coordinatorUrl} />
    </div>
  );
}
```

### Environment Setup

```bash
# .env.local
REACT_APP_COORDINATOR_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=30000
```

### Package Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Build and Run

```bash
# Install dependencies
npm install

# Start development server
npm start
# App will be available at http://localhost:3000

# Build for production
npm run build
```

---

## 4. API Integration Patterns

### Polling Pattern (Used by All Components)

```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch(`${coordinatorUrl}/api/cluster/metrics`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setSystemMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      // Continue with stale data or show error state
    }
  };

  // Initial fetch
  fetchData();

  // Set up polling interval
  const interval = setInterval(fetchData, 2000);

  // Cleanup on unmount
  return () => clearInterval(interval);
}, [coordinatorUrl]);
```

### Error Handling Pattern

```javascript
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        setError('Resource not found');
      } else if (response.status === 503) {
        setError('Cluster not ready');
      } else {
        setError(`HTTP Error: ${response.status}`);
      }
      return;
    }
    
    const data = await response.json();
    setData(data);
    setError(null);
  } catch (err) {
    setError(err.message);
  }
};
```

### Data Aggregation Pattern

```javascript
const aggregateMetrics = (milestones) => {
  const byAtom = {};
  
  for (const milestone of milestones) {
    if (!byAtom[milestone.atom]) {
      byAtom[milestone.atom] = [];
    }
    byAtom[milestone.atom].push(milestone);
  }
  
  const stats = {};
  for (const atom in byAtom) {
    const atomMilestones = byAtom[atom];
    stats[atom] = {
      count: atomMilestones.length,
      avgAccuracy: atomMilestones.reduce((sum, m) => sum + m.accuracy, 0) / atomMilestones.length,
      avgLoss: atomMilestones.reduce((sum, m) => sum + m.loss, 0) / atomMilestones.length,
      lastAccuracy: atomMilestones[atomMilestones.length - 1].accuracy,
    };
  }
  
  return stats;
};
```

---

## 5. Performance Optimization

### Memoization

```javascript
import React, { useMemo } from 'react';

function ConvergenceAnalysis({ milestones }) {
  const aggregatedData = useMemo(() => {
    // Expensive computation
    return processMillestones(milestones);
  }, [milestones]);
  
  return <div>{/* render aggregatedData */}</div>;
}
```

### Lazy Loading

```javascript
import React, { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard coordinatorUrl="http://localhost:5000" />
    </Suspense>
  );
}
```

### Debounced Polling

```javascript
const useDebouncedEffect = (effect, delay, dependencies) => {
  useEffect(() => {
    const timer = setTimeout(effect, delay);
    return () => clearTimeout(timer);
  }, dependencies);
};

// Usage
useDebouncedEffect(() => {
  fetchMetrics();
}, 2000, [coordinatorUrl]);
```

---

## 6. Testing

### Unit Test Example

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './components/Dashboard';

describe('Dashboard Component', () => {
  it('displays metrics when API returns data', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'operational',
          online_nodes: 5,
          avg_accuracy: 0.85,
        }),
      })
    );

    render(<Dashboard coordinatorUrl="http://localhost:5000" />);

    // Wait for component to fetch and render
    await waitFor(() => {
      expect(screen.getByText(/operational/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Test Example

```javascript
describe('Dashboard with Real API', () => {
  beforeAll(() => {
    // Start test server
    server.listen();
  });

  it('fetches metrics and displays them', async () => {
    render(<Dashboard coordinatorUrl="http://localhost:5000" />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // online_nodes
    });
  });
});
```

---

## 7. Deployment

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Serve
ENV REACT_APP_COORDINATOR_URL=http://coordinator:5000
EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  coordinator:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      COORDINATOR_PORT: 5000

  worker-h:
    build: ./server
    environment:
      NODE_ID: node-1
      ATOM: H
      COORDINATOR_URL: ws://coordinator:5000
    depends_on:
      - coordinator

  # ... other workers ...

  client:
    build: ./client
    ports:
      - "3000:3000"
    environment:
      REACT_APP_COORDINATOR_URL: http://coordinator:5000
    depends_on:
      - coordinator
```

---

## 8. Troubleshooting

### Problem: "Coordinator URL not found"

**Solution:**
```javascript
// Check environment variable
console.log(process.env.REACT_APP_COORDINATOR_URL);

// Use fallback
const url = process.env.REACT_APP_COORDINATOR_URL || 'http://localhost:5000';
```

### Problem: "CORS error"

**Solution in Coordinator:**
```javascript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Problem: "Empty data in components"

**Solution:**
```javascript
// Check if session exists
if (!sessionId) {
  console.warn('No session ID provided');
  return;
}

// Check API response
if (!data || !data.milestones) {
  console.error('Invalid response format:', data);
  return;
}
```

### Problem: "Performance is slow"

**Solution:**
```javascript
// 1. Increase polling intervals
const POLLING_INTERVAL = 10000; // 10 seconds instead of 2

// 2. Limit milestone count
const maxMilestones = 1000;
const limitedMilestones = milestones.slice(-maxMilestones);

// 3. Use memoization
const memoizedData = useMemo(() => processData(), [data]);
```

---

## 9. Monitoring & Debugging

### Browser DevTools

```javascript
// Add to console for debugging
window.DEBUG_COORDINATOR_URL = 'http://localhost:5000';

// Check network tab for API calls
// Look for:
// - /api/cluster/metrics (2s interval)
// - /api/cluster/milestones (5s interval)
// - /api/cluster/performance (5s interval)
// - /api/cluster/session (5s interval)
```

### Network Monitoring

```javascript
// Add fetch interceptor for debugging
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const startTime = performance.now();
  const response = await originalFetch(...args);
  const endTime = performance.now();
  
  console.log(`API: ${args[0]} - ${endTime - startTime}ms`);
  return response;
};
```

---

## 10. API Response Validation

### Schema Validation

```javascript
import * as yup from 'yup';

const metricsSchema = yup.object({
  status: yup.string().oneOf(['operational', 'training', 'degraded', 'idle']),
  online_nodes: yup.number().min(0),
  offline_nodes: yup.number().min(0),
  avg_accuracy: yup.number().min(0).max(1),
  avg_loss: yup.number().min(0),
  timestamp: yup.string().typeError('must be ISO string'),
});

// Validate response
try {
  await metricsSchema.validate(data);
} catch (err) {
  console.error('Invalid response format:', err.message);
}
```

---

## 11. Production Checklist

- [ ] Environment variables configured
- [ ] Error handling implemented
- [ ] CORS properly configured
- [ ] API timeouts set
- [ ] Polling intervals optimized
- [ ] Performance tested
- [ ] Error boundaries added
- [ ] Monitoring configured
- [ ] Logging implemented
- [ ] Documentation updated

---

## 12. Reference Links

- **API Reference**: [API-ENDPOINTS-REFERENCE.md](../API-ENDPOINTS-REFERENCE.md)
- **Example Responses**: [API-EXAMPLE-RESPONSES.md](../API-EXAMPLE-RESPONSES.md)
- **UI Components**: [UI-COMPONENTS-IMPLEMENTATION-GUIDE.md](../UI-COMPONENTS-IMPLEMENTATION-GUIDE.md)
- **Coordinator Implementation**: [server/cluster-coordinator.js](../server/cluster-coordinator.js)

---

## Document Version
- **Version**: 1.0
- **Phase**: 17.2.3
- **Date**: April 19, 2024
- **Status**: Active
