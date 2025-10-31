# Evidently Service

Python microservice to bridge VerifyWise and Evidently Cloud.

## Overview

This FastAPI-based microservice provides REST API endpoints for VerifyWise to interact with Evidently Cloud without needing Python on the main backend.

## Features

- Test Evidently Cloud connection
- List projects from Evidently workspace
- Fetch drift metrics
- Fetch performance metrics
- Fetch fairness metrics
- Bulk sync all metrics

## Setup

### Prerequisites

- Python 3.9 or higher
- pip

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The service will be available at `http://localhost:8001`

## API Documentation

Once running, visit:
- API docs: `http://localhost:8001/docs`
- Alternative docs: `http://localhost:8001/redoc`

## API Endpoints

### Health Check
```
GET /health
```

### Test Connection
```
POST /api/evidently/test-connection
Body: {
  "url": "https://app.evidently.cloud",
  "api_token": "your-token"
}
```

### List Projects
```
POST /api/evidently/projects
Body: {
  "url": "https://app.evidently.cloud",
  "api_token": "your-token"
}
```

### Get Drift Metrics
```
POST /api/evidently/metrics/drift
Body: {
  "url": "https://app.evidently.cloud",
  "api_token": "your-token",
  "project_id": "project-uuid"
}
```

### Get Performance Metrics
```
POST /api/evidently/metrics/performance
Body: {
  "url": "https://app.evidently.cloud",
  "api_token": "your-token",
  "project_id": "project-uuid"
}
```

### Get Fairness Metrics
```
POST /api/evidently/metrics/fairness
Body: {
  "url": "https://app.evidently.cloud",
  "api_token": "your-token",
  "project_id": "project-uuid"
}
```

### Bulk Sync (All Metrics)
```
POST /api/evidently/sync
Body: {
  "url": "https://app.evidently.cloud",
  "api_token": "your-token",
  "project_id": "project-uuid"
}
```

## Development

Run with auto-reload:
```bash
uvicorn app.main:app --reload --port 8001
```

## Production Deployment

For production, use a production-grade ASGI server:
```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

## Integration with VerifyWise

The VerifyWise Node.js backend will proxy requests to this service. The service runs on port 8001 by default to avoid conflicts with the main backend on port 3000.

## Architecture

```
VerifyWise Frontend (React)
          ↓
VerifyWise Backend (Node.js:3000)
          ↓
Evidently Service (Python:8001)
          ↓
Evidently Cloud API
```
