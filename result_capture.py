#!/usr/bin/env python3
"""
Phase 17.6.1: Result Capture Module
Structured JSON storage for iteration results
Captures all Phase 17 iteration data into standardized JSON format
"""

import json
import time
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import platform
import psutil


class ResultCapture:
    """Capture and store iteration results in standardized format."""
    
    def __init__(self, results_dir: str):
        """
        Initialize result capture system.
        
        Args:
            results_dir: Directory to store result files
        """
        self.results_dir = Path(results_dir)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.current_iteration = None
        self.start_time = None
    
    def begin_iteration(self, iteration_id: str, metadata: Dict[str, Any]) -> None:
        """
        Begin capturing a new iteration.
        
        Args:
            iteration_id: Unique identifier for this iteration
            metadata: Dictionary with iteration metadata
        """
        self.current_iteration = {
            "iteration_id": iteration_id,
            "timestamp": datetime.utcnow().isoformat(),
            "start_time": time.time(),
            "metadata": metadata,
            "hardware": self._capture_hardware_info(),
            "predictions": [],
            "hardware_fitness": None,
            "execution_log": [],
            "errors": [],
            "performance": {}
        }
        self.start_time = time.time()
    
    def capture_prediction(self, domain: str, prediction: Dict[str, Any]) -> None:
        """
        Capture a single Phase 17 prediction.
        
        Args:
            domain: Domain name (e.g., "atomic_physics")
            prediction: Dictionary with prediction data
                - confidence: float (0-1)
                - vector: list of prediction values
                - metadata: optional dict with additional info
        """
        if not self.current_iteration:
            raise RuntimeError("No active iteration. Call begin_iteration() first.")
        
        prediction_record = {
            "timestamp": time.time(),
            "domain": domain,
            "confidence": prediction.get("confidence", 0),
            "prediction_vector": prediction.get("vector", []),
            "metadata": prediction.get("metadata", {})
        }
        self.current_iteration["predictions"].append(prediction_record)
    
    def capture_hardware_fitness(self, fitness_data: Dict[str, Any]) -> None:
        """
        Capture hardware fitness validator results.
        
        Args:
            fitness_data: Dictionary with fitness metrics
                - cpu_score: float (0-1)
                - memory_score: float (0-1)
                - io_score: float (0-1)
                - thermal_score: float (0-1)
                - overall: float (0-1)
                - details: optional dict with additional details
        """
        if not self.current_iteration:
            raise RuntimeError("No active iteration. Call begin_iteration() first.")
        
        self.current_iteration["hardware_fitness"] = {
            "timestamp": time.time(),
            "cpu_score": fitness_data.get("cpu_score", 0),
            "memory_score": fitness_data.get("memory_score", 0),
            "io_score": fitness_data.get("io_score", 0),
            "thermal_score": fitness_data.get("thermal_score", 0),
            "overall_fitness": fitness_data.get("overall", 0),
            "details": fitness_data.get("details", {})
        }
    
    def log_execution(self, level: str, message: str, context: Optional[Dict] = None) -> None:
        """
        Log execution event (structured, not to terminal).
        
        Args:
            level: Log level (DEBUG, INFO, WARNING, ERROR)
            message: Log message
            context: Optional context dictionary
        """
        if not self.current_iteration:
            raise RuntimeError("No active iteration. Call begin_iteration() first.")
        
        log_entry = {
            "timestamp": time.time(),
            "level": level,
            "message": message,
            "context": context or {}
        }
        self.current_iteration["execution_log"].append(log_entry)
    
    def capture_error(self, error_type: str, error_msg: str, 
                     traceback: Optional[str] = None) -> None:
        """
        Capture error details.
        
        Args:
            error_type: Type of error
            error_msg: Error message
            traceback: Optional traceback string
        """
        if not self.current_iteration:
            raise RuntimeError("No active iteration. Call begin_iteration() first.")
        
        error_record = {
            "timestamp": time.time(),
            "type": error_type,
            "message": error_msg,
            "traceback": traceback
        }
        self.current_iteration["errors"].append(error_record)
    
    def capture_performance(self, metric_name: str, value: float, 
                           unit: str = "ms") -> None:
        """
        Capture performance metric.
        
        Args:
            metric_name: Name of performance metric
            value: Metric value
            unit: Unit of measurement (default: ms)
        """
        if not self.current_iteration:
            raise RuntimeError("No active iteration. Call begin_iteration() first.")
        
        self.current_iteration["performance"][metric_name] = {
            "value": value,
            "unit": unit,
            "timestamp": time.time()
        }
    
    def finalize_iteration(self) -> str:
        """
        Finalize iteration capture and save to disk.
        
        Returns:
            Path to saved result file
            
        Raises:
            RuntimeError: If no active iteration
        """
        if not self.current_iteration:
            raise RuntimeError("No active iteration to finalize.")
        
        # Add completion info
        self.current_iteration["end_time"] = time.time()
        self.current_iteration["duration_seconds"] = (
            self.current_iteration["end_time"] - 
            self.current_iteration["start_time"]
        )
        self.current_iteration["prediction_count"] = len(
            self.current_iteration["predictions"]
        )
        self.current_iteration["error_count"] = len(
            self.current_iteration["errors"]
        )
        
        # Generate file path
        iteration_id = self.current_iteration["iteration_id"]
        result_file = self.results_dir / f"{iteration_id}-result.json"
        
        # Write result file
        with open(result_file, 'w') as f:
            json.dump(self.current_iteration, f, indent=2)
        
        # Generate checksum
        checksum = self._calculate_checksum(result_file)
        checksum_file = self.results_dir / f"{iteration_id}-result.sha256"
        checksum_file.write_text(checksum)
        
        # Log to central index
        self._update_index(iteration_id, result_file, checksum)
        
        # Clear current iteration
        iteration_copy = self.current_iteration.copy()
        self.current_iteration = None
        
        return str(result_file)
    
    def _capture_hardware_info(self) -> Dict[str, Any]:
        """Capture system hardware information."""
        try:
            return {
                "platform": platform.platform(),
                "processor": platform.processor(),
                "cpu_count": psutil.cpu_count(),
                "total_memory_gb": psutil.virtual_memory().total / (1024**3),
                "disk_free_gb": psutil.disk_usage('/').free / (1024**3),
                "capture_timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "error": f"Failed to capture hardware info: {str(e)}",
                "capture_timestamp": datetime.utcnow().isoformat()
            }
    
    def _calculate_checksum(self, filepath: Path) -> str:
        """
        Calculate SHA256 checksum of result file.
        
        Args:
            filepath: Path to file to checksum
            
        Returns:
            Hex-encoded SHA256 checksum
        """
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _update_index(self, iteration_id: str, result_file: Path, 
                     checksum: str) -> None:
        """
        Update central results index.
        
        Args:
            iteration_id: ID of iteration
            result_file: Path to result file
            checksum: SHA256 checksum of result
        """
        index_file = self.results_dir / "INDEX.json"
        
        if index_file.exists():
            with open(index_file, 'r') as f:
                index = json.load(f)
        else:
            index = {"iterations": [], "metadata": {}}
        
        index["iterations"].append({
            "iteration_id": iteration_id,
            "result_file": str(result_file),
            "checksum": checksum,
            "indexed_at": datetime.utcnow().isoformat()
        })
        
        index["metadata"]["total_iterations"] = len(index["iterations"])
        index["metadata"]["last_update"] = datetime.utcnow().isoformat()
        
        with open(index_file, 'w') as f:
            json.dump(index, f, indent=2)


# Example usage
if __name__ == "__main__":
    import sys
    
    # Example: Create sample iteration
    results_dir = Path("./results/structured")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    capture = ResultCapture(str(results_dir))
    
    # Begin iteration
    capture.begin_iteration("phase17-iter-001", {
        "description": "Test iteration",
        "domain": "atomic_physics",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Log execution start
    capture.log_execution("INFO", "Iteration started", {
        "operator": "test",
        "mode": "standalone"
    })
    
    # Capture sample predictions
    for i in range(5):
        capture.capture_prediction(f"domain_{i}", {
            "confidence": 0.75 + (i * 0.03),
            "vector": [0.1 * j for j in range(10)],
            "metadata": {"source": "test"}
        })
    
    # Capture hardware fitness
    capture.capture_hardware_fitness({
        "cpu_score": 0.85,
        "memory_score": 0.90,
        "io_score": 0.75,
        "thermal_score": 0.88,
        "overall": 0.84,
        "details": {"cpu_usage_percent": 45.2}
    })
    
    # Capture performance metrics
    capture.capture_performance("phase17_prediction_ms", 1234.5)
    capture.capture_performance("hardware_validation_ms", 567.8)
    
    # Log completion
    capture.log_execution("INFO", "Iteration completed", {
        "predictions_generated": 5,
        "errors": 0
    })
    
    # Finalize
    result_file = capture.finalize_iteration()
    print(f"Result saved to: {result_file}")
    print(f"Results directory: {results_dir}")
