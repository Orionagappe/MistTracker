"""
Phase 17.5 → Phase 17.6.1 Integration Test Suite
=================================================

Tests complete end-to-end workflow:
1. Phase 17.5 USB validation simulation (atomic domain predictions)
2. Phase 17.6.1 data capture (store predictions + hardware metrics)
3. Phase 17.6.1 result analysis (generate reports)
4. Phase 17.6.1 result verification (integrity checks)

Integration tests validate that Phase 17.5 output flows correctly through
Phase 17.6.1 pipeline without loss or corruption.

Verifies:
- Data capture correctly stores simulated validation output
- SHA256 checksums maintain integrity
- Analysis engine generates accurate reports from captured data
- Verification system confirms all data integrity
- Index consistency across iterations
"""

import json
import sys
import tempfile
from pathlib import Path
from datetime import datetime, timedelta
import unittest
from typing import Dict, List

# Import Phase 17.5 simulator
from phase_17_5_simulation import Phase175Simulator

# Import Phase 17.6.1 components
from result_capture import ResultCapture
from result_analyzer import ResultAnalyzer
from result_verifier import ResultVerifier


class Phase1755IntegrationTests(unittest.TestCase):
    """Integration tests for Phase 17.5 → Phase 17.6.1 pipeline."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_dir = Path(tempfile.mkdtemp(prefix="phase-17-5-6-1-"))
        self.results_dir = self.test_dir / "results"
        self.results_dir.mkdir(parents=True)
        
        self.simulator = Phase175Simulator(seed=42)
        self.capture = ResultCapture(str(self.results_dir))
        self.analyzer = ResultAnalyzer(str(self.results_dir))
        self.verifier = ResultVerifier()
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)
    
    # =====================================================================
    # Test Group 1: Phase 17.5 Simulation → Phase 17.6.1 Data Capture
    # =====================================================================
    
    def test_01_simulate_single_validation(self):
        """Test: Simulate single Phase 17.5 USB validation."""
        print("\n[TEST 01] Simulate single Phase 17.5 validation")
        
        result = self.simulator.simulate_complete_validation("test-001")
        
        # Verify structure
        self.assertEqual(result.domain, "atomic")
        self.assertEqual(result.atom_count, 18)  # H through Ar
        self.assertEqual(len(result.predictions), 18)
        
        # Verify data quality
        self.assertGreater(result.average_emergence_index, 0.6)
        self.assertLess(result.average_emergence_index, 1.0)
        self.assertGreater(result.average_confidence, 0.7)
        self.assertLess(result.average_confidence, 1.0)
        
        # Verify hardware metrics
        self.assertEqual(result.hardware_metrics["total_ram_gb"], 16)
        self.assertGreater(result.hardware_metrics["fitness_score"], 0)
        self.assertLessEqual(result.hardware_metrics["fitness_score"], 100)
        
        # Verify checksum
        self.assertEqual(len(result.checksum_sha256), 64)  # SHA256 hex length
        
        print(f"  ✓ Created validation: {result.iteration_id}")
        print(f"    - Emergence Index: {result.average_emergence_index:.3f}")
        print(f"    - Confidence: {result.average_confidence:.3f}")
        print(f"    - Fitness Score: {result.hardware_metrics['fitness_score']:.1f}/100")
    
    def test_02_capture_simulation_output(self):
        """Test: Capture simulated Phase 17.5 output into Phase 17.6.1."""
        print("\n[TEST 02] Capture Phase 17.5 simulation output")
        
        # Simulate Phase 17.5 validation
        validation = self.simulator.simulate_complete_validation("cap-001")
        
        # Begin Phase 17.6.1 capture
        self.capture.begin_iteration(
            iteration_id=validation.iteration_id,
            metadata={
                "phase": "17.5",
                "domain": validation.domain,
                "atom_count": validation.atom_count,
                "iteration_type": "simulation"
            }
        )
        
        # Capture each atomic domain prediction
        for prediction in validation.predictions:
            self.capture.capture_prediction(
                domain=prediction["atom_name"],
                prediction={
                    "confidence": prediction["confidence"],
                    "vector": [prediction["emergence_index"], prediction["confidence"]],
                    "metadata": {
                        "atomic_number": prediction["atomic_number"],
                        "emergence_index": prediction["emergence_index"],
                        "parameter_sweep": prediction["parameter_sweep"],
                        "provenance_chain": prediction["provenance_chain"],
                        "model_version": prediction["model_version"],
                    }
                }
            )
        
        # Capture hardware metrics (convert fitness_score to 0-1 scale)
        fitness_score_normalized = validation.hardware_metrics["fitness_score"] / 100.0
        self.capture.capture_hardware_fitness({
            "cpu_score": 0.85,
            "memory_score": 0.88,
            "io_score": 0.82,
            "thermal_score": 0.90,
            "overall": fitness_score_normalized,
            "details": {
                "total_ram_gb": validation.hardware_metrics["total_ram_gb"],
                "available_ram_gb": validation.hardware_metrics["available_ram_gb"],
                "cpu_cores": validation.hardware_metrics["cpu_cores"],
                "cpu_frequency_ghz": validation.hardware_metrics["cpu_frequency_ghz"],
                "ssd_free_gb": validation.hardware_metrics["ssd_free_gb"],
                "node_version": validation.hardware_metrics["node_version"],
            }
        })
        
        # Finalize iteration
        self.capture.finalize_iteration()
        
        # Verify files were created
        iteration_file = self.results_dir / f"{validation.iteration_id}-result.json"
        self.assertTrue(iteration_file.exists(), f"Iteration file not found: {iteration_file}")
        
        # Verify INDEX file
        index_file = self.results_dir / "INDEX.json"
        self.assertTrue(index_file.exists(), f"INDEX file not found: {index_file}")
        
        with open(iteration_file) as f:
            captured_data = json.load(f)
        
        self.assertEqual(captured_data["iteration_id"], validation.iteration_id)
        self.assertEqual(len(captured_data["predictions"]), 18)
        self.assertIn("hardware_fitness", captured_data)
        
        print(f"  ✓ Captured iteration: {validation.iteration_id}")
        print(f"    - File: {iteration_file}")
        print(f"    - Predictions: {len(captured_data['predictions'])}")
        print(f"    - Hardware fitness: {captured_data['hardware_fitness']['overall_fitness']:.2f}")
    
    # =====================================================================
    # Test Group 2: Phase 17.6.1 Data Verification
    # =====================================================================
    
    def test_03_verify_captured_data_integrity(self):
        """Test: Verify Phase 17.6.1 data integrity via checksums."""
        print("\n[TEST 03] Verify captured data integrity")
        
        # Simulate and capture
        validation = self.simulator.simulate_complete_validation("verify-001")
        self.capture.begin_iteration(validation.iteration_id, {"phase": "17.5"})
        for pred in validation.predictions:
            self.capture.capture_prediction(
                domain=pred["atom_name"],
                prediction={"confidence": pred["confidence"], "vector": [pred["emergence_index"]]}
            )
        self.capture.capture_hardware_fitness({"overall": 0.85})
        self.capture.finalize_iteration()
        
        # Verify checksum
        is_valid, message = self.verifier.verify_checksum(str(self.results_dir), validation.iteration_id)
        self.assertTrue(is_valid, f"Checksum verification failed: {message}")
        
        print(f"  ✓ Checksum valid: {message}")
    
    def test_04_verify_json_schema_validation(self):
        """Test: Validate JSON schema of captured iterations."""
        print("\n[TEST 04] Validate JSON schema")
        
        # Simulate and capture
        validation = self.simulator.simulate_complete_validation("schema-001")
        self.capture.begin_iteration(validation.iteration_id, {"phase": "17.5"})
        for pred in validation.predictions:
            self.capture.capture_prediction(
                domain=pred["atom_name"],
                prediction={"confidence": pred["confidence"], "vector": [pred["emergence_index"]]}
            )
        self.capture.capture_hardware_fitness({"overall": 0.85})
        self.capture.finalize_iteration()
        
        # Validate schema
        is_valid, message = self.verifier.validate_result_json(str(self.results_dir), validation.iteration_id)
        self.assertTrue(is_valid, f"Schema validation failed: {message}")
        
        print(f"  ✓ Schema valid: {message}")
    
    def test_05_verify_index_consistency(self):
        """Test: Verify INDEX file consistency with actual iterations."""
        print("\n[TEST 05] Verify index consistency")
        
        # Create multiple iterations
        for i in range(3):
            validation = self.simulator.simulate_complete_validation(f"idx-{i+1:03d}")
            self.capture.begin_iteration(validation.iteration_id, {"phase": "17.5"})
            for pred in validation.predictions:
                self.capture.capture_prediction(
                    domain=pred["atom_name"],
                    prediction={"confidence": pred["confidence"], "vector": [pred["emergence_index"]]}
                )
            self.capture.capture_hardware_fitness({"overall": 0.85})
            self.capture.finalize_iteration()
        
        # Verify index consistency
        report = self.verifier.verify_index_consistency(str(self.results_dir))
        self.assertTrue(report["consistent"], f"Index consistency failed: {report['issues']}")
        
        print(f"  ✓ Index consistent")
        print(f"    - Issues: {len(report['issues'])}")
    
    # =====================================================================
    # Test Group 3: Phase 17.6.1 Analysis
    # =====================================================================
    
    def test_06_analyze_captured_predictions(self):
        """Test: Analyze Phase 17.6.1 captured predictions."""
        print("\n[TEST 06] Analyze captured predictions")
        
        # Create multiple iterations for analysis
        for i in range(2):
            validation = self.simulator.simulate_complete_validation(f"ana-{i+1:03d}")
            self.capture.begin_iteration(validation.iteration_id, {"phase": "17.5"})
            for pred in validation.predictions:
                self.capture.capture_prediction(
                    domain=pred["atom_name"],
                    prediction={"confidence": pred["confidence"], "vector": [pred["emergence_index"]]}
                )
            self.capture.capture_hardware_fitness({"overall": 0.85})
            self.capture.finalize_iteration()
        
        # Analyze predictions
        analysis = self.analyzer.analyze_prediction_accuracy()
        
        self.assertGreater(analysis.get("total_predictions", 0), 0)
        self.assertIn("average_confidence", analysis)
        self.assertGreater(analysis["average_confidence"], 0.7)
        
        print(f"  ✓ Prediction analysis complete")
        print(f"    - Total predictions: {analysis.get('total_predictions', 0)}")
        print(f"    - Avg confidence: {analysis.get('average_confidence', 0):.3f}")
    
    def test_07_analyze_hardware_trends(self):
        """Test: Analyze hardware fitness trends across iterations."""
        print("\n[TEST 07] Analyze hardware fitness trends")
        
        # Create iterations with varying hardware fitness
        for i in range(3):
            validation = self.simulator.simulate_complete_validation(f"hw-{i+1:03d}")
            self.capture.begin_iteration(validation.iteration_id, {"phase": "17.5"})
            fitness_normalized = validation.hardware_metrics["fitness_score"] / 100.0
            self.capture.capture_hardware_fitness({"overall": fitness_normalized})
            self.capture.finalize_iteration()
        
        # Analyze trends
        trends = self.analyzer.analyze_hardware_fitness_trends()
        
        self.assertIn("overall_fitness", trends)
        self.assertIn("average", trends["overall_fitness"])
        self.assertGreater(trends["overall_fitness"].get("average", 0), 0)
        
        print(f"  ✓ Hardware trend analysis complete")
        print(f"    - Avg fitness: {trends['overall_fitness']['average']:.2f}")
    
    def test_08_generate_comprehensive_report(self):
        """Test: Generate comprehensive Phase 17.6.1 report."""
        print("\n[TEST 08] Generate comprehensive report")
        
        # Create representative dataset
        for i in range(2):
            validation = self.simulator.simulate_complete_validation(f"rpt-{i+1:03d}")
            self.capture.begin_iteration(
                validation.iteration_id,
                {"phase": "17.5", "domain": "atomic"}
            )
            for pred in validation.predictions:
                self.capture.capture_prediction(
                    domain=pred["atom_name"],
                    prediction={"confidence": pred["confidence"], "vector": [pred["emergence_index"]]}
                )
            fitness_normalized = validation.hardware_metrics["fitness_score"] / 100.0
            self.capture.capture_hardware_fitness({"overall": fitness_normalized})
            self.capture.finalize_iteration()
        
        # Generate report
        report = self.analyzer.generate_comprehensive_report()
        
        self.assertIn("generated_at", report)
        self.assertTrue(isinstance(report, dict))
        
        print(f"  ✓ Comprehensive report generated")
        print(f"    - Report timestamp: {report.get('generated_at', 'N/A')}")
    
    # =====================================================================
    # Test Group 4: End-to-End Integration
    # =====================================================================
    
    def test_09_complete_e2e_workflow(self):
        """Test: Complete end-to-end Phase 17.5 → 17.6.1 workflow."""
        print("\n[TEST 09] Complete end-to-end workflow")
        
        # Phase 1: Simulate Phase 17.5 validations
        print("  Phase 1: Simulating Phase 17.5 validations...")
        validations = self.simulator.simulate_batch_validation(count=3)
        print(f"    ✓ {len(validations)} validations simulated")
        
        # Phase 2: Capture into Phase 17.6.1
        print("  Phase 2: Capturing into Phase 17.6.1...")
        for validation in validations:
            self.capture.begin_iteration(
                validation.iteration_id,
                {"phase": "17.5", "type": "e2e_test"}
            )
            for pred in validation.predictions:
                self.capture.capture_prediction(
                    domain=pred["atom_name"],
                    prediction={"confidence": pred["confidence"], "vector": [pred["emergence_index"]]}
                )
            fitness_normalized = validation.hardware_metrics["fitness_score"] / 100.0
            self.capture.capture_hardware_fitness({"overall": fitness_normalized})
            self.capture.finalize_iteration()
        print(f"    ✓ {len(validations)} iterations captured")
        
        # Phase 3: Verify integrity
        print("  Phase 3: Verifying integrity...")
        verify_report = self.verifier.verify_all_results(str(self.results_dir))
        self.assertEqual(verify_report["passed"], len(validations))
        print(f"    ✓ All checksums valid: {verify_report['passed']}/{verify_report['total_iterations']}")
        
        # Phase 4: Analyze results
        print("  Phase 4: Analyzing results...")
        analysis_report = self.analyzer.generate_comprehensive_report()
        print(f"    ✓ Report generated")
        
        # Phase 5: Validate output
        print("  Phase 5: Validating analysis...")
        self.assertTrue(isinstance(analysis_report, dict))
        
        print("  ✓ End-to-end workflow complete!")
    
    def test_10_integration_statistics(self):
        """Test: Verify integration test statistics."""
        print("\n[TEST 10] Integration test statistics")
        
        # Run full integration
        for i in range(2):
            validation = self.simulator.simulate_complete_validation(f"stat-{i+1:03d}")
            self.capture.begin_iteration(validation.iteration_id, {"phase": "17.5"})
            for pred in validation.predictions:
                self.capture.capture_prediction(
                    domain=pred["atom_name"],
                    prediction={"confidence": pred["confidence"], "vector": [pred["emergence_index"]]}
                )
            fitness_normalized = validation.hardware_metrics["fitness_score"] / 100.0
            self.capture.capture_hardware_fitness({"overall": fitness_normalized})
            self.capture.finalize_iteration()
        
        # Get simulator statistics
        sim_stats = self.simulator.get_statistics()
        
        # Get analyzer statistics
        analysis = self.analyzer.analyze_prediction_accuracy()
        
        print(f"  ✓ Integration statistics:")
        print(f"    - Simulated iterations: {sim_stats.get('total_iterations', 0)}")
        print(f"    - Avg confidence: {sim_stats.get('confidence', {}).get('mean', 0):.3f}")


def run_integration_tests():
    """Run all integration tests."""
    print("\n" + "=" * 70)
    print("Phase 17.5 → Phase 17.6.1 Integration Test Suite")
    print("=" * 70)
    
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(Phase1755IntegrationTests)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✓ All integration tests passed!")
        print("✓ Phase 17.5 → 17.6.1 pipeline validated successfully")
        return 0
    else:
        print("\n✗ Some tests failed. See details above.")
        return 1


if __name__ == "__main__":
    sys.exit(run_integration_tests())
