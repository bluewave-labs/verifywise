# DeepEval UI Redesign - Braintrust Style

## 🎯 Goal

Build a Braintrust-like UI for DeepEval with project management, performance tracking, and detailed experiment runs.

## 📋 Current vs Target

### Current (Simple)

```
DeepEval Tab
├── Table of evaluations
└── Modal for configuration
```

### Target (Braintrust-Style)

```
DeepEval Section
├── Projects Tab
│   ├── Project list/grid
│   └── "+ Create Project" button
│
├── Overview Tab (per project)
│   ├── Performance chart (metrics over time)
│   ├── Recent experiments list
│   └── Quick stats
│
├── Experiments Tab (per project)
│   ├── Performance tracking chart
│   ├── Experiments table
│   │   ├── Run ID
│   │   ├── Input preview
│   │   ├── Output preview
│   │   ├── Metric scores (Answer Relevancy, Bias, Toxicity, etc.)
│   │   └── Actions (View, Delete, Compare)
│   └── "+ New Experiment" button
│
├── Monitor Tab (per project)
│   ├── Real-time metrics
│   └── Live evaluation status
│
└── Configuration Tab (per project)
    ├── Model settings
    ├── Dataset settings
    ├── Metrics configuration
    └── Thresholds
```

## 🏗️ Architecture

### 1. Data Model

```typescript
interface DeepEvalProject {
  id: string;
  name: string;
  description: string;
  model: {
    name: string;
    provider: string;
  };
  dataset: {
    categories: string[];
    limit: number;
  };
  metrics: string[];
  createdAt: string;
  updatedAt: string;
}

interface ExperimentRun {
  id: string;
  projectId: string;
  status: "pending" | "running" | "completed" | "failed";
  metrics: {
    answerRelevancy: number;
    bias: number;
    toxicity: number;
  };
  totalSamples: number;
  createdAt: string;
  completedAt?: string;
}
```

### 2. Component Structure

```
DeepEvalSection/
├── DeepEvalProjects.tsx          # Projects list/grid
├── DeepEvalOverview.tsx          # Overview dashboard
├── DeepEvalExperiments.tsx       # Experiments table + chart
├── DeepEvalMonitor.tsx           # Real-time monitoring
├── DeepEvalConfiguration.tsx     # Configuration form
├── components/
│   ├── ProjectCard.tsx           # Project card in grid
│   ├── CreateProjectModal.tsx    # Create project modal
│   ├── PerformanceChart.tsx      # Metrics over time chart
│   ├── ExperimentsTable.tsx      # Detailed runs table
│   └── MetricBadge.tsx           # Metric score display
└── DeepEvalDashboard.tsx         # Main container with tabs
```

### 3. Routing

```
/fairness → Fairness Dashboard
  ├── #bias → BiasAndFairnessModule
  └── #deepeval → DeepEval Dashboard
      ├── /projects → Projects list
      ├── /project/:id/overview → Project overview
      ├── /project/:id/experiments → Experiments runs
      ├── /project/:id/monitor → Real-time monitor
      └── /project/:id/configuration → Settings
```

### 4. API Additions

New endpoints needed:

```
Projects:
- POST   /deepeval/projects - Create project
- GET    /deepeval/projects - List all projects
- GET    /deepeval/projects/{id} - Get project
- PUT    /deepeval/projects/{id} - Update project
- DELETE /deepeval/projects/{id} - Delete project

Experiments (within project):
- POST   /deepeval/projects/{id}/experiments - Run experiment
- GET    /deepeval/projects/{id}/experiments - List experiments
- GET    /deepeval/projects/{id}/experiments/{run_id} - Get experiment
- GET    /deepeval/projects/{id}/metrics/history - Performance over time
```

## 📊 Key Features

### Performance Chart (like Braintrust)

- X-axis: Time (experiment runs)
- Y-axis: Metric scores (0-100%)
- Multiple lines: Answer Relevancy, Bias, Toxicity, etc.
- Shows trends over time

### Experiments Table

| Run ID  | Input      | Output           | Answer Relevancy | Bias | Toxicity | Duration | Samples |
| ------- | ---------- | ---------------- | ---------------- | ---- | -------- | -------- | ------- |
| exp_001 | What is... | Binary search... | 0.85             | 0.0  | 0.0      | 45s      | 20      |
| exp_002 | Explain... | Recursion is...  | 0.92             | 0.0  | 0.0      | 38s      | 20      |

### Project List

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Coding Eval    │  │ Math Questions │  │ General Q&A    │
│ 12 experiments │  │ 8 experiments  │  │ 5 experiments  │
│ Last run: 2h   │  │ Last run: 1d   │  │ Last run: 3d   │
│ [View Project] │  │ [View Project] │  │ [View Project] │
└────────────────┘  └────────────────┘  └────────────────┘

[+ Create New Project]
```

## 🎨 UI Mockup

### Projects Page

```
╔════════════════════════════════════════════════════╗
║ DeepEval Projects                [+ Create Project]║
╠════════════════════════════════════════════════════╣
║                                                     ║
║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐║
║  │ Coding Eval │  │ Math Eval   │  │ General Q&A │║
║  │             │  │             │  │             │║
║  │ 12 exp      │  │ 8 exp       │  │ 5 exp       │║
║  │ TinyLlama   │  │ GPT-4       │  │ TinyLlama   │║
║  │ [Open]      │  │ [Open]      │  │ [Open]      │║
║  └─────────────┘  └─────────────┘  └─────────────┘║
║                                                     ║
╚════════════════════════════════════════════════════╝
```

### Experiments Page (within project)

```
╔════════════════════════════════════════════════════╗
║ Coding Eval > Experiments        [+ New Experiment]║
╠════════════════════════════════════════════════════╣
║ Performance Chart                                   ║
║  1.0 ┤   ●────●────●                               ║
║  0.8 ┤  /    /    /                                ║
║  0.6 ┤ ●────●────●                                 ║
║      └─────────────────►                           ║
║      exp_001  exp_002  exp_003                     ║
║                                                     ║
╠════════════════════════════════════════════════════╣
║ Experiments Table                                   ║
║ ┌──────────────────────────────────────────────┐  ║
║ │ID│Input│Output│AnswerRel│Bias│Toxicity│Act│  ║
║ ├──┼─────┼──────┼─────────┼────┼────────┼───┤  ║
║ │01│What...│Binary...│0.85│0.0│0.0│👁️│  ║
║ │02│Explain...│Recurs...│0.92│0.0│0.0│👁️│  ║
║ └──────────────────────────────────────────────┘  ║
╚════════════════════════════════════════════════════╝
```

## 🚀 Implementation Plan

1. **Create Project Management**

   - Projects CRUD endpoints (backend)
   - Projects list page (frontend)
   - Create project modal (frontend)

2. **Create Performance Tracking**

   - Metrics history endpoint (backend)
   - Performance chart component (frontend)
   - Time-series data storage (backend)

3. **Redesign Experiments Page**

   - Experiments table with all metrics
   - Input/output previews
   - Comparison features
   - Filtering and sorting

4. **Add Tabs Navigation**

   - Overview
   - Experiments
   - Monitor
   - Configuration

5. **Build Overview Dashboard**
   - Performance summary
   - Recent runs
   - Quick stats

This will be a significant rebuild but will provide a much better UX!

## 📝 Next Steps

1. Build project management backend
2. Create projects UI
3. Add performance chart
4. Redesign experiments table
5. Add tab navigation
6. Build overview dashboard

**Estimated Files to Create/Modify:** ~15 files
**Complexity:** High (full redesign)
**Benefit:** Professional UI matching industry standards (Braintrust)

Ready to start building this?
