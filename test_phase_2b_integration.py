#!/usr/bin/env python3
"""
Phase 2b API Integration Tests
MistTracker Emergence Detection Framework

Demonstrates end-to-end Phase 2a API → Phase 2b Bayesian integration.

Run with:
    python test_phase_2b_integration.py
"""

import json
import sys
from pathlib import Path

# Add repo to path
sys.path.insert(0, str(Path(__file__).parent))

from phase_2b_api_integration import (
    integrate_analysis_result,
    create_bayesian_response,
    create_bayesian_batch_response,
    get_integration_metrics,
    Phase2bIntegrationResult,
    ResultFormat,
)


def print_header(text: str, level: int = 1):
    """Print formatted header"""
    if level == 1:
        print("\n" + "=" * 70)
        print(f"  {text}")
        print("=" * 70)
    elif level == 2:
        print(f"\n{text}")
        print("-" * 70)
    else:
        print(f"\n  {text}")


def test_phase0_result_conversion():
    """Test 1: Convert Phase 0 Test 1 result to Bayesian"""
    print_header("Test 1: Phase 0 Test 1 → Bayesian Conversion", level=2)
    
    # Phase 1 result from Phase 0 Test 1
    phase1_result = {
        "domain": "solar_wind",
        "analysis_type": "emergence_detection",
        "primary_metric": 0.1238,
        "metric_name": "rms_frequency_error_percent",
        "threshold": 5.0,
        "status": "CONFIRMED",
        "timestamp": "2026-04-21T10:00:00Z",
        "frequencies": [0.5, 1.0, 1.5],
        "harmonics": [0.95, 0.92, 0.88],
        "data_points_analyzed": 86400,
    }
    
    # Test combined format
    result = integrate_analysis_result(
        job_id="test-1-combined",
        phase1_result=phase1_result,
        format="combined"
    )
    
    print(f"Job ID: {result.job_id}")
    print(f"Format: {result.format.value}")
    print(f"Phase 1 Status: {result.phase1_result['status']}")
    print(f"Phase 1 Metric: {result.phase1_result['primary_metric']:.4f}%")
    
    if result.bayesian_result:
        print(f"\nBayesian Results:")
        print(f"  Verdict: {result.bayesian_result.get('verdict', 'N/A')}")
        print(f"  Confidence: {result.bayesian_result.get('confidence', 'N/A')}")
        if 'posterior_mean' in result.bayesian_result:
            print(f"  Posterior Mean: {result.bayesian_result['posterior_mean']:.6f}%")
            print(f"  Posterior Std: {result.bayesian_result['posterior_std']:.6f}%")
            ci = result.bayesian_result.get('credible_interval')
            if ci:
                print(f"  95% Credible Interval: [{ci[0]:.6f}, {ci[1]:.6f}]")
        print(f"  P(emergence | data): {result.bayesian_result.get('p_hypothesis', 'N/A')}")
        print(f"  False Positive Risk: {result.bayesian_result.get('false_positive_risk', 'N/A')}")
        print(f"  False Negative Risk: {result.bayesian_result.get('false_negative_risk', 'N/A')}")
    
    if result.integration_error:
        print(f"\nNote: {result.integration_error}")
    
    return result


def test_format_variations():
    """Test 2: Different output formats"""
    print_header("Test 2: Format Variations (phase1, bayesian, combined)", level=2)
    
    phase1_result = {
        "domain": "solar_wind",
        "analysis_type": "emergence_detection",
        "primary_metric": 0.1238,
        "metric_name": "rms_frequency_error_percent",
        "threshold": 5.0,
        "status": "CONFIRMED",
    }
    
    for fmt in ["phase1", "bayesian", "combined"]:
        result = integrate_analysis_result(
            job_id=f"test-2-{fmt}",
            phase1_result=phase1_result,
            format=fmt
        )
        
        has_phase1 = result.phase1_result is not None
        has_bayesian = result.bayesian_result is not None
        
        print(f"\nFormat: '{fmt}'")
        print(f"  Phase 1 included: {has_phase1}")
        print(f"  Bayesian included: {has_bayesian}")


def test_earthquake_domain():
    """Test 3: Earthquake domain (scale-invariance test)"""
    print_header("Test 3: Earthquake Domain - B-Value Analysis", level=2)
    
    # Phase 0 Test 3B: Earthquake b-value
    phase1_result = {
        "domain": "earthquakes",
        "analysis_type": "scale_invariance",
        "primary_metric": 0.4471,
        "metric_name": "b_value",
        "threshold": 1.0,
        "status": "FALSIFIED",
        "timestamp": "2026-04-21T10:15:00Z",
        "analysis_regions": ["california", "japan", "chile", "newzealand"],
    }
    
    result = integrate_analysis_result(
        job_id="test-3-earthquakes",
        phase1_result=phase1_result,
        format="combined"
    )
    
    print(f"Domain: {result.phase1_result['domain']}")
    print(f"Analysis: {result.phase1_result['analysis_type']}")
    print(f"Metric: {result.phase1_result['metric_name']} = {result.phase1_result['primary_metric']}")
    print(f"Phase 1 Verdict: {result.phase1_result['status']}")
    
    if result.bayesian_result:
        print(f"Bayesian Verdict: {result.bayesian_result.get('verdict')}")
        print(f"Bayesian Confidence: {result.bayesian_result.get('confidence')}")
    
    print(f"\nNote: Phase 0 Test 3B showed b-values are REGIONAL")
    print(f"      Not universal (expected 1.0, found 0.3-1.1 by region)")


def test_network_domain():
    """Test 4: Network domain (power-law exponent)"""
    print_header("Test 4: Network Domain - Power-Law Analysis", level=2)
    
    # Phase 0 Test 3C: Network power-law
    phase1_result = {
        "domain": "networks",
        "analysis_type": "scale_invariance",
        "primary_metric": 1.7,
        "metric_name": "power_law_exponent",
        "threshold": 1.0,
        "status": "FALSIFIED",
        "analysis_layers": ["access", "aggregation", "backbone"],
        "layer_exponents": {"access": 1.7, "aggregation": 1.2, "backbone": 1.05},
    }
    
    result = integrate_analysis_result(
        job_id="test-4-networks",
        phase1_result=phase1_result,
        format="combined"
    )
    
    print(f"Domain: {result.phase1_result['domain']}")
    print(f"Analysis: {result.phase1_result['analysis_type']}")
    print(f"Primary Metric: {result.phase1_result['metric_name']} = {result.phase1_result['primary_metric']}")
    
    if "layer_exponents" in result.phase1_result:
        print(f"\nLayer Analysis:")
        for layer, exp in result.phase1_result["layer_exponents"].items():
            print(f"  {layer}: α = {exp}")
    
    print(f"\nPhase 1 Verdict: {result.phase1_result['status']}")
    if result.bayesian_result:
        print(f"Bayesian Verdict: {result.bayesian_result.get('verdict')}")
    
    print(f"\nNote: Power-law exponent is ARCHITECTURE-DEPENDENT")
    print(f"      Access layer (high capacity, shared): α ≈ 1.7")
    print(f"      Backbone layer (low latency, dedicated): α ≈ 1.05")


def test_batch_integration():
    """Test 5: Batch processing with Bayesian integration"""
    print_header("Test 5: Batch Processing - Multiple Jobs", level=2)
    
    # Simulate 3 jobs from a batch
    job_results = {
        "job-1": {
            "domain": "solar_wind",
            "analysis_type": "emergence_detection",
            "primary_metric": 0.1238,
            "metric_name": "rms_frequency_error_percent",
            "threshold": 5.0,
            "status": "CONFIRMED",
        },
        "job-2": {
            "domain": "earthquakes",
            "analysis_type": "scale_invariance",
            "primary_metric": 0.4471,
            "metric_name": "b_value",
            "threshold": 1.0,
            "status": "FALSIFIED",
        },
        "job-3": {
            "domain": "networks",
            "analysis_type": "scale_invariance",
            "primary_metric": 1.7,
            "metric_name": "power_law_exponent",
            "threshold": 1.0,
            "status": "FALSIFIED",
        },
    }
    
    # Create batch response
    batch_response = create_bayesian_batch_response(
        batch_id="batch-001",
        job_results=job_results,
        format="combined"
    )
    
    print(f"Batch ID: {batch_response['batch_id']}")
    print(f"Total Jobs: {batch_response['job_count']}")
    print(f"Format: {batch_response['format']}")
    
    print(f"\nBatch Results Summary:")
    for i, job_result in enumerate(batch_response['results'], 1):
        job_id = job_result['job_id']
        domain = job_result['phase1']['domain']
        phase1_status = job_result['phase1']['status']
        
        bayesian_status = "N/A"
        if 'bayesian' in job_result and job_result['bayesian']:
            bayesian_status = job_result['bayesian'].get('verdict', 'N/A')
        
        print(f"\n  Job {i}: {job_id}")
        print(f"    Domain: {domain}")
        print(f"    Phase 1 Status: {phase1_status}")
        print(f"    Bayesian Status: {bayesian_status}")


def test_json_serialization():
    """Test 6: JSON serialization for API response"""
    print_header("Test 6: JSON Serialization - API Response Format", level=2)
    
    phase1_result = {
        "domain": "solar_wind",
        "analysis_type": "emergence_detection",
        "primary_metric": 0.1238,
        "metric_name": "rms_frequency_error_percent",
        "threshold": 5.0,
        "status": "CONFIRMED",
    }
    
    # Get response as dictionary
    response_dict = create_bayesian_response(
        job_id="test-6-json",
        phase1_result=phase1_result,
        format="combined"
    )
    
    # Serialize to JSON
    json_str = json.dumps(response_dict, indent=2, default=str)
    
    print("Sample JSON Response (truncated):")
    lines = json_str.split('\n')
    for line in lines[:30]:
        print(f"  {line}")
    
    if len(lines) > 30:
        print(f"  ... ({len(lines) - 30} more lines)")
    
    print(f"\nTotal Response Size: {len(json_str)} bytes")


def test_integration_metrics():
    """Test 7: Integration engine metrics"""
    print_header("Test 7: Integration Engine Metrics", level=2)
    
    metrics = get_integration_metrics()
    
    print("Integration Engine Statistics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")


def test_caching():
    """Test 8: Result caching performance"""
    print_header("Test 8: Result Caching - Performance", level=2)
    
    import time
    
    phase1_result = {
        "domain": "solar_wind",
        "analysis_type": "emergence_detection",
        "primary_metric": 0.1238,
        "metric_name": "rms_frequency_error_percent",
        "threshold": 5.0,
        "status": "CONFIRMED",
    }
    
    job_id = "test-8-cache"
    
    # First call (cache miss)
    start = time.time()
    result1 = integrate_analysis_result(job_id, phase1_result, "combined")
    time1 = time.time() - start
    
    # Second call (cache hit)
    start = time.time()
    result2 = integrate_analysis_result(job_id, phase1_result, "combined")
    time2 = time.time() - start
    
    print(f"First call (cache miss): {time1*1000:.2f}ms")
    print(f"Second call (cache hit): {time2*1000:.2f}ms")
    print(f"Speedup: {time1/time2:.1f}x faster with cache")
    
    # Verify results are identical
    assert result1.bayesian_result == result2.bayesian_result
    print(f"\nCache results verified: identical")


def main():
    """Run all integration tests"""
    print_header("Phase 2b API Integration Test Suite", level=1)
    print("Testing end-to-end Phase 2a API → Phase 2b Bayesian integration")
    
    try:
        test_phase0_result_conversion()
        test_format_variations()
        test_earthquake_domain()
        test_network_domain()
        test_batch_integration()
        test_json_serialization()
        test_integration_metrics()
        test_caching()
        
        print_header("All Tests Completed Successfully ✅", level=1)
        
    except Exception as e:
        print_header(f"Test Failed ❌", level=1)
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
