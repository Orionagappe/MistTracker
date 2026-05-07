#!/usr/bin/env python3
"""
Phase 17.6.1: Integration Test Suite
Comprehensive testing and validation of data capture infrastructure
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# Import the three components
from result_capture import ResultCapture
from result_analyzer import ResultAnalyzer
from result_verifier import ResultVerifier


class IntegrationTestSuite:
    """Test suite for Phase 17.6.1 infrastructure."""
    
    def __init__(self, test_dir: str = "./test-results"):
        """Initialize test suite."""
        self.test_dir = Path(test_dir)
        self.test_dir.mkdir(parents=True, exist_ok=True)
        self.results = {
            "test_run": datetime.utcnow().isoformat(),
            "tests_passed": 0,
            "tests_failed": 0,
            "test_details": []
        }
    
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result."""
        if passed:
            self.results["tests_passed"] += 1
            status = "PASS"
        else:
            self.results["tests_failed"] += 1
            status = "FAIL"
        
        self.results["test_details"].append({
            "test": test_name,
            "status": status,
            "message": message
        })
        
        print(f"[{status}] {test_name}: {message}")
    
    def test_result_capture_basic(self):
        """Test basic result capture functionality."""
        test_name = "ResultCapture - Basic Capture"
        
        try:
            capture = ResultCapture(str(self.test_dir))
            
            # Begin iteration
            capture.begin_iteration("test-iter-001", {
                "test": "basic_capture",
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Capture prediction
            capture.capture_prediction("test_domain", {
                "confidence": 0.85,
                "vector": [0.1, 0.2, 0.3],
                "metadata": {"source": "test"}
            })
            
            # Capture hardware fitness
            capture.capture_hardware_fitness({
                "cpu_score": 0.9,
                "memory_score": 0.85,
                "io_score": 0.8,
                "thermal_score": 0.88,
                "overall": 0.86
            })
            
            # Capture performance
            capture.capture_performance("test_metric", 100.5)
            
            # Log and finalize
            capture.log_execution("INFO", "Test iteration completed")
            result_file = capture.finalize_iteration()
            
            # Verify file exists
            if Path(result_file).exists():
                self.log_test(test_name, True, f"Result saved to {result_file}")
            else:
                self.log_test(test_name, False, "Result file not created")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_capture_multiple_predictions(self):
        """Test capturing multiple predictions."""
        test_name = "ResultCapture - Multiple Predictions"
        
        try:
            capture = ResultCapture(str(self.test_dir))
            capture.begin_iteration("test-iter-002", {"test": "multiple_predictions"})
            
            # Capture multiple predictions
            domains = ["physics", "chemistry", "biology", "mathematics"]
            for i, domain in enumerate(domains):
                capture.capture_prediction(domain, {
                    "confidence": 0.70 + (i * 0.05),
                    "vector": [j * 0.1 for j in range(5)],
                    "metadata": {"iteration": i}
                })
            
            capture.log_execution("INFO", f"Captured {len(domains)} predictions")
            capture.finalize_iteration()
            
            self.log_test(test_name, True, f"Captured {len(domains)} predictions")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_capture_error_handling(self):
        """Test error capture and logging."""
        test_name = "ResultCapture - Error Handling"
        
        try:
            capture = ResultCapture(str(self.test_dir))
            capture.begin_iteration("test-iter-003", {"test": "error_handling"})
            
            capture.log_execution("INFO", "Starting error handling test")
            
            # Simulate errors
            capture.capture_error("ValueError", "Invalid input value", "traceback here")
            capture.capture_error("RuntimeError", "Runtime error occurred")
            
            capture.log_execution("ERROR", "Errors captured and logged")
            capture.finalize_iteration()
            
            self.log_test(test_name, True, "Errors captured successfully")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_analyzer_prediction_analysis(self):
        """Test prediction analysis."""
        test_name = "ResultAnalyzer - Prediction Analysis"
        
        try:
            analyzer = ResultAnalyzer(str(self.test_dir))
            analysis = analyzer.analyze_prediction_accuracy()
            
            if "total_predictions" in analysis and analysis["total_predictions"] > 0:
                self.log_test(test_name, True, 
                            f"Analyzed {analysis['total_predictions']} predictions, "
                            f"avg confidence: {analysis.get('average_confidence', 0):.3f}")
            else:
                self.log_test(test_name, False, "No predictions found")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_analyzer_hardware_fitness(self):
        """Test hardware fitness analysis."""
        test_name = "ResultAnalyzer - Hardware Fitness"
        
        try:
            analyzer = ResultAnalyzer(str(self.test_dir))
            analysis = analyzer.analyze_hardware_fitness_trends()
            
            if "total_measurements" in analysis:
                measurements = analysis["total_measurements"]
                self.log_test(test_name, True, 
                            f"Analyzed {measurements} fitness measurements")
            else:
                self.log_test(test_name, False, "No fitness data found")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_analyzer_performance_metrics(self):
        """Test performance metrics analysis."""
        test_name = "ResultAnalyzer - Performance Metrics"
        
        try:
            analyzer = ResultAnalyzer(str(self.test_dir))
            analysis = analyzer.analyze_performance_metrics()
            
            if "total_iterations" in analysis:
                self.log_test(test_name, True, 
                            f"Analyzed {analysis['total_iterations']} iterations")
            else:
                self.log_test(test_name, False, "No performance data found")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_analyzer_comprehensive_report(self):
        """Test comprehensive report generation."""
        test_name = "ResultAnalyzer - Comprehensive Report"
        
        try:
            analyzer = ResultAnalyzer(str(self.test_dir))
            report = analyzer.generate_comprehensive_report()
            
            # Verify report structure
            required_keys = [
                "generated_at",
                "prediction_analysis",
                "hardware_fitness",
                "performance_metrics",
                "error_analysis"
            ]
            
            missing_keys = [k for k in required_keys if k not in report]
            
            if not missing_keys:
                report_file = analyzer.save_report(report, "test-report.json")
                self.log_test(test_name, True, f"Report saved to {report_file}")
            else:
                self.log_test(test_name, False, f"Missing keys: {missing_keys}")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_verifier_checksum(self):
        """Test checksum verification."""
        test_name = "ResultVerifier - Checksum Verification"
        
        try:
            index_file = self.test_dir / "INDEX.json"
            if not index_file.exists():
                self.log_test(test_name, False, "No index file found")
                return
            
            with open(index_file, 'r') as f:
                index = json.load(f)
            
            if not index["iterations"]:
                self.log_test(test_name, False, "No iterations in index")
                return
            
            iteration_id = index["iterations"][0]["iteration_id"]
            is_valid, message = ResultVerifier.verify_checksum(str(self.test_dir), iteration_id)
            
            self.log_test(test_name, is_valid, message)
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_verifier_all_results(self):
        """Test verification of all results."""
        test_name = "ResultVerifier - All Results"
        
        try:
            results = ResultVerifier.verify_all_results(str(self.test_dir))
            
            total = results.get("total_iterations", 0)
            passed = results.get("passed", 0)
            failed = results.get("failed", 0)
            
            self.log_test(test_name, failed == 0, 
                        f"Total: {total}, Passed: {passed}, Failed: {failed}")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_verifier_json_validation(self):
        """Test JSON validation."""
        test_name = "ResultVerifier - JSON Validation"
        
        try:
            results = ResultVerifier.validate_all_json(str(self.test_dir))
            
            total = results.get("total_iterations", 0)
            valid = results.get("valid", 0)
            invalid = results.get("invalid", 0)
            
            self.log_test(test_name, invalid == 0, 
                        f"Total: {total}, Valid: {valid}, Invalid: {invalid}")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_verifier_index_consistency(self):
        """Test index consistency check."""
        test_name = "ResultVerifier - Index Consistency"
        
        try:
            results = ResultVerifier.verify_index_consistency(str(self.test_dir))
            consistent = results.get("consistent", False)
            issues = results.get("issues", [])
            
            self.log_test(test_name, consistent, 
                        f"Consistent: {consistent}, Issues: {len(issues)}")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def test_result_verifier_comprehensive_report(self):
        """Test comprehensive verification report."""
        test_name = "ResultVerifier - Comprehensive Report"
        
        try:
            report = ResultVerifier.generate_verification_report(str(self.test_dir))
            
            required_keys = [
                "checksum_verification",
                "json_validation",
                "index_consistency"
            ]
            
            missing_keys = [k for k in required_keys if k not in report]
            
            if not missing_keys:
                report_file = ResultVerifier.save_verification_report(
                    report, 
                    str(self.test_dir),
                    "test-verification-report.json"
                )
                self.log_test(test_name, True, f"Report saved to {report_file}")
            else:
                self.log_test(test_name, False, f"Missing keys: {missing_keys}")
        
        except Exception as e:
            self.log_test(test_name, False, str(e))
    
    def run_all_tests(self):
        """Run all integration tests."""
        print("=== Phase 17.6.1 Integration Test Suite ===\n")
        
        # ResultCapture tests
        print("--- ResultCapture Tests ---")
        self.test_result_capture_basic()
        self.test_result_capture_multiple_predictions()
        self.test_result_capture_error_handling()
        
        # ResultAnalyzer tests
        print("\n--- ResultAnalyzer Tests ---")
        self.test_result_analyzer_prediction_analysis()
        self.test_result_analyzer_hardware_fitness()
        self.test_result_analyzer_performance_metrics()
        self.test_result_analyzer_comprehensive_report()
        
        # ResultVerifier tests
        print("\n--- ResultVerifier Tests ---")
        self.test_result_verifier_checksum()
        self.test_result_verifier_all_results()
        self.test_result_verifier_json_validation()
        self.test_result_verifier_index_consistency()
        self.test_result_verifier_comprehensive_report()
        
        # Print summary
        print("\n=== Test Summary ===")
        print(f"Passed: {self.results['tests_passed']}")
        print(f"Failed: {self.results['tests_failed']}")
        total = self.results['tests_passed'] + self.results['tests_failed']
        print(f"Total: {total}")
        
        if self.results['tests_failed'] == 0:
            print("\nAll tests passed!")
            return 0
        else:
            print(f"\n{self.results['tests_failed']} test(s) failed!")
            return 1


if __name__ == "__main__":
    suite = IntegrationTestSuite()
    exit_code = suite.run_all_tests()
    
    # Save test results
    results_file = suite.test_dir / "test-results.json"
    with open(results_file, 'w') as f:
        json.dump(suite.results, f, indent=2)
    
    print(f"\nTest results saved to: {results_file}")
    sys.exit(exit_code)
