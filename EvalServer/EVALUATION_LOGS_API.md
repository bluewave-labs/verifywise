# Evaluation Logs & Monitoring API Documentation

## Overview

This module provides comprehensive logging, metrics tracking, and monitoring capabilities for LLM evaluations.

---

## Database Schema

### Tables

#### `evaluation_logs`

Stores individual model interactions and requests.

```sql
CREATE TABLE evaluation_logs (
    id UUID PRIMARY KEY,
    project_id VARCHAR NOT NULL,
    experiment_id VARCHAR,
    trace_id UUID,
    parent_trace_id UUID,
    span_name VARCHAR,
    input_text TEXT,
    output_text TEXT,
    model_name VARCHAR,
    metadata JSONB,
    latency_ms INTEGER,
    token_count INTEGER,
    cost NUMERIC(10, 6),
    status VARCHAR,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    tenant VARCHAR NOT NULL,
    created_by INTEGER
);
```

#### `evaluation_metrics`

Time-series metrics data for performance tracking.

```sql
CREATE TABLE evaluation_metrics (
    id UUID PRIMARY KEY,
    project_id VARCHAR NOT NULL,
    experiment_id VARCHAR,
    metric_name VARCHAR NOT NULL,
    metric_type VARCHAR NOT NULL,
    value FLOAT NOT NULL,
    dimensions JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    tenant VARCHAR NOT NULL
);
```

#### `experiments`

Evaluation run configurations and results.

```sql
CREATE TABLE experiments (
    id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    baseline_experiment_id VARCHAR,
    status VARCHAR DEFAULT 'pending',
    results JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    tenant VARCHAR NOT NULL,
    created_by INTEGER
);
```

---

## API Endpoints

### Logs

#### Create Log

```http
POST /deepeval/logs
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "string",
  "experiment_id": "string",
  "input": "string",
  "output": "string",
  "model_name": "string",
  "latency_ms": 1250,
  "token_count": 150,
  "cost": 0.0025,
  "status": "success"
}
```

#### Get Logs

```http
GET /deepeval/logs?project_id={id}&limit=100&offset=0
Authorization: Bearer <token>
```

Query Parameters:

- `project_id` (optional): Filter by project
- `experiment_id` (optional): Filter by experiment
- `trace_id` (optional): Filter by trace
- `status` (optional): Filter by status (success, error, pending)
- `start_date` (optional): ISO datetime string
- `end_date` (optional): ISO datetime string
- `limit` (default: 100, max: 1000)
- `offset` (default: 0)

#### Get Log by ID

```http
GET /deepeval/logs/{log_id}
Authorization: Bearer <token>
```

#### Get Trace Logs

```http
GET /deepeval/logs/trace/{trace_id}
Authorization: Bearer <token>
```

---

### Metrics

#### Create Metric

```http
POST /deepeval/metrics
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "string",
  "metric_name": "latency",
  "metric_type": "performance",
  "value": 1250.5
}
```

#### Get Metrics

```http
GET /deepeval/metrics?project_id={id}&metric_name=latency
Authorization: Bearer <token>
```

Query Parameters:

- `project_id` (optional)
- `experiment_id` (optional)
- `metric_name` (optional)
- `metric_type` (optional): performance, quality, system
- `start_date` (optional)
- `end_date` (optional)
- `limit` (default: 1000, max: 10000)

#### Get Metric Aggregates

```http
GET /deepeval/metrics/aggregates?project_id={id}&metric_name=latency
Authorization: Bearer <token>
```

Response:

```json
{
  "metric_name": "latency",
  "aggregates": {
    "average": 1250.5,
    "min": 500.0,
    "max": 3000.0,
    "count": 150
  }
}
```

---

### Experiments

#### Create Experiment

```http
POST /deepeval/experiments
Content-Type: application/json
Authorization: Bearer <token>

{
  "project_id": "string",
  "name": "string",
  "description": "string",
  "config": {
    "model": {...},
    "dataset": {...},
    "metrics": {...}
  }
}
```

#### Get Experiments

```http
GET /deepeval/experiments?project_id={id}&status=completed
Authorization: Bearer <token>
```

#### Get Experiment by ID

```http
GET /deepeval/experiments/{experiment_id}
Authorization: Bearer <token>
```

#### Update Experiment Status

```http
PUT /deepeval/experiments/{experiment_id}/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "completed",
  "results": {
    "scores": {...}
  }
}
```

#### Delete Experiment

```http
DELETE /deepeval/experiments/{experiment_id}
Authorization: Bearer <token>
```

---

### Monitoring

#### Get Dashboard Data

```http
GET /deepeval/projects/{project_id}/monitor/dashboard
Authorization: Bearer <token>
```

Query Parameters:

- `start_date` (optional): ISO datetime
- `end_date` (optional): ISO datetime

Response:

```json
{
  "project_id": "string",
  "time_range": {
    "start": "2025-01-05T00:00:00Z",
    "end": "2025-01-05T23:59:59Z"
  },
  "metrics": {
    "latency": {
      "average": 1250.5,
      "min": 500.0,
      "max": 3000.0,
      "count": 150
    },
    "token_count": {...},
    "cost": {...},
    "score_average": {...}
  },
  "logs": {
    "total": 150,
    "success": 145,
    "error": 5,
    "error_rate": 3.33
  },
  "recent_experiments": [...]
}
```

---

## Python Usage Examples

### Using CRUD Functions

```python
from sqlalchemy.orm import Session
from crud import evaluation_logs as crud

# Create a log
log = crud.create_log(
    db=db,
    project_id="project_123",
    tenant="tenant_abc",
    input_text="User prompt",
    output_text="Model response",
    model_name="gpt-4",
    latency_ms=1250,
    token_count=150,
    cost=0.0025,
    status="success"
)

# Get logs with filtering
logs = crud.get_logs(
    db=db,
    tenant="tenant_abc",
    project_id="project_123",
    status="success",
    limit=100
)

# Create a metric
metric = crud.create_metric(
    db=db,
    project_id="project_123",
    metric_name="latency",
    metric_type="performance",
    value=1250.5,
    tenant="tenant_abc"
)

# Get metric aggregates
aggregates = crud.get_metric_aggregates(
    db=db,
    tenant="tenant_abc",
    project_id="project_123",
    metric_name="latency"
)
```

---

## Distributed Tracing

Logs support distributed tracing for tracking complex evaluation flows:

```python
import uuid

# Create parent trace
parent_trace_id = uuid.uuid4()

# Log main request
crud.create_log(
    db=db,
    project_id="project_123",
    tenant="tenant_abc",
    trace_id=parent_trace_id,
    span_name="evaluation_run",
    input_text="prompt",
    output_text="response",
    status="success"
)

# Log child spans
crud.create_log(
    db=db,
    project_id="project_123",
    tenant="tenant_abc",
    trace_id=parent_trace_id,
    parent_trace_id=parent_trace_id,
    span_name="model_inference",
    latency_ms=1000,
    status="success"
)

crud.create_log(
    db=db,
    project_id="project_123",
    tenant="tenant_abc",
    trace_id=parent_trace_id,
    parent_trace_id=parent_trace_id,
    span_name="scoring",
    latency_ms=250,
    status="success"
)

# Retrieve entire trace
trace_logs = crud.get_trace_logs(db, parent_trace_id, "tenant_abc")
```

---

## Migrations

### Run Migrations

```bash
cd EvalServer/src
alembic upgrade head
```

### Create New Migration

```bash
alembic revision -m "description"
```

### Rollback

```bash
alembic downgrade -1
```

---

## Testing

### Unit Tests

```bash
pytest tests/test_evaluation_logs.py
```

### Integration Tests

```bash
# Start test database
docker-compose up -d postgres

# Run tests
pytest tests/integration/test_logs_api.py
```

---

## Performance Considerations

### Indexing

All common query fields are indexed:

- `project_id`
- `experiment_id`
- `trace_id`
- `timestamp`
- `tenant`
- `metric_name`
- `status`

### Query Optimization

- Use pagination (limit/offset) for large result sets
- Filter by `project_id` and `tenant` to leverage indexes
- Use date ranges to limit time-series queries
- Consider adding composite indexes for frequent query patterns

### Scaling

- Metrics table can grow large - consider partitioning by timestamp
- Archive old logs after retention period
- Use read replicas for analytics queries

---

## Security

### Authentication

All endpoints require JWT authentication via `get_current_user_context()` middleware.

### Multi-tenancy

All queries are automatically filtered by `tenant` to ensure data isolation.

### Rate Limiting

Consider adding rate limiting for high-volume logging:

```python
# In middleware
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/deepeval/logs")
@limiter.limit("100/minute")
async def create_log(...):
    ...
```

---

## Monitoring the Monitor

### Health Check

```http
GET /deepeval/health
```

### Database Connection Pool

Monitor connection pool usage in production:

```python
# In app startup
from sqlalchemy import event
from sqlalchemy.pool import Pool

@event.listens_for(Pool, "connect")
def receive_connect(dbapi_conn, connection_record):
    logger.info("Database connection established")
```

---

## Troubleshooting

### High Database Load

- Add indexes for custom query patterns
- Implement caching for aggregate queries
- Use batch inserts for multiple logs/metrics

### Slow Queries

- Check `EXPLAIN ANALYZE` output
- Ensure indexes are being used
- Consider materialized views for complex aggregations

### Memory Issues

- Implement pagination for all list endpoints
- Limit result set sizes
- Use streaming for large exports

---

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Bulk log insertion endpoint
- [ ] Export to external monitoring (Prometheus, Datadog)
- [ ] Alert configuration and triggering
- [ ] Log retention policies
- [ ] Time-series optimization (TimescaleDB)

---

**Last Updated:** January 5, 2025
