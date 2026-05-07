#!/usr/bin/env python3
"""
Phase 17.6.1: Result Verification Module
Data integrity checking and validation
Verifies SHA256 checksums and result file consistency
"""

import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Tuple
from datetime import datetime


class ResultVerifier:
    """Verify integrity of stored results."""
    
    @staticmethod
    def verify_checksum(results_dir: str, iteration_id: str) -> Tuple[bool, str]:
        """
        Verify result file checksum.
        
        Args:
            results_dir: Directory containing results
            iteration_id: ID of iteration to verify
            
        Returns:
            Tuple of (is_valid: bool, message: str)
        """
        results_dir = Path(results_dir)
        result_file = results_dir / f"{iteration_id}-result.json"
        checksum_file = results_dir / f"{iteration_id}-result.sha256"
        
        if not result_file.exists():
            return False, f"Result file not found: {result_file}"
        
        if not checksum_file.exists():
            return False, f"Checksum file not found: {checksum_file}"
        
        # Calculate current checksum
        try:
            sha256_hash = hashlib.sha256()
            with open(result_file, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            
            current_checksum = sha256_hash.hexdigest()
            stored_checksum = checksum_file.read_text().strip()
            
            if current_checksum == stored_checksum:
                return True, f"Checksum valid for {iteration_id}"
            else:
                return False, f"Checksum mismatch for {iteration_id}: expected {stored_checksum}, got {current_checksum}"
        
        except Exception as e:
            return False, f"Error verifying checksum: {str(e)}"
    
    @staticmethod
    def verify_all_results(results_dir: str) -> Dict[str, Any]:
        """
        Verify all result files.
        
        Args:
            results_dir: Directory containing results
            
        Returns:
            Dictionary with verification results for each iteration
        """
        results_dir = Path(results_dir)
        index_file = results_dir / "INDEX.json"
        
        if not index_file.exists():
            return {"error": "No index found", "total_verified": 0}
        
        try:
            with open(index_file, 'r') as f:
                index = json.load(f)
        except Exception as e:
            return {"error": f"Failed to load index: {str(e)}", "total_verified": 0}
        
        verification_results = {
            "verified_at": datetime.utcnow().isoformat(),
            "total_iterations": len(index["iterations"]),
            "passed": 0,
            "failed": 0,
            "results": {}
        }
        
        for iteration in index["iterations"]:
            iteration_id = iteration["iteration_id"]
            is_valid, message = ResultVerifier.verify_checksum(results_dir, iteration_id)
            
            verification_results["results"][iteration_id] = {
                "valid": is_valid,
                "message": message
            }
            
            if is_valid:
                verification_results["passed"] += 1
            else:
                verification_results["failed"] += 1
        
        return verification_results
    
    @staticmethod
    def validate_result_json(results_dir: str, iteration_id: str) -> Tuple[bool, str]:
        """
        Validate that result JSON is well-formed and has required fields.
        
        Args:
            results_dir: Directory containing results
            iteration_id: ID of iteration to validate
            
        Returns:
            Tuple of (is_valid: bool, message: str)
        """
        results_dir = Path(results_dir)
        result_file = results_dir / f"{iteration_id}-result.json"
        
        if not result_file.exists():
            return False, f"Result file not found: {result_file}"
        
        try:
            with open(result_file, 'r') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return False, f"Invalid JSON: {str(e)}"
        except Exception as e:
            return False, f"Error reading file: {str(e)}"
        
        # Check required fields
        required_fields = [
            "iteration_id",
            "timestamp",
            "start_time",
            "end_time",
            "duration_seconds",
            "metadata",
            "hardware",
            "predictions",
            "execution_log",
            "errors",
            "performance"
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return False, f"Missing required fields: {missing_fields}"
        
        # Validate field types
        if not isinstance(data["predictions"], list):
            return False, "predictions must be a list"
        
        if not isinstance(data["execution_log"], list):
            return False, "execution_log must be a list"
        
        if not isinstance(data["errors"], list):
            return False, "errors must be a list"
        
        if not isinstance(data["performance"], dict):
            return False, "performance must be a dict"
        
        # Validate numeric fields
        try:
            float(data["start_time"])
            float(data["end_time"])
            float(data["duration_seconds"])
        except (ValueError, TypeError):
            return False, "Timing fields must be numeric"
        
        return True, f"Result JSON valid for {iteration_id}"
    
    @staticmethod
    def validate_all_json(results_dir: str) -> Dict[str, Any]:
        """
        Validate JSON format of all result files.
        
        Args:
            results_dir: Directory containing results
            
        Returns:
            Dictionary with validation results
        """
        results_dir = Path(results_dir)
        index_file = results_dir / "INDEX.json"
        
        if not index_file.exists():
            return {"error": "No index found", "total_validated": 0}
        
        try:
            with open(index_file, 'r') as f:
                index = json.load(f)
        except Exception as e:
            return {"error": f"Failed to load index: {str(e)}", "total_validated": 0}
        
        validation_results = {
            "validated_at": datetime.utcnow().isoformat(),
            "total_iterations": len(index["iterations"]),
            "valid": 0,
            "invalid": 0,
            "results": {}
        }
        
        for iteration in index["iterations"]:
            iteration_id = iteration["iteration_id"]
            is_valid, message = ResultVerifier.validate_result_json(results_dir, iteration_id)
            
            validation_results["results"][iteration_id] = {
                "valid": is_valid,
                "message": message
            }
            
            if is_valid:
                validation_results["valid"] += 1
            else:
                validation_results["invalid"] += 1
        
        return validation_results
    
    @staticmethod
    def verify_index_consistency(results_dir: str) -> Dict[str, Any]:
        """
        Verify that index lists all result files and vice versa.
        
        Args:
            results_dir: Directory containing results
            
        Returns:
            Dictionary with consistency check results
        """
        results_dir = Path(results_dir)
        index_file = results_dir / "INDEX.json"
        
        consistency_check = {
            "checked_at": datetime.utcnow().isoformat(),
            "consistent": True,
            "issues": []
        }
        
        if not index_file.exists():
            consistency_check["issues"].append("No index file found")
            consistency_check["consistent"] = False
            return consistency_check
        
        try:
            with open(index_file, 'r') as f:
                index = json.load(f)
        except Exception as e:
            consistency_check["issues"].append(f"Failed to load index: {str(e)}")
            consistency_check["consistent"] = False
            return consistency_check
        
        # Get iterations from index
        indexed_iterations = {it["iteration_id"] for it in index["iterations"]}
        
        # Get result files on disk
        result_files = set()
        for f in results_dir.glob("*-result.json"):
            iteration_id = f.name.replace("-result.json", "")
            result_files.add(iteration_id)
        
        # Check for missing result files
        missing_files = indexed_iterations - result_files
        if missing_files:
            consistency_check["issues"].append(f"Result files missing for iterations: {missing_files}")
            consistency_check["consistent"] = False
        
        # Check for orphaned result files
        orphaned_files = result_files - indexed_iterations
        if orphaned_files:
            consistency_check["issues"].append(f"Result files not in index: {orphaned_files}")
            consistency_check["consistent"] = False
        
        # Check for missing checksum files
        missing_checksums = []
        for iteration_id in indexed_iterations:
            checksum_file = results_dir / f"{iteration_id}-result.sha256"
            if not checksum_file.exists():
                missing_checksums.append(iteration_id)
        
        if missing_checksums:
            consistency_check["issues"].append(f"Checksum files missing: {missing_checksums}")
            consistency_check["consistent"] = False
        
        return consistency_check
    
    @staticmethod
    def generate_verification_report(results_dir: str) -> Dict[str, Any]:
        """
        Generate comprehensive verification report.
        
        Args:
            results_dir: Directory containing results
            
        Returns:
            Dictionary with complete verification information
        """
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "report_version": "1.0",
            "checksum_verification": ResultVerifier.verify_all_results(results_dir),
            "json_validation": ResultVerifier.validate_all_json(results_dir),
            "index_consistency": ResultVerifier.verify_index_consistency(results_dir)
        }
    
    @staticmethod
    def save_verification_report(report: Dict[str, Any], 
                                results_dir: str,
                                report_name: str = "verification-report.json") -> str:
        """
        Save verification report to file.
        
        Args:
            report: Report dictionary
            results_dir: Directory to save report in
            report_name: Name of report file
            
        Returns:
            Path to saved report file
        """
        results_dir = Path(results_dir)
        report_file = results_dir / report_name
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        return str(report_file)


# Example usage
if __name__ == "__main__":
    import sys
    
    results_dir = Path("./results/structured")
    
    if not results_dir.exists():
        print(f"Results directory not found: {results_dir}")
        sys.exit(1)
    
    print("=== VERIFICATION REPORT ===\n")
    
    # Generate report
    report = ResultVerifier.generate_verification_report(str(results_dir))
    
    # Save report
    report_file = ResultVerifier.save_verification_report(
        report, 
        str(results_dir)
    )
    print(f"Report saved to: {report_file}\n")
    
    # Print summary
    checksum_results = report["checksum_verification"]
    print(f"Checksum Verification:")
    print(f"  Total iterations: {checksum_results.get('total_iterations', 0)}")
    print(f"  Passed: {checksum_results.get('passed', 0)}")
    print(f"  Failed: {checksum_results.get('failed', 0)}\n")
    
    json_results = report["json_validation"]
    print(f"JSON Validation:")
    print(f"  Total iterations: {json_results.get('total_iterations', 0)}")
    print(f"  Valid: {json_results.get('valid', 0)}")
    print(f"  Invalid: {json_results.get('invalid', 0)}\n")
    
    consistency = report["index_consistency"]
    print(f"Index Consistency:")
    print(f"  Consistent: {consistency.get('consistent', False)}")
    print(f"  Issues: {len(consistency.get('issues', []))}")
