# Phase 9.5: Advanced Analytics & Reporting
## Integration Guide & Implementation Reference

**Status:** Production Ready  
**Version:** 1.0.0  
**Last Updated:** April 2026  
**Dependencies:** React 19.2.5, Phase 9.4 (MeasurementEngine)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Component Reference](#component-reference)
5. [Hook Reference](#hook-reference)
6. [Engine Reference](#engine-reference)
7. [Integration Patterns](#integration-patterns)
8. [Usage Examples](#usage-examples)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Phase 9.5 provides a comprehensive analytics and reporting system built on top of Phase 9.4's measurement engine. It offers:

- **Timeline Tracking**: Event timeline visualization with filtering
- **Trend Analysis**: Linear regression, changepoint detection, projections
- **Statistical Reporting**: Comprehensive statistical metrics and distributions
- **Comparative Analysis**: Multi-dataset comparison with correlation analysis
- **Data Export**: JSON and CSV export formats
- **React Integration**: Ready-to-use components and hooks

### Key Features

| Feature | Description | Component |
|---------|-------------|-----------|
| Event Timeline | Visual and list-based event browsing | MeasurementTimeline |
| Trend Detection | Linear regression with strength metrics | TrendAnalysis |
| Statistical Analysis | 11+ metrics with distribution analysis | StatisticalReport |
| Multi-Dataset Comparison | Correlation and alignment metrics | ComparativeAnalysis |
| Data Export | JSON/CSV export with browser download | useAnalyticsExport |
| Container UI | Tab-based unified analytics interface | AnalyticsPanel |

---

## Architecture

### Component Hierarchy

```
AnalyticsPanel (Container)
├── MeasurementTimeline (Timeline Tab)
├── TrendAnalysis (Trends Tab)
├── StatisticalReport (Statistics Tab)
└── ComparativeAnalysis (Comparison Tab)
```

### Data Flow

```
MeasurementEngine
    ↓ (exports measurements)
AnalyticsEngine
    ↓ (processes & analyzes)
useAnalytics Hook
    ↓ (state management)
React Components
    ↓ (visualization)
User Interface
```

### File Structure

```
client/src/
├── utils/
│   └── AnalyticsEngine.js        (~1,000 lines)
├── hooks/
│   └── useAnalytics.js           (~600 lines, 5 hooks)
├── components/
│   ├── MeasurementTimeline.jsx   (~400 lines)
│   ├── TrendAnalysis.jsx         (~350 lines)
│   ├── StatisticalReport.jsx     (~450 lines)
│   ├── ComparativeAnalysis.jsx   (~400 lines)
│   └── AnalyticsPanel.jsx        (~400 lines)
└── styles/
    └── Analytics.css             (~700 lines)
```

---

## Quick Start

### 1. Import Required Modules

```javascript
// In your measurement container component
import AnalyticsPanel from './components/AnalyticsPanel';
import { useAnalytics } from './hooks/useAnalytics';
import AnalyticsEngine from './utils/AnalyticsEngine';
```

### 2. Initialize Analytics Engine

```javascript
// Create engine instance
const analyticsEngine = new AnalyticsEngine();

// Feed measurements from Phase 9.4
measurement.addEventListener('created', (event) => {
  analyticsEngine.addMeasurement({
    type: event.detail.type,      // 'distance', 'angle', 'area', 'volume'
    value: event.detail.value,
    timestamp: Date.now(),
    sessionId: currentSession.id,
    metadata: {
      points: event.detail.points,
      units: event.detail.units
    }
  });
});
```

### 3. Use Analytics Hook

```javascript
function MeasurementApp() {
  const {
    events,
    report,
    trends,
    statistics,
    addMeasurement,
    analyzeTrends,
    analyzeStatistics,
    generateReport,
    exportReport
  } = useAnalytics();

  return <AnalyticsPanel analytics={{ events, report, trends, statistics }} />;
}
```

### 4. Display Analytics UI

```jsx
<AnalyticsPanel
  analytics={analyticsData}
  onExport={(data, format) => handleExport(data, format)}
  onSelectionChange={(type, data) => handleSelection(type, data)}
  defaultTab="timeline"
/>
```

---

## Component Reference

### AnalyticsPanel

Main container component that orchestrates all analytics features.

**Props:**
```javascript
{
  analytics: {
    events: [Measurement],
    trends: Object,
    statistics: Object,
    report: Object
  },
  onExport: (data, format) => void,
  onSelectionChange: (type, data) => void,
  defaultTab: 'timeline' | 'trends' | 'statistics' | 'comparison'
}
```

**Features:**
- 4 tab interface (Timeline, Trends, Statistics, Comparison)
- Time range filtering
- Measurement type selector
- Status bar with event count

**Example:**
```jsx
<AnalyticsPanel
  analytics={useAnalytics()}
  defaultTab="trends"
  onExport={handleDataExport}
/>
```

---

### MeasurementTimeline

Displays measurement events in timeline format with filtering.

**Props:**
```javascript
{
  events: [
    {
      id: string,
      type: 'distance' | 'angle' | 'area' | 'volume',
      value: number,
      timestamp: number,
      sessionId: string,
      metadata: Object
    }
  ],
  onEventClick: (event) => void,
  onTimeRangeChange: (range) => void,
  filterByType: string,
  aggregated: boolean,
  showDetails: boolean,
  maxVisibleEvents: 50
}
```

**Features:**
- Visual timeline track with color-coded markers
- Event list with expandable details
- Statistics: totalEvents, timeSpan, earliest, latest, eventsByType
- Type distribution badges
- Time range filter with DateTime inputs
- Event actions (copy, details)

**Example:**
```jsx
<MeasurementTimeline
  events={filteredEvents}
  onEventClick={(e) => console.log(e)}
  showDetails={true}
/>
```

---

### TrendAnalysis

Displays trend analysis with linear regression and projections.

**Props:**
```javascript
{
  data: [number],
  type: string,
  showMovingAverage: boolean,
  movingAverageWindow: number,
  showProjection: boolean,
  projectionSteps: number,
  onTrendDetected: (trend) => void
}
```

**Metrics Displayed:**
- Slope (units/step)
- Strength (R² as percentage)
- Direction (Increasing/Decreasing/Stable)
- Changepoints count
- Regression equation (y = mx + b)
- Min/Max/Mean/Variance

**Features:**
- ASCII chart rendering
- Moving average smoothing
- Changepoint detection (2σ threshold)
- 5-step projection
- Metrics toggle

**Example:**
```jsx
<TrendAnalysis
  data={measurementData}
  type="distance"
  showProjection={true}
  projectionSteps={5}
/>
```

---

### StatisticalReport

Comprehensive statistical reporting with distributions.

**Props:**
```javascript
{
  data: {
    count: number,
    mean: number,
    median: number,
    stdDev: number,
    variance: number,
    min: number,
    max: number,
    range: number,
    q1: number,
    q3: number,
    iqr: number,
    skewness: number,
    kurtosis: number
  },
  distributions: Object,
  onExport: (data, format) => void,
  exportFormats: ['json', 'csv']
}
```

**Sections:**
- Summary Statistics (11 metrics grid)
- Definitions (metric explanations)
- Distribution (histogram)
- Percentiles (P0, P10, P25, P50, P75, P90, P100)
- Interpretation (automatic guidance)
- Data Quality (completeness, validity, consistency)

**Example:**
```jsx
<StatisticalReport
  data={statistics}
  distributions={distributions}
  onExport={handleExport}
/>
```

---

### ComparativeAnalysis

Multi-dataset comparison with correlation analysis.

**Props:**
```javascript
{
  datasets: [
    {
      id: string,
      name: string,
      data: [number],
      type: string,
      color?: string
    }
  ],
  onDatasetSelect: (id) => void,
  onComparisonChange: (comparison) => void,
  maxDatasets: 4
}
```

**Comparison Modes:**
- **Correlation**: Pearson correlation coefficient
- **Overlay**: Side-by-side data visualization
- **Differential**: Pairwise differences

**Metrics:**
- Correlation (-1.0 to 1.0)
- Alignment (% direction match)
- Mean Absolute Difference

**Example:**
```jsx
<ComparativeAnalysis
  datasets={typeDatasets}
  maxDatasets={4}
  onComparisonChange={handleComparison}
/>
```

---

## Hook Reference

### useAnalytics

Main hook managing all analytics operations.

**Returns:**
```javascript
{
  events: [Measurement],
  report: Object,
  trends: Object,
  statistics: Object,
  selectedTimeRange: { start?, end? },
  
  // Methods
  addMeasurement: (measurement) => void,
  getTimeline: (options?) => [Measurement],
  analyzeTrends: (type?) => Object,
  analyzeStatistics: (type?) => Object,
  getDistribution: (type) => Object,
  loadDataset: (id, data) => void,
  compareDatasets: (ds1, ds2) => Object,
  generateReport: (options?) => Object,
  exportReport: (format) => void,
  setTimeRange: (start, end) => void,
  clearTimeRange: () => void,
  clear: () => void,
  getCacheStats: () => Object,
  listDatasets: () => [string]
}
```

**Example:**
```javascript
const {
  events,
  trends,
  statistics,
  addMeasurement,
  analyzeTrends,
  exportReport
} = useAnalytics();

// Add measurement
addMeasurement({
  type: 'distance',
  value: 42.5,
  timestamp: Date.now()
});

// Analyze
const trends = analyzeTrends('distance');
const stats = analyzeStatistics('distance');

// Export
exportReport('json');
```

---

### useTrendAnalysis

Dedicated hook for trend calculation.

**Returns:**
```javascript
{
  loading: boolean,
  error: null | string,
  trend: {
    slope: number,
    intercept: number,
    rSquared: number,
    direction: 'increasing' | 'decreasing' | 'stable',
    strength: 'strong' | 'moderate' | 'weak',
    equation: string,
    changepoints: [number]
  }
}
```

**Example:**
```javascript
const { loading, trend } = useTrendAnalysis(data, type);

if (loading) return <div>Calculating trends...</div>;
return <div>R² = {(trend.rSquared * 100).toFixed(1)}%</div>;
```

---

### useStatistics

Statistics and distribution calculations.

**Returns:**
```javascript
{
  stats: {
    count, sum, mean, median, mode,
    min, max, range,
    q1, q3, iqr,
    variance, stdDev,
    skewness, kurtosis
  },
  distribution: {
    bins: [number],
    counts: [number],
    min: number,
    max: number,
    binWidth: number
  }
}
```

**Example:**
```javascript
const { stats, distribution } = useStatistics(data);

console.log(stats.mean);           // Average value
console.log(stats.stdDev);         // Standard deviation
console.log(distribution.bins);    // Histogram bins
```

---

### useComparison

Dataset comparison hook.

**Returns:**
```javascript
{
  datasets: Map<id, data>,
  
  addDataset: (id, data) => void,
  removeDataset: (id) => void,
  compareTwoDatasets: (id1, id2) => {
    correlation: number,
    meanDiff: number,
    alignment: number
  },
  listDatasets: () => [string],
  clearDatasets: () => void
}
```

**Example:**
```javascript
const comparison = useComparison();

comparison.addDataset('session1', data1);
comparison.addDataset('session2', data2);

const result = comparison.compareTwoDatasets('session1', 'session2');
console.log(result.correlation);  // -1.0 to 1.0
console.log(result.alignment);    // 0-100%
```

---

### useAnalyticsExport

Data export functionality.

**Returns:**
```javascript
{
  blob: Blob | null,
  url: string | null,
  filename: string,
  
  exportData: (data, format, filename?) => void,
  triggerDownload: () => void
}
```

**Example:**
```javascript
const { blob, url, exportData, triggerDownload } = useAnalyticsExport();

// Export as JSON
exportData(analysisData, 'json', 'analysis-report.json');

// Trigger download
triggerDownload();
```

---

## Engine Reference

### AnalyticsEngine

Core calculation engine for all analytics operations.

**Constructor:**
```javascript
const engine = new AnalyticsEngine();
```

**Key Methods:**

#### addMeasurement(measurement)
Track a new measurement event.

```javascript
engine.addMeasurement({
  type: 'distance',           // Required
  value: 42.5,                // Required
  timestamp: Date.now(),      // Optional, defaults to now
  sessionId: 'session-123',   // Optional
  metadata: { points: [...] } // Optional
});
```

#### getTimeline(options)
Retrieve events with filtering/aggregation.

```javascript
const events = engine.getTimeline({
  type: 'distance',           // Optional: filter by type
  startTime: Date.now() - 1h, // Optional: start timestamp
  endTime: Date.now(),        // Optional: end timestamp
  aggregation: 'minute',      // Optional: 'second'|'minute'|'hour'|'day'
  limit: 1000                 // Optional: max results
});
```

#### detectTrends(type)
Calculate linear regression and trends.

```javascript
const trends = engine.detectTrends('distance');
// Returns: { slope, intercept, rSquared, direction, changepoints, equation, projection }
```

#### getStatistics(type)
Calculate comprehensive statistics.

```javascript
const stats = engine.getStatistics('distance');
// Returns: { mean, median, stdDev, variance, q1, q3, iqr, skewness, kurtosis, min, max }
```

#### getDistribution(type)
Histogram and distribution analysis.

```javascript
const dist = engine.getDistribution('distance');
// Returns: { bins, counts, min, max, binWidth }
```

#### compareDatasets(ds1, ds2)
Compare two measurement sets.

```javascript
const comparison = engine.compareDatasets(data1, data2);
// Returns: { correlation, alignment, meanDiff, tStatistic, pValue }
```

#### generateReport(options)
Create comprehensive analysis report.

```javascript
const report = engine.generateReport({
  includeStatistics: true,
  includeTrends: true,
  includeDistribution: true,
  types: ['distance', 'angle']
});
```

#### exportReport(format)
Export report in specified format.

```javascript
const exported = engine.exportReport('json');
// or
const exported = engine.exportReport('csv');
```

---

## Integration Patterns

### Pattern 1: Basic Timeline View

```javascript
import { useAnalytics } from './hooks/useAnalytics';
import MeasurementTimeline from './components/MeasurementTimeline';

function TimelineView() {
  const { events, getTimeline } = useAnalytics();
  
  const handleNewMeasurement = (measurement) => {
    // Connect to Phase 9.4 MeasurementEngine
    addMeasurement(measurement);
  };

  return (
    <MeasurementTimeline
      events={getTimeline()}
      showDetails={true}
    />
  );
}
```

### Pattern 2: Trend Detection

```javascript
import { useTrendAnalysis } from './hooks/useAnalytics';
import TrendAnalysis from './components/TrendAnalysis';

function TrendView({ measurementType }) {
  const { trend, loading } = useTrendAnalysis(data, measurementType);
  
  if (trend.rSquared > 0.8) {
    return <Alert>Strong trend detected!</Alert>;
  }
  
  return <TrendAnalysis data={data} type={measurementType} />;
}
```

### Pattern 3: Multi-Dataset Comparison

```javascript
import { useComparison } from './hooks/useAnalytics';
import ComparativeAnalysis from './components/ComparativeAnalysis';

function SessionComparison() {
  const comparison = useComparison();
  
  useEffect(() => {
    // Load previous sessions
    comparison.addDataset('session-1', historicalData1);
    comparison.addDataset('session-2', historicalData2);
  }, []);

  return (
    <ComparativeAnalysis
      datasets={datasets}
      maxDatasets={4}
    />
  );
}
```

### Pattern 4: Real-Time Analytics

```javascript
function RealtimeAnalytics() {
  const { addMeasurement, analyzeTrends, analyzeStatistics } = useAnalytics();
  
  useEffect(() => {
    const subscription = measurementEngine.subscribe((measurement) => {
      // Add to analytics
      addMeasurement(measurement);
      
      // Update trends every 10 measurements
      if (eventCount % 10 === 0) {
        const trends = analyzeTrends(measurement.type);
        updateUI(trends);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);
}
```

---

## Usage Examples

### Example 1: Complete Analytics Dashboard

```jsx
import React, { useEffect } from 'react';
import { useAnalytics } from './hooks/useAnalytics';
import AnalyticsPanel from './components/AnalyticsPanel';
import AnalyticsEngine from './utils/AnalyticsEngine';

function AnalyticsDashboard() {
  const analytics = useAnalytics();
  
  useEffect(() => {
    // Connect to measurement engine
    const measurementEngine = window.measurementEngine;
    
    measurementEngine.addEventListener('measurement:created', (event) => {
      analytics.addMeasurement({
        type: event.type,
        value: event.value,
        timestamp: Date.now(),
        sessionId: getCurrentSessionId(),
        metadata: { units: event.units }
      });
    });
  }, []);

  return (
    <AnalyticsPanel
      analytics={analytics}
      onExport={(data, format) => {
        // Handle export
        downloadFile(data, format);
      }}
      onSelectionChange={(type, data) => {
        // Handle selection
        console.log(`Selected ${type}:`, data);
      }}
      defaultTab="timeline"
    />
  );
}

export default AnalyticsDashboard;
```

### Example 2: Trend Monitoring

```javascript
function TrendMonitor() {
  const { analyzeTrends, events } = useAnalytics();
  
  const checkTrendHealthy = () => {
    const trend = analyzeTrends('distance');
    
    // Monitor R² (trend strength)
    if (trend.rSquared < 0.5) {
      console.warn('Weak trend detected: measurements are inconsistent');
      return false;
    }
    
    // Check for changepoints
    if (trend.changepoints.length > 3) {
      console.warn('Multiple changepoints detected: verify measurement conditions');
      return false;
    }
    
    return true;
  };
  
  return checkTrendHealthy();
}
```

### Example 3: Session Comparison

```javascript
function SessionComparisonReport() {
  const { compareDatasets, events, exportReport } = useAnalytics();
  
  const compareWithPrevious = async () => {
    // Get current session data
    const currentData = events
      .filter(e => e.sessionId === currentSession.id)
      .map(e => e.value);
    
    // Load previous session from storage
    const previousData = await loadSessionData(previousSession.id);
    
    // Compare
    const comparison = compareDatasets(currentData, previousData);
    
    return {
      correlation: comparison.correlation,
      improvement: comparison.meanDiff,
      aligned: comparison.alignment > 80
    };
  };
  
  const handleExport = () => exportReport('json');
}
```

---

## Performance Considerations

### Memory Management

**Event Cache Limit:** 10,000 events maximum
- Automatic pruning when exceeded
- Aggregate older events for memory efficiency

**Optimization Tips:**
```javascript
// Use time range filtering for large datasets
const recentEvents = engine.getTimeline({
  startTime: Date.now() - 24 * 60 * 60 * 1000,
  aggregation: 'hour'
});

// Specify types to analyze
const distances = engine.detectTrends('distance');  // Only distance type
```

### Calculation Performance

| Operation | Time | Threshold |
|-----------|------|-----------|
| Add measurement | <1ms | None |
| Get timeline (10K events) | ~50ms | None |
| Linear regression (1K points) | ~5ms | None |
| Correlation (1K points each) | ~10ms | None |
| Full report generation | ~500ms | Recommend <monthly> |

### Optimization Strategies

1. **Use memoization** in React components
2. **Aggregate old data** by time periods
3. **Lazy load** statistical distributions
4. **Cache trend calculations** if data unchanged
5. **Use Web Workers** for large calculations (future)

---

## Troubleshooting

### Issue: "No events in timeline"

**Cause:** Measurements not being added to analytics

**Solution:**
```javascript
// Verify measurements are being tracked
engine.addEventListener('measurement:added', (event) => {
  console.log('Measurement tracked:', event);
});

// Check engine state
console.log(engine.events.length);
```

---

### Issue: "Trends showing as undefined"

**Cause:** Insufficient data points (< 3) for regression

**Solution:**
```javascript
// Ensure at least 3 data points
if (data.length < 3) {
  console.warn('Need at least 3 measurements to calculate trends');
  return null;
}

// Filter by time range if needed
const recentData = engine.getTimeline({
  type: 'distance',
  startTime: Date.now() - 1 * 60 * 60 * 1000  // Last hour
});
```

---

### Issue: "Export fails silently"

**Cause:** Data format incompatibility

**Solution:**
```javascript
// Verify data structure before export
const validData = engine.generateReport({
  includeStatistics: true,
  includeTrends: true,
  types: ['distance']  // Specify valid types
});

// Check export format
const json = engine.exportReport('json');
console.log(JSON.stringify(json, null, 2));
```

---

### Issue: "Performance degradation over time"

**Cause:** Cache growing beyond 10K events

**Solution:**
```javascript
// Monitor cache size
const stats = engine.getCacheStats();
console.log(`Events in cache: ${stats.eventCount}`);

// Clear old data
if (stats.eventCount > 8000) {
  // Archive old events
  const archived = engine.getTimeline({
    endTime: Date.now() - 7 * 24 * 60 * 60 * 1000  // Older than 7 days
  });
  
  // Save to storage, then clear
  saveToArchive(archived);
  engine.clear();
}
```

---

## Integration Checklist

- [ ] Import AnalyticsPanel component
- [ ] Import useAnalytics hook
- [ ] Initialize AnalyticsEngine
- [ ] Connect MeasurementEngine to AnalyticsEngine
- [ ] Pass events to useAnalytics hook
- [ ] Add AnalyticsPanel to UI
- [ ] Configure export handlers
- [ ] Test all 4 tabs (Timeline, Trends, Stats, Comparison)
- [ ] Verify data export to JSON/CSV
- [ ] Performance test with 1000+ events
- [ ] Deploy to production

---

## Next Steps

### Phase 9.6: Collaborative Features
- Multi-user session sharing
- Real-time collaboration
- Shared measurement sessions
- Comment/annotation system

### Phase 9.7: Machine Learning
- Anomaly detection
- Predictive analytics
- Pattern recognition
- Automated insights

### Phase 9.8: Advanced Visualization
- 3D trend visualization
- Custom chart library integration
- Real-time dashboards
- Export advanced reports

---

**End of Phase 9.5 Integration Guide**
