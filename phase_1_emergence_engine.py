#!/usr/bin/env python3
"""
MistTracker Phase 1: Universal Emergence Detection Engine

The core antenna - domain-agnostic methodology for detecting
emergence patterns across all physical systems.

Design: Domain adapters provide data, engine analyzes universally.
"""

import json
import numpy as np
from scipy import signal
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
from pathlib import Path


@dataclass
class AnalysisResult:
    """Standardized result format for all analyses."""
    
    # Metadata
    timestamp: str
    domain: str
    analysis_type: str  # "precursor", "scale_invariance", etc.
    
    # Data source information
    data_source: str
    data_points_analyzed: int
    date_range: Optional[str]
    
    # Analysis parameters
    parameters: Dict[str, Any]
    
    # Results
    primary_metric: float  # Domain-specific metric (ρ, β, RMS, etc.)
    metric_name: str  # What is this metric called?
    threshold: float  # What's the threshold for success?
    status: str  # "CONFIRMED", "FALSIFIED", "INCONCLUSIVE"
    
    # Supporting data
    frequencies: Optional[List[float]] = None
    power_values: Optional[List[float]] = None
    harmonics: Optional[List[float]] = None
    additional_metrics: Optional[Dict[str, float]] = None
    
    # Provenance
    processing_log: List[str] = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)
    
    def to_json(self, filepath: Path) -> None:
        """Save results to JSON file."""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    def __str__(self) -> str:
        return (
            f"{self.domain.upper()} Emergence Analysis\n"
            f"Type: {self.analysis_type}\n"
            f"Metric: {self.metric_name} = {self.primary_metric:.6f}\n"
            f"Threshold: {self.threshold}\n"
            f"Status: {self.status}\n"
            f"Data Points: {self.data_points_analyzed}"
        )


class MistTrackerEngine:
    """
    Universal emergence detection engine.
    
    Methodology:
    1. Ingest domain-specific data via adapter
    2. Preprocess to standard internal format
    3. Apply universal analysis (frequency discovery, coherence, scaling)
    4. Validate results against domain hypotheses
    5. Export standardized results
    """
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.log = []
        self._log("MistTracker Engine initialized")
    
    def _log(self, message: str) -> None:
        """Log processing steps."""
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] {message}"
        self.log.append(log_entry)
        if self.verbose:
            print(log_entry)
    
    # =========================================================================
    # STAGE 1: DATA INGESTION (Via adapter)
    # =========================================================================
    
    def ingest_data(self, data: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """
        Accept data from adapter.
        
        Expected format:
        {
            'timestamps': 1D array of times,
            'values': 1D or ND array of measurements,
            'metadata': {
                'domain': str,
                'data_source': str,
                'units': str,
                'sampling_rate': float (optional),
            }
        }
        """
        if 'values' not in data:
            raise ValueError("Data must contain 'values' key")
        
        self._log(f"Ingested {data['values'].shape} data")
        return data
    
    # =========================================================================
    # STAGE 2: PREPROCESSING
    # =========================================================================
    
    def preprocess(self, 
                   timestamps: np.ndarray,
                   values: np.ndarray) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Standardize data format.
        
        Returns: (timestamps, values, sampling_frequency)
        """
        # Ensure 1D
        if values.ndim > 1:
            # For multi-dimensional data, flatten or extract magnitude
            if values.shape[1] == 3:
                # Vector data: compute magnitude
                values = np.linalg.norm(values, axis=1)
                self._log("Converted 3D vector to magnitude")
        
        # Remove NaNs
        valid_mask = ~(np.isnan(timestamps) | np.isnan(values))
        timestamps = timestamps[valid_mask]
        values = values[valid_mask]
        
        # Compute sampling frequency
        if len(timestamps) > 1:
            dt = np.mean(np.diff(timestamps))
            fs = 1.0 / dt if dt > 0 else 1.0
        else:
            fs = 1.0
        
        self._log(f"Preprocessed: {len(values)} points, fs={fs:.3f} Hz")
        return timestamps, values, fs
    
    # =========================================================================
    # STAGE 3: FREQUENCY DISCOVERY (Universal)
    # =========================================================================
    
    def discover_frequencies(self, 
                            values: np.ndarray, 
                            fs: float,
                            nperseg: Optional[int] = None,
                            noverlap: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute power spectral density using Welch method.
        
        This is the universal methodology for finding emergence signatures.
        
        Returns: (frequencies, power_density)
        """
        if nperseg is None:
            # Default: window = sqrt(N) samples
            nperseg = max(16, int(np.sqrt(len(values))))
        
        if noverlap is None:
            noverlap = nperseg // 2
        
        frequencies, power = signal.welch(
            values,
            fs=fs,
            nperseg=nperseg,
            noverlap=noverlap
        )
        
        self._log(f"Welch FFT: {len(frequencies)} frequency bins, "
                 f"power range [{power.min():.3e}, {power.max():.3e}]")
        
        return frequencies, power
    
    # =========================================================================
    # STAGE 4: HARMONIC DETECTION
    # =========================================================================
    
    def detect_harmonics(self,
                        frequencies: np.ndarray,
                        power: np.ndarray,
                        fundamental_freq: float,
                        num_harmonics: int = 5,
                        search_width: float = 0.1) -> List[Dict[str, float]]:
        """
        Detect harmonic peaks around expected frequencies.
        
        Args:
            fundamental_freq: Expected fundamental frequency
            num_harmonics: How many harmonics to search for
            search_width: Search window as fraction of expected frequency
        
        Returns: List of detected harmonics with power values
        """
        harmonics = []
        
        for n in range(1, num_harmonics + 1):
            expected_f = n * fundamental_freq
            
            # Search window
            f_min = expected_f * (1 - search_width)
            f_max = expected_f * (1 + search_width)
            
            # Find peak in window
            window_mask = (frequencies >= f_min) & (frequencies <= f_max)
            
            if np.any(window_mask):
                peak_idx = np.argmax(power[window_mask])
                actual_f = frequencies[window_mask][peak_idx]
                peak_power = power[window_mask][peak_idx]
                
                harmonics.append({
                    'harmonic_number': n,
                    'expected_frequency': float(expected_f),
                    'actual_frequency': float(actual_f),
                    'power': float(peak_power),
                    'frequency_error_pct': float(abs(actual_f - expected_f) / expected_f * 100)
                })
        
        self._log(f"Detected {len(harmonics)} harmonics")
        return harmonics
    
    # =========================================================================
    # STAGE 5: COHERENCE ANALYSIS
    # =========================================================================
    
    def compute_coherence(self, 
                         signal1: np.ndarray,
                         signal2: np.ndarray,
                         fs: float) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute magnitude-squared coherence between two signals.
        
        Returns: (frequencies, coherence_values) where coherence ∈ [0, 1]
        """
        f, Cxy = signal.coherence(signal1, signal2, fs=fs, nperseg=256)
        self._log(f"Coherence computed: mean={np.mean(Cxy):.3f}")
        return f, Cxy
    
    # =========================================================================
    # STAGE 6: POWER-LAW ANALYSIS (Scale-Invariance)
    # =========================================================================
    
    def fit_power_law(self, 
                     frequencies: np.ndarray,
                     power: np.ndarray,
                     freq_min: Optional[float] = None,
                     freq_max: Optional[float] = None) -> Tuple[float, float, float]:
        """
        Fit power-law to frequency spectrum: P(f) ~ f^(-β)
        
        Returns: (beta_exponent, r_squared, intercept)
        
        Handles edge cases: empty data, all-zero power, insufficient points.
        """
        try:
            # Filter to frequency range
            if freq_min is not None and freq_max is not None:
                mask = (frequencies >= freq_min) & (frequencies <= freq_max)
                frequencies = frequencies[mask]
                power = power[mask]
            
            # Skip DC component (freq=0) if present
            if len(frequencies) > 0 and frequencies[0] == 0:
                frequencies = frequencies[1:]
                power = power[1:]
            
            # Remove zero/negative power for log
            valid_mask = power > 0
            frequencies = frequencies[valid_mask]
            power = power[valid_mask]
            
            # Check if we have enough valid points
            if len(frequencies) < 3:
                self._log(f"WARNING: Insufficient valid points ({len(frequencies)}) for power-law fit. Returning defaults.")
                return 1.0, 0.0, 0.0
            
            # Log-log fit with error handling
            try:
                # Filter frequencies > 0 for log10
                freq_valid_mask = frequencies > 0
                frequencies_fit = frequencies[freq_valid_mask]
                power_fit = power[freq_valid_mask]
                
                if len(frequencies_fit) < 3:
                    self._log(f"WARNING: Insufficient positive frequencies for fit. Returning defaults.")
                    return 1.0, 0.0, 0.0
                
                log_f = np.log10(frequencies_fit)
                log_p = np.log10(power_fit)
                
                # Polyfit with error handling
                coeffs = np.polyfit(log_f, log_p, 1)
                beta = -coeffs[0]  # Negative slope
                intercept = coeffs[1]
                
                # R-squared
                fit = np.polyval(coeffs, log_f)
                ss_res = np.sum((log_p - fit) ** 2)
                ss_tot = np.sum((log_p - np.mean(log_p)) ** 2)
                r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
                
                self._log(f"Power-law fit: β={beta:.3f}, R²={r_squared:.6f}")
                return beta, r_squared, intercept
            
            except Exception as e:
                self._log(f"WARNING: Polyfit failed: {e}. Returning defaults.")
                return 1.0, 0.0, 0.0
        
        except Exception as e:
            self._log(f"ERROR in fit_power_law: {e}. Returning defaults.")
            return 1.0, 0.0, 0.0
    
    # =========================================================================
    # STAGE 7: VALIDATION & RESULT GENERATION
    # =========================================================================
    
    def validate_result(self,
                       primary_metric: float,
                       threshold: float,
                       metric_name: str = "metric") -> str:
        """
        Validate metric against threshold.
        
        Returns: "CONFIRMED", "FALSIFIED", or "INCONCLUSIVE"
        """
        if metric_name in ["rms_error", "frequency_error"]:
            # Lower is better
            status = "CONFIRMED" if primary_metric < threshold else "FALSIFIED"
        elif metric_name in ["correlation_ratio", "beta_clustering", "coherence"]:
            # Higher is better
            status = "CONFIRMED" if primary_metric > threshold else "FALSIFIED"
        else:
            # Default: check if close to threshold
            status = "INCONCLUSIVE"
        
        self._log(f"Validation: {metric_name}={primary_metric:.6f} vs threshold={threshold} "
                 f"→ {status}")
        return status
    
    def create_result(self,
                     domain: str,
                     analysis_type: str,
                     data_source: str,
                     data_points: int,
                     date_range: Optional[str],
                     primary_metric: float,
                     metric_name: str,
                     threshold: float,
                     parameters: Dict[str, Any],
                     frequencies: Optional[np.ndarray] = None,
                     power: Optional[np.ndarray] = None,
                     harmonics: Optional[List] = None,
                     additional_metrics: Optional[Dict] = None) -> AnalysisResult:
        """Create standardized result object."""
        
        status = self.validate_result(primary_metric, threshold, metric_name)
        
        result = AnalysisResult(
            timestamp=datetime.now().isoformat(),
            domain=domain,
            analysis_type=analysis_type,
            data_source=data_source,
            data_points_analyzed=data_points,
            date_range=date_range,
            parameters=parameters,
            primary_metric=primary_metric,
            metric_name=metric_name,
            threshold=threshold,
            status=status,
            frequencies=frequencies.tolist() if frequencies is not None else None,
            power_values=power.tolist() if power is not None else None,
            harmonics=harmonics,
            additional_metrics=additional_metrics,
            processing_log=self.log.copy()
        )
        
        self._log(f"Result created: {status}")
        return result


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    print("MistTracker Phase 1: Universal Emergence Detection Engine")
    print("=" * 60)
    
    # Example: Create synthetic emergence signal
    print("\n1. Generating test data...")
    t = np.arange(0, 100, 0.01)  # 100 seconds, 100 Hz sampling
    fs = 100.0
    
    # Solar wind-like emergence: 0.5 Hz fundamental with harmonics
    fundamental = 0.5
    emergence_signal = (
        np.sin(2 * np.pi * fundamental * t) +
        0.3 * np.sin(2 * np.pi * 2 * fundamental * t) +
        0.15 * np.sin(2 * np.pi * 3 * fundamental * t) +
        np.random.normal(0, 0.1, len(t))  # Noise
    )
    
    # Initialize engine
    print("\n2. Initializing engine...")
    engine = MistTrackerEngine(verbose=True)
    
    # Preprocess
    print("\n3. Preprocessing...")
    _, values, computed_fs = engine.preprocess(t, emergence_signal)
    
    # Frequency discovery
    print("\n4. Discovering frequencies...")
    frequencies, power = engine.discover_frequencies(values, fs)
    
    # Harmonic detection
    print("\n5. Detecting harmonics...")
    harmonics = engine.detect_harmonics(frequencies, power, fundamental, num_harmonics=3)
    
    # Power-law analysis
    print("\n6. Analyzing power-law...")
    beta, r2, _ = engine.fit_power_law(frequencies, power)
    
    # Create result
    print("\n7. Generating result...")
    result = engine.create_result(
        domain="test",
        analysis_type="emergence_detection",
        data_source="synthetic",
        data_points=len(values),
        date_range=None,
        primary_metric=sum([h['frequency_error_pct'] for h in harmonics]) / len(harmonics),
        metric_name="mean_harmonic_error_pct",
        threshold=5.0,
        parameters={"fundamental_freq": fundamental, "num_harmonics": 3},
        frequencies=frequencies,
        power=power,
        harmonics=harmonics,
        additional_metrics={"beta_exponent": beta, "r_squared": r2}
    )
    
    print("\n" + "=" * 60)
    print(result)
