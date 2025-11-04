# DeepEval Projects - Backend Setup Guide

This document explains the backend implementation for DeepEval Projects and how to get it running.

## What Was Implemented

### 1. Database Schema (`deepeval_projects` table)

Created a new PostgreSQL table with the following structure:

- `id` (VARCHAR): Unique project identifier
- `name` (VARCHAR): Project name
- `description` (TEXT): Project description
- `model` (JSONB): Model configuration
- `dataset` (JSONB): Dataset configuration
- `metrics` (JSONB): Enabled metrics
- `metric_thresholds` (JSONB): Metric thresholds
- `tenant` (VARCHAR): Tenant ID for multi-tenancy
- `created_at`, `updated_at` (TIMESTAMP): Timestamps
- `created_by` (VARCHAR): Creator identifier

### 2. Database Migration

**File**: `src/database/migrations/versions/9f84d27a3b1c_create_deepeval_projects_table.py`

Creates the `deepeval_projects` table with indexes for efficient querying.

### 3. Model

**File**: `src/models/DeepEvalProject.py`

Defines the Python model for DeepEval projects.

### 4. CRUD Operations

**File**: `src/crud/deepeval_projects.py`

Implements database operations:

- `create_project()`: Create new project
- `get_all_projects()`: Get all projects for a tenant
- `get_project_by_id()`: Get specific project
- `update_project()`: Update project configuration
- `delete_project()`: Delete project

### 5. Controllers

**File**: `src/controllers/deepeval_projects.py`

Implements business logic for:

- Creating projects with auto-generated IDs
- Fetching projects (all or by ID)
- Updating project configurations
- Deleting projects
- Getting project statistics

### 6. API Routes

**File**: `src/routers/deepeval_projects.py`

Exposes REST API endpoints:

- `POST /deepeval/projects` - Create project
- `GET /deepeval/projects` - List all projects
- `GET /deepeval/projects/{project_id}` - Get project by ID
- `PUT /deepeval/projects/{project_id}` - Update project
- `DELETE /deepeval/projects/{project_id}` - Delete project
- `GET /deepeval/projects/{project_id}/stats` - Get project stats

## How to Run

### 1. Activate Virtual Environment

```bash
cd /Users/efeacar/verifywise/BiasAndFairnessServers
source venv/bin/activate  # or 'use venv' if you have a custom alias
```

### 2. Run Database Migrations

The migrations should run automatically when the app starts, but you can also run them manually:

```bash
cd src
alembic upgrade head
```

If you encounter issues, you can check the current migration status:

```bash
alembic current
alembic history
```

### 3. Start the Server

```bash
cd src
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 4. Verify the Endpoints

Test the API endpoints:

```bash
# Create a project
curl -X POST http://localhost:8000/deepeval/projects \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -d '{
    "name": "Test Project",
    "description": "My first project",
    "model": {
      "name": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
      "provider": "huggingface",
      "generation": {
        "maxTokens": 500,
        "temperature": 0.7,
        "topP": 0.9
      }
    },
    "dataset": {
      "useBuiltin": true,
      "limit": 10
    },
    "metrics": {
      "answerRelevancy": true,
      "bias": true,
      "toxicity": true
    },
    "metricThresholds": {
      "answerRelevancy": 0.5,
      "bias": 0.5,
      "toxicity": 0.5
    }
  }'

# Get all projects
curl http://localhost:8000/deepeval/projects \
  -H "x-tenant-id: default"
```

## Environment Requirements

Make sure your `.env` file has the database connection string:

```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/database_name
```

## Troubleshooting

### Migration Issues

If the migration doesn't run automatically:

1. Check that the database connection is working
2. Manually run: `alembic upgrade head`
3. Check for any schema conflicts

### 404 Errors

If you're getting 404 errors:

1. Verify the server is running on port 8000
2. Check that the routes are registered in `app.py`
3. Check the frontend is pointing to the correct URL (should be `http://localhost:8000/api/deepeval/projects`)

### Database Schema Issues

If you need to create the schema manually for the default tenant:

```sql
CREATE SCHEMA IF NOT EXISTS "a4ayc80OGd";
```

## Multi-Tenancy Support

The implementation supports multi-tenancy through:

- `x-tenant-id` header in requests
- Schema-based isolation (each tenant has its own schema)
- The default tenant uses schema `"a4ayc80OGd"`

## Next Steps

1. **Run the migrations** to create the `deepeval_projects` table
2. **Start the backend server**
3. **Test with the frontend** - the frontend should now be able to create and list projects
4. **Implement experiments** - Next phase would be to add experiment execution functionality

## API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

This provides interactive API documentation for all endpoints.
