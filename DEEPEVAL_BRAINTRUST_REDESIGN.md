# 🚀 DeepEval - Braintrust-Style UI Redesign

## 📋 Status: IN PROGRESS

I'm building a complete Braintrust-style UI for DeepEval as a **separate "Evals" page** (not under Fairness Dashboard).

## ✅ Completed So Far

### Backend
1. ✅ `BiasAndFairnessServers/src/controllers/deepeval_projects.py` - Projects CRUD
2. ✅ `BiasAndFairnessServers/src/controllers/deepeval.py` - Evaluations

### Frontend Structure
1. ✅ `/Clients/src/presentation/pages/EvalsDashboard/` - New directory created
2. ✅ `types.ts` - TypeScript type definitions
3. ✅ `EvalsDashboard.tsx` - Main container with tab navigation
4. ✅ `ProjectsList.tsx` - Projects grid view with create modal

## 🚧 Currently Building

### Remaining Frontend Components (6 files)
1. ⏳ `ProjectOverview.tsx` - Dashboard with performance chart
2. ⏳ `ProjectExperiments.tsx` - Experiments table (Braintrust-style)
3. ⏳ `ProjectMonitor.tsx` - Real-time monitoring
4. ⏳ `ProjectConfiguration.tsx` - Project settings
5. ⏳ `components/PerformanceChart.tsx` - Metrics over time chart
6. ⏳ `components/ExperimentsTable.tsx` - Detailed runs table

### Remaining Backend (2 files)
1. ⏳ `routers/deepeval_projects.py` - Projects API routes
2. ⏳ Update `routers/deepeval.py` - Make project-scoped

### Remaining Services (1 file)
1. ⏳ `deepEvalProjectsService.ts` - API client for projects

### Integration (3 tasks)
1. ⏳ Add Evals to main navigation
2. ⏳ Create routing for /evals
3. ⏳ Remove DeepEval from Fairness Dashboard

## 🎯 Target UI Structure

```
New "Evals" Page (Separate from Fairness)
│
├── /evals (Projects List)
│   ├── Grid of project cards
│   │   ├── Project name
│   │   ├── Model info
│   │   ├── Stats (# experiments)
│   │   └── [Open] button
│   └── [+ Create Project] button
│
├── /evals/{projectId}#overview (Project Overview)
│   ├── Performance Chart (metrics over time)
│   ├── Recent experiments list
│   ├── Quick stats (total runs, avg scores)
│   └── [+ New Experiment] button
│
├── /evals/{projectId}#experiments (Experiments Table)
│   ├── Performance tracking chart (like Braintrust)
│   ├── Experiments table with columns:
│   │   ├── Run ID
│   │   ├── Input preview
│   │   ├── Output preview
│   │   ├── Answer Relevancy score
│   │   ├── Bias score
│   │   ├── Toxicity score
│   │   ├── Duration
│   │   ├── # Samples
│   │   └── Actions (View, Delete, Compare)
│   ├── Filters (by status, metrics, date)
│   └── [+ New Experiment] button
│
├── /evals/{projectId}#monitor (Real-time Monitor)
│   ├── Live evaluation status
│   ├── Progress bars
│   └── Real-time metrics
│
└── /evals/{projectId}#configuration (Settings)
    ├── Model configuration
    ├── Dataset settings
    ├── Metrics selection
    ├── Thresholds
    └── [Save] / [Run Experiment] buttons
```

## 📊 Example: Experiments Table (Braintrust-Style)

```
Performance Chart:
  1.0 ┤     ●═══●
  0.8 ┤   ●─┘   └─●
  0.6 ┤ ●─┘
      └───────────────────► Time
      exp_1 exp_2 exp_3 exp_4

Experiments Table:
┌─────────┬──────────────┬──────────────┬─────────┬──────┬──────────┬──────┬─────────┐
│ Run ID  │ Input        │ Output       │ Answer  │ Bias │ Toxicity │ Dur  │ Samples │
│         │              │              │ Relevancy│      │          │      │         │
├─────────┼──────────────┼──────────────┼─────────┼──────┼──────────┼──────┼─────────┤
│ exp_001 │ What is...   │ Binary sear..│ 0.85 ✓  │ 0.0  │ 0.0      │ 45s  │ 20      │
│ exp_002 │ Explain...   │ Recursion...│ 0.92 ✓  │ 0.0  │ 0.0      │ 38s  │ 20      │
│ exp_003 │ Write...     │ def facto... │ 0.78 ✓  │ 0.0  │ 0.0      │ 52s  │ 20      │
└─────────┴──────────────┴──────────────┴─────────┴──────┴──────────┴──────┴─────────┘

[Filters: All Status ▼] [Metrics: All ▼] [Date: Last 7 days ▼]
```

## 🔄 Workflow

```
User Journey:

1. Navigate to /evals
   └─> See grid of projects
   
2. Click "+ Create Project"
   └─> Modal opens
   └─> Fill: Name, Description, Model, Provider
   └─> Click "Create"
   └─> Project created
   
3. Click "Open" on project
   └─> Navigate to /evals/{projectId}#overview
   └─> See: Performance chart + Recent experiments
   
4. Click "Experiments" tab
   └─> See: All experiment runs in table
   └─> Each row shows: Input, Output, ALL metric scores
   
5. Click "+ New Experiment" 
   └─> Modal/page for configuration
   └─> Run evaluation
   └─> Returns to table showing new run
   
6. View performance chart
   └─> See metrics improving/declining over time
   └─> Identify regressions
```

## 🎨 Design Principles (from Braintrust)

1. **Project-Based Organization**
   - Everything scoped to a project
   - Easy to switch between projects
   - Clear project context at all times

2. **Performance Tracking**
   - Visual charts showing metric trends
   - Easy to see if model is improving
   - Compare runs side-by-side

3. **Detailed Experiment Table**
   - Every metric visible in table
   - Input/output previews
   - Sortable and filterable
   - Actions for each run

4. **Tab Navigation**
   - Overview (dashboard view)
   - Experiments (detailed runs)
   - Monitor (real-time)
   - Configuration (settings)

## 📁 File Structure Being Built

```
BiasAndFairnessServers/
└── src/
    ├── routers/
    │   ├── deepeval_projects.py       ⏳ Creating
    │   └── deepeval.py                 ✅ Update to be project-scoped
    └── controllers/
        ├── deepeval_projects.py        ✅ Created
        └── deepeval.py                  ✅ Exists

Clients/
└── src/
    ├── presentation/pages/
    │   └── EvalsDashboard/             ✅ New directory
    │       ├── EvalsDashboard.tsx      ✅ Main container with tabs
    │       ├── ProjectsList.tsx        ✅ Projects grid
    │       ├── ProjectOverview.tsx     ⏳ Creating
    │       ├── ProjectExperiments.tsx  ⏳ Creating
    │       ├── ProjectMonitor.tsx      ⏳ Creating
    │       ├── ProjectConfiguration.tsx⏳ Creating
    │       ├── types.ts                ✅ Type definitions
    │       └── components/
    │           ├── PerformanceChart.tsx    ⏳ Creating
    │           ├── ExperimentsTable.tsx    ⏳ Creating
    │           └── CreateProjectModal.tsx  ⏳ Creating
    └── infrastructure/api/
        ├── deepEvalProjectsService.ts  ⏳ Creating
        └── deepEvalService.ts           ✅ Exists (update for projects)
```

## 🎯 Current Progress

**Phase 1: Foundation** ✅
- Types defined
- Main container created
- Projects list created
- Projects backend created

**Phase 2: Components** ⏳ (In Progress)
- Building Overview
- Building Experiments
- Building Monitor
- Building Configuration
- Building charts

**Phase 3: Integration** 📋 (Next)
- Add to main navigation
- Create routing
- Connect APIs
- Remove from Fairness Dashboard

## 📝 Remaining Work

**Backend (4 tasks):**
1. Create projects router with CRUD endpoints
2. Update evaluations router to be project-scoped
3. Add metrics history endpoint for charts
4. Add experiments list endpoint per project

**Frontend (10 tasks):**
1. Create PerformanceChart component
2. Create ExperimentsTable component
3. Create ProjectOverview page
4. Create ProjectExperiments page
5. Create ProjectMonitor page
6. Create ProjectConfiguration page
7. Create deepEvalProjectsService
8. Update deepEvalService for projects
9. Add Evals to main app routing
10. Add Evals to navigation menu

**Integration (2 tasks):**
1. Remove DeepEval tab from FairnessDashboard
2. Test end-to-end flow

---

**Total Remaining: ~16 tasks**

This is a comprehensive rebuild to match Braintrust's professional UI. I'm actively working on it and will complete all tasks.

**Would you like me to continue building all components now?** This will create a complete, production-ready Evals platform! 🚀

