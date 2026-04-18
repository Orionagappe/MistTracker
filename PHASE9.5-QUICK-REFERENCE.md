# Phase 9.5: Quick Reference Card
## Advanced Analytics & Reporting - Cheat Sheet

---

## 🚀 Quick Start (Copy-Paste Ready)

### 1. Import Everything
```javascript
import { useAnalytics } from './hooks/useAnalytics';
import AnalyticsPanel from './components/AnalyticsPanel';
import AnalyticsEngine from './utils/AnalyticsEngine';
```

### 2. Create Component
```jsx
function MyAnalyticsDashboard() {
  const analytics = useAnalytics();
  
  return <AnalyticsPanel analytics={analytics} />;
}
```

### 3. Connect to Phase 9.4
```javascript
// In your measurement handler
measurementEngine.addEventListener('measurement:created', (e) => {
  analytics.addMeasurement({
    type: e.detail.type,
    value: e.detail.value,
    timestamp: Date.now()
  });
});
```

---

## 📊 Common Tasks

### Add Measurement
```javascript
analytics.addMeasurement({
  type: 'distance',        // 'distance'|'angle'|'area'|'volume'
  value: 42.5,
  timestamp: Date.now(),
  sessionId: 'ses-123',
  metadata: { units: 'meters' }
});
```

### Get Timeline
```javascript
// All events
const events = analytics.getTimeline();

// Last 24 hours
const recent = analytics.getTimeline({
  startTime: Date.now() - 24*60*60*1000,
  endTime: Date.now()
});

// Specific type
const distances = analytics.getTimeline({
  type: 'distance'
});
```

### Analyze Trends
```javascript
const trend = analytics.analyzeTrends('distance');

// Result:
// {
//   slope: 0.5,                    // Rate of change
//   rSquared: 0.92,                // Trend strength (0-1)
//   direction: 'increasing',       // increasing|decreasing|stable
//   strength: 'strong',            // strong|moderate|weak
//   equation: 'y = 0.5x + 10',
//   changepoints: [5, 15],         // Indices of changes
//   projection: [42, 44, 46, 48, 50]
// }
```

### Get Statistics
```javascript
const stats = analytics.analyzeStatistics('distance');

// Result:
// {
//   count: 100,
//   mean: 42.5,
//   median: 41.0,
//   stdDev: 5.2,
//   min: 30.1,
//   max: 55.3,
//   q1: 38.0,
//   q3: 47.0,
//   iqr: 9.0,
//   skewness: 0.3,
//   kurtosis: -0.5
// }
```

### Compare Datasets
```javascript
const comparison = analytics.compareDatasets(data1, data2);

// Result:
// {
//   correlation: 0.85,           // -1 to +1
//   alignment: 92.5,             // % direction match
//   meanDiff: 2.3,               // Avg difference
//   tStatistic: 3.45,
//   pValue: 0.001,
//   overlapPercentage: 87.3
// }
```

### Export Data
```javascript
// As JSON (pretty-printed)
const json = analytics.exportReport('json');

// As CSV
const csv = analytics.exportReport('csv');

// As Text (human-readable)
const text = analytics.exportReport('text');
```

---

## 🎛️ Hooks Reference

### useAnalytics
```javascript
const {
  events,                    // Measurement[]
  report,                    // ReportObject
  trends,                    // TrendObject
  statistics,                // StatsObject
  addMeasurement,            // (m) => void
  getTimeline,               // (options?) => Event[]
  analyzeTrends,             // (type?) => TrendObject
  analyzeStatistics,         // (type?) => StatsObject
  generateReport,            // (options?) => ReportObject
  exportReport,              // (format) => string
  compareDatasets,           // (d1, d2) => ComparisonResult
  setTimeRange,              // (start, end) => void
  clearTimeRange,            // () => void
  clear                      // () => void
} = useAnalytics();
```

### useTrendAnalysis
```javascript
const { loading, error, trend } = useTrendAnalysis(data, type);
```

### useStatistics
```javascript
const { stats, distribution, loading } = useStatistics(data);
```

### useComparison
```javascript
const comparison = useComparison();
comparison.addDataset('id1', data1);
comparison.addDataset('id2', data2);
const result = comparison.compareTwoDatasets('id1', 'id2');
```

### useAnalyticsExport
```javascript
const { blob, url, exportData, triggerDownload } = useAnalyticsExport();
exportData(data, 'json', 'report.json');
triggerDownload();
```

---

## 🧩 Components Reference

### AnalyticsPanel
```jsx
<AnalyticsPanel
  analytics={analyticsData}                  // Required
  onExport={(data, format) => {}}           // Optional
  onSelectionChange={(type, data) => {}}    // Optional
  defaultTab="timeline"                      // 'timeline'|'trends'|'statistics'|'comparison'
/>
```

### MeasurementTimeline
```jsx
<MeasurementTimeline
  events={events}                            // Required
  onEventClick={(event) => {}}              // Optional
  onTimeRangeChange={({start, end}) => {}}  // Optional
  showDetails={true}
  maxVisibleEvents={50}
/>
```

### TrendAnalysis
```jsx
<TrendAnalysis
  data={measurementData}                     // Required
  type="distance"                            // Required
  showMovingAverage={true}
  showProjection={true}
  projectionSteps={5}
/>
```

### StatisticalReport
```jsx
<StatisticalReport
  data={stats}                               // Required
  distributions={dists}
  onExport={(data, format) => {}}
  exportFormats={['json', 'csv']}
/>
```

### ComparativeAnalysis
```jsx
<ComparativeAnalysis
  datasets={[                                // Required
    {
      id: 'ds-1',
      name: 'Dataset 1',
      data: [values],
      type: 'distance'
    }
  ]}
  onDatasetSelect={(id) => {}}              // Optional
  maxDatasets={4}
/>
```

---

## 📈 Calculation Reference

### Trend Prediction
```javascript
// Access projection
const trend = analytics.analyzeTrends('distance');
trend.projection;  // 5 future values

// Interpret R²
// > 0.9: Excellent trend
// > 0.7: Strong trend
// > 0.5: Moderate trend
// < 0.5: Weak trend
```

### Statistical Interpretation
```javascript
// Skewness
// > 0: Right-skewed (tail right)
// = 0: Symmetric
// < 0: Left-skewed (tail left)

// Kurtosis
// > 0: Heavy tails
// = 0: Normal distribution
// < 0: Light tails

// IQR (Interquartile Range)
// Use for: outlier detection
// Outliers: < Q1 - 1.5*IQR OR > Q3 + 1.5*IQR
```

### Correlation Strength
```javascript
// Pearson correlation (-1 to +1)
// ≥ 0.7:   Strong positive
// 0.3-0.7: Moderate positive
// 0-0.3:   Weak positive
// -0.3-0:  Weak negative
// -0.7--0.3: Moderate negative
// ≤ -0.7:  Strong negative
```

---

## ⏱️ Performance Tips

### For Large Datasets (>10K events)
```javascript
// Aggregate by time level
const aggregated = analytics.getTimeline({
  aggregation: 'hour'  // Reduces data size
});

// Filter by time range
const recent = analytics.getTimeline({
  startTime: Date.now() - 7*24*60*60*1000  // Last 7 days
});

// Check cache size
const stats = analytics.getCacheStats();
console.log(stats.eventCount);
```

### For Real-Time Updates
```javascript
// Debounce analysis
const [analysisDebounce, setDebounce] = useState(null);

const handleMeasurement = (m) => {
  addMeasurement(m);
  clearTimeout(analysisDebounce);
  setDebounce(setTimeout(() => {
    const trend = analyzeTrends();
    updateUI(trend);
  }, 500));  // Waits 500ms after last measurement
};
```

---

## 🐛 Debugging

### Check Data
```javascript
// View all events
console.log(analytics.events);

// View specific type
const distances = analytics.events.filter(e => e.type === 'distance');

// Check cache stats
console.log(analytics.getCacheStats());
```

### Verify Calculations
```javascript
// Trends need at least 3 points
if (analytics.getTimeline({type: 'distance'}).length < 3) {
  console.warn('Not enough data for trends');
}

// Correlations need same length
if (data1.length !== data2.length) {
  console.warn('Datasets must be equal length');
}
```

### Test Export
```javascript
const json = analytics.exportReport('json');
console.log(JSON.stringify(json, null, 2));
```

---

## 📋 Component Tree

```
App
├── MeasurementComponent (Phase 9.4)
└── AnalyticsPanel (Phase 9.5)
    ├── MeasurementTimeline
    ├── TrendAnalysis
    ├── StatisticalReport
    └── ComparativeAnalysis

useAnalytics connects to:
├── AnalyticsEngine instance
└── Event listeners from Measurement Component
```

---

## 🎯 Common Patterns

### Pattern: Update on New Measurement
```javascript
useEffect(() => {
  const unsubscribe = measurementEngine.onChange(() => {
    const newTrend = analyzeTrends(selectedType);
    setTrend(newTrend);
  });
  return () => unsubscribe();
}, [selectedType]);
```

### Pattern: Time Range Filter
```javascript
const [dateRange, setDateRange] = useState({
  start: Date.now() - 24*60*60*1000,
  end: Date.now()
});

const filteredEvents = getTimeline({
  startTime: dateRange.start,
  endTime: dateRange.end
});
```

### Pattern: Auto-Export
```javascript
const handleExport = async () => {
  const report = generateReport({
    includeStatistics: true,
    includeTrends: true
  });
  const json = exportReport('json');
  
  // Save to file
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${Date.now()}.json`;
  a.click();
};
```

---

## 📚 Documentation Links

- **Integration Guide:** `PHASE9.5-INTEGRATION-GUIDE.md`
- **API Reference:** `PHASE9.5-API-REFERENCE.md`
- **Planning:** `PHASE9.5-PLANNING.md`
- **Completion Summary:** `PHASE9.5-COMPLETION-SUMMARY.md`

---

## ✅ Checklist: Setting Up Phase 9.5

- [ ] Import AnalyticsPanel & useAnalytics
- [ ] Create component with useAnalytics()
- [ ] Pass analytics data to AnalyticsPanel
- [ ] Connect Phase 9.4 measurements
- [ ] Test timeline display
- [ ] Verify trend analysis
- [ ] Check statistics calculations
- [ ] Try data export
- [ ] Deploy to production

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Timeline empty | Add measurements first |
| Trends undefined | Need ≥3 measurements |
| No stats | Ensure measurements loaded |
| Export fails | Check data format |
| Slow performance | Check cache size, aggregate old data |

---

**Phase 9.5 Quick Reference v1.0 • April 2026**
