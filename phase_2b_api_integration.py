"""
Phase 2b API Integration Layer
MistTracker Emergence Detection Framework

Wraps Phase 2a REST API results with Phase 2b Bayesian uncertainty quantification.
Provides unified interface for retrieving analysis results with or without Bayesian enhancement.

Architecture:
  REST Client → Phase 2a Job Queue → Phase 1 Antenna → Bayesian Conversion → Response
"""

import json
import logging
from dataclasses import asdict, dataclass
from typing import Optional, Dict, Any, Literal
from enum import Enum

try:
    from phase_2b_uncertainty_quantifier import convert_to_bayesian_result, BayesianAnalysisResult
except ImportError:
    # Fallback if module not found
    BayesianAnalysisResult = None


logger = logging.getLogger(__name__)


class ResultFormat(str, Enum):
    """Supported result formats for API responses."""
    PHASE1 = "phase1"  # Raw Phase 1 antenna output
    BAYESIAN = "bayesian"  # Phase 1 + Bayesian uncertainty
    COMBINED = "combined"  # Both Phase 1 and Bayesian (default)


@dataclass
class Phase2bIntegrationResult:
    """
    Unified result containing both Phase 1 and Phase 2b Bayesian data.
    
    Attributes:
        job_id: Unique analysis job identifier
        phase1_result: Raw Phase 1 antenna output
        bayesian_result: Phase 2b Bayesian posterior (if format includes bayesian)
        format: Which components are included
        integration_timestamp: When Bayesian conversion occurred
        integration_error: Error message if conversion failed (graceful degradation)
    """
    job_id: str
    phase1_result: Dict[str, Any]
    bayesian_result: Optional[Dict[str, Any]] = None
    format: ResultFormat = ResultFormat.COMBINED
    integration_timestamp: Optional[str] = None
    integration_error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary for JSON response."""
        result = {
            "job_id": self.job_id,
            "format": self.format.value,
            "phase1": self.phase1_result,
        }
        
        if self.bayesian_result is not None:
            result["bayesian"] = self.bayesian_result
        
        if self.integration_timestamp:
            result["integration_timestamp"] = self.integration_timestamp
        
        if self.integration_error:
            result["integration_warning"] = self.integration_error
        
        return result
    
    def to_json(self) -> str:
        """Serialize to JSON string."""
        return json.dumps(self.to_dict(), indent=2, default=str)


class Phase2bIntegrationEngine:
    """
    Orchestrates Phase 2a API results with Phase 2b Bayesian uncertainty.
    
    Responsibilities:
    1. Load Phase 1 analysis results
    2. Convert to Bayesian posteriors (with error handling)
    3. Format response based on client request
    4. Cache results for performance
    """
    
    def __init__(self, cache_enabled: bool = True):
        """
        Initialize integration engine.
        
        Args:
            cache_enabled: Cache Bayesian conversions (default True)
        """
        self.cache_enabled = cache_enabled
        self._bayesian_cache: Dict[str, Dict[str, Any]] = {}
        self.conversion_count = 0
        self.conversion_errors = 0
    
    def integrate_result(
        self,
        job_id: str,
        phase1_result: Dict[str, Any],
        format: ResultFormat = ResultFormat.COMBINED,
    ) -> Phase2bIntegrationResult:
        """
        Integrate Phase 1 result with Phase 2b Bayesian analysis.
        
        Args:
            job_id: Unique job identifier
            phase1_result: Phase 1 antenna output dictionary
            format: Desired output format (phase1, bayesian, or combined)
        
        Returns:
            Phase2bIntegrationResult with both Phase 1 and (optionally) Bayesian data
        
        Note:
            - Gracefully falls back to Phase 1 result if Bayesian conversion fails
            - Results cached for performance (if cache_enabled=True)
        """
        bayesian_result = None
        integration_error = None
        integration_timestamp = None
        
        try:
            # Check cache first
            if self.cache_enabled and job_id in self._bayesian_cache:
                logger.info(f"[Integration] Cache hit for job_id={job_id}")
                bayesian_result = self._bayesian_cache[job_id]
            
            # Convert to Bayesian if needed
            elif format in (ResultFormat.BAYESIAN, ResultFormat.COMBINED):
                bayesian_result = self._convert_to_bayesian_safe(
                    job_id=job_id,
                    phase1_result=phase1_result
                )
                
                if bayesian_result is not None:
                    integration_timestamp = self._get_iso_timestamp()
                    
                    # Cache result
                    if self.cache_enabled:
                        self._bayesian_cache[job_id] = bayesian_result
                    
                    self.conversion_count += 1
                    logger.info(f"[Integration] Bayesian conversion successful for job_id={job_id}")
                else:
                    self.conversion_errors += 1
                    integration_error = "Bayesian conversion failed, returning Phase 1 result"
                    logger.warning(f"[Integration] Bayesian conversion failed for job_id={job_id}")
        
        except Exception as e:
            self.conversion_errors += 1
            integration_error = f"Integration error: {str(e)}"
            logger.error(f"[Integration] Exception during Bayesian conversion: {e}")
        
        # Build response based on requested format
        if format == ResultFormat.PHASE1:
            # User explicitly requested Phase 1 only
            bayesian_result = None
        elif format == ResultFormat.COMBINED and bayesian_result is None:
            # User wanted combined but conversion failed - still return Phase 1
            # (graceful degradation)
            pass
        
        return Phase2bIntegrationResult(
            job_id=job_id,
            phase1_result=phase1_result,
            bayesian_result=bayesian_result,
            format=format,
            integration_timestamp=integration_timestamp,
            integration_error=integration_error,
        )
    
    def _convert_to_bayesian_safe(
        self,
        job_id: str,
        phase1_result: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """
        Safely convert Phase 1 result to Bayesian posterior.
        
        Args:
            job_id: Unique job identifier
            phase1_result: Phase 1 antenna output
        
        Returns:
            Bayesian result as dictionary, or None if conversion fails
        """
        if BayesianAnalysisResult is None:
            logger.warning("[Integration] Bayesian module not available")
            return None
        
        try:
            # Call Phase 2b conversion function
            bayesian_result = convert_to_bayesian_result(phase1_result, job_id)
            
            # Convert dataclass to dictionary
            return asdict(bayesian_result)
        
        except KeyError as e:
            logger.error(f"[Integration] Missing required field in Phase 1 result: {e}")
            return None
        
        except ValueError as e:
            logger.error(f"[Integration] Invalid metric value for Bayesian conversion: {e}")
            return None
        
        except Exception as e:
            logger.error(f"[Integration] Unexpected error during Bayesian conversion: {e}")
            return None
    
    def _get_iso_timestamp(self) -> str:
        """Get current timestamp in ISO 8601 format."""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get integration engine statistics."""
        return {
            "conversions_successful": self.conversion_count,
            "conversions_failed": self.conversion_errors,
            "cache_entries": len(self._bayesian_cache) if self.cache_enabled else 0,
            "cache_enabled": self.cache_enabled,
        }
    
    def clear_cache(self) -> None:
        """Clear Bayesian result cache."""
        self._bayesian_cache.clear()
        logger.info("[Integration] Cache cleared")


# Global integration engine instance (singleton pattern)
_integration_engine: Optional[Phase2bIntegrationEngine] = None


def get_integration_engine(cache_enabled: bool = True) -> Phase2bIntegrationEngine:
    """
    Get or create global integration engine instance.
    
    Args:
        cache_enabled: Whether to cache Bayesian conversions
    
    Returns:
        Phase2bIntegrationEngine singleton
    """
    global _integration_engine
    
    if _integration_engine is None:
        _integration_engine = Phase2bIntegrationEngine(cache_enabled=cache_enabled)
    
    return _integration_engine


def integrate_analysis_result(
    job_id: str,
    phase1_result: Dict[str, Any],
    format: str = "combined",
) -> Phase2bIntegrationResult:
    """
    Convenience function to integrate Phase 1 result with Phase 2b Bayesian analysis.
    
    Usage:
        result = integrate_analysis_result(
            job_id="job-123",
            phase1_result=antenna_output,
            format="bayesian"  # or "phase1" or "combined"
        )
        response = result.to_dict()
    
    Args:
        job_id: Unique analysis job identifier
        phase1_result: Raw Phase 1 antenna output dictionary
        format: Response format ("phase1", "bayesian", or "combined")
    
    Returns:
        Phase2bIntegrationResult with integrated data
    """
    try:
        result_format = ResultFormat(format)
    except ValueError:
        logger.warning(f"Invalid format '{format}', defaulting to 'combined'")
        result_format = ResultFormat.COMBINED
    
    engine = get_integration_engine()
    return engine.integrate_result(job_id, phase1_result, result_format)


# ============================================================================
# FastAPI Integration Helpers (for use in phase_2_api_server.py)
# ============================================================================

def create_bayesian_response(
    job_id: str,
    phase1_result: Dict[str, Any],
    format: str = "combined",
) -> Dict[str, Any]:
    """
    Create API response with integrated Phase 1 + Phase 2b Bayesian results.
    
    Usage in FastAPI:
        @app.get("/api/results/{job_id}")
        async def get_results(job_id: str, format: str = "combined"):
            phase1_result = load_phase1_result(job_id)
            response = create_bayesian_response(job_id, phase1_result, format)
            return response
    
    Args:
        job_id: Job identifier
        phase1_result: Phase 1 antenna output
        format: Response format
    
    Returns:
        Dictionary ready for JSON response
    """
    integration_result = integrate_analysis_result(job_id, phase1_result, format)
    return integration_result.to_dict()


def create_bayesian_batch_response(
    batch_id: str,
    job_results: Dict[str, Dict[str, Any]],
    format: str = "combined",
) -> Dict[str, Any]:
    """
    Create API response for batch of analyses with Bayesian integration.
    
    Args:
        batch_id: Batch identifier
        job_results: Dictionary mapping job_id → phase1_result
        format: Response format for all jobs
    
    Returns:
        Batch response with integrated results
    """
    integrated_results = []
    
    for job_id, phase1_result in job_results.items():
        integration_result = integrate_analysis_result(job_id, phase1_result, format)
        integrated_results.append(integration_result.to_dict())
    
    return {
        "batch_id": batch_id,
        "job_count": len(job_results),
        "format": format,
        "results": integrated_results,
    }


def get_integration_metrics() -> Dict[str, Any]:
    """
    Get metrics from integration engine (for monitoring/observability).
    
    Usage:
        @app.get("/api/metrics/integration")
        async def get_integration_metrics():
            return get_integration_metrics()
    
    Returns:
        Dictionary with conversion statistics and cache info
    """
    engine = get_integration_engine()
    return engine.get_statistics()


if __name__ == "__main__":
    """
    Test integration layer
    
    Usage:
        python phase_2b_api_integration.py
    """
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("Phase 2b API Integration Layer")
    print("=" * 60)
    
    # Test 1: Integration with Phase 0 Test 1 result
    print("\nTest 1: Solar Wind Emergence Detection (Phase 0 Test 1)")
    print("-" * 60)
    
    phase1_result = {
        "domain": "solar_wind",
        "analysis_type": "emergence_detection",
        "primary_metric": 0.1238,
        "metric_name": "rms_frequency_error_percent",
        "threshold": 5.0,
        "status": "CONFIRMED",
        "timestamp": "2026-04-21T10:00:00Z",
    }
    
    # Test format: combined
    result = integrate_analysis_result(
        job_id="test-1-combined",
        phase1_result=phase1_result,
        format="combined"
    )
    
    print(f"Job ID: {result.job_id}")
    print(f"Format: {result.format.value}")
    print(f"Phase 1 Status: {result.phase1_result.get('status')}")
    
    if result.bayesian_result:
        print(f"Bayesian Verdict: {result.bayesian_result.get('verdict')}")
        print(f"Confidence: {result.bayesian_result.get('confidence', 'N/A')}")
    
    if result.integration_error:
        print(f"Note: {result.integration_error}")
    
    # Test 2: Format variations
    print("\n\nTest 2: Format Variations")
    print("-" * 60)
    
    for fmt in ["phase1", "bayesian", "combined"]:
        result = integrate_analysis_result(
            job_id=f"test-1-{fmt}",
            phase1_result=phase1_result,
            format=fmt
        )
        
        has_phase1 = result.phase1_result is not None
        has_bayesian = result.bayesian_result is not None
        
        print(f"\nFormat: {fmt}")
        print(f"  Has Phase1: {has_phase1}")
        print(f"  Has Bayesian: {has_bayesian}")
    
    # Test 3: Statistics
    print("\n\nTest 3: Integration Statistics")
    print("-" * 60)
    
    metrics = get_integration_metrics()
    for key, value in metrics.items():
        print(f"{key}: {value}")
    
    # Test 4: JSON serialization
    print("\n\nTest 4: JSON Response")
    print("-" * 60)
    
    result = integrate_analysis_result(
        job_id="test-1-json",
        phase1_result=phase1_result,
        format="combined"
    )
    
    response_dict = create_bayesian_response(
        job_id="test-1-json",
        phase1_result=phase1_result,
        format="combined"
    )
    
    print("Sample JSON response:")
    print(json.dumps(response_dict, indent=2, default=str)[:500] + "...")
    
    print("\n\nIntegration Layer Tests Complete")
    print("=" * 60)
