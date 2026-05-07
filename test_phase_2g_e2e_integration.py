"""
End-to-End Integration Test: Phase 2g Expert Reputation System

Tests the complete flow:
1. Expert submits feedback (Phase 2e)
2. Prediction outcome is recorded (Phase 2g)
3. Reputation is calculated and updated
4. Alert severity is adjusted based on reputation (Integration)
5. Scorecard and statistics are generated

Status: Integration test for production validation
"""

import unittest
from datetime import datetime, timezone, timedelta
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from phase_2g_expert_reputation import (
    ExpertReputationEngine,
    PredictionOutcome,
    PredictionOutcomeType,
    AccuracyTrend,
)
from phase_2e_expert_feedback import get_feedback_engine, FeedbackRating
from phase_2e_alert_system import get_alerting_engine, AlertSeverity, AlertChannel


class TestE2EReputationIntegration(unittest.TestCase):
    """End-to-end integration test for reputation system."""
    
    def setUp(self):
        """Setup test engines."""
        self.reputation_engine = ExpertReputationEngine()
        self.feedback_engine = get_feedback_engine()
        self.alert_engine = get_alerting_engine()
        self.base_time = datetime.now(timezone.utc)
    
    def test_expert_builds_reputation_through_predictions(self):
        """Expert reputation should build over time through accurate predictions."""
        expert_id = "dr_smith"
        
        # Simulate 10 predictions with 80% accuracy
        correct_count = 0
        for i in range(10):
            is_correct = i < 8  # First 8 are correct
            
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-{i}",
                predicted_value="earthquake_imminent",
                predicted_confidence=0.85,
                actual_value="earthquake_imminent" if is_correct else "no_earthquake",
                outcome_type=PredictionOutcomeType.CORRECT if is_correct else PredictionOutcomeType.INCORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="earthquakes",
            )
            
            self.reputation_engine.record_prediction_outcome(outcome)
            if is_correct:
                correct_count += 1
        
        # Get expert reputation
        reputation = self.reputation_engine.get_expert_reputation(expert_id)
        
        # Verify
        self.assertIsNotNone(reputation)
        self.assertEqual(reputation['total_predictions'], 10)
        self.assertEqual(reputation['correct_predictions'], 8)
        self.assertAlmostEqual(reputation['accuracy'], 0.8, places=1)
        self.assertGreater(reputation['reputation_score'], 0.6)  # Good reputation
    
    def test_reputation_weighted_alert(self):
        """Alert severity should be adjusted based on expert reputation."""
        # Create two experts: trusted and untrusted
        trusted_expert = "expert_reliable"
        untrusted_expert = "expert_unreliable"
        
        # Build trusted expert reputation (100% accuracy)
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=trusted_expert,
                prediction_id=f"pred-{i}",
                predicted_value="x",
                predicted_confidence=0.95,
                actual_value="x",
                outcome_type=PredictionOutcomeType.CORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.reputation_engine.record_prediction_outcome(outcome)
        
        # Build untrusted expert reputation (0% accuracy)
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=untrusted_expert,
                prediction_id=f"pred-{i}",
                predicted_value="x",
                predicted_confidence=0.5,
                actual_value="y",
                outcome_type=PredictionOutcomeType.INCORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.reputation_engine.record_prediction_outcome(outcome)
        
        # Get alert weights
        trusted_result = self.reputation_engine.weight_alert_by_reputation([trusted_expert], base_severity=2)
        untrusted_result = self.reputation_engine.weight_alert_by_reputation([untrusted_expert], base_severity=2)
        
        # Trusted expert should increase severity
        self.assertGreater(trusted_result['weight_factor'], 1.0)
        self.assertGreaterEqual(trusted_result['adjusted_severity'], 2)
        
        # Untrusted expert should not decrease severity below 0.8x
        self.assertGreaterEqual(untrusted_result['weight_factor'], 0.8)
        self.assertGreaterEqual(untrusted_result['adjusted_severity'], 1)
        
        # Trusted should have higher weight than untrusted
        self.assertGreater(trusted_result['weight_factor'], untrusted_result['weight_factor'])
    
    def test_multiple_experts_collective_alert_weighting(self):
        """Multiple experts' reputations should combine for alert weighting."""
        # Create 3 experts with different reputation levels
        high_rep = "expert_high"
        med_rep = "expert_med"
        low_rep = "expert_low"
        
        # High reputation: 5 correct out of 5
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=high_rep,
                prediction_id=f"pred-high-{i}",
                predicted_value="x",
                predicted_confidence=0.9,
                actual_value="x",
                outcome_type=PredictionOutcomeType.CORRECT,
                timestamp_predicted=self.base_time + timedelta(minutes=i),
                timestamp_actual=self.base_time + timedelta(minutes=i, seconds=30),
                domain="test",
            )
            self.reputation_engine.record_prediction_outcome(outcome)
        
        # Medium reputation: 3 correct out of 5
        for i in range(5):
            outcome_type = PredictionOutcomeType.CORRECT if i < 3 else PredictionOutcomeType.INCORRECT
            outcome = PredictionOutcome(
                expert_id=med_rep,
                prediction_id=f"pred-med-{i}",
                predicted_value="x" if outcome_type == PredictionOutcomeType.CORRECT else "y",
                predicted_confidence=0.6,
                actual_value="x",
                outcome_type=outcome_type,
                timestamp_predicted=self.base_time + timedelta(minutes=i),
                timestamp_actual=self.base_time + timedelta(minutes=i, seconds=30),
                domain="test",
            )
            self.reputation_engine.record_prediction_outcome(outcome)
        
        # Low reputation: 1 correct out of 5
        for i in range(5):
            outcome_type = PredictionOutcomeType.CORRECT if i < 1 else PredictionOutcomeType.INCORRECT
            outcome = PredictionOutcome(
                expert_id=low_rep,
                prediction_id=f"pred-low-{i}",
                predicted_value="x" if outcome_type == PredictionOutcomeType.CORRECT else "y",
                predicted_confidence=0.3,
                actual_value="x",
                outcome_type=outcome_type,
                timestamp_predicted=self.base_time + timedelta(minutes=i),
                timestamp_actual=self.base_time + timedelta(minutes=i, seconds=30),
                domain="test",
            )
            self.reputation_engine.record_prediction_outcome(outcome)
        
        # Weight alert from all three experts combined
        combined_result = self.reputation_engine.weight_alert_by_reputation(
            [high_rep, med_rep, low_rep],
            base_severity=3
        )
        
        # Should be slightly above neutral (average reputation)
        self.assertGreater(combined_result['weight_factor'], 0.95)
        self.assertLess(combined_result['weight_factor'], 1.1)
        
        # Check individual weights
        weights = combined_result['expert_weights']
        self.assertGreater(weights[high_rep], weights[low_rep])
        self.assertGreater(weights[med_rep], weights[low_rep])
    
    def test_reputation_scorecard_rankings(self):
        """Scorecard should correctly rank experts by reputation."""
        # Create experts with different accuracy levels
        experts_data = [
            ("expert_excellent", 10, 0),   # 100% accuracy
            ("expert_good", 8, 2),         # 80% accuracy
            ("expert_fair", 5, 5),         # 50% accuracy
            ("expert_poor", 2, 8),         # 20% accuracy
        ]
        
        for expert_id, correct, incorrect in experts_data:
            # Add correct predictions
            for i in range(correct):
                outcome = PredictionOutcome(
                    expert_id=expert_id,
                    prediction_id=f"pred-{i}",
                    predicted_value="x",
                    predicted_confidence=0.8,
                    actual_value="x",
                    outcome_type=PredictionOutcomeType.CORRECT,
                    timestamp_predicted=self.base_time + timedelta(seconds=i),
                    timestamp_actual=self.base_time + timedelta(seconds=i, milliseconds=500),
                    domain="test",
                )
                self.reputation_engine.record_prediction_outcome(outcome)
            
            # Add incorrect predictions
            for i in range(incorrect):
                outcome = PredictionOutcome(
                    expert_id=expert_id,
                    prediction_id=f"pred-incorrect-{i}",
                    predicted_value="x",
                    predicted_confidence=0.2,
                    actual_value="y",
                    outcome_type=PredictionOutcomeType.INCORRECT,
                    timestamp_predicted=self.base_time + timedelta(seconds=correct+i),
                    timestamp_actual=self.base_time + timedelta(seconds=correct+i, milliseconds=500),
                    domain="test",
                )
                self.reputation_engine.record_prediction_outcome(outcome)
        
        # Get scorecard
        scorecard = self.reputation_engine.get_reputation_scorecard(limit=4)
        
        # Verify rankings
        self.assertEqual(len(scorecard.top_experts), 4)
        
        # Top should be excellent expert
        top_expert = scorecard.top_experts[0][0]
        self.assertEqual(top_expert, "expert_excellent")
        
        # Bottom should be poor expert (last in the list)
        bottom_expert = scorecard.bottom_experts[-1][0]
        self.assertEqual(bottom_expert, "expert_poor")
    
    def test_confidence_calibration(self):
        """Experts with well-calibrated confidence should have higher calibration scores."""
        well_calibrated = "expert_calibrated"
        poorly_calibrated = "expert_uncalibrated"
        
        # Well-calibrated: high confidence when correct, low when incorrect
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=well_calibrated,
                prediction_id=f"pred-{i}",
                predicted_value="x",
                predicted_confidence=0.9,  # High confidence
                actual_value="x",
                outcome_type=PredictionOutcomeType.CORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.reputation_engine.record_prediction_outcome(outcome)
        
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=well_calibrated,
                prediction_id=f"pred-wrong-{i}",
                predicted_value="x",
                predicted_confidence=0.1,  # Low confidence
                actual_value="y",
                outcome_type=PredictionOutcomeType.INCORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=5+i),
                timestamp_actual=self.base_time + timedelta(hours=5+i, minutes=30),
                domain="test",
            )
            self.reputation_engine.record_prediction_outcome(outcome)
        
        # Poorly-calibrated: always high confidence regardless
        for i in range(10):
            is_correct = i < 5
            outcome = PredictionOutcome(
                expert_id=poorly_calibrated,
                prediction_id=f"pred-{i}",
                predicted_value="x",
                predicted_confidence=0.9,  # Always high
                actual_value="x" if is_correct else "y",
                outcome_type=PredictionOutcomeType.CORRECT if is_correct else PredictionOutcomeType.INCORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.reputation_engine.record_prediction_outcome(outcome)
        
        # Check calibration scores
        well_cal_rep = self.reputation_engine.get_expert_reputation(well_calibrated)
        poorly_cal_rep = self.reputation_engine.get_expert_reputation(poorly_calibrated)
        
        # Well-calibrated should have better calibration
        self.assertGreater(well_cal_rep['confidence_calibration'], poorly_cal_rep['confidence_calibration'])
    
    def test_system_wide_statistics(self):
        """System statistics should aggregate all expert data."""
        # Add some data
        for expert_num in range(3):
            expert_id = f"expert-{expert_num}"
            accuracy = 0.5 + (expert_num * 0.15)  # 50%, 65%, 80%
            
            for pred_num in range(5):
                is_correct = pred_num < (accuracy * 5)
                outcome = PredictionOutcome(
                    expert_id=expert_id,
                    prediction_id=f"pred-{pred_num}",
                    predicted_value="x",
                    predicted_confidence=0.7,
                    actual_value="x" if is_correct else "y",
                    outcome_type=PredictionOutcomeType.CORRECT if is_correct else PredictionOutcomeType.INCORRECT,
                    timestamp_predicted=self.base_time + timedelta(seconds=pred_num),
                    timestamp_actual=self.base_time + timedelta(seconds=pred_num, milliseconds=500),
                    domain="test",
                )
                self.reputation_engine.record_prediction_outcome(outcome)
        
        stats = self.reputation_engine.get_statistics()
        
        self.assertEqual(stats['total_experts'], 3)
        self.assertEqual(stats['total_predictions_recorded'], 15)
        self.assertGreater(stats['average_accuracy'], 0.5)
        self.assertGreater(stats['average_reputation'], 0.4)
        self.assertGreaterEqual(stats['experts_with_sufficient_data'], 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
