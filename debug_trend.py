import sys
import os
sys.path.insert(0, os.getcwd())
from phase_2g_expert_reputation import PredictionOutcome, PredictionOutcomeType, ExpertReputationEngine
from datetime import datetime, timezone, timedelta

engine = ExpertReputationEngine()
base_time = datetime.now(timezone.utc)
expert_id = "test-improving"

for i in range(5):
    type = PredictionOutcomeType.CORRECT if i < 1 else PredictionOutcomeType.INCORRECT
    outcome = PredictionOutcome(
        expert_id=expert_id, prediction_id=f"o-{i}", predicted_value="x",
        predicted_confidence=0.5, actual_value="x" if type == PredictionOutcomeType.CORRECT else "y",
        outcome_type=type, timestamp_predicted=base_time + timedelta(hours=i),
        timestamp_actual=base_time + timedelta(hours=i, minutes=30), domain="test"
    )
    engine.record_prediction_outcome(outcome)

for i in range(5):
    outcome = PredictionOutcome(
        expert_id=expert_id, prediction_id=f"n-{i}", predicted_value="x",
        predicted_confidence=0.9, actual_value="x", outcome_type=PredictionOutcomeType.CORRECT,
        timestamp_predicted=base_time + timedelta(hours=5+i),
        timestamp_actual=base_time + timedelta(hours=5+i, minutes=30), domain="test"
    )
    engine.record_prediction_outcome(outcome)

rep = engine.get_expert_reputation(expert_id)
print(f"Total: {rep['total_predictions']}")
print(f"Acc: {rep['accuracy']:.2f}")
print(f"Recent: {rep['recent_accuracy']:.2f}")
print(f"Trend: {rep['trend']}")
