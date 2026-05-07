"""
Phase 2e: Expert Feedback System
MistTracker Emergence Detection Framework

Enables domain experts to:
1. Review Bayesian results and provide feedback
2. Rate verdict accuracy (correct/incorrect)
3. Adjust priors based on domain knowledge
4. Learn from feedback across time
5. Track refinement history

Integration: Works with Phase 2b Bayesian results to improve future predictions.
"""

import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Literal
from enum import Enum
import pickle

logger = logging.getLogger(__name__)


class FeedbackRating(str, Enum):
    """How accurate was the Bayesian verdict?"""
    CORRECT = "correct"           # Verdict matched ground truth
    INCORRECT = "incorrect"        # Verdict was wrong
    PARTIALLY_CORRECT = "partial"  # Verdict had right direction but wrong confidence
    UNCERTAIN = "uncertain"        # Expert can't judge reliability
    NEEDS_REVIEW = "needs_review"  # Flagged for expert review


class PriorAdjustment(str, Enum):
    """How should priors be adjusted based on feedback?"""
    SHIFT_UP = "shift_up"           # Increase prior mean
    SHIFT_DOWN = "shift_down"       # Decrease prior mean
    INCREASE_UNCERTAINTY = "increase_uncertainty"  # Broaden distribution
    DECREASE_UNCERTAINTY = "decrease_uncertainty"  # Narrow distribution
    NO_CHANGE = "no_change"         # Keep prior as-is


@dataclass
class ExpertFeedback:
    """Structured feedback from domain expert"""
    job_id: str
    expert_id: str
    domain: str
    analysis_type: str
    
    # Ground truth and feedback
    bayesian_verdict: str  # What the algorithm said
    ground_truth: str      # What actually happened
    feedback_rating: FeedbackRating
    confidence_assessment: float  # 0-1, expert's confidence in their feedback
    
    # Prior refinement suggestions
    metric_name: str
    observed_value: float
    suggested_prior_adjustment: PriorAdjustment
    adjustment_magnitude: float = 0.0  # How much to shift (0-1 scale)
    
    # Narrative feedback
    comments: str = ""
    
    # Metadata
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    signal_strength: Optional[str] = None  # weak, moderate, strong
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        data = asdict(self)
        data['feedback_rating'] = self.feedback_rating.value
        data['suggested_prior_adjustment'] = self.suggested_prior_adjustment.value
        return data


@dataclass
class PriorRefinementHistory:
    """Track how priors evolve from expert feedback"""
    domain: str
    metric_name: str
    original_prior: Dict[str, Any]
    
    refinements: List[ExpertFeedback] = field(default_factory=list)
    current_prior: Dict[str, Any] = field(default_factory=dict)
    
    # Statistics
    feedback_count: int = 0
    accuracy_rate: float = 0.0  # % of correct verdicts
    confidence_mean: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary"""
        return {
            "domain": self.domain,
            "metric_name": self.metric_name,
            "original_prior": self.original_prior,
            "refinements_count": len(self.refinements),
            "current_prior": self.current_prior,
            "feedback_count": self.feedback_count,
            "accuracy_rate": self.accuracy_rate,
            "confidence_mean": self.confidence_mean,
        }


class ExpertFeedbackEngine:
    """
    Orchestrates expert feedback collection and prior refinement.
    
    Workflow:
    1. Expert reviews Bayesian result
    2. Provides feedback: correct/incorrect/partial
    3. Suggests prior adjustments
    4. System aggregates feedback across experts
    5. Updates priors for next analysis
    """
    
    def __init__(self, cache_dir: str = "./expert_feedback_cache"):
        """
        Initialize expert feedback engine.
        
        Args:
            cache_dir: Directory to store feedback history
        """
        self.cache_dir = cache_dir
        self.feedback_history: List[ExpertFeedback] = []
        self.prior_refinements: Dict[str, PriorRefinementHistory] = {}
        self.expert_profiles: Dict[str, Dict[str, Any]] = {}  # Track expert accuracy
        
        self._load_history()
    
    def submit_feedback(self, feedback: ExpertFeedback) -> Dict[str, Any]:
        """
        Submit expert feedback for a completed analysis.
        
        Args:
            feedback: ExpertFeedback object with ratings and suggestions
        
        Returns:
            Result summary including impact on prior
        """
        # Validate feedback
        is_correct = feedback.feedback_rating == FeedbackRating.CORRECT
        
        # Update expert profile
        self._update_expert_profile(feedback.expert_id, is_correct)
        
        # Store feedback
        self.feedback_history.append(feedback)
        
        # Update prior refinement history
        refinement_key = f"{feedback.domain}:{feedback.metric_name}"
        if refinement_key not in self.prior_refinements:
            self.prior_refinements[refinement_key] = PriorRefinementHistory(
                domain=feedback.domain,
                metric_name=feedback.metric_name,
                original_prior={}
            )
        
        refinement = self.prior_refinements[refinement_key]
        refinement.refinements.append(feedback)
        refinement.feedback_count += 1
        
        # Compute new accuracy rate
        correct_count = sum(
            1 for f in refinement.refinements
            if f.feedback_rating == FeedbackRating.CORRECT
        )
        refinement.accuracy_rate = correct_count / refinement.feedback_count
        refinement.confidence_mean = sum(
            f.confidence_assessment for f in refinement.refinements
        ) / refinement.feedback_count
        
        # Compute suggested prior adjustment
        new_prior = self._compute_refined_prior(
            domain=feedback.domain,
            metric_name=feedback.metric_name,
            feedback=feedback,
            refinement=refinement
        )
        refinement.current_prior = new_prior
        
        logger.info(
            f"[Feedback] Submitted by {feedback.expert_id} for {feedback.domain}/{feedback.analysis_type}. "
            f"Rating: {feedback.feedback_rating.value}, Accuracy: {refinement.accuracy_rate:.1%}"
        )
        
        self._save_history()
        
        # Get expert profile with expert_id included
        expert_profile = self.expert_profiles.get(feedback.expert_id, {}).copy()
        expert_profile['expert_id'] = feedback.expert_id
        
        return {
            "job_id": feedback.job_id,
            "status": "feedback_received",
            "expert_profile": expert_profile,
            "refinement_key": refinement_key,
            "domain_accuracy": refinement.accuracy_rate,
            "suggested_prior": new_prior,
        }
    
    def get_expert_profile(self, expert_id: str) -> Dict[str, Any]:
        """Get performance profile for expert"""
        if expert_id not in self.expert_profiles:
            return {
                "expert_id": expert_id,
                "feedback_count": 0,
                "accuracy_rate": 0.0,
                "specialties": []
            }
        
        profile = self.expert_profiles[expert_id]
        profile["expert_id"] = expert_id
        return profile
    
    def get_domain_refinement(self, domain: str, metric_name: str) -> Optional[Dict[str, Any]]:
        """Get refinement history for a specific domain/metric"""
        key = f"{domain}:{metric_name}"
        if key not in self.prior_refinements:
            return None
        
        refinement = self.prior_refinements[key]
        return refinement.to_dict()
    
    def get_refinement_recommendations(self) -> Dict[str, Any]:
        """
        Get recommendations for prior refinements based on all feedback.
        
        Returns:
            Dictionary mapping domain:metric → recommended prior adjustments
        """
        recommendations = {}
        
        for key, refinement in self.prior_refinements.items():
            if refinement.feedback_count < 3:
                # Need minimum feedback before recommending changes
                continue
            
            # Only recommend if accuracy is low
            if refinement.accuracy_rate < 0.7:
                recommendations[key] = {
                    "domain": refinement.domain,
                    "metric_name": refinement.metric_name,
                    "current_accuracy": refinement.accuracy_rate,
                    "confidence": refinement.confidence_mean,
                    "feedback_count": refinement.feedback_count,
                    "refinements": [f.to_dict() for f in refinement.refinements[-5:]],
                    "priority": "high" if refinement.accuracy_rate < 0.5 else "medium"
                }
        
        return recommendations
    
    def _update_expert_profile(self, expert_id: str, is_correct: bool) -> None:
        """Update expert's accuracy profile"""
        if expert_id not in self.expert_profiles:
            self.expert_profiles[expert_id] = {
                "feedback_count": 0,
                "correct_count": 0,
                "accuracy_rate": 0.0,
                "specialties": {}
            }
        
        profile = self.expert_profiles[expert_id]
        profile["feedback_count"] += 1
        if is_correct:
            profile["correct_count"] += 1
        
        profile["accuracy_rate"] = (
            profile["correct_count"] / profile["feedback_count"]
        )
    
    def _compute_refined_prior(
        self,
        domain: str,
        metric_name: str,
        feedback: ExpertFeedback,
        refinement: PriorRefinementHistory
    ) -> Dict[str, Any]:
        """
        Compute refined prior based on feedback.
        
        Strategy:
        - If expert says verdict wrong + suggests adjustment → apply adjustment
        - Weight by expert confidence
        - Average adjustments from multiple experts
        """
        if not refinement.current_prior:
            # Initialize from original
            refinement.current_prior = refinement.original_prior.copy()
        
        refined = refinement.current_prior.copy()
        
        # Apply adjustment if rating indicates change needed
        if feedback.feedback_rating in [FeedbackRating.INCORRECT, FeedbackRating.PARTIALLY_CORRECT]:
            adjustment = feedback.suggested_prior_adjustment
            magnitude = feedback.adjustment_magnitude * feedback.confidence_assessment
            
            if adjustment == PriorAdjustment.SHIFT_UP:
                # Increase mean
                if "mu" in refined:
                    refined["mu"] = refined["mu"] * (1 + magnitude * 0.1)
            
            elif adjustment == PriorAdjustment.SHIFT_DOWN:
                # Decrease mean
                if "mu" in refined:
                    refined["mu"] = refined["mu"] * (1 - magnitude * 0.1)
            
            elif adjustment == PriorAdjustment.INCREASE_UNCERTAINTY:
                # Broaden distribution
                if "sigma" in refined:
                    refined["sigma"] = refined["sigma"] * (1 + magnitude * 0.2)
            
            elif adjustment == PriorAdjustment.DECREASE_UNCERTAINTY:
                # Narrow distribution
                if "sigma" in refined:
                    refined["sigma"] = refined["sigma"] * (1 - magnitude * 0.1)
        
        return refined
    
    def _load_history(self) -> None:
        """Load feedback history from disk"""
        try:
            history_file = f"{self.cache_dir}/feedback_history.pkl"
            with open(history_file, 'rb') as f:
                data = pickle.load(f)
                self.feedback_history = data.get('feedback_history', [])
                self.prior_refinements = data.get('prior_refinements', {})
                self.expert_profiles = data.get('expert_profiles', {})
            logger.info(f"[Feedback] Loaded {len(self.feedback_history)} feedback entries")
        except FileNotFoundError:
            logger.info("[Feedback] No history file found, starting fresh")
        except Exception as e:
            logger.warning(f"[Feedback] Error loading history: {e}")
    
    def _save_history(self) -> None:
        """Save feedback history to disk"""
        try:
            import os
            os.makedirs(self.cache_dir, exist_ok=True)
            
            history_file = f"{self.cache_dir}/feedback_history.pkl"
            with open(history_file, 'wb') as f:
                pickle.dump({
                    'feedback_history': self.feedback_history,
                    'prior_refinements': self.prior_refinements,
                    'expert_profiles': self.expert_profiles,
                }, f)
        except Exception as e:
            logger.error(f"[Feedback] Error saving history: {e}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get overall feedback system statistics"""
        return {
            "total_feedback_submitted": len(self.feedback_history),
            "unique_experts": len(self.expert_profiles),
            "domains_with_feedback": len(set(f.domain for f in self.feedback_history)),
            "average_accuracy_by_domain": self._compute_accuracy_by_domain(),
            "expert_with_highest_accuracy": self._get_top_expert(),
        }
    
    def _compute_accuracy_by_domain(self) -> Dict[str, float]:
        """Compute average accuracy per domain"""
        accuracy = {}
        for domain_key, refinement in self.prior_refinements.items():
            domain = refinement.domain
            if domain not in accuracy:
                accuracy[domain] = []
            accuracy[domain].append(refinement.accuracy_rate)
        
        return {domain: sum(rates) / len(rates) for domain, rates in accuracy.items()}
    
    def _get_top_expert(self) -> Optional[str]:
        """Get expert with highest accuracy"""
        if not self.expert_profiles:
            return None
        
        return max(
            self.expert_profiles.items(),
            key=lambda x: x[1].get('accuracy_rate', 0)
        )[0]


# Global feedback engine (singleton)
_feedback_engine: Optional[ExpertFeedbackEngine] = None


def get_feedback_engine() -> ExpertFeedbackEngine:
    """Get or create global feedback engine"""
    global _feedback_engine
    if _feedback_engine is None:
        _feedback_engine = ExpertFeedbackEngine()
    return _feedback_engine


def submit_expert_feedback(
    job_id: str,
    expert_id: str,
    domain: str,
    analysis_type: str,
    bayesian_verdict: str,
    ground_truth: str,
    feedback_rating: str,
    metric_name: str,
    observed_value: float,
    suggested_adjustment: str = "no_change",
    adjustment_magnitude: float = 0.0,
    comments: str = "",
) -> Dict[str, Any]:
    """
    Convenience function to submit expert feedback.
    
    Usage:
        result = submit_expert_feedback(
            job_id="job-123",
            expert_id="dr_smith",
            domain="solar_wind",
            analysis_type="emergence_detection",
            bayesian_verdict="strongly_confirmed",
            ground_truth="confirmed",
            feedback_rating="correct",
            metric_name="rms_frequency_error_percent",
            observed_value=0.1238,
            comments="Emergence signal was indeed strong and clear"
        )
    """
    try:
        rating = FeedbackRating(feedback_rating)
        adjustment = PriorAdjustment(suggested_adjustment)
    except ValueError as e:
        raise ValueError(f"Invalid enum value: {e}")
    
    feedback = ExpertFeedback(
        job_id=job_id,
        expert_id=expert_id,
        domain=domain,
        analysis_type=analysis_type,
        bayesian_verdict=bayesian_verdict,
        ground_truth=ground_truth,
        feedback_rating=rating,
        confidence_assessment=0.9,
        metric_name=metric_name,
        observed_value=observed_value,
        suggested_prior_adjustment=adjustment,
        adjustment_magnitude=adjustment_magnitude,
        comments=comments,
    )
    
    engine = get_feedback_engine()
    return engine.submit_feedback(feedback)


if __name__ == "__main__":
    """Test expert feedback system"""
    logging.basicConfig(level=logging.INFO)
    
    print("Phase 2e Expert Feedback System Test")
    print("=" * 70)
    
    engine = get_feedback_engine()
    
    # Test 1: Submit feedback
    print("\nTest 1: Submit Expert Feedback")
    print("-" * 70)
    
    feedback1 = ExpertFeedback(
        job_id="job-123",
        expert_id="dr_smith",
        domain="solar_wind",
        analysis_type="emergence_detection",
        bayesian_verdict="strongly_confirmed",
        ground_truth="confirmed",
        feedback_rating=FeedbackRating.CORRECT,
        confidence_assessment=0.95,
        metric_name="rms_frequency_error_percent",
        observed_value=0.1238,
        suggested_prior_adjustment=PriorAdjustment.NO_CHANGE,
        comments="Emergence signal clear and consistent"
    )
    
    result = engine.submit_feedback(feedback1)
    print(f"Feedback submitted: {feedback1.job_id}")
    print(f"Expert accuracy: {engine.expert_profiles['dr_smith']['accuracy_rate']:.0%}")
    
    # Test 2: Get refinement recommendations
    print("\nTest 2: Refinement Recommendations")
    print("-" * 70)
    
    recommendations = engine.get_refinement_recommendations()
    print(f"Recommendations available: {len(recommendations)}")
    
    # Test 3: Statistics
    print("\nTest 3: System Statistics")
    print("-" * 70)
    
    stats = engine.get_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print("\nPhase 2e Expert Feedback System Ready ✅")
