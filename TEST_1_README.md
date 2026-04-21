# TEST 1: COHERENCE FREQUENCY PREDICTION VALIDATION

## Overview

This is the executable Phase 0 validation test for MistTracker emergence signatures. It tests whether coherence index oscillations in solar wind data show the frequency patterns predicted by MistTracker Phase 17.

## Scientific Basis

**Hypothesis**: MistTracker Phase 17 predicts that coherence index $C(t) = (\vec{E} \cdot \vec{B}) / (|\vec{E}| |\vec{B}|)$ in solar wind plasma exhibits characteristic frequency harmonics:
- Ion cyclotron frequency: $f_{ic} = \frac{q B}{2\pi m}$ (0.3 Hz for protons in 5 nT field)
- Harmonics at $n \times f_{ic}$ for $n = 1, 2, 3, ...$
- Emergence signatures in Fourier spectrum correlate with plasma discontinuities

**Prediction**: These harmonics should be detectable above background turbulence with measurable spectral peaks.

**Falsification Threshold** (from MISTTRACKER-DOMAIN-ARCHITECTURE-AND-EMERGENCE-SIGNATURES.md):
- If RMS error ε < 5% → Prediction CONFIRMED ✓
- If 5% ≤ ε ≤ 15% → Marginal evidence, refine algorithm
- If ε > 15% → Prediction FALSIFIED ✗

## Quick Start

### Option 1: Run with Bash (Linux/Mac)

```bash
cd MistTracker
chmod +x run_test_1.sh
./run_test_1.sh --date 2021-01-15 --duration 24
```

### Option 2: Run with Python Directly

```bash
python3 test_1_coherence_frequencies.py --date 2021-01-15 --duration 24 --output test_1_results/
```

### Option 3: Windows (PowerShell)

```powershell
python.exe test_1_coherence_frequencies.py --date 2021-01-15 --duration 24 --output test_1_results\
```

## Installation

### 1. Prerequisites

- Python 3.8+
- pip (Python package manager)

### 2. Install Dependencies

```bash
# Install required packages
pip install -r requirements_test_1.txt

# Or manually:
pip install numpy scipy matplotlib
```

### 3. Optional: For Direct NASA Data Access

```bash
pip install cdflib  # Enables direct CDF file reading from NASA archive
```

## Usage

### Basic Usage

```bash
python3 test_1_coherence_frequencies.py
```

This runs Test 1 with default parameters (synthetic data for demonstration).

### With Custom Parameters

```bash
# 48-hour analysis starting Jan 15, 2021
python3 test_1_coherence_frequencies.py \
  --date 2021-01-15 \
  --duration 48 \
  --output my_results/
```

### Full Options

```
Usage: test_1_coherence_frequencies.py [OPTIONS]

Options:
  --date DATE              Start date (YYYY-MM-DD format). Default: 2021-01-15
  --duration HOURS         Analysis duration in hours. Default: 24
  --output DIR             Output directory. Default: current directory
  --verbose                Enable verbose logging. Default: False
  -h, --help              Show help message

Examples:
  python3 test_1_coherence_frequencies.py
  python3 test_1_coherence_frequencies.py --date 2020-06-01 --duration 48
  python3 test_1_coherence_frequencies.py --date 2021-03-15 --output ~/psp_analysis/
```

## Output

The test generates the following outputs:

### 1. JSON Results File

**Location**: `test_1_output/test_1_results.json`

**Contains**:
```json
{
  "observed_frequencies": [0.123, 0.245, 0.367, ...],
  "observed_powers": [1.23, 0.95, 0.78, ...],
  "predicted_frequencies": [0.125, 0.250, 0.375, ...],
  "matches": [
    {
      "predicted": 0.125,
      "observed": 0.123,
      "error_percent": 1.6
    },
    ...
  ],
  "rms_error": 0.0340,
  "rms_error_percent": 3.40,
  "ion_cyclotron_frequency": 0.125,
  "falsification_threshold_5pct": "PASS",
  "falsification_threshold_15pct": "PASS",
  "status": "CONFIRMED",
  "message": "MistTracker prediction CONFIRMED: RMS error < 5%",
  "timestamp": "2026-04-21T14:32:15.123456"
}
```

### 2. Visualization Plots

**Location**: `test_1_output/plots/`

- `coherence_spectrum.png` — Time series of coherence index and power spectrum

### 3. Console Output

Sample output shows:
- Ion cyclotron frequency (calculated from typical solar wind B-field)
- Predicted harmonic frequencies
- Observed spectral peaks
- RMS error comparison
- Falsification threshold status
- Final verdict

## Interpreting Results

### RMS Error < 5%: CONFIRMED ✓

MistTracker's predicted coherence harmonics match observed solar wind data. This indicates:
- Ion cyclotron waves at predicted frequencies are detected
- Emergence mechanism appears to be real
- Proceed to Tests 2 & 3 for stronger validation

### RMS Error 5–15%: MARGINAL ⚠️

Partial agreement between prediction and observation. Options:
- Refine frequency detection algorithm (wavelet analysis, etc.)
- Re-examine plasma parameter assumptions
- Collect longer data windows for better statistics

### RMS Error > 15%: FALSIFIED ✗

MistTracker predictions do not match observed coherence data. Implications:
- Emergence model is incomplete or incorrect
- Solar wind physics explains observations better than MistTracker
- Do NOT proceed with ELON V2 mission proposal
- Return to Phase 17 theoretical refinement

## Using Real Parker Solar Probe Data

### Option A: Automatic Download (with cdflib)

If `cdflib` is installed, the script attempts to download PSP FIELDS data:

```bash
pip install cdflib
python3 test_1_coherence_frequencies.py --date 2021-04-15 --duration 24
```

The script queries NASA's CDAWeb archive and downloads CDF files automatically.

### Option B: Manual Download

1. Visit: https://cdaweb.gsfc.nasa.gov/pub/data/psp/fields/
2. Download FIELDS Level 2 magnetometer + electric field data (CDF format)
3. Place in `/data/psp_fields/` directory
4. Modify script to load local CDF files

### Option C: Use Synthetic Data

(Default if real data unavailable) Generates realistic solar wind coherence signatures with known frequency content.

## Reproducing Results Independently

Anyone can verify MistTracker's claims by running this test:

```bash
# Step 1: Clone repo
git clone https://github.com/Orionagappe/MistTracker.git
cd MistTracker

# Step 2: Install dependencies
pip install -r requirements_test_1.txt

# Step 3: Run test
python3 test_1_coherence_frequencies.py --date 2021-06-15 --duration 24

# Step 4: Review results
cat test_1_output/test_1_results.json | python3 -m json.tool
```

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'numpy'`

**Solution**: Install dependencies
```bash
pip install numpy scipy matplotlib
```

### Issue: `cdflib not available. Will use synthetic test data.`

**This is normal.** The test can run with synthetic data or real NASA data.
To use real data, install `cdflib`:
```bash
pip install cdflib
```

### Issue: Plots not generating

**Solution**: Ensure matplotlib is installed:
```bash
pip install matplotlib
```

If still failing, check that the `plots/` directory is writable.

## Scientific Validation

### What This Test Proves (If Successful)

✓ MistTracker coherence model matches real solar wind observations  
✓ Predicted frequency harmonics appear in data  
✓ Emergence signatures are detectable above noise  
✓ Phase 17 theory is at least internally consistent with plasma physics  

### What This Test Does NOT Prove

✗ That MistTracker is the *only* explanation (standard plasma physics may also work)  
✗ That scale-invariance holds (requires heliocentric data: Tests 2 & 3)  
✗ That ELON V2 mission is justified (requires Tests 2 & 3 to also pass)  
✗ That ELON V1 (Roadster retrofit) is viable (already proven impossible by GROK)  

## References

- MISTTRACKER-DOMAIN-ARCHITECTURE-AND-EMERGENCE-SIGNATURES.md — Full scientific basis
- W-DOMAIN-CAUSALITY-FIX-AND-PUBLIC-VALIDATION.md — Physics foundation and w-domain correction
- GROK-RESPONSE — Critical review of MistTracker claims
- MistTracker GitHub: https://github.com/Orionagappe/MistTracker

## Contact / Questions

For issues, results, or questions:
1. Check GitHub Issues: https://github.com/Orionagappe/MistTracker/issues
2. Review documentation
3. Create reproducible test case if reporting issues

## License

MistTracker Test Suite is open-source. Use, modify, and share freely under conditions of scientific integrity and attribution.

---

**Last Updated**: April 21, 2026  
**Status**: Ready for Phase 0 validation  
**Maintainer**: MistTracker Validation Suite
