"""
Phase 2e: Interactive Threshold Optimizer
MistTracker Emergence Detection Framework

Learns optimal decision thresholds through:
1. Real-time user feedback on verdicts
2. Labeled data collection (correct/incorrect classifications)
3. ROC curve analysis
4. Bayesian optimization of decision boundaries
5. Per-domain and per-expert threshold tuning

Insight:
- Phase 1 threshold (0.12% RMS) works well for solar wind (88% accuracy)
- But fails for earthquakes (scale-free statistics need domain-specific threshold)
- Interactive learning adapts thresholds to real-world verdict distribution
"""

import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import json

logger = logging.getLogger(__name__)


class ClassificationOutcome(str, Enum):
    """Ground truth for a classification"""
    TRUE_POSITIVE = "tp"    # Correctly identified emergence
    TRUE_NEGATIVE = "tn"    # Correctly identified non-emergence
    FALSE_POSITIVE = "fp"   # Incorrectly identified emergence
    FALSE_NEGATIVE = "fn"   # Missed emergence


@dataclass
class LabeledDatapoint:
    """
    Labeled data point for threshold optimization.
    
    Example:
        LabeledDatapoint(
            domain="earthquakes",
            metric_value=0.0892,  # b-value deviation
            verdict_by_algorithm="strongly_confirmed",
            ground_truth=ClassificationOutcome.TRUE_POSITIVE,
            expert_id="dr_smith",
            confidence=0.95,
        )
    """
    domain: str
    metric_name: str
    metric_value: float
    verdict_by_algorithm: str
    ground_truth: ClassificationOutcome
    expert_id: str
    confidence: float = 0.9  # How confident is expert in label?
    
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    notes: str = ""


@dataclass
class PerformanceMetrics:
    """ROC/performance metrics for a threshold"""
    threshold: float
    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int
    
    @property
    def sensitivity(self) -> float:
        """TP / (TP + FN) - true positive rate"""
        total = self.true_positives + self.false_negatives
        return self.true_positives / total if total > 0 else 0.0
    
    @property
    def specificity(self) -> float:
        """TN / (TN + FP) - true negative rate"""
        total = self.true_negatives + self.false_positives
        return self.true_negatives / total if total > 0 else 0.0
    
    @property
    def precision(self) -> float:
        """TP / (TP + FP)"""
        total = self.true_positives + self.false_positives
        return self.true_positives / total if total > 0 else 0.0
    
    @property
    def f1_score(self) -> float:
        """Harmonic mean of precision and recall"""
        p = self.precision
        r = self.sensitivity
        total = p + r
        return 2 * p * r / total if total > 0 else 0.0
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "threshold": self.threshold,
            "true_positives": self.true_positives,
            "true_negatives": self.true_negatives,
            "false_positives": self.false_positives,
            "false_negatives": self.false_negatives,
            "sensitivity": self.sensitivity,
            "specificity": self.specificity,
            "precision": self.precision,
            "f1_score": self.f1_score,
        }


@dataclass
class OptimizedThreshold:
    """
    Learned threshold for a domain.
    
    Fields:
        emergence_threshold: Raw metric threshold for emergence
        confidence_threshold: Minimum Bayesian confidence
        decision_rule: String describing the rule
    """
    domain: str
    metric_name: str
    emergence_threshold: float
    confidence_threshold: float = 0.70
    
    # Performance on labeled data
    f1_score: float = 0.0
    sensitivity: float = 0.0
    specificity: float = 0.0
    precision: float = 0.0
    
    # Data used for optimization
    labeled_datapoints: int = 0
    
    # When was this optimized?
    optimized_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Is this recommended?
    is_recommended: bool = True
    recommendation_note: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ThresholdOptimizer:
    """
    Learns optimal thresholds through interactive feedback.
    
    Workflow:
    1. Collect labeled data: metric value + ground truth
    2. Sweep threshold values
    3. Compute ROC metrics for each threshold
    4. Find optimal threshold (maximize F1 or user-specified metric)
    5. Deploy optimized threshold
    6. Track performance over time
    """
    
    def __init__(self):
        """Initialize threshold optimizer"""
        self.labeled_data: List[LabeledDatapoint] = []
        self.optimized_thresholds: Dict[str, OptimizedThreshold] = {}
        self.threshold_history: List[Dict[str, Any]] = []
    
    def add_labeled_datapoint(self, datapoint: LabeledDatapoint) -> None:
        """
        Add labeled data point for learning.
        
        Args:
            datapoint: Labeled data with ground truth
        """
        self.labeled_data.append(datapoint)
        logger.info(
            f"[Threshold] Added labeled datapoint: "
            f"domain={datapoint.domain}, "
            f"value={datapoint.metric_value:.4f}, "
            f"truth={datapoint.ground_truth.value}"
        )
    
    def optimize_threshold(
        self,
        domain: str,
        metric_name: str,
        optimize_for: str = "f1_score",
        min_datapoints: int = 10
    ) -> Optional[OptimizedThreshold]:
        """
        Optimize threshold for a domain/metric.
        
        Args:
            domain: Domain to optimize
            metric_name: Metric name (e.g., 'rms_frequency_error_percent')
            optimize_for: Optimization target ('f1_score', 'sensitivity', 'specificity')
            min_datapoints: Minimum labeled points required
        
        Returns:
            OptimizedThreshold if successful, None if insufficient data
        """
        # Filter data for this domain/metric
        relevant_data = [
            d for d in self.labeled_data
            if d.domain == domain and d.metric_name == metric_name
        ]
        
        if len(relevant_data) < min_datapoints:
            logger.warning(
                f"[Threshold] Insufficient data for {domain}/{metric_name}: "
                f"{len(relevant_data)} < {min_datapoints}"
            )
            return None
        
        # Get unique metric values and sort
        sorted_data = sorted(relevant_data, key=lambda d: d.metric_value)
        thresholds_to_test = [
            d.metric_value for d in sorted_data
        ]
        
        # Evaluate each threshold
        best_metrics = None
        best_threshold = None
        best_score = -1
        
        for threshold in thresholds_to_test:
            metrics = self._compute_metrics(relevant_data, threshold)
            score = getattr(metrics, optimize_for, 0)
            
            if score > best_score:
                best_score = score
                best_metrics = metrics
                best_threshold = threshold
        
        if best_metrics is None:
            return None
        
        # Create optimized threshold object
        opt_threshold = OptimizedThreshold(
            domain=domain,
            metric_name=metric_name,
            emergence_threshold=best_threshold,
            f1_score=best_metrics.f1_score,
            sensitivity=best_metrics.sensitivity,
            specificity=best_metrics.specificity,
            precision=best_metrics.precision,
            labeled_datapoints=len(relevant_data),
        )
        
        # Store
        key = f"{domain}:{metric_name}"
        self.optimized_thresholds[key] = opt_threshold
        self.threshold_history.append({
            "domain": domain,
            "metric_name": metric_name,
            "optimized_at": opt_threshold.optimized_at,
            "threshold": best_threshold,
            "f1_score": best_metrics.f1_score,
        })
        
        logger.info(
            f"[Threshold] Optimized {domain}/{metric_name}: "
            f"threshold={best_threshold:.4f}, "
            f"f1={best_metrics.f1_score:.3f}"
        )
        
        return opt_threshold
    
    def get_optimal_threshold(
        self,
        domain: str,
        metric_name: str
    ) -> Optional[OptimizedThreshold]:
        """Get optimized threshold for domain/metric"""
        key = f"{domain}:{metric_name}"
        return self.optimized_thresholds.get(key)
    
    def get_roc_curve(
        self,
        domain: str,
        metric_name: str
    ) -> List[Dict[str, float]]:
        """
        Get ROC curve data for threshold sweep.
        
        Returns:
            List of points: [{"threshold": x, "sensitivity": y, "1-specificity": z}]
        """
        relevant_data = [
            d for d in self.labeled_data
            if d.domain == domain and d.metric_name == metric_name
        ]
        
        if not relevant_data:
            return []
        
        # Sweep thresholds
        thresholds = sorted(set(d.metric_value for d in relevant_data))
        roc_points = []
        
        for threshold in thresholds:
            metrics = self._compute_metrics(relevant_data, threshold)
            roc_points.append({
                "threshold": threshold,
                "sensitivity": metrics.sensitivity,
                "false_positive_rate": 1 - metrics.specificity,
                "f1_score": metrics.f1_score,
            })
        
        return roc_points
    
    def get_threshold_recommendations(self) -> Dict[str, OptimizedThreshold]:
        """Get all recommended optimized thresholds"""
        return {
            k: v for k, v in self.optimized_thresholds.items()
            if v.is_recommended
        }
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get optimizer statistics"""
        return {
            "total_labeled_datapoints": len(self.labeled_data),
            "domains_with_labels": len(set(d.domain for d in self.labeled_data)),
            "optimized_thresholds": len(self.optimized_thresholds),
            "history_entries": len(self.threshold_history),
            "recent_optimizations": self.threshold_history[-5:] if self.threshold_history else [],
        }
    
    # Private methods
    
    def _compute_metrics(
        self,
        labeled_data: List[LabeledDatapoint],
        threshold: float
    ) -> PerformanceMetrics:
        """
        Compute TP/TN/FP/FN for threshold.
        
        Classification rule:
        - If metric_value >= threshold: predict emergence
        - Else: predict no emergence
        """
        tp = tn = fp = fn = 0
        
        for datapoint in labeled_data:
            # Predict based on threshold
            predicted_emergence = datapoint.metric_value >= threshold
            
            # True label
            is_true_emergence = datapoint.ground_truth in [
                ClassificationOutcome.TRUE_POSITIVE,
                ClassificationOutcome.FALSE_NEGATIVE
            ]
            
            # Compare
            if predicted_emergence and is_true_emergence:
                tp += 1
            elif predicted_emergence and not is_true_emergence:
                fp += 1
            elif not predicted_emergence and not is_true_emergence:
                tn += 1
            else:  # not predicted and true emergence
                fn += 1
        
        return PerformanceMetrics(
            threshold=threshold,
            true_positives=tp,
            true_negatives=tn,
            false_positives=fp,
            false_negatives=fn,
        )


# Global threshold optimizer
_threshold_optimizer: Optional[ThresholdOptimizer] = None


def get_threshold_optimizer() -> ThresholdOptimizer:
    """Get or create global threshold optimizer"""
    global _threshold_optimizer
    if _threshold_optimizer is None:
        _threshold_optimizer = ThresholdOptimizer()
    return _threshold_optimizer


if __name__ == "__main__":
    """Test threshold optimizer"""
    logging.basicConfig(level=logging.INFO)
    
    print("Phase 2e Interactive Threshold Optimizer Test")
    print("=" * 70)
    
    optimizer = get_threshold_optimizer()
    
    # Test 1: Add labeled data
    print("\nTest 1: Add Labeled Data")
    print("-" * 70)
    
    # Simulate labeled dataset for solar wind
    import random
    random.seed(42)
    
    for i in range(20):
        value = random.uniform(0.08, 0.15)
        
        # Ground truth: values > 0.12 are more likely true emergences
        if value > 0.12:
            truth = ClassificationOutcome.TRUE_POSITIVE if random.random() > 0.1 else ClassificationOutcome.FALSE_NEGATIVE
        else:
            truth = ClassificationOutcome.TRUE_NEGATIVE if random.random() > 0.15 else ClassificationOutcome.FALSE_POSITIVE
        
        dp = LabeledDatapoint(
            domain="solar_wind",
            metric_name="rms_frequency_error_percent",
            metric_value=value,
            verdict_by_algorithm="confirmed",
            ground_truth=truth,
            expert_id="dr_smith",
            confidence=0.95
        )
        optimizer.add_labeled_datapoint(dp)
    
    print(f"Added 20 labeled datapoints")
    
    # Test 2: Optimize threshold
    print("\nTest 2: Optimize Threshold")
    print("-" * 70)
    
    opt_threshold = optimizer.optimize_threshold(
        domain="solar_wind",
        metric_name="rms_frequency_error_percent",
        optimize_for="f1_score",
        min_datapoints=5
    )
    
    if opt_threshold:
        print(f"Optimized threshold: {opt_threshold.emergence_threshold:.4f}")
        print(f"  F1 Score: {opt_threshold.f1_score:.3f}")
        print(f"  Sensitivity: {opt_threshold.sensitivity:.1%}")
        print(f"  Specificity: {opt_threshold.specificity:.1%}")
    
    # Test 3: ROC curve
    print("\nTest 3: ROC Curve Data")
    print("-" * 70)
    
    roc_points = optimizer.get_roc_curve(
        domain="solar_wind",
        metric_name="rms_frequency_error_percent"
    )
    
    print(f"ROC curve points: {len(roc_points)}")
    for i, point in enumerate(roc_points[:5]):
        print(f"  Point {i+1}: threshold={point['threshold']:.4f}, "
              f"sensitivity={point['sensitivity']:.2f}, "
              f"fpr={point['false_positive_rate']:.2f}")
    
    # Test 4: Statistics
    print("\nTest 4: Optimizer Statistics")
    print("-" * 70)
    
    stats = optimizer.get_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print("\nPhase 2e Interactive Threshold Optimizer Ready ✅")
