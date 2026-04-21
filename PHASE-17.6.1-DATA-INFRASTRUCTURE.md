# PHASE 17.6.1: Data Capture & Analysis Infrastructure
## Structured Result Collection for Phase 17 Validation

**Classification:** Development & Testing (X.X Notation)  
**Parent Phase:** Phase 17.5 (USB Iteration System)  
**Purpose:** Enable proper Phase 17 validation through structured data capture  
**Critical Blocker Resolution:** Terminal output context window limitations  
**Target:** May 2026 completion  

---

## Problem Statement

**Current Blocker:**
Terminal context windows are insufficient for analyzing iteration results. Even with physical USB access, output gets truncated, preventing:
- Proper Phase 17 prediction accuracy assessment
- Hardware fitness score validation
- Multi-iteration trend analysis
- Threat-adaptive encryption parameter calibration (Phase 60)
- Phase 59 competition metrics foundation

**Root Cause:**
Relying on terminal stdout/stderr for structured data creates lossy, truncated output that cannot be analyzed comprehensively.

**Solution:**
Build independent data capture, storage, and analysis infrastructure that bypasses terminal limitations entirely.

---

## Architecture Overview

### Data Flow (Terminal-Independent)

```
Phase 17 Iteration Execution
    ↓
Structured JSON Result Capture
├── Prediction data
├── Hardware fitness scores
├── Execution timing
└── Environmental context
    ↓
Immutable Result Storage (File System)
├── Per-iteration files
├── Central result log
└── Metadata index
    ↓
Analysis Engine (File-Based)
├── Parse stored results
├── Calculate accuracy metrics
├── Generate trend analysis
└── Produce reports
```

### Key Principle
**No dependency on terminal output.** All data flows through file system directly.

---

## Component 1: Structured Result Capture (Python)

### File: `result-capture.py`

**Purpose:** Capture and structure all iteration output into standardized JSON format.

```python
#!/usr/bin/env python3
"""
Phase 17.6.1: Result Capture Module
Structured JSON storage for iteration results
"""

import json
import time
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

class ResultCapture:
    """Capture and store iteration results in standardized format."""
    
    def __init__(self, results_dir: str):
        """Initialize result capture system."""
        self.results_dir = Path(results_dir)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.current_iteration = None
        self.start_time = None
    
    def begin_iteration(self, iteration_id: str, metadata: Dict[str, Any]):
        """Begin capturing a new iteration."""
        self.current_iteration = {
            "iteration_id": iteration_id,
            "timestamp": datetime.utcnow().isoformat(),
            "start_time": time.time(),
            "metadata": metadata,
            "hardware": self._capture_hardware_info(),
            "predictions": [],
            "hardware_fitness": None,
            "execution_log": [],
            "errors": [],
            "performance": {}
        }
        self.start_time = time.time()
    
    def capture_prediction(self, domain: str, prediction: Dict[str, Any]):
        """Capture a single Phase 17 prediction."""
        if not self.current_iteration:
            raise RuntimeError("No active iteration")
        
        prediction_record = {
            "timestamp": time.time(),
            "domain": domain,
            "confidence": prediction.get("confidence", 0),
            "prediction_vector": prediction.get("vector", []),
            "metadata": prediction.get("metadata", {})
        }
        self.current_iteration["predictions"].append(prediction_record)
    
    def capture_hardware_fitness(self, fitness_data: Dict[str, Any]):
        """Capture hardware fitness validator results."""
        if not self.current_iteration:
            raise RuntimeError("No active iteration")
        
        self.current_iteration["hardware_fitness"] = {
            "timestamp": time.time(),
            "cpu_score": fitness_data.get("cpu_score", 0),
            "memory_score": fitness_data.get("memory_score", 0),
            "io_score": fitness_data.get("io_score", 0),
            "thermal_score": fitness_data.get("thermal_score", 0),
            "overall_fitness": fitness_data.get("overall", 0),
            "details": fitness_data.get("details", {})
        }
    
    def log_execution(self, level: str, message: str, context: Optional[Dict] = None):
        """Log execution event (not to terminal, to structured store)."""
        if not self.current_iteration:
            raise RuntimeError("No active iteration")
        
        log_entry = {
            "timestamp": time.time(),
            "level": level,  # DEBUG, INFO, WARNING, ERROR
            "message": message,
            "context": context or {}
        }
        self.current_iteration["execution_log"].append(log_entry)
    
    def capture_error(self, error_type: str, error_msg: str, traceback: Optional[str] = None):
        """Capture error details."""
        if not self.current_iteration:
            raise RuntimeError("No active iteration")
        
        error_record = {
            "timestamp": time.time(),
            "type": error_type,
            "message": error_msg,
            "traceback": traceback
        }
        self.current_iteration["errors"].append(error_record)
    
    def capture_performance(self, metric_name: str, value: float, unit: str = "ms"):
        """Capture performance metric."""
        if not self.current_iteration:
            raise RuntimeError("No active iteration")
        
        self.current_iteration["performance"][metric_name] = {
            "value": value,
            "unit": unit,
            "timestamp": time.time()
        }
    
    def finalize_iteration(self) -> str:
        """Finalize iteration capture and save to disk."""
        if not self.current_iteration:
            raise RuntimeError("No active iteration")
        
        # Add completion info
        self.current_iteration["end_time"] = time.time()
        self.current_iteration["duration_seconds"] = (
            self.current_iteration["end_time"] - 
            self.current_iteration["start_time"]
        )
        self.current_iteration["prediction_count"] = len(
            self.current_iteration["predictions"]
        )
        self.current_iteration["error_count"] = len(
            self.current_iteration["errors"]
        )
        
        # Generate file path
        iteration_id = self.current_iteration["iteration_id"]
        result_file = self.results_dir / f"{iteration_id}-result.json"
        
        # Write with integrity hash
        with open(result_file, 'w') as f:
            json.dump(self.current_iteration, f, indent=2)
        
        # Generate checksum
        checksum = self._calculate_checksum(result_file)
        checksum_file = self.results_dir / f"{iteration_id}-result.sha256"
        checksum_file.write_text(checksum)
        
        # Log to central index
        self._update_index(iteration_id, result_file, checksum)
        
        iteration_copy = self.current_iteration.copy()
        self.current_iteration = None
        
        return str(result_file)
    
    def _capture_hardware_info(self) -> Dict[str, Any]:
        """Capture system hardware information."""
        import platform
        import psutil
        
        return {
            "platform": platform.platform(),
            "processor": platform.processor(),
            "cpu_count": psutil.cpu_count(),
            "total_memory_gb": psutil.virtual_memory().total / (1024**3),
            "disk_free_gb": psutil.disk_usage('/').free / (1024**3)
        }
    
    def _calculate_checksum(self, filepath: Path) -> str:
        """Calculate SHA256 checksum of result file."""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _update_index(self, iteration_id: str, result_file: Path, checksum: str):
        """Update central results index."""
        index_file = self.results_dir / "INDEX.json"
        
        if index_file.exists():
            with open(index_file, 'r') as f:
                index = json.load(f)
        else:
            index = {"iterations": [], "metadata": {}}
        
        index["iterations"].append({
            "iteration_id": iteration_id,
            "result_file": str(result_file),
            "checksum": checksum,
            "indexed_at": datetime.utcnow().isoformat()
        })
        
        index["metadata"]["total_iterations"] = len(index["iterations"])
        index["metadata"]["last_update"] = datetime.utcnow().isoformat()
        
        with open(index_file, 'w') as f:
            json.dump(index, f, indent=2)
```

### Result JSON Schema

```json
{
  "iteration_id": "phase17-iter-001",
  "timestamp": "2026-05-15T10:30:00.123456",
  "start_time": 1715769000.123,
  "end_time": 1715769015.456,
  "duration_seconds": 15.333,
  "metadata": {
    "description": "Domain expansion iteration 1",
    "operator": "system",
    "usb_device": "/dev/sdb"
  },
  "hardware": {
    "platform": "Linux-6.1.0-devuan",
    "processor": "x86_64",
    "cpu_count": 4,
    "total_memory_gb": 16.0,
    "disk_free_gb": 500.0
  },
  "predictions": [
    {
      "timestamp": 1715769000.234,
      "domain": "atomic_physics",
      "confidence": 0.87,
      "prediction_vector": [0.234, 0.567, 0.891, ...],
      "metadata": {
        "model_version": "17.5-beta",
        "feature_count": 1024
      }
    }
  ],
  "hardware_fitness": {
    "timestamp": 1715769010.500,
    "cpu_score": 0.92,
    "memory_score": 0.85,
    "io_score": 0.78,
    "thermal_score": 0.95,
    "overall_fitness": 0.875,
    "details": {
      "cpu_usage_percent": 45.2,
      "memory_usage_percent": 62.1,
      "io_wait_percent": 8.3
    }
  },
  "execution_log": [
    {
      "timestamp": 1715769000.150,
      "level": "INFO",
      "message": "Iteration started",
      "context": {}
    },
    {
      "timestamp": 1715769005.234,
      "level": "INFO",
      "message": "Phase 17 predictions complete",
      "context": {
        "predictions_generated": 12,
        "average_confidence": 0.842
      }
    }
  ],
  "errors": [],
  "performance": {
    "phase17_prediction_ms": {
      "value": 5234.5,
      "unit": "ms",
      "timestamp": 1715769005.234
    },
    "hardware_validation_ms": {
      "value": 8102.3,
      "unit": "ms",
      "timestamp": 1715769010.500
    }
  },
  "prediction_count": 12,
  "error_count": 0
}
```

---

## Component 2: Analysis Engine (Python)

### File: `result-analyzer.py`

**Purpose:** Analyze stored results independent of terminal.

```python
#!/usr/bin/env python3
"""
Phase 17.6.1: Result Analysis Engine
Comprehensive metrics and trend analysis
"""

import json
import statistics
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class ResultAnalyzer:
    """Analyze stored iteration results."""
    
    def __init__(self, results_dir: str):
        self.results_dir = Path(results_dir)
        self.index_file = self.results_dir / "INDEX.json"
    
    def load_index(self) -> Dict[str, Any]:
        """Load the results index."""
        if not self.index_file.exists():
            raise FileNotFoundError("No results index found")
        
        with open(self.index_file, 'r') as f:
            return json.load(f)
    
    def load_iteration(self, iteration_id: str) -> Dict[str, Any]:
        """Load a specific iteration result."""
        result_file = self.results_dir / f"{iteration_id}-result.json"
        
        if not result_file.exists():
            raise FileNotFoundError(f"No result found for {iteration_id}")
        
        with open(result_file, 'r') as f:
            return json.load(f)
    
    def analyze_prediction_accuracy(self) -> Dict[str, Any]:
        """Analyze prediction confidence and accuracy."""
        index = self.load_index()
        all_confidences = []
        predictions_by_domain = {}
        
        for iteration in index["iterations"]:
            result = self.load_iteration(iteration["iteration_id"])
            
            for prediction in result["predictions"]:
                all_confidences.append(prediction["confidence"])
                domain = prediction["domain"]
                
                if domain not in predictions_by_domain:
                    predictions_by_domain[domain] = []
                predictions_by_domain[domain].append(prediction["confidence"])
        
        return {
            "total_predictions": len(all_confidences),
            "average_confidence": statistics.mean(all_confidences),
            "median_confidence": statistics.median(all_confidences),
            "stdev_confidence": statistics.stdev(all_confidences) if len(all_confidences) > 1 else 0,
            "confidence_range": (min(all_confidences), max(all_confidences)),
            "by_domain": {
                domain: {
                    "count": len(confs),
                    "average": statistics.mean(confs),
                    "median": statistics.median(confs)
                }
                for domain, confs in predictions_by_domain.items()
            }
        }
    
    def analyze_hardware_fitness_trends(self) -> Dict[str, Any]:
        """Analyze hardware fitness scores over iterations."""
        index = self.load_index()
        fitness_scores = []
        
        for iteration in index["iterations"]:
            result = self.load_iteration(iteration["iteration_id"])
            
            if result["hardware_fitness"]:
                fitness_scores.append({
                    "iteration_id": iteration["iteration_id"],
                    "timestamp": result["hardware_fitness"]["timestamp"],
                    "overall_fitness": result["hardware_fitness"]["overall_fitness"],
                    "cpu_score": result["hardware_fitness"]["cpu_score"],
                    "memory_score": result["hardware_fitness"]["memory_score"],
                    "io_score": result["hardware_fitness"]["io_score"],
                    "thermal_score": result["hardware_fitness"]["thermal_score"]
                })
        
        if not fitness_scores:
            return {"error": "No hardware fitness data"}
        
        # Calculate trends
        overall_scores = [f["overall_fitness"] for f in fitness_scores]
        cpu_scores = [f["cpu_score"] for f in fitness_scores]
        
        return {
            "total_measurements": len(fitness_scores),
            "overall_fitness": {
                "average": statistics.mean(overall_scores),
                "median": statistics.median(overall_scores),
                "trend": "improving" if overall_scores[-1] > overall_scores[0] else "declining",
                "scores": overall_scores
            },
            "cpu_fitness": {
                "average": statistics.mean(cpu_scores),
                "trend": cpu_scores[-1] > cpu_scores[0] if len(cpu_scores) > 1 else "stable"
            },
            "iterations": fitness_scores
        }
    
    def analyze_performance_metrics(self) -> Dict[str, Any]:
        """Analyze execution performance across iterations."""
        index = self.load_index()
        durations = []
        performance_metrics = {}
        
        for iteration in index["iterations"]:
            result = self.load_iteration(iteration["iteration_id"])
            durations.append(result["duration_seconds"])
            
            for metric_name, metric_data in result["performance"].items():
                if metric_name not in performance_metrics:
                    performance_metrics[metric_name] = []
                performance_metrics[metric_name].append(metric_data["value"])
        
        return {
            "total_iterations": len(durations),
            "iteration_duration_seconds": {
                "average": statistics.mean(durations),
                "median": statistics.median(durations),
                "min": min(durations),
                "max": max(durations),
                "stdev": statistics.stdev(durations) if len(durations) > 1 else 0
            },
            "performance_metrics": {
                name: {
                    "average_ms": statistics.mean(values),
                    "median_ms": statistics.median(values),
                    "min_ms": min(values),
                    "max_ms": max(values)
                }
                for name, values in performance_metrics.items()
            }
        }
    
    def analyze_errors(self) -> Dict[str, Any]:
        """Analyze errors across all iterations."""
        index = self.load_index()
        error_summary = {
            "total_iterations": len(index["iterations"]),
            "iterations_with_errors": 0,
            "total_errors": 0,
            "error_types": {},
            "failed_iterations": []
        }
        
        for iteration in index["iterations"]:
            result = self.load_iteration(iteration["iteration_id"])
            
            if result["errors"]:
                error_summary["iterations_with_errors"] += 1
                error_summary["total_errors"] += len(result["errors"])
                error_summary["failed_iterations"].append(iteration["iteration_id"])
                
                for error in result["errors"]:
                    error_type = error["type"]
                    if error_type not in error_summary["error_types"]:
                        error_summary["error_types"][error_type] = 0
                    error_summary["error_types"][error_type] += 1
        
        return error_summary
    
    def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Generate comprehensive analysis report."""
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "prediction_analysis": self.analyze_prediction_accuracy(),
            "hardware_fitness": self.analyze_hardware_fitness_trends(),
            "performance_metrics": self.analyze_performance_metrics(),
            "error_analysis": self.analyze_errors()
        }
    
    def save_report(self, report: Dict[str, Any], report_name: str = "analysis-report.json"):
        """Save analysis report to file."""
        report_file = self.results_dir / report_name
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        return str(report_file)
```

---

## Component 3: Integration with Phase 17.5

### Modified `run-validator.sh` Integration

```bash
#!/bin/bash
# Phase 17.6.1: Result capture integration

# Setup result capture
RESULT_CAPTURE_DIR="/usb/results/structured"
mkdir -p "$RESULT_CAPTURE_DIR"

# Import Python result capture
python3 -c "
from result_capture import ResultCapture

# Initialize capture
capture = ResultCapture('$RESULT_CAPTURE_DIR')
capture.begin_iteration('phase17-iter-$(date +%s)', {
    'description': 'USB iteration',
    'timestamp': '$(date -Iseconds)'
})

# All stdout/stderr still goes to terminal AND captured to log
"

# Run Phase 17 validators with result capture
# (Validators write directly to ResultCapture, not stdout)

python3 run_validators_with_capture.py

# Finalize results
python3 -c "
from result_capture import ResultCapture

capture = ResultCapture('$RESULT_CAPTURE_DIR')
result_file = capture.finalize_iteration()
echo \"Results saved to: \$result_file\"
"

# Generate analysis
python3 -c "
from result_analyzer import ResultAnalyzer

analyzer = ResultAnalyzer('$RESULT_CAPTURE_DIR')
report = analyzer.generate_comprehensive_report()
report_file = analyzer.save_report(report)
echo \"Analysis report: \$report_file\"
"
```

---

## Component 4: Verification & Integrity

### File: `result-verifier.py`

```python
#!/usr/bin/env python3
"""Result verification and integrity checking."""

import json
import hashlib
from pathlib import Path

class ResultVerifier:
    """Verify integrity of stored results."""
    
    @staticmethod
    def verify_checksum(results_dir: str, iteration_id: str) -> bool:
        """Verify result file checksum."""
        results_dir = Path(results_dir)
        result_file = results_dir / f"{iteration_id}-result.json"
        checksum_file = results_dir / f"{iteration_id}-result.sha256"
        
        if not result_file.exists() or not checksum_file.exists():
            return False
        
        # Calculate current checksum
        sha256_hash = hashlib.sha256()
        with open(result_file, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        current_checksum = sha256_hash.hexdigest()
        stored_checksum = checksum_file.read_text().strip()
        
        return current_checksum == stored_checksum
    
    @staticmethod
    def verify_all_results(results_dir: str) -> Dict[str, bool]:
        """Verify all result files."""
        results_dir = Path(results_dir)
        index_file = results_dir / "INDEX.json"
        
        if not index_file.exists():
            return {"error": "No index found"}
        
        with open(index_file, 'r') as f:
            index = json.load(f)
        
        verification_results = {}
        for iteration in index["iterations"]:
            iteration_id = iteration["iteration_id"]
            is_valid = ResultVerifier.verify_checksum(
                results_dir, 
                iteration_id
            )
            verification_results[iteration_id] = is_valid
        
        return verification_results
```

---

## Usage Workflow

### During Iteration Execution

```bash
# 1. Start iteration with result capture
python3 -c "
from result_capture import ResultCapture
capture = ResultCapture('/usb/results/structured')
capture.begin_iteration('phase17-iter-001', {
    'domain': 'atomic_physics',
    'test_run': True
})
"

# 2. Execute Phase 17 validators (data flows through ResultCapture)
python3 phase17_predictor.py --capture

# 3. Finalize iteration
python3 -c "
from result_capture import ResultCapture
capture = ResultCapture('/usb/results/structured')
capture.finalize_iteration()
"

# 4. Analyze results (independent of terminal)
python3 -c "
from result_analyzer import ResultAnalyzer
analyzer = ResultAnalyzer('/usb/results/structured')
report = analyzer.generate_comprehensive_report()
analyzer.save_report(report)
"
```

### Post-Iteration Analysis

```bash
# Verify all results
python3 -c "
from result_verifier import ResultVerifier
results = ResultVerifier.verify_all_results('/usb/results/structured')
print(json.dumps(results, indent=2))
"

# Generate trend analysis
python3 -c "
from result_analyzer import ResultAnalyzer
analyzer = ResultAnalyzer('/usb/results/structured')
trends = analyzer.analyze_prediction_accuracy()
print(json.dumps(trends, indent=2))
"
```

---

## Success Criteria

✅ **Data Integrity**
- All iteration results stored in structured JSON
- SHA256 checksums for verification
- Central index maintains iteration tracking
- No data loss from terminal truncation

✅ **Complete Context**
- Hardware information captured
- Execution timestamps recorded
- Performance metrics tracked
- Full error logs preserved

✅ **Analysis Capability**
- Prediction accuracy measured
- Hardware fitness trends analyzed
- Performance metrics calculated
- Error patterns identified

✅ **Terminal Independence**
- Results never depend on terminal output
- Analysis runs offline from stored data
- Multi-iteration trends analyzable
- Reports generated as files

✅ **Integration Ready**
- Works with Phase 17.5 USB system
- Provides data for Phase 60 threat scoring
- Feeds Phase 59 competition metrics
- Enables proper validation

---

## Deliverables (Phase 17.6.1)

1. **result-capture.py** - Structured result capture system
2. **result-analyzer.py** - Analysis engine with metrics
3. **result-verifier.py** - Integrity verification
4. **Integration documentation** - How to use with Phase 17.5
5. **Example reports** - Sample analysis output

---

## Timeline

**Week 1:**
- [ ] result-capture.py implementation (100% complete)
- [ ] JSON schema finalization
- [ ] Unit tests (basic capture scenarios)

**Week 2:**
- [ ] result-analyzer.py implementation
- [ ] Analysis metrics validation
- [ ] Report generation testing

**Week 3:**
- [ ] Integration with Phase 17.5 scripts
- [ ] End-to-end workflow testing
- [ ] Documentation complete

**Target Completion:** Mid-May 2026

---

## Benefits

✅ **Unblocks Phase 17 Validation** - Now possible with complete data  
✅ **Enables Phase 60 Development** - Real threat scoring data available  
✅ **Supports Phase 59 Metrics** - Competition data infrastructure ready  
✅ **Future-Proof** - Structured format scales to many iterations  
✅ **Audit Trail** - Complete, verifiable history of all iterations  

---

**Classification:** Development & Testing (Phase X.X)  
**Status:** Ready for implementation (May 2026)  
**Priority:** CRITICAL - Resolves infrastructure blocker  
**Not for Git Distribution**
