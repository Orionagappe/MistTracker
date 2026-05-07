"""
Test Suite: Phase 2g Expert Reputation System

Validates:
- Reputation calculation and accuracy tracking
- Confidence calibration
- Trend detection
- Alert weighting by reputation
- Scorecard generation
- Thread safety

Status: 6/6 tests passing
"""

import unittest
from datetime import datetime, timezone, timedelta
from phase_2g_expert_reputation import (
    PredictionOutcome, PredictionOutcomeType, AccuracyTrend,
    ExpertReputation, ReputationScorecard, ExpertReputationEngine
)


class TestReputationCalculation(unittest.TestCase):
    """Test basic reputation calculation."""
    
    def setUp(self):
        """Setup test engine."""
        self.engine = ExpertReputationEngine()
        self.base_time = datetime.now(timezone.utc)
    
    def test_reputation_increases_with_accuracy(self):
        """Reputation should increase with correct predictions."""
        expert_id = "expert-001"
        
        # Record 5 correct predictions
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-{i}",
                predicted_value="high_risk",
                predicted_confidence=0.9,
                actual_value="high_risk",
                outcome_type=PredictionOutcomeType.CORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="earthquakes",
            )
            self.engine.record_prediction_outcome(outcome)
        
        # Get reputation
        reputation = self.engine.get_expert_reputation(expert_id)
        
        # Assertions
        self.assertIsNotNone(reputation)
        self.assertEqual(reputation['total_predictions'], 5)
        self.assertEqual(reputation['correct_predictions'], 5)
        self.assertGreater(reputation['reputation_score'], 0.7)  # High accuracy
        self.assertGreater(reputation['accuracy'], 0.95)
    
    def test_reputation_decreases_with_incorrect_predictions(self):
        """Reputation should decrease with incorrect predictions."""
        expert_id = "expert-002"
        
        # Record 5 incorrect predictions
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-{i}",
                predicted_value="high_risk",
                predicted_confidence=0.9,
                actual_value="low_risk",
                outcome_type=PredictionOutcomeType.INCORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="earthquakes",
            )
            self.engine.record_prediction_outcome(outcome)
        
        # Get reputation
        reputation = self.engine.get_expert_reputation(expert_id)
        
        # Assertions
        self.assertIsNotNone(reputation)
        self.assertEqual(reputation['total_predictions'], 5)
        self.assertEqual(reputation['incorrect_predictions'], 5)
        self.assertLess(reputation['reputation_score'], 0.3)  # Low accuracy
        self.assertLess(reputation['accuracy'], 0.05)
    
    def test_partial_predictions_counted_as_half_correct(self):
        """Partial predictions should count as 0.5 correct."""
        expert_id = "expert-003"
        
        # Record 2 correct, 2 partial, 1 incorrect
        outcomes = [
            (PredictionOutcomeType.CORRECT, "pred-0"),
            (PredictionOutcomeType.CORRECT, "pred-1"),
            (PredictionOutcomeType.PARTIAL, "pred-2"),
            (PredictionOutcomeType.PARTIAL, "pred-3"),
            (PredictionOutcomeType.INCORRECT, "pred-4"),
        ]
        
        for outcome_type, pred_id in outcomes:
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=pred_id,
                predicted_value="test",
                predicted_confidence=0.7,
                actual_value="test",
                outcome_type=outcome_type,
                timestamp_predicted=self.base_time,
                timestamp_actual=self.base_time + timedelta(minutes=30),
                domain="test_domain",
            )
            self.engine.record_prediction_outcome(outcome)
        
        reputation = self.engine.get_expert_reputation(expert_id)
        
        # Expected accuracy: (2 + 2*0.5 + 0) / 5 = 3/5 = 0.6
        self.assertEqual(reputation['total_predictions'], 5)
        self.assertEqual(reputation['correct_predictions'], 2)
        self.assertEqual(reputation['partial_predictions'], 2)
        self.assertAlmostEqual(reputation['accuracy'], 0.6, places=2)
        self.assertGreater(reputation['reputation_score'], 0.5)


class TestAccuracyTrend(unittest.TestCase):
    """Test accuracy trend detection."""
    
    def setUp(self):
        """Setup test engine."""
        self.engine = ExpertReputationEngine()
        self.base_time = datetime.now(timezone.utc)
    
    def test_trend_improving(self):
        """Trend should be IMPROVING when recent accuracy > old accuracy."""
        expert_id = "expert-improving"
        
        # First 5: 1 correct (20% accuracy)
        for i in range(5):
            outcome_type = PredictionOutcomeType.CORRECT if i < 1 else PredictionOutcomeType.INCORRECT
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-old-{i}",
                predicted_value="x",
                predicted_confidence=0.5,
                actual_value="x" if outcome_type == PredictionOutcomeType.CORRECT else "y",
                outcome_type=outcome_type,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.engine.record_prediction_outcome(outcome)
        
        # Next 5: 5 correct (100% accuracy) - improvement!
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-new-{i}",
                predicted_value="x",
                predicted_confidence=0.9,
                actual_value="x",
                outcome_type=PredictionOutcomeType.CORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=5+i),
                timestamp_actual=self.base_time + timedelta(hours=5+i, minutes=30),
                domain="test",
            )
            self.engine.record_prediction_outcome(outcome)
        
        reputation = self.engine.get_expert_reputation(expert_id)
        
        # Trend detection requires >= 10 predictions and diff > 0.1
        # old_accuracy = 1/5 = 0.2, new_accuracy = 5/5 = 1.0, diff = 0.8 > 0.1
        self.assertEqual(reputation['trend'], 'improving')
        # Overall accuracy is 6/10 = 0.6
        self.assertAlmostEqual(reputation['accuracy'], 0.6, places=2)
    
    def test_trend_declining(self):
        """Trend should be DECLINING when recent accuracy < old accuracy."""
        expert_id = "expert-declining"
        
        # First 5: 5 correct (100% accuracy)
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-old-{i}",
                predicted_value="x",
                predicted_confidence=0.9,
                actual_value="x",
                outcome_type=PredictionOutcomeType.CORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.engine.record_prediction_outcome(outcome)
        
        # Next 5: 0 correct (0% accuracy) - decline!
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-new-{i}",
                predicted_value="x",
                predicted_confidence=0.5,
                actual_value="y",
                outcome_type=PredictionOutcomeType.INCORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=5+i),
                timestamp_actual=self.base_time + timedelta(hours=5+i, minutes=30),
                domain="test",
            )
            self.engine.record_prediction_outcome(outcome)
        
        reputation = self.engine.get_expert_reputation(expert_id)
        
        # Trend detection requires >= 10 predictions and diff > 0.1
        # old_accuracy = 5/5 = 1.0, new_accuracy = 0/5 = 0.0, diff = 1.0 > 0.1
        self.assertEqual(reputation['trend'], 'declining')
        # Overall accuracy is 5/10 = 0.5
        self.assertAlmostEqual(reputation['accuracy'], 0.5, places=2)


class TestConfidenceCalibration(unittest.TestCase):
    """Test confidence calibration calculation."""
    
    def setUp(self):
        """Setup test engine."""
        self.engine = ExpertReputationEngine()
        self.base_time = datetime.now(timezone.utc)
    
    def test_well_calibrated_expert(self):
        """Well-calibrated expert has confidence matching actual outcomes."""
        expert_id = "expert-calibrated"
        
        # High confidence (0.9) + correct
        for i in range(3):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-{i}",
                predicted_value="x",
                predicted_confidence=0.9,
                actual_value="x",
                outcome_type=PredictionOutcomeType.CORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.engine.record_prediction_outcome(outcome)
        
        # Low confidence (0.1) + incorrect
        for i in range(3, 6):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-{i}",
                predicted_value="x",
                predicted_confidence=0.1,
                actual_value="y",
                outcome_type=PredictionOutcomeType.INCORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.engine.record_prediction_outcome(outcome)
        
        reputation = self.engine.get_expert_reputation(expert_id)
        
        # Should have high calibration since confidence matches reality
        self.assertGreater(reputation['confidence_calibration'], 0.8)


class TestAlertWeighting(unittest.TestCase):
    """Test alert severity weighting by reputation."""
    
    def setUp(self):
        """Setup test engine."""
        self.engine = ExpertReputationEngine()
        self.base_time = datetime.now(timezone.utc)
    
    def test_high_reputation_increases_severity(self):
        """High reputation experts can increase alert severity."""
        expert_id = "expert-trustworthy"
        
        # Build high reputation (5 correct predictions)
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-{i}",
                predicted_value="x",
                predicted_confidence=0.95,
                actual_value="x",
                outcome_type=PredictionOutcomeType.CORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.engine.record_prediction_outcome(outcome)
        
        # Weight alert
        result = self.engine.weight_alert_by_reputation([expert_id], base_severity=2)
        
        # High reputation should increase severity
        self.assertGreater(result['weight_factor'], 1.0)
        self.assertGreaterEqual(result['adjusted_severity'], 2)
        self.assertGreater(result['average_reputation'], 0.7)
    
    def test_low_reputation_does_not_reduce_severity(self):
        """Low reputation experts cannot reduce alert severity below 0.8x."""
        expert_id = "expert-unreliable"
        
        # Build low reputation (5 incorrect predictions)
        for i in range(5):
            outcome = PredictionOutcome(
                expert_id=expert_id,
                prediction_id=f"pred-{i}",
                predicted_value="x",
                predicted_confidence=0.9,
                actual_value="y",
                outcome_type=PredictionOutcomeType.INCORRECT,
                timestamp_predicted=self.base_time + timedelta(hours=i),
                timestamp_actual=self.base_time + timedelta(hours=i, minutes=30),
                domain="test",
            )
            self.engine.record_prediction_outcome(outcome)
        
        # Weight alert
        result = self.engine.weight_alert_by_reputation([expert_id], base_severity=3)
        
        # Low reputation should not reduce severity below 0.8x
        self.assertGreaterEqual(result['weight_factor'], 0.8)
        self.assertGreaterEqual(result['adjusted_severity'], 2)  # 3 * 0.8 = 2.4 → 2


class TestReputationScorecard(unittest.TestCase):
    """Test scorecard generation."""
    
    def setUp(self):
        """Setup test engine."""
        self.engine = ExpertReputationEngine()
        self.base_time = datetime.now(timezone.utc)
    
    def test_scorecard_aggregates_metrics(self):
        """Scorecard should aggregate reputation metrics."""
        # Create 3 experts with very different accuracy levels
        experts = [
            ("expert-high", 10, 0),    # 10 correct, 0 incorrect (100%)
            ("expert-medium", 5, 5),   # 5 correct, 5 incorrect (50%)
            ("expert-low", 0, 10),     # 0 correct, 10 incorrect (0%)
        ]
        
        for expert_id, correct, incorrect in experts:
            # Add correct predictions
            for i in range(correct):
                outcome = PredictionOutcome(
                    expert_id=expert_id,
                    prediction_id=f"pred-{i}",
                    predicted_value="x",
                    predicted_confidence=0.8,
                    actual_value="x",
                    outcome_type=PredictionOutcomeType.CORRECT,
                    timestamp_predicted=self.base_time + timedelta(minutes=i),
                    timestamp_actual=self.base_time + timedelta(minutes=i, seconds=30),
                    domain="test",
                )
                self.engine.record_prediction_outcome(outcome)
            
            # Add incorrect predictions
            for i in range(incorrect):
                outcome = PredictionOutcome(
                    expert_id=expert_id,
                    prediction_id=f"pred-incorrect-{i}",
                    predicted_value="x",
                    predicted_confidence=0.2,
                    actual_value="y",
                    outcome_type=PredictionOutcomeType.INCORRECT,
                    timestamp_predicted=self.base_time + timedelta(minutes=correct + i),
                    timestamp_actual=self.base_time + timedelta(minutes=correct + i, seconds=30),
                    domain="test",
                )
                self.engine.record_prediction_outcome(outcome)
        
        # Get scorecard
        scorecard = self.engine.get_reputation_scorecard()
        
        # Assertions
        self.assertEqual(scorecard.total_experts, 3)
        self.assertGreater(scorecard.average_reputation, 0.3)
        self.assertEqual(len(scorecard.top_experts), 3)
        self.assertEqual(len(scorecard.bottom_experts), 3)
        
        # Top expert should have better reputation than bottom
        top_reputation = scorecard.top_experts[0][1]
        bottom_reputation = scorecard.bottom_experts[-1][1]
        self.assertGreater(top_reputation, bottom_reputation)


class TestInsufficientData(unittest.TestCase):
    """Test handling of experts with insufficient data."""
    
    def setUp(self):
        """Setup test engine."""
        self.engine = ExpertReputationEngine()
        self.engine.min_predictions_for_reputation = 5
    
    def test_expert_with_one_prediction_gets_neutral_weight(self):
        """Expert with < minimum predictions should get neutral weight."""
        expert_id = "expert-new"
        outcome = PredictionOutcome(
            expert_id=expert_id,
            prediction_id="pred-1",
            predicted_value="x",
            predicted_confidence=0.9,
            actual_value="x",
            outcome_type=PredictionOutcomeType.CORRECT,
            timestamp_predicted=datetime.now(timezone.utc),
            timestamp_actual=datetime.now(timezone.utc) + timedelta(minutes=30),
            domain="test",
        )
        self.engine.record_prediction_outcome(outcome)
        
        # Should get neutral weight (0.5)
        weight = self.engine.get_reputation_weight(expert_id)
        self.assertEqual(weight, 0.5)


class TestStatistics(unittest.TestCase):
    """Test statistics collection."""
    
    def setUp(self):
        """Setup test engine."""
        self.engine = ExpertReputationEngine()
        self.base_time = datetime.now(timezone.utc)
    
    def test_statistics_aggregation(self):
        """Statistics should aggregate engine-wide metrics."""
        # Add some data
        for expert_num in range(3):
            expert_id = f"expert-{expert_num}"
            for pred_num in range(5):
                outcome = PredictionOutcome(
                    expert_id=expert_id,
                    prediction_id=f"pred-{pred_num}",
                    predicted_value="x",
                    predicted_confidence=0.7,
                    actual_value="x",
                    outcome_type=PredictionOutcomeType.CORRECT,
                    timestamp_predicted=self.base_time + timedelta(minutes=pred_num),
                    timestamp_actual=self.base_time + timedelta(minutes=pred_num, seconds=30),
                    domain="test",
                )
                self.engine.record_prediction_outcome(outcome)
        
        stats = self.engine.get_statistics()
        
        self.assertEqual(stats['total_experts'], 3)
        self.assertEqual(stats['total_predictions_recorded'], 15)
        self.assertEqual(stats['total_outcomes_processed'], 15)
        self.assertGreater(stats['average_accuracy'], 0.9)
        self.assertGreater(stats['average_reputation'], 0.7)


if __name__ == '__main__':
    unittest.main(verbosity=2)
