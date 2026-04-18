# Phase 9.5: Advanced Analytics & Reporting
## API Reference Documentation

**Status:** Complete  
**Version:** 1.0.0  
**Last Updated:** April 2026

---

## Table of Contents

1. [AnalyticsEngine API](#analyticsengine-api)
2. [React Hooks API](#react-hooks-api)
3. [Component Props API](#component-props-api)
4. [Data Structures](#data-structures)
5. [Error Handling](#error-handling)
6. [Type Definitions](#type-definitions)

---

## AnalyticsEngine API

### Constructor

```javascript
const engine = new AnalyticsEngine(options?)
```

**Options:**
- `maxEvents`: number (default: 10000) - Maximum events to keep in cache
- `aggregationLevels`: string[] (default: ['second', 'minute', 'hour', 'day'])
- `distributionBins`: number (default: 20) - Number of histogram bins

**Example:**
```javascript
const engine = new AnalyticsEngine({
  maxEvents: 5000,
  distributionBins: 25
});
```

---

### Instance Methods

#### addMeasurement(measurement)

Add a new measurement to the analytics engine.

**Parameters:**
```javascript
{
  type: 'distance' | 'angle' | 'area' | 'volume',  // Required
  value: number,                                     // Required
  timestamp?: number,                                // Unix timestamp, default Date.now()
  sessionId?: string,                                // Session identifier
  metadata?: {                                       // Optional metadata
    points?: Point[],
    units?: string,
    description?: string,
    ...any
  }
}
```

**Returns:** `void`

**Throws:** 
- Throws if `type` not in supported types
- Throws if `value` is not a number

**Example:**
```javascript
engine.addMeasurement({
  type: 'distance',
  value: 42.5,
  timestamp: Date.now(),
  sessionId: 'session-abc123',
  metadata: {
    units: 'meters',
    points: [[0,0,0], [10,10,10]]
  }
});
```

---

#### getTimeline(options?)

Retrieve timeline events with optional filtering and aggregation.

**Parameters:**
```javascript
{
  type?: 'distance' | 'angle' | 'area' | 'volume',  // Filter by type
  startTime?: number,                                 // Earliest timestamp
  endTime?: number,                                   // Latest timestamp
  aggregation?: 'second' | 'minute' | 'hour' | 'day', // Time aggregation
  limit?: number,                                     // Max results
  sessionId?: string,                                 // Filter by session
  includeMetadata?: boolean                           // Include full metadata (default: true)
}
```

**Returns:** `Array<{id, type, value, timestamp, sessionId, metadata}>`

**Example:**
```javascript
// Get all distance measurements from last 24 hours
const events = engine.getTimeline({
  type: 'distance',
  startTime: Date.now() - 24 * 60 * 60 * 1000,
  endTime: Date.now(),
  aggregation: 'hour'
});

// Get 1000 most recent events
const recent = engine.getTimeline({
  limit: 1000
});
```

---

#### detectTrends(type?)

Detect trends in measurement data using linear regression.

**Parameters:**
- `type`: string (optional) - Measurement type to analyze. If omitted, analyzes all

**Returns:**
```javascript
{
  slope: number,                    // Rate of change
  intercept: number,                // Y-intercept
  rSquared: number,                 // Coefficient of determination (0-1)
  direction: 'increasing' | 'decreasing' | 'stable',
  strength: 'strong' | 'moderate' | 'weak',  // Based on R²
  equation: string,                 // "y = mx + b" format
  changepoints: number[],           // Indices where trend changes
  projection: number[],             // 5-step projection
  dataPoints: number,               // Number of points used
  startValue: number,               // First value
  endValue: number,                 // Last value
  totalChange: number               // End - Start
}
```

**Throws:** 
- Returns empty object if < 3 data points
- Returns zero slopes if all values identical

**Example:**
```javascript
const trend = engine.detectTrends('distance');

if (trend.rSquared > 0.8) {
  console.log('Strong trend detected');
  console.log(`Equation: ${trend.equation}`);
  console.log(`Direction: ${trend.direction}`);
  console.log(`Changepoints: ${trend.changepoints.length}`);
}
```

---

#### getStatistics(type?)

Calculate comprehensive statistical metrics.

**Parameters:**
- `type`: string (optional) - Measurement type. If omitted, analyzes all

**Returns:**
```javascript
{
  count: number,      // Number of values
  sum: number,        // Total sum
  mean: number,       // Average
  median: number,     // Middle value
  mode: number,       // Most frequent value
  min: number,        // Minimum value
  max: number,        // Maximum value
  range: number,      // Max - Min
  
  // Quartiles and spreads
  q1: number,         // 25th percentile
  q3: number,         // 75th percentile
  iqr: number,        // Interquartile range (Q3 - Q1)
  
  // Variance and standard deviation
  variance: number,   // Variance
  stdDev: number,     // Standard deviation
  
  // Distribution shape
  skewness: number,   // Skewness (-∞ to +∞)
  kurtosis: number    // Kurtosis (-3 to +∞)
}
```

**Interpretation:**
- **Skewness**: 0 = symmetric, > 0 = right skew, < 0 = left skew
- **Kurtosis**: 0 = normal, > 0 = heavy tails, < 0 = light tails
- **Variance**: Squared deviation from mean
- **StdDev**: Square root of variance

**Example:**
```javascript
const stats = engine.getStatistics('angle');

console.log(`Mean angle: ${stats.mean}°`);
console.log(`Std Dev: ±${stats.stdDev}°`);
console.log(`IQR: ${stats.iqr}°`);

// Check for outliers
const outliers = stats.q1 - 1.5 * stats.iqr;
const inliers = stats.q3 + 1.5 * stats.iqr;
console.log(`Normal range: ${outliers} to ${inliers}`);
```

---

#### getDistribution(type)

Calculate data distribution and histogram.

**Parameters:**
- `type`: 'distance' | 'angle' | 'area' | 'volume' (required)

**Returns:**
```javascript
{
  bins: number[],          // Bin edge values
  counts: number[],        // Count in each bin
  min: number,             // Minimum value
  max: number,             // Maximum value
  binWidth: number,        // Width of each bin
  total: number,           // Total count
  binCenters: number[]     // Center of each bin
}
```

**Example:**
```javascript
const dist = engine.getDistribution('distance');

// Render histogram
dist.bins.forEach((bin, i) => {
  const barHeight = (dist.counts[i] / dist.total) * 100;
  console.log(`${bin.toFixed(1)}: ${'█'.repeat(Math.round(barHeight))}`);
});
```

---

#### compareDatasets(dataset1, dataset2)

Compare two measurement datasets.

**Parameters:**
- `dataset1`: number[] - First dataset values
- `dataset2`: number[] - Second dataset values

**Returns:**
```javascript
{
  correlation: number,      // Pearson correlation (-1 to +1)
  alignment: number,        // Direction match percentage (0-100)
  meanDiff: number,         // Mean absolute difference
  tStatistic: number,       // T-test statistic
  pValue: number,           // P-value (0-1)
  overlapPercentage: number, // Percent of overlapping range
  correlation2: number,      // Alternative correlation estimate
  maxDifferenceIndex: number // Index of maximum difference
}
```

**Interpretation:**
- **Correlation**: 1.0 = perfect positive, -1.0 = perfect negative, 0 = no relationship
- **Alignment**: Percentage of times datasets move in same direction
- **P-Value**: < 0.05 indicates significant difference

**Example:**
```javascript
const comparison = engine.compareDatasets(sessionA, sessionB);

if (comparison.correlation > 0.7) {
  console.log('Strong correlation between datasets');
}

if (comparison.pValue > 0.05) {
  console.log('No significant difference');
}
```

---

#### generateReport(options?)

Generate comprehensive analysis report.

**Parameters:**
```javascript
{
  includeStatistics?: boolean,     // Include statistical metrics (default: true)
  includeTrends?: boolean,         // Include trend analysis (default: true)
  includeDistribution?: boolean,   // Include histograms (default: false)
  types?: string[],                // Types to include (default: all)
  timeRange?: {                    // Optional time filtering
    startTime?: number,
    endTime?: number
  }
}
```

**Returns:**
```javascript
{
  summary: {
    totalEvents: number,
    timeSpan: number,
    eventsByType: { distance: n, angle: n, ... }
  },
  statistics: {
    [type]: StatObject
  },
  trends: {
    [type]: TrendObject
  },
  distributions?: {
    [type]: DistributionObject
  },
  timestamp: number,
  version: string
}
```

**Example:**
```javascript
const report = engine.generateReport({
  includeStatistics: true,
  includeTrends: true,
  types: ['distance', 'angle']
});

console.log(`Report generated with ${report.summary.totalEvents} events`);
```

---

#### exportReport(format)

Export report in specified format.

**Parameters:**
- `format`: 'json' | 'csv' | 'text' (required)

**Returns:** `string` - Formatted export data

**Example:**
```javascript
// Export as JSON
const jsonData = engine.exportReport('json');
console.log(jsonData);  // Pretty-printed JSON

// Export as CSV
const csvData = engine.exportReport('csv');
console.log(csvData);   // CSV format

// Export as text
const textData = engine.exportReport('text');
console.log(textData);  // Human-readable text
```

---

#### loadDataset(id, data)

Load external dataset for comparison.

**Parameters:**
- `id`: string - Dataset identifier
- `data`: Array<{value: number, timestamp?: number}> - Dataset values

**Returns:** `void`

**Example:**
```javascript
engine.loadDataset('external-1', [
  { value: 10, timestamp: 1000 },
  { value: 12, timestamp: 2000 },
  { value: 15, timestamp: 3000 }
]);
```

---

#### clear()

Clear all events and data from engine.

**Returns:** `void`

**Caution:** This is irreversible!

**Example:**
```javascript
engine.clear();  // All data erased
```

---

#### getCacheStats()

Get information about current cache usage.

**Returns:**
```javascript
{
  eventCount: number,      // Total events in cache
  memoryUsage: number,     // Approximate memory in bytes
  eventsByType: {
    distance: number,
    angle: number,
    area: number,
    volume: number
  },
  oldestTimestamp: number,
  newestTimestamp: number,
  averageValueSize: number
}
```

**Example:**
```javascript
const stats = engine.getCacheStats();
console.log(`Using ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
console.log(`${stats.eventCount} events in cache`);
```

---

## React Hooks API

### useAnalytics

Main hook for analytics state management.

**Signature:**
```javascript
const analyticsState = useAnalytics(initialEngine?)
```

**Returns:** AnalyticsState object with methods and state properties

**Properties:**
```javascript
{
  // State
  events: Measurement[],
  report: ReportObject | null,
  trends: TrendObject | null,
  statistics: StatisticsObject | null,
  selectedTimeRange: TimeRange | null,
  
  // Methods (See below for details)
  addMeasurement,
  getTimeline,
  analyzeTrends,
  analyzeStatistics,
  getDistribution,
  loadDataset,
  compareDatasets,
  generateReport,
  exportReport,
  setTimeRange,
  clearTimeRange,
  clear,
  getCacheStats,
  listDatasets
}
```

---

### useTrendAnalysis

Calculate trend for dataset with loading/error states.

**Signature:**
```javascript
const { loading, error, trend } = useTrendAnalysis(data, type, options?)
```

**Parameters:**
- `data`: number[] - Dataset to analyze
- `type`: string - Measurement type
- `options`: object (optional)
  - `debounceMs`: number (default: 500)
  - `enabled`: boolean (default: true)

**Returns:**
```javascript
{
  loading: boolean,
  error: string | null,
  trend: TrendObject | null
}
```

---

### useComparison

Manage multiple datasets for comparison.

**Signature:**
```javascript
const comparison = useComparison()
```

**Methods:**
```javascript
{
  addDataset: (id, data) => void,
  removeDataset: (id) => void,
  compareTwoDatasets: (id1, id2) => ComparisonResult,
  listDatasets: () => string[],
  clearDatasets: () => void,
  datasets: Map<string, number[]>,
  getDataset: (id) => number[] | undefined
}
```

---

### useStatistics

Calculate statistics for dataset.

**Signature:**
```javascript
const { stats, distribution } = useStatistics(data)
```

**Returns:**
```javascript
{
  stats: StatisticsObject,
  distribution: DistributionObject,
  loading: boolean,
  error: string | null
}
```

---

### useAnalyticsExport

Export analysis data in multiple formats.

**Signature:**
```javascript
const export = useAnalyticsExport()
```

**Methods:**
```javascript
{
  exportData: (data, format, filename?) => void,
  triggerDownload: () => void,
  blob: Blob | null,
  url: string | null,
  filename: string,
  loading: boolean,
  error: string | null
}
```

---

## Component Props API

### AnalyticsPanel

**Full Props Schema:**
```javascript
{
  // Data
  analytics: {
    events: Measurement[],
    trends: TrendObject,
    statistics: StatisticsObject,
    report: ReportObject
  },
  
  // Callbacks
  onExport: (data, format) => void,
  onSelectionChange: (type, data) => void,
  
  // Options
  defaultTab: 'timeline' | 'trends' | 'statistics' | 'comparison',
  className: string,
  style: CSSProperties
}
```

---

### MeasurementTimeline

**Full Props Schema:**
```javascript
{
  // Data
  events: MeasurementEvent[],
  
  // Callbacks
  onEventClick: (event) => void,
  onTimeRangeChange: ({start, end}) => void,
  
  // Filters
  filterByType: string,
  
  // Options
  aggregated: boolean,
  showDetails: boolean,
  maxVisibleEvents: number
}
```

---

### TrendAnalysis

**Full Props Schema:**
```javascript
{
  // Data
  data: number[],
  type: string,
  
  // Options
  showMovingAverage: boolean,
  movingAverageWindow: number,
  showProjection: boolean,
  projectionSteps: number,
  
  // Callback
  onTrendDetected: (trend) => void
}
```

---

### StatisticalReport

**Full Props Schema:**
```javascript
{
  // Data
  data: StatisticsObject,
  distributions: {[type]: DistributionObject},
  
  // Callbacks
  onExport: (data, format) => void,
  
  // Options
  exportFormats: string[],
  expandedByDefault: boolean
}
```

---

### ComparativeAnalysis

**Full Props Schema:**
```javascript
{
  // Data
  datasets: Dataset[],
  
  // Callbacks
  onDatasetSelect: (id) => void,
  onComparisonChange: (result) => void,
  
  // Options
  maxDatasets: number
}
```

---

## Data Structures

### Measurement

```typescript
interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'area' | 'volume';
  value: number;
  timestamp: number;
  sessionId?: string;
  metadata?: {
    points?: Array<[number, number, number]>;
    units?: string;
    description?: string;
    [key: string]: any;
  };
}
```

---

### TimelineEvent

```typescript
interface TimelineEvent {
  id: string;
  type: string;
  value: number;
  timestamp: number;
  sessionId: string;
  metadata: object;
}
```

---

### TrendObject

```typescript
interface TrendObject {
  slope: number;
  intercept: number;
  rSquared: number;
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  equation: string;
  changepoints: number[];
  projection: number[];
  dataPoints: number;
}
```

---

### StatisticsObject

```typescript
interface StatisticsObject {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  variance: number;
  stdDev: number;
  skewness: number;
  kurtosis: number;
}
```

---

### DistributionObject

```typescript
interface DistributionObject {
  bins: number[];
  counts: number[];
  min: number;
  max: number;
  binWidth: number;
  total: number;
  binCenters: number[];
}
```

---

### ComparisonResult

```typescript
interface ComparisonResult {
  correlation: number;
  alignment: number;
  meanDiff: number;
  tStatistic: number;
  pValue: number;
  overlapPercentage: number;
}
```

---

## Error Handling

### Common Errors

#### Invalid Type
```javascript
try {
  engine.addMeasurement({
    type: 'invalid',  // ← Error
    value: 42
  });
} catch (e) {
  console.error('Invalid measurement type:', e.message);
}
```

#### Insufficient Data
```javascript
const trend = engine.detectTrends('distance');
if (Object.keys(trend).length === 0) {
  console.warn('Need at least 3 measurements for trend analysis');
}
```

#### Empty Results
```javascript
const events = engine.getTimeline({
  type: 'distance',
  startTime: futureDate,  // ← No events
  endTime: farFutureDate
});

if (events.length === 0) {
  console.log('No events in specified time range');
}
```

---

## Type Definitions

### Supported Measurement Types

```javascript
MEASUREMENT_TYPES = [
  'distance',  // Linear distance (mm, cm, m, km, in, ft, yd, mi)
  'angle',     // Angles in degrees
  'area',      // 2D area measurements
  'volume'     // 3D volume measurements
]
```

### Aggregation Levels

```javascript
AGGREGATION_LEVELS = [
  'second',    // Aggregate by second
  'minute',    // Aggregate by minute
  'hour',      // Aggregate by hour
  'day'        // Aggregate by day
]
```

### Export Formats

```javascript
EXPORT_FORMATS = [
  'json',      // JSON format
  'csv',       // CSV format
  'text'       // Human-readable text
]
```

### Component Tabs

```javascript
TAB_IDS = [
  'timeline',      // Event timeline view
  'trends',        // Trend analysis view
  'statistics',    // Statistical report view
  'comparison'     // Dataset comparison view
]
```

---

**End of API Reference**
