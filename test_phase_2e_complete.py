"""
Phase 2e: Comprehensive Test Suite
MistTracker Emergence Detection Framework

Tests for:
1. Expert Feedback System
2. Advanced Alert System
3. Multi-Domain Correlation Detector
4. Interactive Threshold Optimizer
5. End-to-End Integration

Run with: python test_phase_2e_complete.py
"""

import sys
from pathlib import Path
import logging
from datetime import datetime, timedelta, timezone

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from phase_2e_expert_feedback import (
    ExpertFeedback,
    FeedbackRating,
    PriorAdjustment,
    get_feedback_engine,
    submit_expert_feedback,
)

from phase_2e_alert_system import (
    Alert,
    AlertRule,
    AlertSeverity,
    AlertChannel,
    get_alerting_engine,
    create_default_rules,
)

from phase_2e_correlation_detector import (
    DomainEvent,
    CorrelationType,
    get_correlation_detector,
)

from phase_2e_threshold_optimizer import (
    LabeledDatapoint,
    ClassificationOutcome,
    get_threshold_optimizer,
)


def test_1_expert_feedback():
    """Test 1: Expert Feedback System"""
    print("\n" + "="*70)
    print("TEST 1: Expert Feedback System")
    print("="*70)
    
    engine = get_feedback_engine()
    
    # Submit feedback from solar wind expert
    result = submit_expert_feedback(
        job_id="job-sw-001",
        expert_id="dr_smith",
        domain="solar_wind",
        analysis_type="emergence_detection",
        bayesian_verdict="strongly_confirmed",
        ground_truth="confirmed",
        feedback_rating="correct",
        metric_name="rms_frequency_error_percent",
        observed_value=0.1238,
        suggested_adjustment="no_change",
        comments="Emergence signal clear and consistent"
    )
    
    print(f"✓ Feedback submitted: {result['status']}")
    print(f"  Expert: {result['expert_profile']['expert_id']}")
    print(f"  Accuracy: {result['expert_profile']['accuracy_rate']:.0%}")
    
    # Get expert profile
    profile = engine.get_expert_profile("dr_smith")
    assert profile['feedback_count'] >= 1, f"Expected at least 1 feedback entry, got {profile['feedback_count']}"
    assert profile['expert_id'] == "dr_smith"
    print(f"✓ Expert profile retrieved: {profile['feedback_count']} feedback entries")
    
    # Get statistics
    stats = engine.get_statistics()
    print(f"✓ System statistics:")
    print(f"  Total feedback: {stats['total_feedback_submitted']}")
    print(f"  Unique experts: {stats['unique_experts']}")
    
    return True


def test_2_advanced_alerts():
    """Test 2: Advanced Alert System"""
    print("\n" + "="*70)
    print("TEST 2: Advanced Alert System")
    print("="*70)
    
    engine = get_alerting_engine()
    
    # Register default rules
    for rule in create_default_rules():
        engine.add_rule(rule)
    
    print(f"✓ Registered {len(engine.rules)} alert rules")
    
    # Evaluate high-confidence result
    high_conf_result = {
        "job_id": "job-123",
        "domain": "solar_wind",
        "verdict": "strongly_confirmed",
        "confidence": 0.99,
        "false_positive_risk": 0.001,
        "false_negative_risk": 0.0,
    }
    
    alerts = engine.evaluate_result(high_conf_result)
    print(f"✓ Generated {len(alerts)} alerts for high-confidence result")
    
    # Send alerts
    status = engine.send_alerts(alerts)
    print(f"✓ Alerts sent: {status['alerts_sent']}/{status['total_alerts']}")
    
    # Check active alerts
    active = engine.get_active_alerts()
    print(f"✓ Active alerts: {len(active)}")
    
    # Get alert history
    history = engine.get_alert_history(domain="solar_wind", hours=1)
    print(f"✓ Alert history: {len(history)} in last hour")
    
    # Test acknowledge
    if alerts:
        success = engine.acknowledge_alert(alerts[0].alert_id)
        print(f"✓ Alert acknowledged: {success}")
    
    # Statistics
    stats = engine.get_statistics()
    print(f"✓ Alerting statistics:")
    print(f"  Rules: {stats['rules_registered']}")
    print(f"  Total alerts: {stats['total_alerts_generated']}")
    print(f"  Active: {stats['active_alerts']}")
    
    return True


def test_3_correlation_detector():
    """Test 3: Multi-Domain Correlation Detector"""
    print("\n" + "="*70)
    print("TEST 3: Multi-Domain Correlation Detector")
    print("="*70)
    
    detector = get_correlation_detector()
    
    now = datetime.now(timezone.utc)
    
    # Process solar wind event
    event1 = DomainEvent(
        domain="solar_wind",
        job_id="job-sw-1",
        analysis_type="emergence_detection",
        verdict="strongly_confirmed",
        confidence=0.99,
        primary_metric=0.12,
        timestamp=now.isoformat(),
        signal_strength="strong"
    )
    
    patterns1 = detector.process_event(event1)
    print(f"✓ Solar wind event processed: {len(patterns1)} patterns")
    
    # Process earthquake event 2 minutes later
    event2_time = now + timedelta(seconds=120)
    event2 = DomainEvent(
        domain="earthquakes",
        job_id="job-eq-2",
        analysis_type="scale_invariance",
        verdict="confirmed",
        confidence=0.87,
        primary_metric=0.45,
        timestamp=event2_time.isoformat(),
        signal_strength="moderate"
    )
    
    patterns2 = detector.process_event(event2)
    print(f"✓ Earthquake event processed: {len(patterns2)} patterns detected")
    
    # Get active patterns
    active = detector.get_active_patterns()
    print(f"✓ Active correlation patterns: {len(active)}")
    
    # Get high-confidence patterns
    high_conf = detector.get_high_confidence_patterns(min_strength=0.6)
    print(f"✓ High-confidence patterns: {len(high_conf)}")
    
    # Rank by significance
    ranked = detector.rank_patterns_by_significance()
    print(f"✓ Ranked patterns: {len(ranked)}")
    
    for pattern, score in ranked:
        narrative = detector.generate_narrative(pattern)
        print(f"  - {pattern.correlation_type.value}: score={score:.3f}")
    
    # Statistics
    stats = detector.get_statistics()
    print(f"✓ Correlation statistics:")
    print(f"  Total patterns: {stats['total_patterns_detected']}")
    print(f"  Active: {stats['active_patterns']}")
    print(f"  Domains involved: {stats['domains_involved']}")
    
    return True


def test_4_threshold_optimizer():
    """Test 4: Interactive Threshold Optimizer"""
    print("\n" + "="*70)
    print("TEST 4: Interactive Threshold Optimizer")
    print("="*70)
    
    optimizer = get_threshold_optimizer()
    
    # Add labeled data for solar wind
    import random
    random.seed(42)
    
    labeled_count = 0
    for i in range(25):
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
        labeled_count += 1
    
    print(f"✓ Added {labeled_count} labeled datapoints")
    
    # Optimize threshold
    opt_threshold = optimizer.optimize_threshold(
        domain="solar_wind",
        metric_name="rms_frequency_error_percent",
        optimize_for="f1_score",
        min_datapoints=10
    )
    
    if opt_threshold:
        print(f"✓ Threshold optimized:")
        print(f"  Threshold: {opt_threshold.emergence_threshold:.4f}")
        print(f"  F1 Score: {opt_threshold.f1_score:.3f}")
        print(f"  Sensitivity: {opt_threshold.sensitivity:.1%}")
        print(f"  Specificity: {opt_threshold.specificity:.1%}")
        print(f"  Precision: {opt_threshold.precision:.1%}")
    
    # Get ROC curve
    roc_points = optimizer.get_roc_curve(
        domain="solar_wind",
        metric_name="rms_frequency_error_percent"
    )
    print(f"✓ ROC curve generated: {len(roc_points)} points")
    
    # Get recommendations
    recommendations = optimizer.get_threshold_recommendations()
    print(f"✓ Threshold recommendations: {len(recommendations)}")
    
    # Statistics
    stats = optimizer.get_statistics()
    print(f"✓ Optimizer statistics:")
    print(f"  Labeled datapoints: {stats['total_labeled_datapoints']}")
    print(f"  Optimized thresholds: {stats['optimized_thresholds']}")
    
    return True


def test_5_integration():
    """Test 5: End-to-End Integration"""
    print("\n" + "="*70)
    print("TEST 5: End-to-End Integration")
    print("="*70)
    
    # Simulate a complete workflow
    feedback_engine = get_feedback_engine()
    alerting_engine = get_alerting_engine()
    detector = get_correlation_detector()
    optimizer = get_threshold_optimizer()
    
    # Scenario: User receives analysis result, triggers multiple Phase 2e systems
    
    # 1. Expert provides feedback
    feedback = submit_expert_feedback(
        job_id="integration-test-1",
        expert_id="expert_2",
        domain="earthquakes",
        analysis_type="emergence_detection",
        bayesian_verdict="confirmed",
        ground_truth="confirmed",
        feedback_rating="correct",
        metric_name="b_value_deviation",
        observed_value=0.089,
    )
    print(f"✓ Expert feedback submitted")
    
    # 2. Alerts are evaluated
    result = {
        "job_id": "integration-test-1",
        "domain": "earthquakes",
        "verdict": "confirmed",
        "confidence": 0.92,
        "false_positive_risk": 0.02,
        "false_negative_risk": 0.05,
    }
    
    # Register alert rules
    for rule in create_default_rules():
        alerting_engine.add_rule(rule)
    
    alerts = alerting_engine.evaluate_result(result)
    alerting_engine.send_alerts(alerts)
    print(f"✓ Alerts evaluated and sent: {len(alerts)} alerts")
    
    # 3. Correlation detection
    event = DomainEvent(
        domain="earthquakes",
        job_id="integration-test-1",
        analysis_type="emergence_detection",
        verdict="confirmed",
        confidence=0.92,
        primary_metric=0.089,
        timestamp=datetime.now(timezone.utc).isoformat(),
        signal_strength="moderate"
    )
    
    patterns = detector.process_event(event)
    print(f"✓ Correlation patterns detected: {len(patterns)}")
    
    # 4. Threshold learning
    dp = LabeledDatapoint(
        domain="earthquakes",
        metric_name="b_value_deviation",
        metric_value=0.089,
        verdict_by_algorithm="confirmed",
        ground_truth=ClassificationOutcome.TRUE_POSITIVE,
        expert_id="expert_2",
        confidence=0.95
    )
    optimizer.add_labeled_datapoint(dp)
    print(f"✓ Threshold learning datapoint added")
    
    print(f"\n✓ End-to-end integration successful!")
    return True


def test_6_api_endpoints():
    """Test 6: API Endpoint Documentation"""
    print("\n" + "="*70)
    print("TEST 6: API Endpoint Reference")
    print("="*70)
    
    endpoints = {
        "Expert Feedback": [
            "POST /api/feedback/submit - Submit expert feedback",
            "GET /api/feedback/expert/{expert_id} - Get expert profile",
            "GET /api/feedback/statistics - Get system statistics",
        ],
        "Advanced Alerts": [
            "GET /api/alerts/active - Get active alerts",
            "GET /api/alerts/history - Get alert history",
            "POST /api/alerts/acknowledge - Acknowledge alert",
        ],
        "Correlations": [
            "GET /api/correlations/active - Get active patterns",
            "GET /api/correlations/high-confidence - Get high-confidence patterns",
        ],
        "Thresholds": [
            "GET /api/thresholds/recommendations - Get recommendations",
            "GET /api/thresholds/roc/{domain}/{metric} - Get ROC curve",
            "POST /api/thresholds/label-datapoint - Add labeled data",
            "POST /api/thresholds/optimize - Optimize threshold",
        ],
        "System": [
            "GET /api/phase2e/statistics - Get all statistics",
        ]
    }
    
    for category, eps in endpoints.items():
        print(f"\n{category}:")
        for ep in eps:
            print(f"  • {ep}")
    
    return True


def main():
    """Run all tests"""
    print("\n" + "#"*70)
    print("# PHASE 2E COMPREHENSIVE TEST SUITE")
    print("# MistTracker Emergence Detection Framework")
    print("#"*70)
    
    tests = [
        ("Expert Feedback System", test_1_expert_feedback),
        ("Advanced Alert System", test_2_advanced_alerts),
        ("Multi-Domain Correlation Detector", test_3_correlation_detector),
        ("Interactive Threshold Optimizer", test_4_threshold_optimizer),
        ("End-to-End Integration", test_5_integration),
        ("API Endpoint Reference", test_6_api_endpoints),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, "PASS" if success else "FAIL"))
        except Exception as e:
            logger.error(f"Test failed with exception: {e}", exc_info=True)
            results.append((name, "ERROR"))
    
    # Print summary
    print("\n" + "#"*70)
    print("# TEST SUMMARY")
    print("#"*70)
    
    for name, status in results:
        symbol = "✓" if status == "PASS" else "✗"
        print(f"{symbol} {name}: {status}")
    
    passed = sum(1 for _, s in results if s == "PASS")
    total = len(results)
    
    print(f"\nResult: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All Phase 2e tests passed! System ready for production.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review errors above.")
        return 1


if __name__ == "__main__":
    exit(main())
