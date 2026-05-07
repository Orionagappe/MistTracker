# Phase 2a: REST API Deployment Guide
**MistTracker Emergence Detection API**  
**Date**: April 21, 2026

---

## Executive Summary

Phase 2a transforms the **Phase 1 standalone CLI antenna** into a **production-ready REST API** enabling:
- ✅ Real-time multi-domain analysis submission via HTTP
- ✅ Asynchronous background job processing
- ✅ Server-sent events (SSE) for live progress monitoring
- ✅ Batch job orchestration (1-N concurrent analyses)
- ✅ Webhook subscriptions for emergence event notifications
- ✅ Result streaming in JSON/CSV formats

**Architecture**: FastAPI + Uvicorn on Python 3.8+  
**Deployment Options**: Docker, systemd, Kubernetes, serverless (AWS Lambda)

---

## System Requirements

### Development
- Python 3.8+ (.venv active)
- pip 21+
- 512 MB RAM minimum
- 1 GB disk space

### Production
- Python 3.9+ (recommended)
- 2+ GB RAM (multi-job concurrency)
- 10 GB+ disk space (result caching)
- Redis 6+ (optional, for job persistence)
- PostgreSQL 12+ (optional, for audit logging)

---

## Installation

### Step 1: Install API Dependencies

```bash
# Activate Phase 1 virtual environment
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\Activate.ps1  # Windows PowerShell

# Install Phase 2a requirements
pip install -r phase_2a_requirements.txt

# Verify installation
python -c "import fastapi, uvicorn; print('✓ FastAPI and Uvicorn installed')"
```

### Step 2: Verify Phase 1 Components

Ensure Phase 1 modules are in place:
```bash
ls -la phase_1_*.py phase_1_config_manager.py
```

Expected files:
- `phase_1_antenna.py` ✓
- `phase_1_emergence_engine.py` ✓
- `phase_1_data_adapter.py` ✓
- `phase_1_config_manager.py` ✓

### Step 3: Test API Server Startup

```bash
# Start development server
python phase_2_api_server.py

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete

# In separate terminal, test health endpoint
curl http://localhost:8000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2026-04-21T...","version":"2.0.0"}
```

---

## API Endpoints Reference

### Health & Info

**GET /api/health**
```bash
curl -X GET http://localhost:8000/api/health
```

**GET /api/info**
```bash
curl -X GET http://localhost:8000/api/info
```

Returns: Supported domains, analysis types, API version.

---

### Configuration Management

**GET /api/templates**
List available config templates (solar_wind, earthquake, internet)
```bash
curl -X GET http://localhost:8000/api/templates
```

**POST /api/template/{template_name}**
Generate config from template
```bash
curl -X POST http://localhost:8000/api/template/solar_wind
```

---

### Analysis Job Submission

**POST /api/analyze** (Primary endpoint)
Submit single analysis job
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "solar_wind",
    "analysis_type": "emergence_detection",
    "adapter_config": {
      "duration_hours": 24,
      "spacecraft": "parker"
    },
    "analysis_parameters": {
      "fundamental_freq": 0.5,
      "num_harmonics": 4,
      "harmonics_threshold": 5.0
    },
    "engine_parameters": {
      "nperseg": 512,
      "noverlap": 256,
      "freq_range": [0.01, 5.0]
    },
    "output_format": "json",
    "description": "Solar wind ion cyclotron emergence test"
  }'
```

Response:
```json
{
  "job_id": "job-20260421143529-00001",
  "status": "queued",
  "domain": "solar_wind",
  "analysis_type": "emergence_detection",
  "submitted_at": "2026-04-21T14:35:29.123Z",
  "result_url": "/api/results/job-20260421143529-00001"
}
```

---

### Job Monitoring

**GET /api/status/{job_id}**
Poll job status (recommended: poll every 2-5 seconds)
```bash
curl -X GET http://localhost:8000/api/status/job-20260421143529-00001
```

Response:
```json
{
  "job_id": "job-20260421143529-00001",
  "status": "running",
  "progress_percent": 45,
  "message": "Running - solar_wind emergence_detection"
}
```

Status values:
- `queued` → Waiting to start
- `running` → Currently executing (10-90% progress)
- `completed` → Finished successfully (100% progress)
- `failed` → Error occurred
- `cancelled` → User cancelled job

---

### Result Retrieval

**GET /api/results/{job_id}**
Download completed results
```bash
# JSON format (default)
curl -X GET http://localhost:8000/api/results/job-20260421143529-00001

# CSV format
curl -X GET "http://localhost:8000/api/results/job-20260421143529-00001?format=csv" \
  -o results.csv
```

Response (JSON):
```json
{
  "timestamp": "2026-04-21T14:35:35.123Z",
  "domain": "solar_wind",
  "analysis_type": "emergence_detection",
  "metric_name": "rms_frequency_error_percent",
  "primary_metric": 0.123,
  "threshold": 5.0,
  "status": "CONFIRMED",
  "data_points_analyzed": 86400,
  "frequencies": [0.0, 0.00195, 0.00391, ...],
  "power": [6.238e-06, 1.234e-05, ...]
}
```

---

### Live Streaming

**GET /api/stream/{job_id}**
Server-sent events stream (WebSocket alternative)
```bash
curl -X GET http://localhost:8000/api/stream/job-20260421143529-00001 \
  --header "Accept: text/event-stream"
```

Receives events every 1 second:
```
data: {"status":"running","progress":25}
data: {"status":"running","progress":50}
data: {"status":"completed","progress":100}
```

Use in browser:
```javascript
const eventSource = new EventSource('/api/stream/job-id');
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log(`Progress: ${data.progress}%`);
};
```

---

### Batch Job Submission

**POST /api/batch**
Submit multiple jobs with concurrency control
```bash
curl -X POST http://localhost:8000/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {
        "domain": "solar_wind",
        "analysis_type": "emergence_detection",
        "adapter_config": {"duration_hours": 24, "spacecraft": "parker"},
        "analysis_parameters": {"fundamental_freq": 0.5, "num_harmonics": 4}
      },
      {
        "domain": "earthquakes",
        "analysis_type": "scale_invariance",
        "adapter_config": {"start_date": "2023-01-01", "end_date": "2023-12-31", "min_magnitude": 4.0, "region": "california"},
        "analysis_parameters": {"expected_b_value": 1.0}
      },
      {
        "domain": "networks",
        "analysis_type": "precursor_detection",
        "adapter_config": {"target_ip": "25.0.0.1", "duration_seconds": 300},
        "analysis_parameters": {"jitter_threshold_sigma": 2.0}
      }
    ],
    "concurrent_limit": 2
  }'
```

Response:
```json
{
  "batch_id": "batch-20260421143529",
  "job_ids": [
    "job-20260421143529-00001",
    "job-20260421143529-00002",
    "job-20260421143529-00003"
  ],
  "status": "submitted"
}
```

---

### Batch Status

**GET /api/batch/{batch_id}**
Monitor all jobs in batch
```bash
curl -X GET http://localhost:8000/api/batch/batch-20260421143529
```

---

### Webhook Subscriptions

**POST /api/webhooks/subscribe**
Subscribe to emergence events for a domain
```bash
curl -X POST http://localhost:8000/api/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "solar_wind",
    "webhook_config": {
      "url": "https://your-server.com/webhooks/emergence",
      "events": ["analysis_complete", "emergence_detected"],
      "secret": "shared-secret-key"
    }
  }'
```

Your webhook receives POST with:
```json
{
  "event": "analysis_complete",
  "domain": "solar_wind",
  "data": {
    "job_id": "job-20260421143529-00001",
    "status": "CONFIRMED",
    "metric_value": 0.123,
    "threshold": 5.0
  }
}
```

---

## Deployment Scenarios

### Scenario 1: Development (Local Testing)

```bash
# Terminal 1: Start API server
python phase_2_api_server.py

# Terminal 2: Submit test job
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "solar_wind",
    "analysis_type": "emergence_detection",
    "adapter_config": {"duration_hours": 1, "spacecraft": "parker"},
    "analysis_parameters": {"fundamental_freq": 0.5, "num_harmonics": 4}
  }'

# Terminal 3: Monitor progress
while true; do
  curl -X GET http://localhost:8000/api/status/job-xxx
  sleep 2
done
```

---

### Scenario 2: Production (Linux systemd)

**1. Create systemd service file** `/etc/systemd/system/misttracker-api.service`:
```ini
[Unit]
Description=MistTracker Emergence Detection API
After=network.target

[Service]
Type=notify
User=misttracker
WorkingDirectory=/opt/misttracker
Environment="PATH=/opt/misttracker/.venv/bin"
ExecStart=/opt/misttracker/.venv/bin/python -m phase_2_api_server
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**2. Create environment file** `/opt/misttracker/.env`:
```
PHASE_1_DATA_DIR=/var/misttracker/data
RESULT_CACHE_DIR=/var/misttracker/results
MAX_CONCURRENT_JOBS=5
JOB_TTL_HOURS=24
LOG_LEVEL=info
```

**3. Enable and start service**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable misttracker-api
sudo systemctl start misttracker-api

# Monitor logs
sudo journalctl -u misttracker-api -f
```

---

### Scenario 3: Docker Container

**Dockerfile** (in project root):
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY phase_2a_requirements.txt .
RUN pip install --no-cache-dir -r phase_2a_requirements.txt

# Copy Phase 1 and Phase 2 components
COPY phase_1_*.py .
COPY phase_2_api_server.py .
COPY phase_1_config_manager.py .

# Create output directory
RUN mkdir -p /app/phase-17-output

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"

# Start API
CMD ["python", "phase_2_api_server.py"]
```

**Build and run**:
```bash
# Build image
docker build -t misttracker-api:2.0.0 .

# Run container
docker run -d \
  --name misttracker-api \
  -p 8000:8000 \
  -v $(pwd)/phase-17-output:/app/phase-17-output \
  -e MAX_CONCURRENT_JOBS=5 \
  misttracker-api:2.0.0

# Check logs
docker logs -f misttracker-api

# Test health
curl http://localhost:8000/api/health
```

---

### Scenario 4: Kubernetes Deployment

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: misttracker-api
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: misttracker-api
  template:
    metadata:
      labels:
        app: misttracker-api
    spec:
      containers:
      - name: api
        image: misttracker-api:2.0.0
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: results
          mountPath: /app/phase-17-output
      volumes:
      - name: results
        persistentVolumeClaim:
          claimName: misttracker-results
---
apiVersion: v1
kind: Service
metadata:
  name: misttracker-api
spec:
  selector:
    app: misttracker-api
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: misttracker-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: misttracker-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Deploy to cluster**:
```bash
kubectl apply -f deployment.yaml
kubectl get pods -l app=misttracker-api
kubectl logs -l app=misttracker-api -f
```

---

## Production Hardening

### 1. Authentication & Authorization

```python
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from fastapi import Depends

security = HTTPBearer()

async def verify_api_key(credentials: HTTPAuthCredentials = Depends(security)):
    if credentials.credentials != os.getenv("API_KEY"):
        raise HTTPException(status_code=403, detail="Invalid API key")
    return credentials.credentials

@app.post("/api/analyze")
async def submit_analysis(
    request: AnalysisRequest,
    api_key: str = Depends(verify_api_key)
):
    # Protected endpoint
    ...
```

### 2. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/analyze")
@limiter.limit("10/minute")
async def submit_analysis(request: AnalysisRequest):
    ...
```

### 3. HTTPS/TLS

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Run with HTTPS
uvicorn phase_2_api_server:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem
```

### 4. Reverse Proxy (Nginx)

```nginx
upstream misttracker_api {
    server localhost:8000;
    server localhost:8001;
    server localhost:8002;
}

server {
    listen 80;
    server_name api.misttracker.com;

    client_max_body_size 100M;

    location /api/ {
        proxy_pass http://misttracker_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    location /api/docs {
        proxy_pass http://misttracker_api/api/docs;
    }
}

limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

---

## Performance Tuning

### 1. Worker Processes

For CPU-bound analysis:
```bash
# Gunicorn with 4 workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker phase_2_api_server:app
```

### 2. Async Database Connection Pool

```python
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://user:password@localhost/misttracker"

async_engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    echo=False
)
```

### 3. Result Caching

```python
from functools import lru_cache
import aioredis

redis = aioredis.from_url("redis://localhost")

@app.get("/api/results/{job_id}")
async def get_job_results(job_id: str):
    # Check cache first
    cached = await redis.get(f"results:{job_id}")
    if cached:
        return json.loads(cached)
    
    # Fetch from storage
    result = job_store[job_id]["result"]
    
    # Cache for 1 hour
    await redis.setex(f"results:{job_id}", 3600, json.dumps(result))
    
    return result
```

---

## Monitoring & Observability

### 1. Prometheus Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

job_submissions = Counter("misttracker_jobs_submitted_total", "Total jobs submitted")
job_duration = Histogram("misttracker_job_duration_seconds", "Job execution time")
active_jobs = Gauge("misttracker_active_jobs", "Currently running jobs")

@app.post("/api/analyze")
async def submit_analysis(request: AnalysisRequest):
    job_submissions.inc()
    active_jobs.inc()
    ...
```

### 2. Structured Logging

```python
import logging
import json

# Configure JSON logging
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(message)s'))

logger = logging.getLogger()
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Log events
logger.info(json.dumps({
    "event": "analysis_started",
    "job_id": job_id,
    "domain": domain,
    "timestamp": datetime.utcnow().isoformat()
}))
```

### 3. Distributed Tracing

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

jaeger_exporter = JaegerExporter(agent_host_name="localhost", agent_port=6831)
trace.set_tracer_provider(TracerProvider())
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(jaeger_exporter))

tracer = trace.get_tracer(__name__)

@app.post("/api/analyze")
async def submit_analysis(request: AnalysisRequest):
    with tracer.start_as_current_span("submit_analysis") as span:
        span.set_attribute("domain", request.domain.value)
        ...
```

---

## Troubleshooting

### Issue: Port 8000 already in use
```bash
# Find process using port 8000
lsof -i :8000  # Linux/macOS
netstat -ano | findstr :8000  # Windows

# Kill process or use different port
python phase_2_api_server.py --port 8001
```

### Issue: Jobs timing out
```bash
# Increase timeout in config
PHASE_1_ANALYSIS_TIMEOUT_SECONDS=300  # 5 minutes
```

### Issue: Memory exhaustion
```bash
# Implement job result cleanup
# Delete results older than 24 hours
async def cleanup_old_results():
    import glob
    for file in glob.glob("phase-17-output/result_*.json"):
        age = datetime.utcnow() - datetime.fromtimestamp(os.path.getmtime(file))
        if age.days > 1:
            os.remove(file)
```

---

## Next Steps: Phase 2b & Beyond

### Phase 2b: Physics Refinement
- Implement domain-specific hypothesis refinement
- Add uncertainty quantification (Bayesian thresholds)
- Integrate expert feedback (heliophysicists, seismologists)

### Phase 2c: New Domains
- Magnetosphere (THEMIS, MMS data)
- Climate/weather oscillations
- Financial market cascades

### Phase 2d: Real-Time Monitoring Dashboard
- WebSocket-based live emergence signals
- Multi-domain correlation visualization
- Automated alert system

---

## Reference Materials

- **Phase 1 Architecture**: PHASE-1-ARCHITECTURE.md
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Uvicorn Guide**: https://www.uvicorn.org
- **Production Checklist**: DEPLOYMENT-CHECKLIST.md

---

**Status**: Phase 2a Infrastructure Ready for Deployment ✅  
**API Version**: 2.0.0  
**Last Updated**: April 21, 2026
