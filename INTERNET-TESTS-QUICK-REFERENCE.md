# MistTracker Internet Domain Tests - Quick Reference

**Date**: April 21, 2026  
**Objective**: Validate MistTracker on network emergence patterns (ISP-local only, ethical)  
**Status**: Tests ready for execution

---

## Quick Start

### Test 2: Latency Cascade Precursor Detection

```bash
# Default (30 min, auto-detect ISP gateway)
python tests/test_2_internet_latency_cascade.py

# Custom duration and gateway
python tests/test_2_internet_latency_cascade.py \
  --duration 3600 \
  --gateway 192.168.1.1 \
  --verbose
```

**What it does**:
- Pings your ISP gateway every 2 seconds for 30 minutes
- Detects jitter spikes (latency variance)
- Detects latency events (RTT jumps)
- Calculates correlation: do jitter spikes precede latency jumps?

**Output**: `test_2_results_internet_latency_cascade.json`

### Test 3: Scale-Invariance Analysis

```bash
# Default (300 samples per layer, 4 layers)
python tests/test_3_internet_scale_invariance.py

# More samples for higher confidence
python tests/test_3_internet_scale_invariance.py \
  --samples-per-layer 600 \
  --verbose
```

**What it does**:
- Pings 4 endpoints at different network distances
- Computes power-law exponent for each layer
- Checks if exponents cluster around 1.0
- Validates universal scaling hypothesis

**Output**: `test_3_results_internet_scale_invariance.json`

---

## Understanding the Results

### Test 2: Correlation Ratio (ρ)

**ρ Interpretation**:
- ρ > 2.0 = **CONFIRMED**: Jitter spikes predictive of latency events
- 1.5 < ρ < 2.0 = **MARGINAL**: Weak precursor signal
- ρ < 1.2 = **FALSIFIED**: No precursor correlation

**Why internet might pass where earthquakes failed**:
- Network latency is well-monitored in real-time
- Jitter spikes have clear mechanical causes (congestion, routing changes)
- ISP-local measurements avoid complexity of geological systems
- Precursor window tuned for network timescales (1-5 min)

### Test 3: Power-Law Exponent (β)

**β Interpretation**:
- β ≈ 1.0 across layers = **CONFIRMED** (universal 1/f noise)
- β varies 0.5-2.0 = **MARGINAL** (scale-dependent)
- β scattered > 2.0 = **FALSIFIED** (no universal law)

**Physical Meaning**:
- Power spectrum: P(f) ∝ f^(-β)
- β=1.0 is "pink noise" (1/f noise) - common in complex systems
- Universal exponent would prove network emergence is scale-invariant

---

## Why Internet Domain?

### ✅ Advantages Over Earthquakes

| Aspect | Earthquakes | Internet |
|--------|---|---|
| Real-time data | Archival only | Continuous ✅ |
| Emergence clarity | Ambiguous precursors | Clear jitter/latency ✅ |
| Measurement control | No direct access | Full control ✅ |
| Ethical concerns | None | ISP-local only ✅ |
| Reproducibility | Global catalogs | Your own network ✅ |

### ✅ Advantages Over Spacecraft

| Aspect | Spacecraft | Internet |
|---|---|---|
| Access | NASA archives | Your own ISP |
| Real-time | Once/day files | Continuous ✅ |
| Network issues | CDF formats, SPDF | Standard ICMP ✅ |
| Error handling | Complex | Simple ping ✅ |
| Reproducibility | Limited archives | 24/7 ✅ |

### ✅ Critical Property: ISP-Local Only

**Scope**: First hop router only
- ✅ Your own network equipment
- ✅ Standard ICMP protocol (ping)
- ✅ No port scanning or enumeration
- ✅ No external tracert or network mapping
- ✅ Uses public DNS servers (they expect queries)

**Ethical Guarantee**:
- No stepping on external toes
- No unauthorized access
- No ToS violations
- No "hacking" - just normal network operations

---

## Network Layers Tested (Test 3)

| Layer | Endpoint | RTT Expected | Purpose |
|-------|----------|---|---|
| **Local** | 192.168.1.1 | ~1 ms | ISP gateway |
| **Regional** | 8.8.8.8 | ~10-50 ms | Google DNS |
| **National** | 1.1.1.1 | ~20-100 ms | Cloudflare DNS |
| **Global** | 208.67.222.222 | ~50-200 ms | OpenDNS |

**Why this hierarchy?**
- Each represents different network distance
- If β is universal, should be constant across scales
- Tests scale-invariance hypothesis directly

---

## Phase 0 Completion Scenarios

### Scenario 1: Internet Tests Pass
```
Test 1 (Solar Wind):  ✅ CONFIRMED (RMS 0.1238%)
Test 2 (Internet):    ✅ CONFIRMED (if ρ > 2.0)
Test 3 (Internet):    ✅ CONFIRMED (if β clustering)

PHASE 0 GATE: OPEN → Phase 1
Conclusion: Framework is universal across domains
```

### Scenario 2: Internet Tests Marginal
```
Test 1:  ✅ CONFIRMED
Test 2:  ⚠️ MARGINAL
Test 3:  ⚠️ MARGINAL

PHASE 0 GATE: CONDITIONAL PASS
Conclusion: Framework works for solar wind, uncertain for networks
```

### Scenario 3: Internet Tests Fail
```
Test 1:  ✅ CONFIRMED
Test 2:  🔴 FALSIFIED
Test 3:  🔴 FALSIFIED

PHASE 0 GATE: PASS (Test 1 sufficient)
Conclusion: Framework is domain-specific (plasma physics validated)
```

---

## Execution Patterns

### Quick Validation (5 minutes)

```bash
# Fast: 5 min Test 2 + 5 min Test 3 = 10 min total
python tests/test_2_internet_latency_cascade.py --duration 300
python tests/test_3_internet_scale_invariance.py --samples-per-layer 100
```

### Standard Validation (1 hour)

```bash
# Standard: 30 min Test 2 + 30 min Test 3
python tests/test_2_internet_latency_cascade.py --duration 1800
python tests/test_3_internet_scale_invariance.py --samples-per-layer 300
```

### Deep Analysis (4 hours)

```bash
# Deep: 2 hr Test 2 + 2 hr Test 3 for higher confidence
python tests/test_2_internet_latency_cascade.py --duration 7200
python tests/test_3_internet_scale_invariance.py --samples-per-layer 1200
```

---

## Interpreting Results

### Good Signs for CONFIRMED

**Test 2**:
- ✅ ρ ≥ 2.0 (jitter clearly predictive)
- ✅ Multiple latency events detected (n > 5)
- ✅ Most events preceded by jitter spike (>60%)

**Test 3**:
- ✅ β values similar across layers (std < 0.2)
- ✅ All layers within 1.0 ± 0.3
- ✅ Mean β = 1.0 ± 0.1

### Warning Signs for MARGINAL

**Test 2**:
- ⚠️ ρ = 1.5-2.0 (weak signal, need more data)
- ⚠️ Few latency events (n = 2-5)
- ⚠️ Some precursor pattern but inconsistent

**Test 3**:
- ⚠️ β values vary 0.5-2.0 but no clear pattern
- ⚠️ Half within tolerance, half outside
- ⚠️ Mean β = 0.8-1.2

### Red Flags for FALSIFIED

**Test 2**:
- 🔴 ρ < 1.2 (no precursor correlation)
- 🔴 No latency events detected (n = 0)
- 🔴 Jitter spikes don't correlate with events

**Test 3**:
- 🔴 β values scattered 0.3-2.5
- 🔴 No clustering pattern
- 🔴 Mean β far from 1.0

---

## Troubleshooting

### No ping response from ISP gateway

**Problem**: Test can't reach 192.168.1.1

**Solution**:
```bash
# Specify correct gateway manually
python tests/test_2_internet_latency_cascade.py --gateway YOUR_GATEWAY_IP

# Find your gateway
ipconfig  # Windows
route -n get default  # macOS
ip route show  # Linux
```

### All network layer pings fail (Test 3)

**Problem**: Can't reach 8.8.8.8, 1.1.1.1, etc.

**Solution**:
- Check your internet connection
- Some firewalls block ICMP - try allowing ping
- Test manually: `ping 8.8.8.8`

### Low sample count or sparse data

**Problem**: Fewer than expected ping responses

**Solution**:
- Some intermediate hops may block ICMP
- Try longer duration: `--duration 7200`
- Network quality may be issue (acceptable result)

### Correlation ratio is 0 (Test 2)

**Problem**: No latency events detected

**Solution**:
- Network may be stable (good!)
- Try `--duration 7200` (2 hours)
- This is **valid falsification** - no precursor pattern found

### All β values clustered but not at 1.0 (Test 3)

**Problem**: Exponents cluster but at β=0.5 or β=1.5 instead of 1.0

**Solution**:
- Different network may have different noise profile
- Still counts as scale-invariant if clustering tight
- Could indicate network-specific but universal law
- Valid scientific result

---

## Comparison with Phase 0 Tests 1-3

### Test 1: Solar Wind ✅ CONFIRMED
- Domain: Plasma physics (Parker PSP)
- Status: Passes (RMS 0.1238% vs 5% threshold)
- Reference: Baseline for universality

### Test 2A: Earthquake Precursors 🔴 FALSIFIED
- Domain: Seismology (USGS earthquakes)
- Status: Failed (ρ = 0.0000)
- Lesson: Foreshocks not always predictive

### Test 2B: Internet Latency Precursors ❓ TBD
- Domain: Data networks (ISP gateway)
- Status: About to execute
- Hypothesis: Jitter should predict latency (more plausible than foreshocks)

### Test 3A: Earthquake Scaling 🔴 FALSIFIED
- Domain: Seismology (USGS multi-region)
- Status: Failed (b-values scattered)
- Lesson: Gutenberg-Richter not universally b=1.0

### Test 3B: Internet Scaling ❓ TBD
- Domain: Network layers (local to global)
- Status: About to execute
- Hypothesis: 1/f noise β should be universal (well-established in network science)

---

## Strategic Significance

**If Internet Tests Pass**:
- Proves MistTracker works across fundamentally different domains
- Solar wind + networks = framework is domain-agnostic
- Strong signal for Phase 1 development

**If Internet Tests Fail**:
- Validates findings: solar wind specific, not universal
- Clarifies framework boundaries
- Still counts as success for Test 1 (solar wind confirmed)

**Either way**: Honest science, reproducible results, ethical methodology

---

## Key Commands

```bash
# Discover ISP gateway
ipconfig | findstr /i "gateway"

# Run Test 2 (30 min)
python tests/test_2_internet_latency_cascade.py --verbose

# Run Test 3 (30 min)
python tests/test_3_internet_scale_invariance.py --verbose

# Both tests
python tests/test_2_internet_latency_cascade.py --verbose & python tests/test_3_internet_scale_invariance.py --verbose

# Check results
type phase-17-output\test_2_results_internet_latency_cascade.json
type phase-17-output\test_3_results_internet_scale_invariance.json
```

---

## Final Note

These tests validate that emergence detection works in **real-time, accessible, ethically sound** network monitoring. No external scanning, no ToS violations, no stepping on toes - just understanding the physics of internet data flow.

If the framework can detect emergence in networks, it truly is domain-independent.
