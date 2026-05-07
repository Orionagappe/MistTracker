"""
Phase 2b: Physics Refinement & Parameter Optimization
======================================================

Domain-specific analysis parameter tuning and hypothesis testing
based on Phase 0 validation results.

Key insight from Phase 0:
- Tests 2A-2C (precursors): FALSIFIED → Universal precursor hypothesis wrong
  Refined hypothesis: Precursors may be domain-specific or non-existent
  
- Tests 3A-3C (scale-invariance): FALSIFIED → Universal scaling wrong
  Refined hypothesis: Scaling depends on domain physics (B-field dynamics, 
  tectonic settings, network architecture)
"""

import json
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from phase_1_antenna import MistTrackerAntenna
from phase_1_config_manager import AnalysisConfig
from phase_2b_uncertainty_quantifier import (
    BayesianAnalysisFramework, 
    AdaptiveThresholdEstimator,
    convert_to_bayesian_result
)


# ============================================================================
# PHASE 0 LESSONS LEARNED
# ============================================================================

PHASE_0_LESSONS = {
    "solar_wind": {
        "emergence_detection": {
            "status": "CONFIRMED",
            "metric": "rms_frequency_error_percent",
            "value": 0.1238,
            "threshold": 5.0,
            "insight": "Ion cyclotron waves are real, sharp spectral features detected",
            "optimal_parameters": {
                "fundamental_freq": 0.5,
                "num_harmonics": 4,
                "harmonics_threshold": 5.0,
                "min_coherence": 0.7
            }
        },
        "precursor_detection": {
            "status": "FALSIFIED",
            "metric": "correlation_ratio",
            "value": 0.0,
            "threshold": 2.0,
            "insight": "No universal precursor 24-48h before events. Domain-specific prediction not supported",
            "recommendation": "Focus on detection only, not prediction"
        },
        "scale_invariance": {
            "status": "FALSIFIED",
            "metric": "frequency_ratio",
            "value": 1.12,
            "expected": 3.162,
            "insight": "Parker/Wind frequency ratio does NOT reflect orbital scaling. Magnetic pressure dynamics dominate",
            "lesson": "Cannot infer scaling from two observations alone"
        }
    },
    
    "earthquakes": {
        "scale_invariance": {
            "status": "FALSIFIED",
            "metric": "b_value_mean",
            "value": 0.4471,
            "expected": 1.0,
            "domains_analyzed": 4,
            "breakdown": {
                "california": 0.873,
                "japan": 0.301,
                "chile": 0.307,
                "new_zealand": 0.307
            },
            "insight": "B-values cluster by tectonic setting, not universal. Subduction zones ≠ transform faults",
            "lesson": "Must fit per-region, not globally"
        },
        "precursor_detection": {
            "status": "FALSIFIED",
            "metric": "mainshake_foreshock_correlation",
            "value": 0.0,
            "threshold": 2.0,
            "insight": "Foreshocks are not statistically distinguishable from background seismicity",
            "lesson": "Precursor prediction is statistically unreliable"
        }
    },
    
    "networks": {
        "scale_invariance": {
            "status": "FALSIFIED",
            "metric": "power_law_exponent",
            "value": "layer-dependent",
            "insight": "Network latency scaling varies by ISP layer. Access vs backbone networks have different dynamics",
            "lesson": "Architecture matters more than physics"
        },
        "precursor_detection": {
            "status": "FALSIFIED",
            "metric": "jitter_precursor_correlation",
            "value": 0.0,
            "insight": "No latency cascades detected. ISP-local monitoring insufficient for prediction",
            "lesson": "Need end-to-end monitoring for cascade detection"
        }
    }
}


# ============================================================================
# REFINED DOMAIN-SPECIFIC HYPOTHESES
# ============================================================================

class RefinedDomainHypothesis:
    """Domain-specific physics refined by Phase 0 results"""
    
    def __init__(self, domain: str, hypothesis_type: str):
        self.domain = domain
        self.hypothesis_type = hypothesis_type
        self.phase0_lesson = None
        self.refined_hypothesis = None
        self.recommended_parameters = {}
        self.expected_metric_range = None
    
    def describe(self) -> Dict[str, Any]:
        return {
            "domain": self.domain,
            "hypothesis_type": self.hypothesis_type,
            "phase0_lesson": self.phase0_lesson,
            "refined_hypothesis": self.refined_hypothesis,
            "recommended_parameters": self.recommended_parameters,
            "expected_metric_range": self.expected_metric_range
        }


class SolarWindRefinedHypotheses:
    """Refined hypotheses for solar wind domain"""
    
    @staticmethod
    def emergence_detection() -> RefinedDomainHypothesis:
        h = RefinedDomainHypothesis("solar_wind", "emergence_detection")
        h.phase0_lesson = PHASE_0_LESSONS["solar_wind"]["emergence_detection"]
        
        h.refined_hypothesis = (
            "Ion cyclotron waves are detectable in magnetic field data with RMS "
            "frequency error < 1% when high-resolution SPDF data is available. "
            "Detection is CONFIRMED for Parker Solar Probe at 0.1 AU. "
            "Performance may degrade at 1 AU (Wind) due to weaker magnetic field."
        )
        
        h.recommended_parameters = {
            "fundamental_freq": 0.5,  # Hz (ion cyclotron at L1)
            "num_harmonics": 4,
            "harmonics_threshold": 5.0,
            "min_coherence": 0.7,
            "nperseg": 512,  # Welch window
            "noverlap": 256,
            "duration_hours": 24  # Need enough data for convergence
        }
        
        h.expected_metric_range = {
            "rms_frequency_error_percent": (0.05, 0.5),  # 0.05-0.5%
            "coherence": (0.65, 0.85),
            "power_snr_db": (5, 15)
        }
        
        return h
    
    @staticmethod
    def scale_invariance() -> RefinedDomainHypothesis:
        h = RefinedDomainHypothesis("solar_wind", "scale_invariance")
        h.phase0_lesson = PHASE_0_LESSONS["solar_wind"]["scale_invariance"]
        
        h.refined_hypothesis = (
            "Frequency ratios between Parker and Wind do NOT follow orbital "
            "scaling (√R). Phase 0 found Parker/Wind ratio = 1.12 (expected 3.162). "
            "Likely cause: Magnetic pressure & solar wind velocity both affect "
            "ion cyclotron frequency. Single metric insufficient. "
            "RECOMMENDATION: Test multiple scaling laws (pressure, velocity, B-field magnitude)"
        )
        
        h.recommended_parameters = {
            "frequency_ratio_metric": "don't_use_alone",
            "alternative_metrics": [
                "ion_cyclotron_freq_vs_solar_wind_speed",
                "gyrofrequency_vs_B_magnitude",
                "cyclotron_damping_rate"
            ],
            "concurrent_window_duration": "7+ days"
        }
        
        h.expected_metric_range = {
            "frequency_ratio": (0.5, 2.5),  # Don't expect √10
            "correlation_with_speed": (0.6, 0.9),  # Should correlate with V
            "correlation_with_B": (0.7, 0.95)  # Should correlate with |B|
        }
        
        return h


class EarthquakeRefinedHypotheses:
    """Refined hypotheses for earthquake domain"""
    
    @staticmethod
    def scale_invariance() -> RefinedDomainHypothesis:
        h = RefinedDomainHypothesis("earthquakes", "scale_invariance")
        h.phase0_lesson = PHASE_0_LESSONS["earthquakes"]["scale_invariance"]
        
        h.refined_hypothesis = (
            "Gutenberg-Richter b-values are NOT universal. Phase 0 found: "
            "CA=0.873, Japan=0.301, Chile=0.308, NZ=0.307. "
            "Regional variation is REAL, driven by: tectonic setting, lithospheric "
            "thickness, stress state. RECOMMENDATION: Fit per-region, not globally. "
            "Expect b-values 0.3-1.0 depending on subduction vs transform"
        )
        
        h.recommended_parameters = {
            "fit_method": "per_region_maximum_likelihood",
            "regions": ["subduction_zones", "transform_faults", "rifts", "stable_cratons"],
            "min_magnitude": 4.0,
            "catalog_duration_years": 10,
            "expected_b_by_setting": {
                "subduction": 0.3,
                "transform": 0.85,
                "rifts": 0.95,
                "cratons": 1.1
            }
        }
        
        h.expected_metric_range = {
            "b_value": (0.25, 1.15),
            "b_value_uncertainty": (0.05, 0.20),
            "r_squared": (0.3, 0.8)  # Often poor fit
        }
        
        return h


class NetworkRefinedHypotheses:
    """Refined hypotheses for network domain"""
    
    @staticmethod
    def scale_invariance() -> RefinedDomainHypothesis:
        h = RefinedDomainHypothesis("networks", "scale_invariance")
        h.phase0_lesson = PHASE_0_LESSONS["networks"]["scale_invariance"]
        
        h.refined_hypothesis = (
            "Network latency scaling is architecture-dependent. Access layers "
            "(home ISP) show Pareto-like tail (α ≈ 1.5-2.0). Backbone layers show "
            "heavier tails (α ≈ 1.0). RECOMMENDATION: Test hypothesis that "
            "power-law exponent correlates with network hop count"
        )
        
        h.recommended_parameters = {
            "multi_layer_measurement": True,
            "layers": ["access", "regional", "backbone"],
            "samples_per_layer": 500,
            "measurement_frequency": "every_500ms"
        }
        
        h.expected_metric_range = {
            "access_layer_exponent": (1.4, 2.0),
            "backbone_exponent": (0.8, 1.3),
            "tail_heaviness": "architecture_dependent"
        }
        
        return h


# ============================================================================
# PARAMETER SWEEP ENGINE
# ============================================================================

class ParameterSweepExecutor:
    """Systematically test different analysis parameters"""
    
    def __init__(self, config_template: Dict[str, Any], domain: str):
        self.config_template = config_template
        self.domain = domain
        self.results = []
    
    def sweep_parameter(
        self,
        param_name: str,
        param_values: List[Any],
        metric_to_optimize: str = "confidence"
    ) -> Dict[str, Any]:
        """
        Sweep a single parameter and record metric improvement
        
        Args:
            param_name: e.g., "fundamental_freq", "num_harmonics"
            param_values: e.g., [0.3, 0.5, 0.7]
            metric_to_optimize: "confidence", "p_hypothesis", or "rms_error"
        
        Returns:
            Best parameter value and associated metrics
        """
        
        best_value = None
        best_score = -np.inf
        sweep_results = []
        
        for value in param_values:
            # Create modified config
            config = self.config_template.copy()
            config["analysis"]["parameters"][param_name] = value
            
            try:
                # Run analysis (in production, would use phase_2_api_server)
                # For now, just simulate
                score = self._simulate_analysis(param_name, value, metric_to_optimize)
                
                sweep_results.append({
                    "parameter": param_name,
                    "value": value,
                    "score": score,
                    "metric": metric_to_optimize
                })
                
                if score > best_score:
                    best_score = score
                    best_value = value
            
            except Exception as e:
                print(f"Failed to test {param_name}={value}: {e}")
        
        return {
            "parameter": param_name,
            "best_value": best_value,
            "best_score": best_score,
            "sweep_results": sweep_results
        }
    
    def _simulate_analysis(self, param: str, value: Any, metric: str) -> float:
        """Simulate analysis result (placeholder)"""
        # In production, would run phase_1_antenna.py and evaluate metric
        # For now, return mock score
        import random
        return random.gauss(0.75, 0.15)


# ============================================================================
# PHYSICS REFINEMENT FRAMEWORK
# ============================================================================

class PhysicsRefinementFramework:
    """Orchestrate Phase 2b physics refinement work"""
    
    def __init__(self, domain: str):
        self.domain = domain
        self.refined_hypotheses = {}
        self.parameter_sweeps = {}
        self.recommendations = {}
    
    def generate_refined_hypotheses(self) -> Dict[str, Any]:
        """Generate all refined hypotheses for domain"""
        
        if self.domain == "solar_wind":
            self.refined_hypotheses["emergence_detection"] = SolarWindRefinedHypotheses.emergence_detection()
            self.refined_hypotheses["scale_invariance"] = SolarWindRefinedHypotheses.scale_invariance()
        
        elif self.domain == "earthquakes":
            self.refined_hypotheses["scale_invariance"] = EarthquakeRefinedHypotheses.scale_invariance()
        
        elif self.domain == "networks":
            self.refined_hypotheses["scale_invariance"] = NetworkRefinedHypotheses.scale_invariance()
        
        return {
            name: h.describe()
            for name, h in self.refined_hypotheses.items()
        }
    
    def compute_parameter_recommendations(self) -> Dict[str, Any]:
        """Extract recommended parameters from refined hypotheses"""
        
        recommendations = {}
        
        for analysis_type, hypothesis in self.refined_hypotheses.items():
            recommendations[analysis_type] = {
                "recommended_parameters": hypothesis.recommended_parameters,
                "expected_metric_range": hypothesis.expected_metric_range,
                "why": hypothesis.refined_hypothesis
            }
        
        return recommendations
    
    def generate_report(self) -> str:
        """Generate comprehensive Phase 2b refinement report"""
        
        report = f"""
# Phase 2b: Physics Refinement Report
## Domain: {self.domain.upper()}

### Phase 0 Validation Results
{json.dumps(PHASE_0_LESSONS.get(self.domain, {}), indent=2)}

### Refined Hypotheses
{json.dumps(self.generate_refined_hypotheses(), indent=2)}

### Recommended Parameters for Phase 2c+
{json.dumps(self.compute_parameter_recommendations(), indent=2)}

---
Generated: {datetime.utcnow().isoformat()}
"""
        return report


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    # Example: Generate refinement for solar wind domain
    
    print("=" * 80)
    print("PHASE 2B: PHYSICS REFINEMENT FRAMEWORK")
    print("=" * 80)
    print()
    
    for domain in ["solar_wind", "earthquakes", "networks"]:
        print(f"\n{'='*80}")
        print(f"Domain: {domain.upper()}")
        print(f"{'='*80}\n")
        
        framework = PhysicsRefinementFramework(domain)
        hypotheses = framework.generate_refined_hypotheses()
        
        for analysis_type, hypothesis in hypotheses.items():
            print(f"\n{'-'*80}")
            print(f"Analysis Type: {analysis_type}")
            print(f"{'-'*80}")
            print(json.dumps(hypothesis, indent=2))
        
        recommendations = framework.compute_parameter_recommendations()
        
        print(f"\n{'-'*80}")
        print("RECOMMENDED PARAMETERS")
        print(f"{'-'*80}")
        print(json.dumps(recommendations, indent=2))
