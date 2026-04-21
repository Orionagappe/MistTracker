#!/usr/bin/env python3
"""
Phase 17.6.1: Result Analysis Engine
Comprehensive metrics and trend analysis
Analyzes stored iteration results independent of terminal
"""

import json
import statistics
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime


class ResultAnalyzer:
    """Analyze stored iteration results."""
    
    def __init__(self, results_dir: str):
        """
        Initialize result analyzer.
        
        Args:
            results_dir: Directory containing result files
        """
        self.results_dir = Path(results_dir)
        self.index_file = self.results_dir / "INDEX.json"
    
    def load_index(self) -> Dict[str, Any]:
        """
        Load the results index.
        
        Returns:
            Index dictionary with all iterations
            
        Raises:
            FileNotFoundError: If no index exists
        """
        if not self.index_file.exists():
            raise FileNotFoundError("No results index found")
        
        with open(self.index_file, 'r') as f:
            return json.load(f)
    
    def load_iteration(self, iteration_id: str) -> Dict[str, Any]:
        """
        Load a specific iteration result.
        
        Args:
            iteration_id: ID of iteration to load
            
        Returns:
            Iteration result dictionary
            
        Raises:
            FileNotFoundError: If result not found
        """
        result_file = self.results_dir / f"{iteration_id}-result.json"
        
        if not result_file.exists():
            raise FileNotFoundError(f"No result found for {iteration_id}")
        
        with open(result_file, 'r') as f:
            return json.load(f)
    
    def analyze_prediction_accuracy(self) -> Dict[str, Any]:
        """
        Analyze prediction confidence and accuracy.
        
        Returns:
            Dictionary with prediction metrics including:
            - total_predictions: Total predictions across all iterations
            - average_confidence: Mean confidence score
            - median_confidence: Median confidence score
            - stdev_confidence: Standard deviation
            - confidence_range: (min, max) tuple
            - by_domain: Metrics grouped by domain
        """
        index = self.load_index()
        all_confidences = []
        predictions_by_domain = {}
        
        for iteration in index["iterations"]:
            try:
                result = self.load_iteration(iteration["iteration_id"])
                
                for prediction in result["predictions"]:
                    all_confidences.append(prediction["confidence"])
                    domain = prediction["domain"]
                    
                    if domain not in predictions_by_domain:
                        predictions_by_domain[domain] = []
                    predictions_by_domain[domain].append(prediction["confidence"])
            except Exception as e:
                # Skip iterations that fail to load
                continue
        
        if not all_confidences:
            return {
                "error": "No predictions found",
                "total_predictions": 0
            }
        
        return {
            "total_predictions": len(all_confidences),
            "average_confidence": statistics.mean(all_confidences),
            "median_confidence": statistics.median(all_confidences),
            "stdev_confidence": statistics.stdev(all_confidences) if len(all_confidences) > 1 else 0,
            "confidence_range": (min(all_confidences), max(all_confidences)),
            "confidence_min": min(all_confidences),
            "confidence_max": max(all_confidences),
            "by_domain": {
                domain: {
                    "count": len(confs),
                    "average": statistics.mean(confs),
                    "median": statistics.median(confs),
                    "stdev": statistics.stdev(confs) if len(confs) > 1 else 0
                }
                for domain, confs in predictions_by_domain.items()
            }
        }
    
    def analyze_hardware_fitness_trends(self) -> Dict[str, Any]:
        """
        Analyze hardware fitness scores over iterations.
        
        Returns:
            Dictionary with fitness trends including:
            - total_measurements: Number of fitness measurements
            - overall_fitness: Average fitness metrics
            - cpu_fitness: CPU-specific metrics
            - iterations: Detailed fitness data per iteration
        """
        index = self.load_index()
        fitness_scores = []
        
        for iteration in index["iterations"]:
            try:
                result = self.load_iteration(iteration["iteration_id"])
                
                if result["hardware_fitness"]:
                    fitness_scores.append({
                        "iteration_id": iteration["iteration_id"],
                        "timestamp": result["hardware_fitness"]["timestamp"],
                        "overall_fitness": result["hardware_fitness"]["overall_fitness"],
                        "cpu_score": result["hardware_fitness"]["cpu_score"],
                        "memory_score": result["hardware_fitness"]["memory_score"],
                        "io_score": result["hardware_fitness"]["io_score"],
                        "thermal_score": result["hardware_fitness"]["thermal_score"]
                    })
            except Exception as e:
                # Skip iterations that fail to load
                continue
        
        if not fitness_scores:
            return {"error": "No hardware fitness data found"}
        
        # Calculate trends
        overall_scores = [f["overall_fitness"] for f in fitness_scores]
        cpu_scores = [f["cpu_score"] for f in fitness_scores]
        memory_scores = [f["memory_score"] for f in fitness_scores]
        io_scores = [f["io_score"] for f in fitness_scores]
        thermal_scores = [f["thermal_score"] for f in fitness_scores]
        
        # Determine trend direction
        def get_trend(scores: List[float]) -> str:
            if len(scores) < 2:
                return "stable"
            if scores[-1] > scores[0]:
                return "improving"
            elif scores[-1] < scores[0]:
                return "declining"
            else:
                return "stable"
        
        return {
            "total_measurements": len(fitness_scores),
            "overall_fitness": {
                "average": statistics.mean(overall_scores),
                "median": statistics.median(overall_scores),
                "min": min(overall_scores),
                "max": max(overall_scores),
                "stdev": statistics.stdev(overall_scores) if len(overall_scores) > 1 else 0,
                "trend": get_trend(overall_scores),
                "scores": overall_scores
            },
            "cpu_fitness": {
                "average": statistics.mean(cpu_scores),
                "median": statistics.median(cpu_scores),
                "trend": get_trend(cpu_scores)
            },
            "memory_fitness": {
                "average": statistics.mean(memory_scores),
                "median": statistics.median(memory_scores),
                "trend": get_trend(memory_scores)
            },
            "io_fitness": {
                "average": statistics.mean(io_scores),
                "median": statistics.median(io_scores),
                "trend": get_trend(io_scores)
            },
            "thermal_fitness": {
                "average": statistics.mean(thermal_scores),
                "median": statistics.median(thermal_scores),
                "trend": get_trend(thermal_scores)
            },
            "iterations": fitness_scores
        }
    
    def analyze_performance_metrics(self) -> Dict[str, Any]:
        """
        Analyze execution performance across iterations.
        
        Returns:
            Dictionary with performance metrics including:
            - total_iterations: Number of iterations analyzed
            - iteration_duration_seconds: Duration statistics
            - performance_metrics: Detailed per-metric statistics
        """
        index = self.load_index()
        durations = []
        performance_metrics = {}
        
        for iteration in index["iterations"]:
            try:
                result = self.load_iteration(iteration["iteration_id"])
                durations.append(result["duration_seconds"])
                
                for metric_name, metric_data in result["performance"].items():
                    if metric_name not in performance_metrics:
                        performance_metrics[metric_name] = []
                    performance_metrics[metric_name].append(metric_data["value"])
            except Exception as e:
                # Skip iterations that fail to load
                continue
        
        if not durations:
            return {
                "error": "No performance data found",
                "total_iterations": 0
            }
        
        return {
            "total_iterations": len(durations),
            "iteration_duration_seconds": {
                "average": statistics.mean(durations),
                "median": statistics.median(durations),
                "min": min(durations),
                "max": max(durations),
                "stdev": statistics.stdev(durations) if len(durations) > 1 else 0,
                "total_time": sum(durations)
            },
            "performance_metrics": {
                name: {
                    "average_ms": statistics.mean(values),
                    "median_ms": statistics.median(values),
                    "min_ms": min(values),
                    "max_ms": max(values),
                    "stdev_ms": statistics.stdev(values) if len(values) > 1 else 0,
                    "count": len(values)
                }
                for name, values in performance_metrics.items()
            }
        }
    
    def analyze_errors(self) -> Dict[str, Any]:
        """
        Analyze errors across all iterations.
        
        Returns:
            Dictionary with error statistics including:
            - total_iterations: Total iterations processed
            - iterations_with_errors: Count of failed iterations
            - total_errors: Total error count
            - error_types: Breakdown by error type
            - failed_iterations: List of iteration IDs with errors
        """
        index = self.load_index()
        error_summary = {
            "total_iterations": len(index["iterations"]),
            "iterations_with_errors": 0,
            "total_errors": 0,
            "error_types": {},
            "failed_iterations": []
        }
        
        for iteration in index["iterations"]:
            try:
                result = self.load_iteration(iteration["iteration_id"])
                
                if result["errors"]:
                    error_summary["iterations_with_errors"] += 1
                    error_summary["total_errors"] += len(result["errors"])
                    error_summary["failed_iterations"].append(iteration["iteration_id"])
                    
                    for error in result["errors"]:
                        error_type = error["type"]
                        if error_type not in error_summary["error_types"]:
                            error_summary["error_types"][error_type] = 0
                        error_summary["error_types"][error_type] += 1
            except Exception as e:
                # Skip iterations that fail to load
                continue
        
        return error_summary
    
    def generate_comprehensive_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive analysis report.
        
        Returns:
            Dictionary containing all analysis results
        """
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "report_version": "1.0",
            "prediction_analysis": self.analyze_prediction_accuracy(),
            "hardware_fitness": self.analyze_hardware_fitness_trends(),
            "performance_metrics": self.analyze_performance_metrics(),
            "error_analysis": self.analyze_errors()
        }
    
    def save_report(self, report: Dict[str, Any], 
                   report_name: str = "analysis-report.json") -> str:
        """
        Save analysis report to file.
        
        Args:
            report: Report dictionary to save
            report_name: Name of report file
            
        Returns:
            Path to saved report file
        """
        report_file = self.results_dir / report_name
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        return str(report_file)
    
    def get_iteration_count(self) -> int:
        """Get total number of iterations in results."""
        try:
            index = self.load_index()
            return len(index["iterations"])
        except:
            return 0
    
    def get_domain_summary(self) -> Dict[str, int]:
        """Get count of predictions per domain."""
        analysis = self.analyze_prediction_accuracy()
        return {
            domain: metrics["count"] 
            for domain, metrics in analysis.get("by_domain", {}).items()
        }


# Example usage
if __name__ == "__main__":
    import sys
    
    # Example: Analyze results
    results_dir = Path("./results/structured")
    
    if not results_dir.exists():
        print(f"Results directory not found: {results_dir}")
        print("Run result-capture.py first to generate sample data.")
        sys.exit(1)
    
    analyzer = ResultAnalyzer(str(results_dir))
    
    try:
        # Generate report
        report = analyzer.generate_comprehensive_report()
        
        # Save report
        report_file = analyzer.save_report(report)
        print(f"Report saved to: {report_file}")
        
        # Print summary
        print("\n=== ANALYSIS SUMMARY ===")
        print(f"Iterations: {analyzer.get_iteration_count()}")
        print(f"Domains: {analyzer.get_domain_summary()}")
        
        pred_analysis = report["prediction_analysis"]
        print(f"Total predictions: {pred_analysis.get('total_predictions', 0)}")
        print(f"Avg confidence: {pred_analysis.get('average_confidence', 0):.3f}")
        
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
