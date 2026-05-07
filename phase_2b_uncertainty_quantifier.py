"""
Phase 2b: Uncertainty Quantification Framework
===============================================

Bayesian inference layer replacing hard thresholds with posterior distributions,
credible intervals, and adaptive domain-specific thresholds.

Components:
1. BayesianAnalysisFramework: Converts metrics to posterior distributions
2. DomainPhysicsModel: Domain-specific likelihood & priors
3. AdaptiveThresholdEstimator: Learn optimal thresholds from data
4. UncertaintyQuantifier: Compute credible intervals & risk metrics
"""

import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import numpy as np
from scipy import stats
from scipy.special import beta as beta_function
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from phase_1_emergence_engine import AnalysisResult


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class PriorDistribution:
    """Prior belief about a parameter"""
    distribution_type: str  # "normal", "gamma", "beta", "lognormal"
    params: Dict[str, float]  # e.g., {"mu": 0.5, "sigma": 0.1}
    description: str = ""


@dataclass
class MetricDistribution:
    """Posterior distribution of an emergence metric"""
    metric_name: str
    domain: str
    analysis_type: str
    
    # Posterior samples (from MCMC or variational inference)
    posterior_samples: np.ndarray  # Shape: (n_samples,)
    
    # Summary statistics
    mean: float
    std: float
    median: float
    credible_interval_lower: float  # 2.5%
    credible_interval_upper: float  # 97.5%
    
    # Risk metrics
    p_positive: float  # P(metric > 0)
    p_exceeds_threshold: float  # P(metric > threshold)
    
    timestamp: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric_name": self.metric_name,
            "domain": self.domain,
            "analysis_type": self.analysis_type,
            "mean": self.mean,
            "std": self.std,
            "median": self.median,
            "credible_interval": [self.credible_interval_lower, self.credible_interval_upper],
            "p_positive": self.p_positive,
            "p_exceeds_threshold": self.p_exceeds_threshold,
            "timestamp": self.timestamp
        }


@dataclass
class BayesianAnalysisResult:
    """Extended analysis result with uncertainty quantification"""
    job_id: str
    domain: str
    analysis_type: str
    
    # Phase 1 metric
    primary_metric: float
    metric_name: str
    
    # Bayesian posterior
    posterior_mean: float
    posterior_std: float
    credible_interval: Tuple[float, float]
    
    # Decision-making
    verdict: str  # "strongly_confirmed", "confirmed", "uncertain", "falsified", "strongly_falsified"
    confidence: float  # 0-1, how sure we are of verdict
    p_hypothesis: float  # P(true emergence | data)
    
    # Risk assessment
    false_positive_risk: float
    false_negative_risk: float
    
    timestamp: str = ""
    metadata: Dict[str, Any] = None


# ============================================================================
# DOMAIN-SPECIFIC PHYSICS MODELS
# ============================================================================

class DomainPhysicsModel:
    """Abstract base for domain-specific physics"""
    
    def get_prior_distribution(self, parameter: str) -> PriorDistribution:
        """Get prior belief for parameter in this domain"""
        raise NotImplementedError
    
    def get_likelihood(self, metric: float, null_hypothesis: bool = False):
        """Likelihood of observing metric under hypothesis"""
        raise NotImplementedError
    
    def get_domain_name(self) -> str:
        raise NotImplementedError


class SolarWindPhysicsModel(DomainPhysicsModel):
    """
    Solar wind emergence physics:
    - Ion cyclotron waves are real phenomena (well-documented)
    - Frequency scaling reflects particle gyroradii
    - RMS error typically 0.1-2% for well-resolved data
    """
    
    def get_domain_name(self) -> str:
        return "solar_wind"
    
    def get_prior_distribution(self, parameter: str) -> PriorDistribution:
        """Prior beliefs based on heliophysics knowledge"""
        priors = {
            "rms_frequency_error_percent": PriorDistribution(
                distribution_type="lognormal",
                params={"mu": np.log(0.5), "sigma": 0.5},  # Mean ~0.5%, std spans 0.1-2%
                description="RMS frequency error in % (ion cyclotron waves are sharp)"
            ),
            "coherence": PriorDistribution(
                distribution_type="beta",
                params={"alpha": 4, "beta": 2},  # Mean ~0.67 (realistic)
                description="E·B coherence (well-coupled plasma)"
            ),
            "power_law_exponent": PriorDistribution(
                distribution_type="normal",
                params={"mu": 1.5, "sigma": 0.3},  # Kolmogorov spectrum 5/3
                description="Spectral power-law exponent β"
            ),
        }
        return priors.get(parameter, PriorDistribution(
            distribution_type="uniform",
            params={"a": 0, "b": 1}
        ))
    
    def get_likelihood(self, metric: float, null_hypothesis: bool = False):
        """P(metric | emergence) vs P(metric | no emergence)"""
        if null_hypothesis:
            # Under null: metric should be large (>10% RMS error)
            return stats.lognorm.pdf(metric, s=1.0, scale=np.exp(np.log(10)))
        else:
            # Under alternative: metric should be small (<2% RMS error)
            return stats.lognorm.pdf(metric, s=0.5, scale=np.exp(np.log(0.5)))


class EarthquakePhysicsModel(DomainPhysicsModel):
    """
    Earthquake physics:
    - Gutenberg-Richter law is universal (b ≈ 1.0) BUT with regional variation
    - b-values vary 0.3-1.5 depending on tectonic setting
    - No universal precursor signature found empirically
    """
    
    def get_domain_name(self) -> str:
        return "earthquakes"
    
    def get_prior_distribution(self, parameter: str) -> PriorDistribution:
        """Prior beliefs based on seismology knowledge"""
        priors = {
            "b_value": PriorDistribution(
                distribution_type="normal",
                params={"mu": 1.0, "sigma": 0.25},  # Regional variation ±0.25
                description="Gutenberg-Richter b-value (varies by region)"
            ),
            "precursor_correlation": PriorDistribution(
                distribution_type="beta",
                params={"alpha": 1, "beta": 2},  # Favors low values
                description="Foreshock-mainshock correlation (weak or absent)"
            ),
            "magnitude_variance": PriorDistribution(
                distribution_type="gamma",
                params={"alpha": 2, "scale": 0.1},
                description="Magnitude distribution variance"
            ),
        }
        return priors.get(parameter, PriorDistribution(
            distribution_type="uniform",
            params={"a": 0, "b": 2}
        ))
    
    def get_likelihood(self, metric: float, null_hypothesis: bool = False):
        """P(metric | Gutenberg-Richter holds) vs P(metric | broken)"""
        if null_hypothesis:
            # Null: b-value far from 1.0 (e.g., 0.3 or 2.0)
            return stats.norm.pdf(metric, loc=0.6, scale=0.4) + stats.norm.pdf(metric, loc=1.5, scale=0.3)
        else:
            # Alternative: b-value near 1.0
            return stats.norm.pdf(metric, loc=1.0, scale=0.2)


class NetworkPhysicsModel(DomainPhysicsModel):
    """
    Network physics:
    - Latency distributions are heavy-tailed (not Gaussian)
    - Power-law scaling depends on network architecture
    - Precursors are hard to detect (causality issues)
    """
    
    def get_domain_name(self) -> str:
        return "networks"
    
    def get_prior_distribution(self, parameter: str) -> PriorDistribution:
        """Prior beliefs based on network science knowledge"""
        priors = {
            "power_law_exponent": PriorDistribution(
                distribution_type="normal",
                params={"mu": 1.5, "sigma": 0.5},  # Varies by network layer
                description="Power-law exponent β (architecture-dependent)"
            ),
            "cascade_correlation": PriorDistribution(
                distribution_type="beta",
                params={"alpha": 1, "beta": 3},  # Weak cascades expected
                description="Latency cascade correlation (weak)"
            ),
            "jitter_variance": PriorDistribution(
                distribution_type="gamma",
                params={"alpha": 2, "scale": 5},
                description="Latency jitter variance (ms²)"
            ),
        }
        return priors.get(parameter, PriorDistribution(
            distribution_type="uniform",
            params={"a": 0, "b": 3}
        ))
    
    def get_likelihood(self, metric: float, null_hypothesis: bool = False):
        """P(metric | emergence) vs P(metric | noise)"""
        if null_hypothesis:
            # Null: metric is random noise
            return stats.expon.pdf(metric, scale=2.0)
        else:
            # Alternative: metric shows structure
            return stats.norm.pdf(metric, loc=1.5, scale=0.3)


PHYSICS_MODELS = {
    "solar_wind": SolarWindPhysicsModel(),
    "earthquakes": EarthquakePhysicsModel(),
    "networks": NetworkPhysicsModel(),
}


# ============================================================================
# BAYESIAN ANALYSIS ENGINE
# ============================================================================

class BayesianAnalysisFramework:
    """Convert hard metrics into Bayesian posterior inference"""
    
    def __init__(self, domain: str, verbose: bool = True):
        self.domain = domain
        self.verbose = verbose
        self.physics_model = PHYSICS_MODELS.get(domain)
        
        if not self.physics_model:
            raise ValueError(f"Unknown domain: {domain}")
    
    def infer_posterior(
        self,
        metric: float,
        metric_name: str,
        analysis_type: str,
        threshold: float,
        num_samples: int = 10000
    ) -> MetricDistribution:
        """
        Use Bayesian inference to estimate posterior distribution of metric
        
        Approach:
        1. Get domain-specific prior for metric
        2. Compute likelihood P(observed metric | true metric)
        3. Use rejection sampling or grid approximation for posterior
        4. Generate posterior samples
        """
        
        prior = self.physics_model.get_prior_distribution(metric_name)
        
        # Grid-based posterior approximation
        if prior.distribution_type == "lognormal":
            # Lognormal: P(X | mu, sigma)
            mu = prior.params["mu"]
            sigma = prior.params["sigma"]
            
            # Generate prior samples
            prior_samples = np.random.lognormal(mean=mu, sigma=sigma, size=num_samples)
            
            # Likelihood: Normal around observed metric
            likelihood = stats.norm.pdf(prior_samples, loc=metric, scale=metric * 0.1)
            
            # Posterior: prior * likelihood (normalized)
            weights = likelihood / np.sum(likelihood)
            posterior_samples = np.random.choice(prior_samples, size=num_samples, p=weights)
        
        elif prior.distribution_type == "normal":
            mu = prior.params["mu"]
            sigma = prior.params["sigma"]
            
            # Normal prior with normal likelihood
            prior_precision = 1.0 / (sigma ** 2)
            observed_precision = 1.0 / ((metric * 0.15) ** 2)  # Measurement noise
            
            posterior_precision = prior_precision + observed_precision
            posterior_variance = 1.0 / posterior_precision
            posterior_mean = (prior_precision * mu + observed_precision * metric) * posterior_variance
            
            posterior_samples = np.random.normal(posterior_mean, np.sqrt(posterior_variance), num_samples)
        
        elif prior.distribution_type == "beta":
            alpha = prior.params["alpha"]
            beta = prior.params["beta"]
            
            # Beta-binomial conjugate prior (approximation)
            # Treat metric as proportion (0-1)
            metric_normalized = np.clip(metric / (threshold * 2), 0, 1)
            
            # Update beta parameters
            n_successes = int(alpha + metric_normalized * 10)
            n_trials = int(alpha + beta + 10)
            
            posterior_samples = np.random.beta(n_successes, n_trials - n_successes, num_samples)
        
        else:
            # Uniform prior fallback
            posterior_samples = np.random.uniform(0, threshold * 2, num_samples)
        
        # Compute summary statistics
        mean = np.mean(posterior_samples)
        std = np.std(posterior_samples)
        median = np.median(posterior_samples)
        credible_lower, credible_upper = np.percentile(posterior_samples, [2.5, 97.5])
        
        p_positive = np.mean(posterior_samples > 0)
        p_exceeds_threshold = np.mean(posterior_samples > threshold)
        
        return MetricDistribution(
            metric_name=metric_name,
            domain=self.domain,
            analysis_type=analysis_type,
            posterior_samples=posterior_samples,
            mean=float(mean),
            std=float(std),
            median=float(median),
            credible_interval_lower=float(credible_lower),
            credible_interval_upper=float(credible_upper),
            p_positive=float(p_positive),
            p_exceeds_threshold=float(p_exceeds_threshold),
            timestamp=datetime.utcnow().isoformat()
        )
    
    def compute_verdict(
        self,
        metric: float,
        metric_name: str,
        posterior: MetricDistribution,
        threshold: float
    ) -> Tuple[str, float, float]:
        """
        Convert posterior distribution into verdict + confidence
        
        Returns: (verdict, confidence, p_hypothesis)
        - verdict: "strongly_confirmed", "confirmed", "uncertain", "falsified", "strongly_falsified"
        - confidence: 0-1, how certain we are
        - p_hypothesis: P(true emergence | data)
        """
        
        # P(metric > threshold) from posterior
        p_exceeds = posterior.p_exceeds_threshold
        
        # Odds ratio: P(emergence) / P(no emergence)
        # Using threshold as decision boundary
        odds = p_exceeds / (1 - p_exceeds) if p_exceeds > 0 else 1e-6
        
        # Log odds (more interpretable)
        log_odds = np.log(odds)
        
        # Verdict based on log odds
        if log_odds > 2.0:
            verdict = "strongly_confirmed"
            confidence = min(p_exceeds * 1.5, 0.99)
        elif log_odds > 0.5:
            verdict = "confirmed"
            confidence = p_exceeds
        elif log_odds > -0.5:
            verdict = "uncertain"
            confidence = 0.5
        elif log_odds > -2.0:
            verdict = "falsified"
            confidence = 1 - p_exceeds
        else:
            verdict = "strongly_falsified"
            confidence = min((1 - p_exceeds) * 1.5, 0.99)
        
        # P(hypothesis | data) using Bayes rule
        # P(H|D) = P(D|H) * P(H) / P(D)
        # Approximate: p_hypothesis ≈ log_odds / (1 + log_odds)
        p_hypothesis = 1.0 / (1.0 + np.exp(-log_odds))
        
        return verdict, confidence, p_hypothesis
    
    def compute_risks(
        self,
        posterior: MetricDistribution,
        threshold: float,
        prior_prob_emergence: float = 0.1
    ) -> Tuple[float, float]:
        """
        Compute false positive and false negative risks
        
        Returns: (false_positive_risk, false_negative_risk)
        """
        
        # False positive: metric > threshold but no true emergence
        # P(FP) ≈ (1 - P(hypothesis)) * P(metric > threshold | ~H)
        p_emergence = prior_prob_emergence
        
        # False negative: metric < threshold but true emergence
        # P(FN) ≈ P(hypothesis) * P(metric < threshold | H)
        p_no_emergence = 1 - p_emergence
        
        # Approximate using posterior
        p_exceeds = posterior.p_exceeds_threshold
        
        # Simple approximation
        false_positive_risk = (1 - p_emergence) * (1 - p_exceeds)
        false_negative_risk = p_emergence * (1 - p_exceeds)
        
        return float(false_positive_risk), float(false_negative_risk)


# ============================================================================
# ADAPTIVE THRESHOLD LEARNING
# ============================================================================

class AdaptiveThresholdEstimator:
    """Learn optimal thresholds from historical data"""
    
    def __init__(self, domain: str):
        self.domain = domain
        self.history: List[Dict[str, Any]] = []
    
    def add_observation(
        self,
        metric: float,
        true_label: bool,
        metric_name: str,
        confidence: float = None
    ):
        """Add labeled observation to training history"""
        self.history.append({
            "metric": metric,
            "true_label": true_label,
            "metric_name": metric_name,
            "confidence": confidence or 0.5,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def estimate_optimal_threshold(
        self,
        metric_name: str,
        target_specificity: float = 0.95
    ) -> float:
        """
        Use ROC analysis to find optimal threshold
        
        target_specificity: How many true negatives to capture
                           (0-1, default 0.95 = 95% true negatives)
        """
        
        observations = [o for o in self.history if o["metric_name"] == metric_name]
        
        if len(observations) < 5:
            # Not enough data, return default
            return 5.0 if metric_name == "rms_frequency_error_percent" else 1.0
        
        metrics = np.array([o["metric"] for o in observations])
        labels = np.array([o["true_label"] for o in observations])
        
        # Compute ROC curve (simplified)
        thresholds = np.percentile(metrics, np.linspace(0, 100, 50))
        tprs = []
        fprs = []
        
        for thresh in thresholds:
            positives = labels == 1
            negatives = labels == 0
            
            tp = np.sum((metrics > thresh) & positives)
            fp = np.sum((metrics > thresh) & negatives)
            tn = np.sum((metrics <= thresh) & negatives)
            fn = np.sum((metrics <= thresh) & positives)
            
            tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
            specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
            
            if specificity >= target_specificity:
                tprs.append(tpr)
                fprs.append(fpr)
        
        # Find threshold with best TPR at target specificity
        if tprs:
            best_idx = np.argmax(tprs)
            return float(thresholds[best_idx])
        else:
            return float(np.median(metrics))


# ============================================================================
# RESULT CONVERSION
# ============================================================================

def convert_to_bayesian_result(
    phase1_result: Dict[str, Any],
    job_id: str
) -> BayesianAnalysisResult:
    """
    Convert Phase 1 AnalysisResult to Bayesian result with uncertainty
    """
    
    domain = phase1_result.get("domain", "unknown")
    analysis_type = phase1_result.get("analysis_type", "unknown")
    metric = phase1_result.get("primary_metric", 0.0)
    metric_name = phase1_result.get("metric_name", "unknown")
    threshold = phase1_result.get("threshold", 1.0)
    
    # Run Bayesian inference
    framework = BayesianAnalysisFramework(domain, verbose=False)
    posterior = framework.infer_posterior(
        metric=metric,
        metric_name=metric_name,
        analysis_type=analysis_type,
        threshold=threshold,
        num_samples=10000
    )
    
    # Compute verdict and confidence
    verdict, confidence, p_hypothesis = framework.compute_verdict(
        metric, metric_name, posterior, threshold
    )
    
    # Compute risks
    fp_risk, fn_risk = framework.compute_risks(posterior, threshold)
    
    return BayesianAnalysisResult(
        job_id=job_id,
        domain=domain,
        analysis_type=analysis_type,
        primary_metric=metric,
        metric_name=metric_name,
        posterior_mean=posterior.mean,
        posterior_std=posterior.std,
        credible_interval=(posterior.credible_interval_lower, posterior.credible_interval_upper),
        verdict=verdict,
        confidence=confidence,
        p_hypothesis=p_hypothesis,
        false_positive_risk=fp_risk,
        false_negative_risk=fn_risk,
        timestamp=datetime.utcnow().isoformat(),
        metadata={
            "p_exceeds_threshold": posterior.p_exceeds_threshold,
            "posterior_median": posterior.median,
            "phase1_result": phase1_result
        }
    )


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    # Example: Convert Phase 0 Test 1 result to Bayesian
    test_1_result = {
        "domain": "solar_wind",
        "analysis_type": "emergence_detection",
        "primary_metric": 0.1238,
        "metric_name": "rms_frequency_error_percent",
        "threshold": 5.0,
        "status": "CONFIRMED"
    }
    
    bayesian_result = convert_to_bayesian_result(test_1_result, "test-1-bayesian")
    
    print("=" * 70)
    print("BAYESIAN ANALYSIS RESULT")
    print("=" * 70)
    print(f"Job ID: {bayesian_result.job_id}")
    print(f"Domain: {bayesian_result.domain}")
    print(f"Analysis: {bayesian_result.analysis_type}")
    print()
    print(f"Metric: {bayesian_result.metric_name} = {bayesian_result.primary_metric:.4f}")
    print(f"Posterior Mean: {bayesian_result.posterior_mean:.4f} ± {bayesian_result.posterior_std:.4f}")
    print(f"95% Credible Interval: [{bayesian_result.credible_interval[0]:.4f}, {bayesian_result.credible_interval[1]:.4f}]")
    print()
    print(f"Verdict: {bayesian_result.verdict.upper()}")
    print(f"Confidence: {bayesian_result.confidence:.1%}")
    print(f"P(true emergence | data): {bayesian_result.p_hypothesis:.1%}")
    print()
    print(f"False Positive Risk: {bayesian_result.false_positive_risk:.2%}")
    print(f"False Negative Risk: {bayesian_result.false_negative_risk:.2%}")
    print("=" * 70)
