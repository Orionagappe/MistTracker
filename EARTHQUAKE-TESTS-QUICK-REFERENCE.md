# MistTracker Earthquake Data Tests - Quick Reference

## Test 2: Seismic Precursor Correlation

**File**: `tests/test_2_seismic_precursor_correlation.py`

**Purpose**: Validate that foreshocks (magnitude precursors) predict mainshake ruptures

**Usage**:
```bash
# Default (2023 California data)
python tests/test_2_seismic_precursor_correlation.py

# Custom date range
python tests/test_2_seismic_precursor_correlation.py \
  --start-date 2022-01-01 \
  --end-date 2024-12-31

# Adjust magnitude threshold
python tests/test_2_seismic_precursor_correlation.py \
  --magnitude-threshold 6.0 \
  --correlation-threshold 1.5

# Verbose output
python tests/test_2_seismic_precursor_correlation.py --verbose
```

**Output**: `phase-17-output/test_2_results_seismic_precursor.json`

**Metrics**:
- `correlation_ratio` (ρ): Ratio of mainshakes with precursors to random baseline
- `mainshakes_identified`: Number of detected mainshakes
- `mainshakes_with_foreshocks`: Count showing precursor activity
- `status`: CONFIRMED (ρ > 2.0), MARGINAL (1.5-2.0), or FALSIFIED (< 1.2)

**Data Source**: Real USGS Earthquake API (automatic fallback to synthetic if unavailable)

---

## Test 3: Scale-Invariance of Earthquake Magnitude Scaling

**File**: `tests/test_3_earthquake_scale_invariance.py`

**Purpose**: Validate Gutenberg-Richter law universality (b-value ≈ 1.0 across regions)

**Usage**:
```bash
# Default (all 4 regions: California, Japan, Chile, New Zealand)
python tests/test_3_earthquake_scale_invariance.py

# Custom date range
python tests/test_3_earthquake_scale_invariance.py \
  --start-date 2019-01-01 \
  --end-date 2025-12-31

# Lower magnitude limit (more events)
python tests/test_3_earthquake_scale_invariance.py \
  --min-magnitude 2.5

# Verbose output
python tests/test_3_earthquake_scale_invariance.py --verbose
```

**Output**: `phase-17-output/test_3_results_scale_invariance_earthquakes.json`

**Metrics**:
- `b_value_mean`: Average Gutenberg-Richter exponent
- `b_values_by_region`: Dict of regional b-values
- `percent_within_tolerance`: % of regions with b ≈ 1.0 ± 0.2
- `status`: CONFIRMED (≥60%), MARGINAL (30-60%), or FALSIFIED (< 30%)

**Data Source**: Real USGS Earthquake API for 4 tectonic regions

---

## Understanding Results

### Precursor Correlation Ratio (Test 2)

**ρ Interpretation**:
- ρ > 2.0 = **CONFIRMED**: Foreshocks are predictive (2+ times more likely than random)
- 1.5 < ρ < 2.0 = **MARGINAL**: Weak precursor signal
- ρ < 1.2 = **FALSIFIED**: No precursor effect detected

**Why USGS data might give low ρ**:
1. Foreshocks are not always present before mainshakes (genuine seismic fact)
2. Precursor window (30-60 min) may not capture actual timing
3. Magnitude threshold may filter out meaningful events
4. Regional variation: some areas have more foreshocks than others

### Gutenberg-Richter B-Values (Test 3)

**Understanding b-value**:
- Formula: log₁₀(N) = a - b·M
- N = number of earthquakes with magnitude ≥ M
- b ≈ 1.0 typically (discovered by Gutenberg & Richter 1954)
- b-value universality = scale-invariant earthquake physics

**Results Interpretation**:
- b ≈ 1.0 ± 0.2 in 60%+ regions = **CONFIRMED** (universal scaling)
- b values scattered 0.3-2.0 = **FALSIFIED** (domain-dependent)
- Mean b-value provides summary statistic

**Why USGS data shows scatter**:
1. Real tectonic environments differ (subduction vs. transform)
2. Magnitude completeness varies by region
3. Small catalogs (< 500 events) give noisy estimates
4. Genuine physics: earthquake scaling may be regional

---

## Integration with Phase 0

**Test 1 (Solar Wind - Parker PSP)**
```
Status:     ✅ CONFIRMED
RMS Error:  0.1238% (vs 5% threshold)
Data:       Real NASA SPDF FIELDS L2
```

**Test 2 (Earthquake Precursors - USGS)**
```
Status:     🔴 FALSIFIED (as of April 21, 2026)
ρ Ratio:    0.0000 (need ≥ 2.0)
Data:       Real USGS Earthquake API
Mainshakes: 3 identified, 0 with foreshocks
```

**Test 3 (Scale-Invariance - USGS + IRIS)**
```
Status:     🔴 FALSIFIED (as of April 21, 2026)
B-value:    0.4471 mean (need ~1.0)
Regions:    25% within tolerance (need ≥60%)
Data:       Real USGS Earthquake API (4 regions)
```

### Phase 0 Gate Decision

| Scenario | Test 1 | Test 2 | Test 3 | Gate Status |
|----------|--------|--------|--------|------------|
| Current  | ✅ PASS | 🔴 FAIL | 🔴 FAIL | **INCOMPLETE** |
| If 2&3 pass | ✅ PASS | ✅ PASS | ✅ PASS | **OPEN** → Next Phase |
| Solar wind only | ✅ PASS | ✅ PASS | ✅ PASS | **CONDITIONAL OPEN** |

---

## Troubleshooting

### No earthquakes retrieved (Test 2-3)

**Problem**: Tests show 0 earthquakes from USGS API

**Solutions**:
1. Check internet connection
2. Verify date range has events: try `--start-date 2024-01-01`
3. Lower magnitude threshold: `--min-magnitude 2.5`
4. Use verbose mode: `--verbose` to see API queries

**Automatic Fallback**: If USGS API fails, tests use realistic synthetic data (still falsifiable)

### Low correlation ratio (Test 2)

**Problem**: ρ = 0.0 or very low

**Possible Causes**:
1. **Legitimate result**: Earthquakes in that region/period don't have precursors
2. **Parameter adjustment needed**: Try `--start-date 2024-06-01` (more recent data)
3. **Magnitude too high**: Lower threshold to capture smaller foreshocks

**Refinement Ideas**:
- Extend precursor window: 1-6 hours before (not just 30-60 min)
- Search larger epicenter radius: 100 km instead of 50 km
- Use different tectonic region with known foreshock activity

### Scattered b-values (Test 3)

**Problem**: B-values are 0.3-0.8 instead of clustering at 1.0

**Possible Causes**:
1. **Real physics**: Different tectonic settings genuinely have different scaling
2. **Magnitude completeness**: Regional catalogs detect different minimum magnitudes
3. **Sample size**: Need 500+ earthquakes per region for stable estimates
4. **Time period matters**: Different time windows may show different clustering

**Refinement Ideas**:
- Use longer time period: `--start-date 2015-01-01` (more events)
- Focus on one region at higher magnitude: California + M≥4.0
- Compare to published b-values (seismology literature)

---

## Comparing to Original Tests (Solar Wind)

### Framework Portability

| Aspect | Test 1 (Solar Wind) | Test 2 (Earthquakes) | Test 3 (Earthquakes) |
|--------|---|---|---|
| Domain | Plasma physics | Seismology | Seismology |
| Data API | NASA SPDF | USGS | USGS |
| Emergence | Frequency peaks | Foreshock activity | Magnitude distribution |
| Metric | RMS error (%) | Correlation ratio ρ | B-value clustering |
| Falsification | 0.1238% vs 5% | ρ > 2.0 required | b ≈ 1.0 ± 0.2 required |
| Result | ✅ CONFIRMED | 🔴 FALSIFIED | 🔴 FALSIFIED |

### Key Insight

**Same methodology, different domains**:
- All tests use real public APIs
- All tests compute falsifiable metrics
- All tests produce reproducible results
- Results vary: Some hypotheses confirmed, some falsified
- Framework is domain-agnostic, hypotheses are domain-specific

---

## Next Steps

### To Improve Test 2 (Precursor Correlation)

1. Analyze specific earthquake sequences with known foreshock activity
2. Use IRIS seismic waveform data (higher temporal resolution)
3. Compare timing with P-wave vs. S-wave arrivals
4. Test different regions known for foreshock activity (Japan, Turkey, etc.)

### To Improve Test 3 (Scale-Invariance)

1. Increase sample size: Use IRIS continuous waveform data
2. Analyze finer scales: Local vs. regional vs. teleseismic
3. Test separate tectonic type: Only subduction, only transform, etc.
4. Compare b-values to published literature values

### To Extend Beyond Earthquakes

1. Try ocean buoy data (wave emergence patterns)
2. Try atmospheric data (pressure systems, cyclones)
3. Try tidal data (multi-scale filtering analysis)
4. Any domain with real emergence phenomena

---

## References

**Gutenberg-Richter Law**:
- Gutenberg, B., & Richter, C. F. (1954). "Seismicity of the Earth and Associated Phenomena". Princeton: Princeton University Press.

**USGS Earthquake API**:
- https://earthquake.usgs.gov/fdsnws/event/1/

**IRIS Data Services**:
- https://ds.iris.edu/

**MistTracker Framework**:
- Phase 0 Tests: Solar wind emergence, seismic precursors, scale-invariance
- Falsifiability: Tests can and will fail with wrong hypotheses
- Universality: Same methodology across physical domains
