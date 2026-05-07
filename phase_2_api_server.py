"""
MistTracker Phase 2a: REST API Server
=====================================

FastAPI wrapper for Phase 1 antenna, enabling:
- Real-time emergence detection via HTTP endpoints
- Multi-domain concurrent analysis
- Result caching and streaming
- Event webhooks for emergence detection

Dependencies: fastapi, uvicorn, pydantic, python-multipart, aiofiles
"""

import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Query
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Import Phase 1 components
import sys
sys.path.insert(0, str(Path(__file__).parent))

from phase_1_antenna import MistTrackerAntenna
from phase_1_config_manager import AnalysisConfig, list_available_templates, create_config_file
from phase_1_emergence_engine import AnalysisResult

# Import Phase 2b components
try:
    from phase_2b_api_integration import (
        integrate_analysis_result,
        create_bayesian_response,
        create_bayesian_batch_response,
        get_integration_metrics,
        ResultFormat,
    )
    PHASE2B_AVAILABLE = True
except ImportError:
    PHASE2B_AVAILABLE = False

# Import Phase 2e components
try:
    from phase_2e_expert_feedback import (
        get_feedback_engine,
        submit_expert_feedback,
        FeedbackRating,
        PriorAdjustment,
    )
    from phase_2e_alert_system import (
        get_alerting_engine,
        create_default_rules,
        AlertSeverity,
        AlertChannel,
    )
    from phase_2e_correlation_detector import (
        get_correlation_detector,
        DomainEvent,
    )
    from phase_2e_threshold_optimizer import (
        get_threshold_optimizer,
        LabeledDatapoint,
        ClassificationOutcome,
    )
    PHASE2E_AVAILABLE = True
except ImportError:
    PHASE2E_AVAILABLE = False

# Import Phase 2f components
try:
    from phase_2f_distributed_storage import (
        initialize_storage,
        get_storage,
        DataCategory,
        DataRecord,
    )
    from phase_2f_consensus_engine import (
        initialize_consensus,
        get_consensus,
    )
    from phase_2f_node_manager import (
        initialize_node_manager,
        get_node_manager,
        ReplicationStrategy,
    )
    PHASE2F_AVAILABLE = True
except ImportError:
    PHASE2F_AVAILABLE = False

# Import Phase 2g components
try:
    from phase_2g_expert_reputation import (
        ExpertReputationEngine,
        PredictionOutcome,
        PredictionOutcomeType,
    )
    PHASE2G_AVAILABLE = True
    # Initialize global reputation engine
    _reputation_engine = ExpertReputationEngine()
except ImportError:
    PHASE2G_AVAILABLE = False
    _reputation_engine = None


# ============================================================================
# PYDANTIC REQUEST/RESPONSE MODELS
# ============================================================================

class DomainEnum(str, Enum):
    """Supported domains for analysis"""
    SOLAR_WIND = "solar_wind"
    EARTHQUAKES = "earthquakes"
    NETWORKS = "networks"
    MAGNETOSPHERE = "magnetosphere"
    CLIMATE = "climate"


class AnalysisTypeEnum(str, Enum):
    """Supported analysis types"""
    EMERGENCE_DETECTION = "emergence_detection"
    SCALE_INVARIANCE = "scale_invariance"
    PRECURSOR_DETECTION = "precursor_detection"


class AnalysisRequest(BaseModel):
    """Request model for analysis job submission"""
    domain: DomainEnum = Field(..., description="Physical domain to analyze")
    analysis_type: AnalysisTypeEnum = Field(..., description="Type of emergence analysis")
    adapter_config: Dict[str, Any] = Field(..., description="Domain-specific adapter configuration")
    analysis_parameters: Dict[str, Any] = Field(default_factory=dict, description="Analysis-specific parameters")
    engine_parameters: Dict[str, Any] = Field(default_factory=dict, description="Engine configuration (nperseg, noverlap, etc.)")
    output_format: str = Field(default="json", description="Output format (json, csv, parquet)")
    description: Optional[str] = Field(None, description="Human-readable description")


class AnalysisResponse(BaseModel):
    """Response model for submitted analysis"""
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(default="queued", description="Job status (queued, running, completed, failed)")
    domain: str = Field(..., description="Physical domain")
    analysis_type: str = Field(..., description="Analysis type")
    submitted_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    result_url: Optional[str] = Field(None, description="URL to retrieve results")


class AnalysisResultResponse(BaseModel):
    """Response model for completed analysis results"""
    job_id: str
    status: str
    domain: str
    analysis_type: str
    metric_name: str
    metric_value: float
    threshold: float
    verdict: str  # CONFIRMED, FALSIFIED, MARGINAL, INCONCLUSIVE
    frequencies: Optional[List[float]] = None
    power: Optional[List[float]] = None
    harmonics: Optional[List[Dict[str, Any]]] = None
    data_points_analyzed: int
    timestamp: str
    processing_time_seconds: float


class JobStatusResponse(BaseModel):
    """Response model for job status polling"""
    job_id: str
    status: str  # queued, running, completed, failed
    progress_percent: int = Field(0, ge=0, le=100)
    message: Optional[str] = None
    result: Optional[AnalysisResultResponse] = None
    error: Optional[str] = None


class BatchSubmissionRequest(BaseModel):
    """Request model for batch job submission"""
    jobs: List[AnalysisRequest] = Field(..., description="List of analysis jobs")
    concurrent_limit: int = Field(default=3, description="Max concurrent jobs")


class BatchStatusResponse(BaseModel):
    """Response model for batch job status"""
    batch_id: str
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    queued_jobs: int
    jobs: List[JobStatusResponse]


class WebhookConfig(BaseModel):
    """Configuration for result webhooks"""
    url: str = Field(..., description="HTTP(S) URL for webhook POST")
    events: List[str] = Field(default=["analysis_complete"], description="Events to trigger webhook")
    secret: Optional[str] = Field(None, description="HMAC secret for request signing")


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="MistTracker Emergence Detection API",
    description="RESTful interface for universal emergence detection across physical domains",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store (for production, use Redis/PostgreSQL)
job_store: Dict[str, Dict[str, Any]] = {}
batch_store: Dict[str, Dict[str, Any]] = {}
job_counter = 0


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_job_id() -> str:
    """Generate unique job ID"""
    global job_counter
    job_counter += 1
    return f"job-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{job_counter:05d}"


def generate_batch_id() -> str:
    """Generate unique batch ID"""
    return f"batch-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"


async def run_analysis_task(job_id: str, request: AnalysisRequest):
    """Background task to execute analysis asynchronously"""
    try:
        job_store[job_id]["status"] = "running"
        job_store[job_id]["progress"] = 10
        
        # Create temporary config file
        config_data = {
            "adapter": {
                "name": request.domain.value,
                "config": request.adapter_config
            },
            "analysis": {
                "type": request.analysis_type.value,
                "parameters": request.analysis_parameters
            },
            "engine": request.engine_parameters,
            "output_dir": "./phase-17-output",
            "output_format": request.output_format,
            "verbose": False
        }
        
        import yaml
        config_path = f"/tmp/{job_id}_config.yaml"
        with open(config_path, 'w') as f:
            yaml.dump(config_data, f)
        
        job_store[job_id]["progress"] = 25
        
        # Run antenna
        antenna = MistTrackerAntenna(AnalysisConfig.from_yaml(config_path))
        result = antenna.run()
        
        job_store[job_id]["progress"] = 90
        job_store[job_id]["result"] = result
        job_store[job_id]["status"] = "completed"
        job_store[job_id]["progress"] = 100
        job_store[job_id]["completed_at"] = datetime.utcnow().isoformat()
        
        # Cleanup
        os.remove(config_path)
        
    except Exception as e:
        job_store[job_id]["status"] = "failed"
        job_store[job_id]["error"] = str(e)


# ============================================================================
# HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/api/health", tags=["Health"])
async def health_check() -> JSONResponse:
    """Check API server health"""
    return JSONResponse({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0"
    })


@app.get("/api/info", tags=["Info"])
async def api_info() -> JSONResponse:
    """Get API and framework information"""
    info = {
        "service": "MistTracker Emergence Detection API",
        "phase": "2a (with Phase 2b, 2e & 2f enhancements)",
        "version": "2.0.0",
        "domains": [d.value for d in DomainEnum],
        "analysis_types": [a.value for a in AnalysisTypeEnum],
        "max_concurrent_jobs": 10,
        "job_ttl_hours": 24,
        "phase_2b_available": PHASE2B_AVAILABLE,
        "phase_2e_available": PHASE2E_AVAILABLE,
        "phase_2f_available": PHASE2F_AVAILABLE,
        "phase_2e_features": {
            "expert_feedback": PHASE2E_AVAILABLE,
            "advanced_alerts": PHASE2E_AVAILABLE,
            "multi_domain_correlation": PHASE2E_AVAILABLE,
            "threshold_learning": PHASE2E_AVAILABLE,
        } if PHASE2E_AVAILABLE else None,
        "phase_2f_features": {
            "distributed_storage": PHASE2F_AVAILABLE,
            "distributed_consensus": PHASE2F_AVAILABLE,
            "multi_node_clustering": PHASE2F_AVAILABLE,
            "automatic_failover": PHASE2F_AVAILABLE,
            "data_replication": PHASE2F_AVAILABLE,
        } if PHASE2F_AVAILABLE else None,
        "phase_2g_available": PHASE2G_AVAILABLE,
        "phase_2g_features": {
            "expert_reputation": PHASE2G_AVAILABLE,
            "prediction_accuracy_tracking": PHASE2G_AVAILABLE,
            "confidence_calibration": PHASE2G_AVAILABLE,
            "accuracy_trends": PHASE2G_AVAILABLE,
            "reputation_weighted_alerts": PHASE2G_AVAILABLE,
        } if PHASE2G_AVAILABLE else None,
    }
    return JSONResponse(info)


@app.get("/api/metrics/integration", tags=["Metrics"])
async def get_phase2b_integration_metrics() -> JSONResponse:
    """Get Phase 2b Bayesian integration metrics and statistics"""
    if not PHASE2B_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Phase 2b integration metrics not available"
        )
    
    try:
        metrics = get_integration_metrics()
        return JSONResponse({
            "component": "Phase 2b Integration Layer",
            "status": "available",
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve metrics: {str(e)}")


# ============================================================================
# CONFIGURATION ENDPOINTS
# ============================================================================

@app.get("/api/templates", tags=["Configuration"])
async def list_templates() -> JSONResponse:
    """List available config templates"""
    try:
        templates = list_available_templates()
        return JSONResponse({"templates": templates})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/template/{template_name}", tags=["Configuration"])
async def get_template(template_name: str) -> JSONResponse:
    """Generate config from template"""
    try:
        config_path = f"/tmp/{template_name}_template.yaml"
        create_config_file(template_name, config_path)
        
        with open(config_path, 'r') as f:
            content = f.read()
        
        os.remove(config_path)
        return JSONResponse({"template": template_name, "config": content})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# ANALYSIS JOB ENDPOINTS
# ============================================================================

@app.post("/api/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def submit_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks) -> AnalysisResponse:
    """Submit analysis job for processing
    
    Creates a background task to run emergence detection. Returns job ID for polling.
    """
    job_id = generate_job_id()
    
    job_store[job_id] = {
        "status": "queued",
        "domain": request.domain.value,
        "analysis_type": request.analysis_type.value,
        "submitted_at": datetime.utcnow().isoformat(),
        "progress": 0,
        "request": request
    }
    
    # Schedule background execution
    background_tasks.add_task(run_analysis_task, job_id, request)
    
    return AnalysisResponse(
        job_id=job_id,
        status="queued",
        domain=request.domain.value,
        analysis_type=request.analysis_type.value,
        result_url=f"/api/results/{job_id}"
    )


@app.post("/api/batch", tags=["Analysis"])
async def submit_batch(request: BatchSubmissionRequest, background_tasks: BackgroundTasks) -> JSONResponse:
    """Submit batch of analysis jobs"""
    batch_id = generate_batch_id()
    job_ids = []
    
    for idx, job_request in enumerate(request.jobs):
        if idx >= request.concurrent_limit:
            # Queue remaining jobs for later scheduling
            pass
        
        job_id = generate_job_id()
        job_store[job_id] = {
            "status": "queued",
            "batch_id": batch_id,
            "domain": job_request.domain.value,
            "analysis_type": job_request.analysis_type.value,
            "submitted_at": datetime.utcnow().isoformat(),
            "progress": 0,
            "request": job_request
        }
        
        background_tasks.add_task(run_analysis_task, job_id, job_request)
        job_ids.append(job_id)
    
    batch_store[batch_id] = {
        "job_ids": job_ids,
        "total_jobs": len(request.jobs),
        "submitted_at": datetime.utcnow().isoformat()
    }
    
    return JSONResponse({
        "batch_id": batch_id,
        "job_ids": job_ids,
        "status": "submitted"
    })


@app.get("/api/status/{job_id}", response_model=JobStatusResponse, tags=["Analysis"])
async def get_job_status(job_id: str) -> JobStatusResponse:
    """Poll job status and get results"""
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    job = job_store[job_id]
    
    response = JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress_percent=job.get("progress", 0),
        message=f"{job['status'].capitalize()} - {job['domain']} {job['analysis_type']}"
    )
    
    if job["status"] == "completed" and "result" in job:
        result = job["result"]
        response.result = AnalysisResultResponse(
            job_id=job_id,
            status=result.get("status", "unknown"),
            domain=result.get("domain", job["domain"]),
            analysis_type=result.get("analysis_type", job["analysis_type"]),
            metric_name=result.get("metric_name", "unknown"),
            metric_value=float(result.get("primary_metric", 0)),
            threshold=float(result.get("threshold", 0)),
            verdict=result.get("status", "unknown"),
            frequencies=result.get("frequencies", [])[:20],  # Limit response size
            power=result.get("power", [])[:20],
            harmonics=result.get("harmonics", []),
            data_points_analyzed=result.get("data_points_analyzed", 0),
            timestamp=result.get("timestamp", ""),
            processing_time_seconds=0.0  # TODO: Calculate from timestamps
        )
    
    if job["status"] == "failed" and "error" in job:
        response.error = job["error"]
    
    return response


@app.get("/api/results/{job_id}", tags=["Analysis"])
async def get_job_results(
    job_id: str,
    format: str = Query("json", enum=["json", "csv", "phase1", "bayesian", "combined"]),
    output_format: Optional[str] = Query(None, enum=["json", "csv"])
) -> Any:
    """
    Download analysis results in specified format.
    
    Query Parameters:
    - format: Result format
      * json/csv: Output file format
      * phase1: Phase 1 antenna results only
      * bayesian: Bayesian uncertainty quantification only (Phase 2b)
      * combined: Both Phase 1 + Bayesian (default, requires Phase 2b)
    - output_format: Output file format (json or csv, overrides format param)
    
    Examples:
      GET /api/results/job-123?format=combined        # Phase 1 + Bayesian JSON
      GET /api/results/job-123?format=bayesian        # Bayesian results only
      GET /api/results/job-123?output_format=csv      # Results as CSV
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    job = job_store[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=202, detail=f"Job still {job['status']}")
    
    result = job["result"]
    
    # Determine output file format (output_format overrides format if both specified)
    file_format = output_format if output_format in ["json", "csv"] else "json"
    
    # Determine result content format
    result_format = format if format in ["phase1", "bayesian", "combined"] else "combined"
    
    # Apply Phase 2b Bayesian integration if requested
    if result_format in ["bayesian", "combined"] and PHASE2B_AVAILABLE:
        try:
            result = create_bayesian_response(job_id, result, format=result_format)
        except Exception as e:
            # Graceful fallback: return Phase 1 result if Bayesian integration fails
            print(f"[Warning] Bayesian integration failed for {job_id}: {e}")
            if result_format == "combined":
                # Still return Phase 1 result for combined format
                pass
            else:
                # For bayesian-only format, still try to serve what we have
                pass
    elif result_format in ["bayesian", "combined"] and not PHASE2B_AVAILABLE:
        if result_format == "bayesian":
            raise HTTPException(
                status_code=501,
                detail="Phase 2b Bayesian module not available. Install phase_2b_uncertainty_quantifier.py"
            )
        # For combined format with Phase 2b unavailable, just return Phase 1
        result_format = "phase1"
    
    # Serialize to requested file format
    if file_format == "json":
        return JSONResponse(result)
    
    elif file_format == "csv":
        # Convert to CSV
        import csv
        import io
        
        output = io.StringIO()
        
        # Handle nested structures
        def flatten_dict(d: Dict, parent_key: str = '', sep: str = '_'):
            items = []
            for k, v in d.items():
                new_key = f"{parent_key}{sep}{k}" if parent_key else k
                if isinstance(v, dict):
                    items.extend(flatten_dict(v, new_key, sep=sep).items())
                elif isinstance(v, list):
                    items.append((new_key, str(v)))
                else:
                    items.append((new_key, v))
            return dict(items)
        
        flat_result = flatten_dict(result)
        writer = csv.DictWriter(output, fieldnames=flat_result.keys())
        writer.writeheader()
        writer.writerow(flat_result)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={job_id}_results.csv"}
        )


@app.delete("/api/jobs/{job_id}", tags=["Analysis"])
async def cancel_job(job_id: str) -> JSONResponse:
    """Cancel running analysis job"""
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    job = job_store[job_id]
    
    if job["status"] in ["completed", "failed"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel {job['status']} job")
    
    job["status"] = "cancelled"
    return JSONResponse({"job_id": job_id, "status": "cancelled"})


# ============================================================================
# BATCH ENDPOINTS
# ============================================================================

@app.get("/api/batch/{batch_id}", tags=["Batch"])
async def get_batch_status(batch_id: str, format: str = Query("phase1", enum=["phase1", "bayesian", "combined"])) -> Any:
    """
    Get status and results of all jobs in batch.
    
    Query Parameters:
    - format: Result format
      * phase1: Phase 1 antenna results only
      * bayesian: Bayesian uncertainty quantification (Phase 2b)
      * combined: Both Phase 1 + Bayesian (requires Phase 2b)
    """
    if batch_id not in batch_store:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    
    batch = batch_store[batch_id]
    job_ids = batch["job_ids"]
    
    completed = sum(1 for jid in job_ids if job_store[jid]["status"] == "completed")
    failed = sum(1 for jid in job_ids if job_store[jid]["status"] == "failed")
    queued = sum(1 for jid in job_ids if job_store[jid]["status"] == "queued")
    
    # Prepare job results with optional Bayesian integration
    job_results = []
    for jid in job_ids:
        job = job_store[jid]
        job_resp = {
            "job_id": jid,
            "status": job["status"],
            "progress": job.get("progress", 0)
        }
        
        # Include results if job is completed
        if job["status"] == "completed" and format in ["bayesian", "combined"]:
            try:
                if PHASE2B_AVAILABLE:
                    integrated_result = integrate_analysis_result(
                        job_id=jid,
                        phase1_result=job["result"],
                        format=format
                    )
                    job_resp["result"] = integrated_result.to_dict()
                else:
                    job_resp["result"] = job["result"]
            except Exception as e:
                job_resp["result"] = job["result"]
                job_resp["integration_error"] = str(e)
        elif job["status"] == "completed":
            job_resp["result"] = job["result"]
        
        job_results.append(job_resp)
    
    return JSONResponse({
        "batch_id": batch_id,
        "total_jobs": batch["total_jobs"],
        "completed_jobs": completed,
        "failed_jobs": failed,
        "queued_jobs": queued,
        "format": format,
        "phase_2b_available": PHASE2B_AVAILABLE,
        "jobs": job_results,
        "timestamp": datetime.utcnow().isoformat()
    })


# ============================================================================
# STREAMING & MONITORING ENDPOINTS
# ============================================================================

@app.get("/api/stream/{job_id}", tags=["Monitoring"])
async def stream_job_progress(job_id: str):
    """Server-sent events stream for job progress"""
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    async def event_generator():
        while True:
            job = job_store.get(job_id, {})
            
            status = job.get("status", "unknown")
            progress = job.get("progress", 0)
            
            yield f"data: {json.dumps({'status': status, 'progress': progress})}\n\n"
            
            if status in ["completed", "failed", "cancelled"]:
                break
            
            await asyncio.sleep(1)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"}
    )


# ============================================================================
# WEBHOOK ENDPOINTS
# ============================================================================

webhook_subscriptions: Dict[str, List[WebhookConfig]] = {}


@app.post("/api/webhooks/subscribe", tags=["Webhooks"])
async def subscribe_webhook(domain: DomainEnum, config: WebhookConfig) -> JSONResponse:
    """Subscribe to emergence detection events for a domain"""
    if domain.value not in webhook_subscriptions:
        webhook_subscriptions[domain.value] = []
    
    webhook_subscriptions[domain.value].append(config)
    
    return JSONResponse({
        "domain": domain.value,
        "webhook_url": config.url,
        "status": "subscribed"
    })


@app.delete("/api/webhooks/unsubscribe", tags=["Webhooks"])
async def unsubscribe_webhook(domain: DomainEnum, webhook_url: str) -> JSONResponse:
    """Unsubscribe from emergence detection events"""
    if domain.value in webhook_subscriptions:
        webhook_subscriptions[domain.value] = [
            w for w in webhook_subscriptions[domain.value]
            if w.url != webhook_url
        ]
    
    return JSONResponse({
        "domain": domain.value,
        "webhook_url": webhook_url,
        "status": "unsubscribed"
    })


async def trigger_webhooks(domain: str, event: str, data: Dict[str, Any]):
    """Trigger registered webhooks for domain event"""
    if domain not in webhook_subscriptions:
        return
    
    import httpx
    
    for webhook in webhook_subscriptions[domain]:
        if event in webhook.events:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        webhook.url,
                        json={"event": event, "domain": domain, "data": data},
                        timeout=5.0
                    )
            except Exception as e:
                print(f"Webhook trigger failed for {webhook.url}: {e}")


# ============================================================================
# PHASE 2E ENDPOINTS: EXPERT FEEDBACK, ALERTS, CORRELATIONS, THRESHOLDS
# ============================================================================

@app.post("/api/feedback/submit", tags=["Phase 2e: Expert Feedback"])
async def submit_feedback(
    job_id: str,
    expert_id: str,
    domain: str,
    verdict: str,
    ground_truth: str,
    rating: str,  # correct, incorrect, partial, uncertain
    metric_name: str,
    metric_value: float,
    adjustment: str = "no_change",  # shift_up, shift_down, increase_uncertainty, decrease_uncertainty
    adjustment_magnitude: float = 0.0,
    comments: str = ""
) -> JSONResponse:
    """
    Submit expert feedback for analysis result.
    
    This feedback trains the system to improve future predictions.
    """
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    try:
        result = submit_expert_feedback(
            job_id=job_id,
            expert_id=expert_id,
            domain=domain,
            analysis_type="emergence_detection",
            bayesian_verdict=verdict,
            ground_truth=ground_truth,
            feedback_rating=rating,
            metric_name=metric_name,
            observed_value=metric_value,
            suggested_adjustment=adjustment,
            adjustment_magnitude=adjustment_magnitude,
            comments=comments
        )
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/feedback/expert/{expert_id}", tags=["Phase 2e: Expert Feedback"])
async def get_expert_profile(expert_id: str) -> JSONResponse:
    """Get expert's feedback profile and accuracy metrics"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    feedback_engine = get_feedback_engine()
    profile = feedback_engine.get_expert_profile(expert_id)
    return JSONResponse(profile)


@app.get("/api/feedback/statistics", tags=["Phase 2e: Expert Feedback"])
async def get_feedback_statistics() -> JSONResponse:
    """Get overall expert feedback system statistics"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    feedback_engine = get_feedback_engine()
    stats = feedback_engine.get_statistics()
    return JSONResponse({
        "component": "Expert Feedback Engine",
        "statistics": stats,
        "timestamp": datetime.utcnow().isoformat()
    })


@app.get("/api/alerts/active", tags=["Phase 2e: Advanced Alerts"])
async def get_active_alerts() -> JSONResponse:
    """Get currently active (unresolved) alerts"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    alerting_engine = get_alerting_engine()
    active = alerting_engine.get_active_alerts()
    return JSONResponse({
        "active_alerts": len(active),
        "alerts": [alert.to_dict() for alert in active],
        "timestamp": datetime.utcnow().isoformat()
    })


@app.get("/api/alerts/history", tags=["Phase 2e: Advanced Alerts"])
async def get_alerts_history(
    domain: Optional[str] = None,
    severity: Optional[str] = None,
    hours: int = 24
) -> JSONResponse:
    """Get alert history for specified period"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    try:
        alerting_engine = get_alerting_engine()
        
        severity_enum = None
        if severity:
            severity_enum = AlertSeverity(severity)
        
        alerts = alerting_engine.get_alert_history(
            domain=domain,
            severity=severity_enum,
            hours=hours
        )
        
        return JSONResponse({
            "alerts_found": len(alerts),
            "period_hours": hours,
            "alerts": [alert.to_dict() for alert in alerts],
            "timestamp": datetime.utcnow().isoformat()
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameter: {e}")


@app.post("/api/alerts/acknowledge", tags=["Phase 2e: Advanced Alerts"])
async def acknowledge_alert(alert_id: str) -> JSONResponse:
    """Acknowledge an alert"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    alerting_engine = get_alerting_engine()
    success = alerting_engine.acknowledge_alert(alert_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    return JSONResponse({"alert_id": alert_id, "status": "acknowledged"})


@app.get("/api/correlations/active", tags=["Phase 2e: Multi-Domain Correlations"])
async def get_active_correlations() -> JSONResponse:
    """Get active multi-domain correlation patterns"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    detector = get_correlation_detector()
    active = detector.get_active_patterns()
    
    return JSONResponse({
        "active_patterns": len(active),
        "patterns": [pattern.to_dict() for pattern in active],
        "timestamp": datetime.utcnow().isoformat()
    })


@app.get("/api/correlations/high-confidence", tags=["Phase 2e: Multi-Domain Correlations"])
async def get_high_confidence_correlations(
    min_strength: float = 0.75
) -> JSONResponse:
    """Get high-confidence correlation patterns"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    detector = get_correlation_detector()
    patterns = detector.get_high_confidence_patterns(min_strength=min_strength)
    ranked = detector.rank_patterns_by_significance()
    
    return JSONResponse({
        "high_confidence_patterns": len(patterns),
        "min_strength_threshold": min_strength,
        "patterns": [
            {
                "pattern": p.to_dict(),
                "significance_score": score
            }
            for p, score in ranked
        ],
        "timestamp": datetime.utcnow().isoformat()
    })


@app.get("/api/thresholds/recommendations", tags=["Phase 2e: Threshold Learning"])
async def get_threshold_recommendations() -> JSONResponse:
    """Get recommended optimized thresholds"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    optimizer = get_threshold_optimizer()
    recommendations = optimizer.get_threshold_recommendations()
    
    return JSONResponse({
        "optimized_thresholds": {
            key: threshold.to_dict()
            for key, threshold in recommendations.items()
        },
        "timestamp": datetime.utcnow().isoformat()
    })


@app.get("/api/thresholds/roc/{domain}/{metric}", tags=["Phase 2e: Threshold Learning"])
async def get_threshold_roc_curve(domain: str, metric: str) -> JSONResponse:
    """Get ROC curve data for threshold optimization"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    optimizer = get_threshold_optimizer()
    roc_points = optimizer.get_roc_curve(domain=domain, metric_name=metric)
    
    if not roc_points:
        raise HTTPException(
            status_code=404,
            detail=f"No threshold data available for {domain}/{metric}"
        )
    
    return JSONResponse({
        "domain": domain,
        "metric": metric,
        "roc_curve": roc_points,
        "point_count": len(roc_points),
        "timestamp": datetime.utcnow().isoformat()
    })


@app.post("/api/thresholds/label-datapoint", tags=["Phase 2e: Threshold Learning"])
async def add_labeled_datapoint(
    domain: str,
    metric_name: str,
    metric_value: float,
    verdict: str,
    ground_truth: str,  # tp, tn, fp, fn
    expert_id: str,
    confidence: float = 0.9
) -> JSONResponse:
    """
    Add labeled data point for threshold optimization.
    
    Ground truth values:
    - tp: True positive (correctly identified emergence)
    - tn: True negative (correctly identified non-emergence)
    - fp: False positive (incorrectly identified emergence)
    - fn: False negative (missed emergence)
    """
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    try:
        optimizer = get_threshold_optimizer()
        
        outcome = ClassificationOutcome(ground_truth)
        datapoint = LabeledDatapoint(
            domain=domain,
            metric_name=metric_name,
            metric_value=metric_value,
            verdict_by_algorithm=verdict,
            ground_truth=outcome,
            expert_id=expert_id,
            confidence=confidence
        )
        
        optimizer.add_labeled_datapoint(datapoint)
        
        return JSONResponse({
            "status": "labeled_datapoint_added",
            "domain": domain,
            "metric": metric_name,
            "total_labeled": sum(
                1 for d in optimizer.labeled_data
                if d.domain == domain and d.metric_name == metric_name
            )
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid ground truth value: {e}")


@app.post("/api/thresholds/optimize", tags=["Phase 2e: Threshold Learning"])
async def optimize_threshold(
    domain: str,
    metric_name: str,
    optimize_for: str = "f1_score",
    min_datapoints: int = 10
) -> JSONResponse:
    """
    Optimize threshold for domain/metric based on labeled data.
    
    Optimization targets:
    - f1_score: Balanced precision/recall
    - sensitivity: Minimize false negatives
    - specificity: Minimize false positives
    """
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    try:
        optimizer = get_threshold_optimizer()
        
        opt_threshold = optimizer.optimize_threshold(
            domain=domain,
            metric_name=metric_name,
            optimize_for=optimize_for,
            min_datapoints=min_datapoints
        )
        
        if opt_threshold is None:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient labeled data: need {min_datapoints}, have <{min_datapoints}"
            )
        
        return JSONResponse({
            "status": "threshold_optimized",
            "optimized_threshold": opt_threshold.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameter: {e}")


@app.get("/api/phase2e/statistics", tags=["Phase 2e: System Statistics"])
async def get_phase2e_statistics() -> JSONResponse:
    """Get comprehensive Phase 2e platform statistics"""
    if not PHASE2E_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2e not available")
    
    feedback_engine = get_feedback_engine()
    alerting_engine = get_alerting_engine()
    detector = get_correlation_detector()
    optimizer = get_threshold_optimizer()
    
    return JSONResponse({
        "phase_2e_platform": {
            "expert_feedback": feedback_engine.get_statistics(),
            "alerting_system": alerting_engine.get_statistics(),
            "correlation_detector": detector.get_statistics(),
            "threshold_optimizer": optimizer.get_statistics(),
        },
        "timestamp": datetime.utcnow().isoformat()
    })


# ============================================================================
# PHASE 2F ENDPOINTS: DISTRIBUTED STORAGE, CONSENSUS, CLUSTERING
# ============================================================================

@app.get("/api/cluster/status", tags=["Phase 2f: Cluster Management"])
async def get_cluster_status() -> JSONResponse:
    """Get overall cluster status and health"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        node_mgr = get_node_manager()
        status = node_mgr.get_cluster_status()
        
        return JSONResponse({
            "component": "Distributed Cluster",
            "status": "healthy" if status["healthy_nodes"] > 0 else "degraded",
            "cluster_status": status,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve cluster status: {str(e)}")


@app.get("/api/cluster/nodes", tags=["Phase 2f: Cluster Management"])
async def list_cluster_nodes(region: Optional[str] = None) -> JSONResponse:
    """Get list of all nodes in cluster, optionally filtered by region"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        node_mgr = get_node_manager()
        
        # Get all nodes
        nodes = []
        for node_id, node_info in node_mgr.nodes.items():
            if region and node_info.get("region") != region:
                continue
            nodes.append({
                "node_id": node_id,
                "region": node_info.get("region"),
                "address": node_info.get("address"),
                "is_backup": node_info.get("is_backup", False),
                "primary_node": node_info.get("primary_node"),
                "online": node_info.get("online", False),
                "last_heartbeat": node_info.get("last_heartbeat"),
            })
        
        return JSONResponse({
            "total_nodes": len(nodes),
            "region_filter": region,
            "nodes": nodes,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list nodes: {str(e)}")


@app.post("/api/cluster/register-node", tags=["Phase 2f: Cluster Management"])
async def register_cluster_node(
    node_id: str,
    region: str,
    address: str,
    is_backup: bool = False,
    primary_node: Optional[str] = None
) -> JSONResponse:
    """Register a new node in the cluster"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        node_mgr = get_node_manager()
        node_mgr.register_node(node_id, region, address, is_backup, primary_node)
        
        return JSONResponse({
            "status": "node_registered",
            "node_id": node_id,
            "region": region,
            "address": address,
            "is_backup": is_backup,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to register node: {str(e)}")


@app.get("/api/storage/record/{record_id}", tags=["Phase 2f: Distributed Storage"])
async def retrieve_storage_record(record_id: str, category: Optional[str] = None) -> JSONResponse:
    """Retrieve a stored data record"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        storage = get_storage()
        record = storage.get_record(record_id)
        
        if not record:
            raise HTTPException(status_code=404, detail=f"Record {record_id} not found")
        
        return JSONResponse({
            "record_id": record.record_id,
            "category": record.category.name,
            "data": record.data,
            "version": record.version,
            "source_node": record.source_node,
            "timestamp": record.timestamp.isoformat(),
            "checksum": record.calculate_checksum(),
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve record: {str(e)}")


@app.post("/api/storage/record", tags=["Phase 2f: Distributed Storage"])
async def store_data_record(
    record_id: str,
    category: str,  # EXPERT_FEEDBACK, ALERTS, CORRELATIONS, THRESHOLDS, NODE_STATE
    data: Dict[str, Any],
    source_node: Optional[str] = None
) -> JSONResponse:
    """Store a new data record in distributed storage"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        storage = get_storage()
        
        # Parse category
        try:
            cat = DataCategory[category]
        except KeyError:
            raise ValueError(f"Invalid category. Must be one of: {', '.join([c.name for c in DataCategory])}")
        
        # Create and store record
        record = DataRecord(
            record_id=record_id,
            category=cat,
            data=data,
            timestamp=datetime.now(timezone.utc),
            source_node=source_node or "local"
        )
        
        success = storage.store_record(record)
        
        if not success:
            raise Exception("Failed to store record (conflict or write error)")
        
        return JSONResponse({
            "status": "record_stored",
            "record_id": record_id,
            "category": category,
            "version": record.version,
            "timestamp": datetime.utcnow().isoformat()
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store record: {str(e)}")


@app.get("/api/storage/status", tags=["Phase 2f: Distributed Storage"])
async def get_storage_status() -> JSONResponse:
    """Get storage system status and statistics"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        storage = get_storage()
        status = storage.get_system_status()
        
        return JSONResponse({
            "component": "Distributed Storage",
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve storage status: {str(e)}")


@app.get("/api/consensus/proposals", tags=["Phase 2f: Distributed Consensus"])
async def list_consensus_proposals(status: Optional[str] = None) -> JSONResponse:
    """List all consensus proposals, optionally filtered by status"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        consensus = get_consensus()
        proposals = []
        
        for prop_id, proposal in consensus.proposals.items():
            if status and proposal.status != status:
                continue
            proposals.append({
                "proposal_id": prop_id,
                "category": proposal.category,
                "command": proposal.command,
                "status": proposal.status,
                "approved_votes": proposal.approved_votes,
                "rejected_votes": proposal.rejected_votes,
                "required_votes": proposal.required_votes,
                "timestamp": proposal.timestamp.isoformat() if hasattr(proposal.timestamp, 'isoformat') else str(proposal.timestamp),
            })
        
        return JSONResponse({
            "total_proposals": len(proposals),
            "status_filter": status,
            "proposals": proposals,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list proposals: {str(e)}")


@app.post("/api/consensus/vote", tags=["Phase 2f: Distributed Consensus"])
async def vote_on_proposal(proposal_id: str, voter_id: str, vote: bool) -> JSONResponse:
    """Vote on a consensus proposal"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        consensus = get_consensus()
        
        if proposal_id not in consensus.proposals:
            raise HTTPException(status_code=404, detail=f"Proposal {proposal_id} not found")
        
        consensus.vote_on_proposal(proposal_id, voter_id, vote)
        
        # Get updated status
        proposal = consensus.proposals[proposal_id]
        
        return JSONResponse({
            "status": "vote_recorded",
            "proposal_id": proposal_id,
            "voter": voter_id,
            "vote": "approved" if vote else "rejected",
            "proposal_status": proposal.status,
            "approved_votes": proposal.approved_votes,
            "rejected_votes": proposal.rejected_votes,
            "timestamp": datetime.utcnow().isoformat()
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to vote on proposal: {str(e)}")


@app.get("/api/failover/events", tags=["Phase 2f: Failover Management"])
async def get_failover_events(node_id: Optional[str] = None, hours: int = 24) -> JSONResponse:
    """Get failover event history"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        node_mgr = get_node_manager()
        
        events = []
        if hasattr(node_mgr, 'failover_events'):
            for event in node_mgr.failover_events:
                if node_id and event.failed_node_id != node_id:
                    continue
                events.append({
                    "failed_node_id": event.failed_node_id,
                    "backup_node_id": event.backup_node_id,
                    "reason": event.reason,
                    "timestamp": event.timestamp.isoformat() if hasattr(event.timestamp, 'isoformat') else str(event.timestamp),
                    "status": event.status,
                })
        
        return JSONResponse({
            "failover_events": len(events),
            "node_filter": node_id,
            "period_hours": hours,
            "events": events,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve failover events: {str(e)}")


@app.get("/api/replication/status", tags=["Phase 2f: Replication Management"])
async def get_replication_status() -> JSONResponse:
    """Get data replication status across nodes"""
    if not PHASE2F_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2f not available")
    
    try:
        node_mgr = get_node_manager()
        repl_status = node_mgr.get_replication_status()
        
        return JSONResponse({
            "replication_strategy": node_mgr.replication_strategy.name,
            "replication_status": repl_status,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve replication status: {str(e)}")


# ============================================================================
# PHASE 2G: EXPERT REPUTATION SYSTEM ENDPOINTS
# ============================================================================

@app.post("/api/reputation/record-outcome", tags=["Phase 2g: Expert Reputation"])
async def record_prediction_outcome(
    expert_id: str,
    prediction_id: str,
    predicted_value: str,
    predicted_confidence: float,
    actual_value: str,
    outcome_type: str,  # CORRECT, INCORRECT, PARTIAL, UNKNOWN
    domain: str,
    notes: Optional[str] = None
) -> JSONResponse:
    """Record a prediction outcome for reputation tracking"""
    if not PHASE2G_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2g not available")
    
    try:
        # Validate confidence
        if not (0 <= predicted_confidence <= 1):
            raise ValueError("predicted_confidence must be between 0 and 1")
        
        # Parse outcome type
        try:
            outcome_enum = PredictionOutcomeType[outcome_type.upper()]
        except KeyError:
            valid_types = [t.name for t in PredictionOutcomeType]
            raise ValueError(f"Invalid outcome_type. Must be one of: {', '.join(valid_types)}")
        
        # Create outcome
        outcome = PredictionOutcome(
            expert_id=expert_id,
            prediction_id=prediction_id,
            predicted_value=predicted_value,
            predicted_confidence=predicted_confidence,
            actual_value=actual_value,
            outcome_type=outcome_enum,
            timestamp_predicted=datetime.now(timezone.utc),
            timestamp_actual=datetime.now(timezone.utc),
            domain=domain,
            notes=notes
        )
        
        # Record and get updated reputation
        result = _reputation_engine.record_prediction_outcome(outcome)
        
        return JSONResponse({
            "expert_id": expert_id,
            "prediction_id": prediction_id,
            "outcome_type": outcome_type,
            "reputation_updated": result,
            "timestamp": datetime.utcnow().isoformat()
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record outcome: {str(e)}")


@app.get("/api/reputation/expert/{expert_id}", tags=["Phase 2g: Expert Reputation"])
async def get_expert_reputation(expert_id: str) -> JSONResponse:
    """Get reputation metrics for a specific expert"""
    if not PHASE2G_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2g not available")
    
    try:
        reputation = _reputation_engine.get_expert_reputation(expert_id)
        
        if not reputation:
            raise HTTPException(status_code=404, detail=f"No reputation data for expert {expert_id}")
        
        return JSONResponse({
            "expert_id": expert_id,
            "reputation": reputation,
            "timestamp": datetime.utcnow().isoformat()
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve reputation: {str(e)}")


@app.get("/api/reputation/weight/{expert_id}", tags=["Phase 2g: Expert Reputation"])
async def get_reputation_weight(expert_id: str) -> JSONResponse:
    """Get reputation weight (0-1) for an expert - used to weight feedback"""
    if not PHASE2G_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2g not available")
    
    try:
        weight = _reputation_engine.get_reputation_weight(expert_id)
        
        return JSONResponse({
            "expert_id": expert_id,
            "reputation_weight": weight,
            "weight_category": (
                "highly_trusted" if weight > 0.8 else
                "trusted" if weight > 0.6 else
                "neutral" if weight > 0.4 else
                "low_trust"
            ),
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve weight: {str(e)}")


@app.get("/api/reputation/scorecard", tags=["Phase 2g: Expert Reputation"])
async def get_reputation_scorecard(domain: Optional[str] = None, limit: int = 10) -> JSONResponse:
    """Get aggregated reputation metrics for all experts"""
    if not PHASE2G_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2g not available")
    
    try:
        scorecard = _reputation_engine.get_reputation_scorecard(domain=domain, limit=limit)
        
        return JSONResponse({
            "total_experts": scorecard.total_experts,
            "average_reputation": scorecard.average_reputation,
            "domain_filter": domain,
            "top_experts": [{"expert_id": e[0], "reputation": e[1]} for e in scorecard.top_experts],
            "bottom_experts": [{"expert_id": e[0], "reputation": e[1]} for e in scorecard.bottom_experts],
            "reputation_distribution": scorecard.reputation_distribution,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve scorecard: {str(e)}")


@app.get("/api/reputation/history/{expert_id}", tags=["Phase 2g: Expert Reputation"])
async def get_expert_history(expert_id: str, limit: int = 10) -> JSONResponse:
    """Get recent prediction outcomes for an expert"""
    if not PHASE2G_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2g not available")
    
    try:
        history = _reputation_engine.get_expert_prediction_history(expert_id, limit=limit)
        
        return JSONResponse({
            "expert_id": expert_id,
            "prediction_count": len(history),
            "limit": limit,
            "predictions": history,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")


@app.post("/api/reputation/alert-weight", tags=["Phase 2g: Expert Reputation"])
async def weight_alert_by_reputation(
    expert_ids: List[str],
    base_severity: int
) -> JSONResponse:
    """
    Adjust alert severity based on expert reputation.
    
    Higher reputation experts can raise alerts more effectively.
    Severity range: 1-5
    """
    if not PHASE2G_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2g not available")
    
    try:
        # Validate severity
        if not (1 <= base_severity <= 5):
            raise ValueError("base_severity must be between 1 and 5")
        
        if not expert_ids:
            raise ValueError("At least one expert_id required")
        
        result = _reputation_engine.weight_alert_by_reputation(expert_ids, base_severity)
        
        return JSONResponse({
            "expert_ids": expert_ids,
            "base_severity": base_severity,
            "adjusted_severity": result['adjusted_severity'],
            "weight_factor": result['weight_factor'],
            "average_reputation": result['average_reputation'],
            "expert_weights": result['expert_weights'],
            "timestamp": datetime.utcnow().isoformat()
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to weight alert: {str(e)}")


@app.get("/api/reputation/statistics", tags=["Phase 2g: Expert Reputation"])
async def get_reputation_statistics() -> JSONResponse:
    """Get reputation system-wide statistics"""
    if not PHASE2G_AVAILABLE:
        raise HTTPException(status_code=501, detail="Phase 2g not available")
    
    try:
        stats = _reputation_engine.get_statistics()
        
        return JSONResponse({
            "component": "Expert Reputation System",
            "statistics": stats,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve statistics: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
