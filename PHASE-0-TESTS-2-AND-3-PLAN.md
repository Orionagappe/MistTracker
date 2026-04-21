# Phase 0 Tests 2 & 3 Implementation Plan

**Status:** Ready for development  
**Date:** April 21, 2026  
**Timeline:** Tests 2 & 3 to follow Test 1 (CONFIRMED, RMS 0.064%)

---

## Test 2: Emergence Precursor Correlation (Priority 1)

### Objective
Validate that coherence precursors (sharp drops in C(t) alignment) **predict** solar wind discontinuities 30-60 minutes ahead.

### Method
1. **Input:** Solar wind sector boundaries from Wind spacecraft (2020-2025)
2. **Processing:**
   - Extract coherence C(t) from 90 min before to 30 min after boundary
   - Identify precursor events: $C < \mu_C - 1.5\sigma$ lasting >5 min
   - Calculate correlation ratio: $\rho = \frac{\text{precursor rate before}}{\text{precursor rate at random}}$
3. **Falsification:**
   - $\rho > 2.0$ = CONFIRMED ✓
   - $1.5 < \rho < 2.0$ = MARGINAL ~
   - $\rho < 1.2$ = FALSIFIED ✗

### Data Sources
- Wind magnetometer L2 public archive
- SWPC sector boundary catalogs
- NASA SPDF Wind CDFs (similar access as Test 1)

### Script Structure
- `tests/test_2_precursor_correlation.py` (500+ lines)
  - `SPDFWindDataLoader` class (similar to Parker loader)
  - `CoherencePrecursorAnalyzer` class
  - `extract_sector_boundaries()` function
  - `compute_correlation_ratio()` function
  - Results: `test_2_results_precursor.json`

### Input Handling
```bash
python tests/test_2_precursor_correlation.py \
  --start-date 2020-01-01 \
  --end-date 2025-12-31 \
  --min-precursor-duration 5 \
  --correlation-threshold 1.5 \
  --output-dir phase-17-output
```

### Output Format
```json
{
  "test_date_range": "2020-01-01 to 2025-12-31",
  "total_sector_boundaries": 412,
  "precursor_windows_analyzed": 412,
  "precursor_events_before_boundary": 287,
  "precursor_events_random_window": 139,
  "correlation_ratio": 2.064,
  "correlation_ratio_stderr": 0.187,
  "falsification_threshold": 2.0,
  "status": "CONFIRMED",
  "rms_error_percent": 3.2,
  "validation_notes": [...],
  "spdf_urls": {...}
}
```

### Timeline
- Design: 2-3 days
- Implementation: 4-5 days
- Testing: 2-3 days
- **Total: 1 week**

---

## Test 3: Scale-Invariance Frequency Ratio (Priority 2)

### Objective
Validate that emergence frequencies scale predictably across heliospheric distances: $f_{0.1 AU} / f_{1 AU} = \sqrt{10} \approx 3.16$

### Method
1. **Input:** Simultaneous Parker Solar Probe (0.1 AU) + Wind (1 AU) observation windows (2021-2026)
2. **Processing:**
   - For each 24+ hour concurrent window:
     - Compute coherence: $C_{PSP}(t)$ and $C_{Wind}(t)$
     - Extract dominant frequency via wavelet transform
     - Calculate ratio: $R = f_{PSP} / f_{Wind}$
   - Statistical analysis: Does $R$ cluster around 3.16?
3. **Falsification:**
   - $R_{\text{mean}} = 3.16 \pm 0.3$ in >60% windows = CONFIRMED ✓
   - $R_{\text{mean}} = 2.0-2.5$ = MARGINAL ~
   - $R$ scattered (0.5-5.0) = FALSIFIED ✗

### Data Sources
- Parker Solar Probe FIELDS Level 2 CDFs (same as Test 1)
- Wind MFI + SWE data
- Mission ephemeris (find simultaneous windows)

### Script Structure
- `tests/test_3_scale_invariance.py` (600+ lines)
  - `SPDFParkerWindDataLoader` class (dual concurrent access)
  - `ScaleInvarianceAnalyzer` class
  - `find_concurrent_observation_windows()` function
  - `compute_wavelet_dominant_frequency()` function
  - `compute_frequency_ratio()` function
  - Results: `test_3_results_scale_invariance.json`

### Input Handling
```bash
python tests/test_3_scale_invariance.py \
  --start-date 2021-01-01 \
  --end-date 2026-12-31 \
  --min-window-duration 24 \
  --expected-ratio 3.16 \
  --tolerance 0.3 \
  --output-dir phase-17-output
```

### Output Format
```json
{
  "test_date_range": "2021-01-01 to 2026-12-31",
  "concurrent_windows_found": 47,
  "windows_with_valid_frequencies": 43,
  "frequency_ratios": [3.15, 3.18, 3.12, ...],
  "ratio_mean": 3.164,
  "ratio_std": 0.281,
  "expected_ratio": 3.16,
  "predicted_tolerance": 0.3,
  "windows_within_tolerance": 39,
  "percent_within_tolerance": 90.7,
  "falsification_threshold": 60,
  "status": "CONFIRMED",
  "rms_error_percent": 0.13,
  "validation_notes": [...],
  "spdf_urls": {...}
}
```

### Timeline
- Design: 3-4 days
- Implementation: 5-7 days
- Testing: 3-4 days
- **Total: 2-2.5 weeks**

---

## Implementation Sequence

### Phase 1: Foundation (Week 1)
1. Create `tests/test_2_precursor_correlation.py` with basic structure
2. Implement Wind data loader (similar to Parker)
3. Implement sector boundary extraction
4. Test with small sample (1 month of Wind data)

### Phase 2: Test 2 Complete (Week 2)
1. Complete precursor correlation analysis
2. Generate real results
3. Commit to GitHub
4. Document for GROK review

### Phase 3: Test 3 Foundation (Weeks 3-4)
1. Create `tests/test_3_scale_invariance.py`
2. Implement concurrent window finder
3. Implement wavelet-based frequency extraction
4. Test with sample concurrent data

### Phase 4: Test 3 Complete (Week 4-5)
1. Complete frequency ratio analysis
2. Generate real results
3. Commit to GitHub
4. Document for GROK review

### Phase 5: Phase 0 Complete (Week 6+)
1. If both pass: Begin Phase 18 planning
2. Prepare arXiv preprint with all three tests
3. Submit to peer review

---

## Key Principles (From Test 1)

✓ **Real NASA data only** (Wind, Parker SPDF archives)  
✓ **No synthetic injection** (discover what's actually there)  
✓ **Falsifiable thresholds** (could fail, not guaranteed to pass)  
✓ **Transparent methodology** (every step auditable)  
✓ **Input handling** (CLI args for flexibility)  
✓ **Error handling** (graceful network fallback)  
✓ **Results with URLs** (reproducible, GROK can verify)  

---

## GROK Collaboration Points

1. **After Test 2 implementation**: GROK reviews precursor logic
2. **After Test 2 real run**: GROK validates correlation ratio calculation
3. **After Test 3 implementation**: GROK reviews wavelet methodology
4. **After Test 3 real run**: GROK validates scale-invariance claim
5. **Phase 0 complete**: GROK and partners assess readiness for Phase 18 / publication

---

## Immediate Next Steps

1. Confirm you want both Test 2 & 3 implemented
2. Prioritize: Test 2 first (lower cost gate), then Test 3?
3. Start with Test 2 skeleton this week
4. Plan Test 3 for following week

**Ready to begin?**
