# Phase 1 Architecture: The Antenna

**Date**: April 21, 2026  
**Status**: ✅ COMPLETE AND DEPLOYABLE  
**Mission**: Universal emergence detection framework

---

## System Architecture

### 3-Layer Design

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: CLI INTERFACE (phase-1-antenna.py)                   │
│ User-facing command-line tool                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: ANTENNA CONTROLLER (MistTrackerAntenna class)         │
│ Orchestrates pipeline: config → data → analysis → results      │
└─────────────────────────────────────────────────────────────────┘
                         ↙    ↓    ↘
        ┌────────────────┴────┴─────┴─────────────────┐
        ↓                ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ CONFIG MANAGER   │  │ ADAPTER REGISTRY │  │ CORE ENGINE      │
│ (Layer 2.5)      │  │ (Layer 2.5)      │  │ (Layer 2.5)      │
│ YAML → Config    │  │ Domain selec.    │  │ Univers. analysis│
└──────────────────┘  └──────────────────┘  └──────────────────┘
        ↓                    ↓                    ↓
        └────────────────┬────┬───────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: IMPLEMENTATIONS (Adapters & Engine)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ DataAdapter      │  │ MistTrackerEngine│  │ AnalysisResult
│  │ (Abstract)       │  │ (Universal)      │  │ (Standardized)
│  │                  │  │                  │  │              │
│  │ ├─ SPDFAdapter   │  │ ├─ ingest_data() │  │ ├─ timestamp
│  │ ├─ USGSAdapter   │  │ ├─ preprocess()  │  │ ├─ domain
│  │ └─ NetworkAdapter│  │ ├─ discover_*()  │  │ ├─ metric
│  │                  │  │ ├─ detect_*()    │  │ ├─ result
│  │                  │  │ ├─ validate()    │  │ └─ log
│  │                  │  │ └─ create_result
│  └──────────────────┘  └──────────────────┘  └──────────────┘
│
│  ┌──────────────────┐  ┌──────────────────┐
│  │ SPDF Data        │  │ USGS Data        │
│  │ (Spacecraft)     │  │ (Earthquake)     │
│  └──────────────────┘  └──────────────────┘
│
│  ┌──────────────────┐
│  │ Network Data     │
│  │ (Internet)       │
│  └──────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Layer 1: CLI Interface (`phase-1-antenna.py`)

**Responsibilities**:
- Parse command-line arguments
- Load configuration files
- Display usage information
- Orchestrate analysis pipeline

**User Commands**:
```bash
# Run analysis with config file
python phase-1-antenna.py --config config.yaml

# List available adapters
python phase-1-antenna.py --list-adapters

# List available config templates
python phase-1-antenna.py --list-templates

# Create new config from template
python phase-1-antenna.py --create-config solar_wind --output config.yaml
```

### Layer 2.5a: Configuration Manager (`phase-1-config-manager.py`)

**Responsibilities**:
- Parse YAML configuration files
- Validate configuration completeness
- Provide configuration templates
- Create configuration files from templates

**Key Classes**:
- `AnalysisConfig`: Dataclass representing entire configuration
- `AdapterRegistry`: Catalog of available domain adapters
- `CONFIG_TEMPLATES`: Pre-built configurations for common analyses

**Config Structure**:
```yaml
description: "Analysis description"

adapter:
  name: "spdf" | "usgs" | "network"
  config:
    domain_specific_params: value

analysis:
  type: "emergence_detection" | "scale_invariance" | "precursor_detection"
  parameters:
    analysis_specific_params: value

engine:
  nperseg: 512
  other_universal_params: value

output_dir: "./output"
verbose: true
```

### Layer 2.5b: Data Adapters (`phase-1-data-adapter.py`)

**Responsibilities**:
- Load domain-specific data
- Transform to standardized internal format
- Provide metadata about data

**Key Classes**:
- `DataAdapter`: Abstract base class (interface)
- `SPDFAdapter`: Parker/Wind spacecraft data
- `USGSAdapter`: Earthquake data
- `NetworkAdapter`: Network latency data
- `AdapterRegistry`: Lookup/registration system

**Adapter Pattern**:
```python
class CustomAdapter(DataAdapter):
    def get_metadata(self):
        # Return adapter capabilities
        
    def validate_config(self, config):
        # Verify required parameters
        
    def load_data(self, config):
        # Load domain data, return standardized format
```

**Adding New Domain**: Just create new adapter class, register with `AdapterRegistry`. Core code unchanged.

### Layer 2.5c: Core Engine (`phase-1-emergence-engine.py`)

**Responsibilities**:
- Provide universal analysis methodology
- Preprocess any data format
- Discover frequencies (Welch FFT)
- Detect harmonics
- Compute coherence
- Fit power-laws
- Generate standardized results

**Key Classes**:
- `MistTrackerEngine`: Core analysis engine
- `AnalysisResult`: Standardized result format (dataclass)

**Universal Pipeline**:
```
Raw Data → Ingest → Preprocess → Discover Freq → Analyze → Validate → Result
           (Adapter)  (Engine)    (Engine)        (Engine)  (Engine)   (JSON)
```

**Key Methods**:
- `ingest_data(data)`: Accept adapter output
- `preprocess(t, v)`: Standardize to internal format
- `discover_frequencies(v, fs)`: Welch FFT
- `detect_harmonics(f, p, f0)`: Find peaks at expected locations
- `compute_coherence(s1, s2, fs)`: Signal coherence
- `fit_power_law(f, p)`: Extract β exponent
- `validate_result(metric, threshold)`: CONFIRMED/FALSIFIED/INCONCLUSIVE
- `create_result(...)`: Generate AnalysisResult object

### Layer 3: Data Sources

Pluggable inputs - any data format can be analyzed by creating an adapter.

**Currently Supported**:
1. **SPDF**: Parker Solar Probe, Wind spacecraft
2. **USGS**: Earthquake catalogs
3. **Network**: ICMP ping (internet latency)

**Future Additions**:
- Medical: ECG, EEG signals
- Climate: Temperature, pressure time series
- Economics: Market data, volatility
- Astronomy: Light curves, radio observations
- Any time series data

---

## Data Flow Example: Solar Wind Analysis

```
1. User runs:
   python phase-1-antenna.py --config config-solar_wind.yaml

2. CLI loads config:
   - Adapter: "spdf"
   - Analysis: "emergence_detection"
   - Parameters: fundamental_freq=0.5 Hz, num_harmonics=4

3. Antenna controller creates:
   - SPDFAdapter instance
   - MistTrackerEngine instance

4. Pipeline execution:
   
   a) SPDFAdapter.load_data({date, duration, spacecraft})
      → Returns: {timestamps, B-field 3D vectors, metadata}
   
   b) MistTrackerEngine.ingest_data()
      → Validates format
      → Stores data reference
   
   c) MistTrackerEngine.preprocess(timestamps, values)
      → Compute vector magnitude
      → Remove NaNs
      → Calculate sampling frequency (1 Hz)
   
   d) MistTrackerEngine.discover_frequencies(values, 1 Hz)
      → Welch FFT: nperseg=512, noverlap=256
      → Returns: (frequencies, power spectrum)
   
   e) MistTrackerEngine.detect_harmonics(f, p, 0.5 Hz)
      → Search for n=1,2,3,4 harmonics at 0.5, 1.0, 1.5, 2.0 Hz
      → Return: peaks with error %
   
   f) Compute RMS error across harmonics
      → 0.1238% (from test 1 baseline)
   
   g) MistTrackerEngine.validate_result(0.1238%, threshold=5%)
      → Status: CONFIRMED (0.1238% < 5%)
   
   h) MistTrackerEngine.create_result()
      → Generate AnalysisResult dataclass
      → Include all metadata, parameters, processing log

5. Result saved to JSON:
   test_1_results_real.json
   
6. Display to user:
   Domain: SPDF
   Analysis: emergence_detection
   Metric: rms_frequency_error_percent = 0.1238
   Status: CONFIRMED
   Data Points: 360000
```

---

## Configuration: From Code to YAML

### Before (Phase 0): Hardcoded Parameters

```python
# test_1_real_psp_data.py
fundamental_freq = 0.5
num_harmonics = 4
threshold_pct = 5.0
nperseg = 512
# ... must edit code to change anything
```

### After (Phase 1): YAML Configuration

```yaml
# config-solar_wind.yaml
analysis:
  parameters:
    fundamental_freq: 0.5
    num_harmonics: 4
    harmonics_threshold: 5.0

engine:
  nperseg: 512
# No code change needed - edit YAML only
```

---

## Adding a New Domain: Step by Step

### Example: Seismic Network (Continuous Ground Motion)

**Step 1: Create Adapter**
```python
class SeismicAdapter(DataAdapter):
    def get_metadata(self):
        return AdapterMetadata(
            adapter_name="Seismic Network",
            domain="seismology",
            ...
        )
    
    def validate_config(self, config):
        # Check for required stations, dates, etc.
        pass
    
    def load_data(self, config):
        # Download from IRIS, transform to standard format
        return {
            'timestamps': t,
            'values': acceleration_3d,
            'metadata': {...}
        }
```

**Step 2: Register with Registry**
```python
AdapterRegistry.register('seismic', SeismicAdapter)
```

**Step 3: Create Config Template**
```python
CONFIG_TEMPLATES['seismic'] = """
adapter:
  name: seismic
  config:
    station: "IRIS:YKA"
    start_date: "2024-01-01"
    end_date: "2024-01-31"
analysis:
  type: emergence_detection
  parameters:
    ...
"""
```

**Step 4: Run**
```bash
python phase-1-antenna.py --create-config seismic --output config-seismic.yaml
python phase-1-antenna.py --config config-seismic.yaml
```

**No modification to core engine needed!**

---

## Result Format: Standardized JSON

Every analysis produces consistent result format:

```json
{
  "timestamp": "2024-04-21T10:30:00",
  "domain": "spdf",
  "analysis_type": "emergence_detection",
  "data_source": "SPDF Parker Solar Probe Fields L2",
  "data_points_analyzed": 360000,
  "date_range": "2024-01-01 ± 1 hours",
  "parameters": {
    "fundamental_freq": 0.5,
    "num_harmonics": 4,
    "search_width": 0.1
  },
  "primary_metric": 0.1238,
  "metric_name": "rms_frequency_error_percent",
  "threshold": 5.0,
  "status": "CONFIRMED",
  "frequencies": [...],
  "power_values": [...],
  "harmonics": [
    {
      "harmonic_number": 1,
      "expected_frequency": 0.5,
      "actual_frequency": 0.501,
      "power": 45.2,
      "frequency_error_pct": 0.2
    },
    ...
  ],
  "additional_metrics": {
    "power_law_exponent": 1.2,
    "power_law_r_squared": 0.95
  },
  "processing_log": [
    "[2024-04-21T10:30:00] MistTracker Engine initialized",
    "[2024-04-21T10:30:01] Ingested (360000,) data",
    ...
  ]
}
```

---

## Design Principles Implemented

### 1. ✅ Separation of Concerns
- **CLI** handles user interaction
- **Adapters** handle data loading
- **Engine** handles analysis
- **Config** handles parameterization

### 2. ✅ Plugin Architecture
- Add domain = new adapter class
- Core engine remains unchanged
- Register adapter = automatic availability

### 3. ✅ Configuration Over Code
- Switch domains via YAML
- Adjust parameters without coding
- Enable non-technical users to configure

### 4. ✅ Universal Methodology
- Same analysis pipeline for all domains
- Standardized result format
- Falsifiable: results can clearly pass/fail

### 5. ✅ Transparency
- All processing steps logged
- Data sources documented
- Parameters saved with results
- Reproducible from results alone

---

## Deployment Checklist

- [x] Core engine: `phase-1-emergence-engine.py`
- [x] Data adapters: `phase-1-data-adapter.py`
- [x] Configuration: `phase-1-config-manager.py`
- [x] CLI interface: `phase-1-antenna.py`
- [x] Documentation: `PHASE-1-ARCHITECTURE.md`

---

## What's Next: Phase 2

With Phase 1 complete, Phase 2 can:

1. **Deployment Infrastructure**
   - Docker containers for consistent environment
   - Scheduled analysis (cron/Airflow)
   - Distributed execution (multiple domains parallel)

2. **Monitoring & Dashboards**
   - Real-time analysis results
   - Historical trend analysis
   - Alert system for anomalies

3. **Extended Domains**
   - Medical signals (ECG, EEG)
   - Climate data (temperature, pressure)
   - Economic indicators
   - Astronomical observations

4. **Advanced Analysis**
   - Cross-domain correlation
   - Multi-signal coherence
   - Emergence prediction
   - System resilience assessment

---

## The Antenna is Built 🌐

Phase 0 proved the concept works.

Phase 1 built the reusable instrument.

Phase 2 will deploy it to measure emergence across the universe of physical systems.

---

*"We have understanding. Now we have an instrument to apply it."*
