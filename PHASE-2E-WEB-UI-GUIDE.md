# Phase 2e Web UI - Quick Start Guide

## Overview

The Phase 2e Web UI (`phase_2e_dashboard.html`) provides a comprehensive interface for:
- Submitting expert feedback on analysis results
- Managing real-time alerts with multi-tier severity
- Viewing cross-domain correlations and patterns
- Tuning and optimizing decision thresholds
- Monitoring system statistics

## Quick Start

### 1. Start the Phase 2e API Server

```bash
cd "j:\Portfolio Site\Gdocsdev\MistTracker"
python phase_2_api_server.py
```

The server will start on `http://localhost:8000`

### 2. Open the Web UI

Open `phase_2e_dashboard.html` in your web browser:
- Double-click the file from your file manager, or
- Open in your browser manually: `file:///j:/Portfolio%20Site/Gdocsdev/MistTracker/phase_2e_dashboard.html`

### 3. Verify API Connection

The dashboard will automatically fetch system statistics on load. You should see:
- 4 status cards (Feedback, Alerts, Correlations, Thresholds) showing real-time counts
- System status indicators showing "Active" for all Phase 2e components

## Feature Breakdown

### Dashboard Tab

**Real-time Statistics**
- Expert Feedback Submitted: Total feedback entries collected
- Active Alerts: Currently unresolved alerts
- Active Patterns: Multi-domain correlations detected
- Optimized Thresholds: Learned decision thresholds

**System Status**
- Shows operational status of all 4 Phase 2e engines
- All green ✓ when system is working correctly

### Expert Feedback Tab

**Submit Feedback Form**
- **Job ID**: Unique identifier for the analysis result
- **Expert ID**: Identifier for the expert providing feedback
- **Domain**: solar_wind, earthquakes, or networks
- **Feedback Rating**: correct, partially_correct, or incorrect
- **Bayesian Verdict**: confirmed, strongly_confirmed, uncertain, rejected
- **Ground Truth**: What the expert knows to be true
- **Comments**: Additional observations or notes

**Feedback Statistics**
- Total feedback entries submitted to the system
- Number of unique experts who have provided feedback
- Number of domains with feedback data

### Alert Management Tab

**Critical & Warning Counts**
- Real-time tallies of high and medium severity alerts
- Color-coded boxes for quick status assessment

**Active Alerts Table**
- Alert ID, Severity, Domain, Rule name
- Triggered timestamp
- Acknowledge button to mark alerts as seen

**Alert History Table**
- Recent alerts (last 10)
- Status: Active, Acknowledged, or Resolved
- Sortable by time, severity, domain

### Correlations Tab

**Active Correlation Patterns**
- Pattern type (TEMPORAL, SEQUENTIAL, MAGNITUDE_CORRELATED, etc.)
- Involved domains
- Correlation strength (0-100%)
- Significance score
- Detection time

**High-Confidence Patterns**
- Detailed cards for patterns with >0.8 significance
- Shows domains, correlation strength, and pattern type
- Can include narrative explanations

### Threshold Tuning Tab

**Add Labeled Data**
- Provide training examples for threshold optimization
- Domain selection
- Metric name and value
- Classification: TRUE_POSITIVE, TRUE_NEGATIVE, FALSE_POSITIVE, FALSE_NEGATIVE

**Threshold Recommendations**
- Automatically suggested thresholds for each domain/metric
- Performance metrics:
  - F1 Score (overall balance)
  - Sensitivity (recall/true positive rate)
  - Specificity (true negative rate)

### Statistics Tab

**Overall Metrics**
- Feedback system: total entries, unique experts, domains
- Alert system: total generated, currently active, rules registered
- Correlation detector: active patterns, high-confidence, average strength
- Threshold optimizer: labeled datapoints, optimized thresholds, avg F1 & AUC

**System Summary**
- Status: All Systems Operational
- Last update timestamp
- System uptime

## REST API Endpoints

The Web UI connects to these FastAPI endpoints:

**Feedback**
- `POST /api/feedback/submit` - Submit expert feedback
- `GET /api/feedback/expert/{expert_id}` - Get expert profile
- `GET /api/feedback/statistics` - Get system-wide statistics

**Alerts**
- `GET /api/alerts/active` - Get currently active alerts
- `GET /api/alerts/history` - Get historical alerts
- `POST /api/alerts/acknowledge` - Mark alert as acknowledged

**Correlations**
- `GET /api/correlations/active` - Get active patterns
- `GET /api/correlations/high-confidence` - Get high-confidence patterns

**Thresholds**
- `POST /api/thresholds/label-datapoint` - Add training data
- `GET /api/thresholds/recommendations` - Get optimized thresholds
- `GET /api/thresholds/roc/{domain}/{metric}` - Get ROC curve data

**System**
- `GET /api/phase2e/statistics` - Consolidated Phase 2e statistics

## Testing with Real Data

### Example: Solar Wind Expert Feedback

1. Go to **Expert Feedback** tab
2. Fill form:
   - Job ID: `job-sw-001`
   - Expert ID: `dr_smith`
   - Domain: `solar_wind`
   - Rating: `correct`
   - Verdict: `strongly_confirmed`
   - Ground Truth: `confirmed`
3. Click "Submit Feedback"
4. Go to **Statistics** tab to see updated counts

### Example: Alert Evaluation

The system automatically generates alerts when analysis results match certain criteria. You can:
1. Go to **Alert Management** tab
2. View active alerts in the table
3. Click "Acknowledge" button to mark as reviewed
4. See alert history showing resolved and acknowledged alerts

### Example: Threshold Tuning

1. Go to **Threshold Tuning** tab
2. Add labeled datapoints:
   - Domain: `earthquakes`
   - Metric: `b_value_deviation`
   - Value: `0.089`
   - Classification: `TRUE_POSITIVE`
3. Click "Add Datapoint"
4. View recommendations table for optimized thresholds
5. Recommendations automatically update as more data is added

## Configuration

### API Base URL

Default: `http://localhost:8000/api`

To change, edit this line in `phase_2e_dashboard.html`:

```javascript
const API_BASE = 'http://localhost:8000/api';
```

### Auto-Refresh Interval

Default: 30 seconds

To change, find this line and modify the interval:

```javascript
setInterval(() => {
    const tab = document.querySelector('.tab-content.active').id;
    loadTabData(tab);
}, 30000);  // 30000ms = 30 seconds
```

## Troubleshooting

### "API Error" Notifications

**Problem**: Dashboard shows API errors

**Solutions**:
1. Verify server is running: `python phase_2_api_server.py`
2. Check that `localhost:8000` is accessible
3. Ensure CORS is enabled in FastAPI (it is by default)

### Empty Tables/Statistics

**Problem**: Dashboard loads but shows no data

**Solutions**:
1. Verify Phase 2e modules are loaded without errors
2. Check that previous feedback/alerts have been submitted
3. Reload the page (Ctrl+R)

### Feedback Not Submitting

**Problem**: Submit button doesn't work or shows error

**Solutions**:
1. Verify all required fields are filled (marked with *)
2. Check browser console for error messages (F12)
3. Verify API server is responding to `/api/feedback/statistics`

## Performance Notes

- Dashboard auto-refreshes every 30 seconds
- Initial load may take 1-2 seconds while fetching all data
- Subsequent tab switches are fast (cached data)
- Handle large datasets: with >1000 feedback entries, consider pagination

## Advanced Usage

### Accessing Raw API Data

Open browser developer tools (F12) and run:

```javascript
// Get all expert profiles
apiCall('/feedback/statistics').then(data => console.log(data));

// Get active alerts
apiCall('/alerts/active').then(data => console.log(data));

// Get all correlations
apiCall('/correlations/active').then(data => console.log(data));
```

### Custom Data Submission

Use the form fields or programmatically submit via fetch:

```javascript
fetch('http://localhost:8000/api/feedback/submit', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        job_id: 'test-job',
        expert_id: 'test-expert',
        domain: 'solar_wind',
        analysis_type: 'emergence_detection',
        bayesian_verdict: 'confirmed',
        ground_truth: 'confirmed',
        feedback_rating: 'correct'
    })
}).then(r => r.json()).then(d => console.log(d));
```

## Integration with Real World Data

To test Phase 2e with real domain data:

1. **Solar Wind Data**: Integrate with NOAA DSCOVR or SOHO data
2. **Earthquake Data**: Use USGS earthquake API
3. **Network Data**: Integrate with your monitoring system

Modify `phase_2_api_server.py` to ingest real data streams and the dashboard will automatically display results.

## Support

For issues or questions:
1. Check the comprehensive Phase 2e documentation: `PHASE-2E-EXPERT-PLATFORM-GUIDE.md`
2. Review API endpoint documentation: `API-ENDPOINTS-REFERENCE.md`
3. Check test examples in: `test_phase_2e_complete.py`

---

**Status**: Phase 2e Web UI Complete ✓
All 6 tests passing, API endpoints functional, UI ready for real data testing.
