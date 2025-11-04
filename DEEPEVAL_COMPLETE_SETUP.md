# DeepEval Projects - Complete Setup Guide

## 🎉 What Has Been Implemented

### Backend (BiasAndFairnessServers)

✅ **Database Table**: `deepeval_projects`

- Stores project configurations with JSONB fields for flexibility
- Multi-tenant support via schema isolation
- Indexed for efficient querying

✅ **Migration**: `9f84d27a3b1c_create_deepeval_projects_table.py`

- Creates table structure
- Adds necessary indexes

✅ **CRUD Operations**: `src/crud/deepeval_projects.py`

- Create, Read, Update, Delete operations
- Full database integration

✅ **Controllers**: `src/controllers/deepeval_projects.py`

- Business logic layer
- Error handling and validation

✅ **API Endpoints**: `src/routers/deepeval_projects.py`

- `POST /deepeval/projects` - Create project
- `GET /deepeval/projects` - List all projects
- `GET /deepeval/projects/{id}` - Get project details
- `PUT /deepeval/projects/{id}` - Update project
- `DELETE /deepeval/projects/{id}` - Delete project
- `GET /deepeval/projects/{id}/stats` - Get statistics

### Frontend (Clients)

✅ **API Service**: `deepEvalProjectsService.ts`

- TypeScript service for backend communication

✅ **UI Components**:

- `EvalsDashboard.tsx` - Main dashboard with tabs
- `ProjectsList.tsx` - Project grid with create modal (simplified to name + description)
- `ProjectOverview.tsx` - Project metrics and stats
- `ProjectExperiments.tsx` - Experiment runs table
- `ProjectMonitor.tsx` - Real-time monitoring
- `ProjectConfiguration.tsx` - Project settings
- `PerformanceChart.tsx` - Metrics visualization

✅ **Routing**:

- `/evals` - Projects list
- `/evals/:projectId` - Project dashboard with tabs

✅ **Proxy Configuration**:

- Vite dev server now proxies `/api/deepeval` to `localhost:8000`

## 🚀 How to Start Everything

### Step 1: Start the BiasAndFairnessServers Backend

```bash
# Navigate to the backend directory
cd /Users/efeacar/verifywise/BiasAndFairnessServers

# Activate virtual environment
source venv/bin/activate  # or 'use venv' if you have an alias

# Run migrations (if not done automatically)
cd src
alembic upgrade head

# Start the server
python app.py
# OR using uvicorn
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The backend should now be running on **http://localhost:8000**

### Step 2: Start the Frontend

```bash
# Navigate to the frontend directory
cd /Users/efeacar/verifywise/Clients

# Install dependencies (if not done already)
npm install

# Install the chart library
npm install recharts

# Start the dev server
npm run dev
```

The frontend should now be running on **http://localhost:5173**

### Step 3: Verify Everything Works

1. **Open the frontend**: Navigate to http://localhost:5173/evals
2. **Check the backend**: Visit http://localhost:8000/docs for API documentation
3. **Create a test project**: Click "+ Create Project" in the frontend
4. **Fill in the form**:
   - Project Name: "Test Project"
   - Description: "My first DeepEval project"
5. **Click "Create Project"**
6. **Verify the project appears in the list**

## 🔍 Testing the API Directly

You can also test the backend API directly:

```bash
# Create a project
curl -X POST http://localhost:8000/deepeval/projects \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -d '{
    "name": "CLI Test Project",
    "description": "Testing via cURL",
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

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────┐
│        Frontend (localhost:5173)            │
│  React + TypeScript + Material-UI          │
│                                             │
│  Pages:                                     │
│  - /evals (ProjectsList)                   │
│  - /evals/:id (EvalsDashboard)            │
│    ├─ Overview Tab                         │
│    ├─ Experiments Tab                      │
│    ├─ Monitor Tab                          │
│    └─ Configuration Tab                    │
└──────────────────┬──────────────────────────┘
                   │ HTTP Requests
                   │ /api/deepeval/*
                   ↓ (Proxied by Vite)
┌─────────────────────────────────────────────┐
│    BiasAndFairnessServers (port 8000)      │
│         FastAPI Backend                     │
│                                             │
│  Routers:                                   │
│  - /deepeval/projects (CRUD)               │
│                                             │
│  Controllers:                               │
│  - deepeval_projects.py                    │
│                                             │
│  CRUD:                                      │
│  - deepeval_projects.py                    │
│                                             │
│  Models:                                    │
│  - DeepEvalProject.py                      │
└──────────────────┬──────────────────────────┘
                   │ SQL Queries
                   ↓
┌─────────────────────────────────────────────┐
│          PostgreSQL Database                │
│                                             │
│  Schema: a4ayc80OGd (default tenant)       │
│                                             │
│  Table: deepeval_projects                  │
│  - id (VARCHAR)                            │
│  - name (VARCHAR)                          │
│  - description (TEXT)                      │
│  - model (JSONB)                           │
│  - dataset (JSONB)                         │
│  - metrics (JSONB)                         │
│  - metric_thresholds (JSONB)               │
│  - tenant (VARCHAR)                        │
│  - created_at, updated_at (TIMESTAMP)      │
│  - created_by (VARCHAR)                    │
└─────────────────────────────────────────────┘
```

## 🔧 Key Configuration Files

### Backend

- `BiasAndFairnessServers/src/app.py` - FastAPI app with router registration
- `BiasAndFairnessServers/src/routers/deepeval_projects.py` - API endpoints
- `BiasAndFairnessServers/src/controllers/deepeval_projects.py` - Business logic
- `BiasAndFairnessServers/src/crud/deepeval_projects.py` - Database operations
- `BiasAndFairnessServers/src/database/migrations/versions/9f84d27a3b1c_*.py` - Migration

### Frontend

- `Clients/vite.config.ts` - Proxy configuration (NEW!)
- `Clients/src/infrastructure/api/deepEvalProjectsService.ts` - API service
- `Clients/src/presentation/pages/EvalsDashboard/*` - UI components
- `Clients/src/application/config/routes.tsx` - Routing configuration
- `Clients/src/presentation/components/Sidebar/index.tsx` - Navigation

## 🐛 Troubleshooting

### 404 Errors on API Calls

**Problem**: Console shows `404 Not Found` for `/api/deepeval/projects`

**Solutions**:

1. **Verify backend is running**: Check http://localhost:8000/docs
2. **Verify frontend proxy is working**: Restart the Vite dev server (`npm run dev`)
3. **Check the database migration ran**:
   ```bash
   cd BiasAndFairnessServers/src
   alembic current
   ```
   Should show: `9f84d27a3b1c (head)`

### Backend Won't Start

**Problem**: Backend crashes on startup

**Solutions**:

1. **Check database connection**: Verify `DATABASE_URL` in `.env`
2. **Check port 8000 is free**: `lsof -i :8000`
3. **Check Python dependencies**: `pip install -r requirements.txt`

### Frontend Shows Empty Project List

**Problem**: No projects show up even after creating one

**Solutions**:

1. **Check browser console for errors**
2. **Verify the API call succeeded** (check Network tab in DevTools)
3. **Check the backend logs** for any errors
4. **Verify the database has data**:
   ```sql
   SELECT * FROM "a4ayc80OGd".deepeval_projects;
   ```

### Migration Errors

**Problem**: Migration fails with "table already exists"

**Solution**:

```bash
# Check current migration state
alembic current

# If needed, stamp the database to the latest version
alembic stamp head

# Or drop and recreate (CAUTION: destroys data)
# DROP TABLE IF EXISTS deepeval_projects CASCADE;
# alembic upgrade head
```

## 📝 Next Steps

Now that the basic infrastructure is in place, you can:

1. **Test project creation** - Create several projects via the UI
2. **Implement experiment execution** - Add the ability to run DeepEval experiments
3. **Add results storage** - Create a table for storing experiment results
4. **Build the metrics dashboard** - Connect real data to the overview charts
5. **Add experiment monitoring** - Implement real-time updates for running experiments

## 🎯 Quick Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173
- [ ] Database migration completed (`alembic upgrade head`)
- [ ] Can access http://localhost:5173/evals
- [ ] Can create a new project via UI
- [ ] Project appears in the list after creation
- [ ] Can view project details by clicking "Open"
- [ ] All tabs (Overview, Experiments, Monitor, Configuration) load without errors

## 🎉 Success!

If all the above steps work, you've successfully set up the DeepEval Projects feature! The frontend can now create, list, update, and delete projects, all persisted in the PostgreSQL database.

For more details on the backend implementation, see `BiasAndFairnessServers/DEEPEVAL_SETUP.md`.
