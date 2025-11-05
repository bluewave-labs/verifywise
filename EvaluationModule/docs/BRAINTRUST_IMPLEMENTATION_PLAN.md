# Braintrust-Style Implementation Plan for LLM Evaluations

## Overview

Based on [Braintrust's platform](https://www.braintrust.dev/docs), this plan outlines how to implement their key features into our LLM Evaluations module.

## Core Braintrust Features to Implement

### 1. **Projects & Organization** ✅ (Already Implemented)

- [x] Project-based organization
- [x] Create/manage multiple projects
- [x] Project descriptions and metadata

### 2. **Experiments** (Partially Implemented - Needs Enhancement)

**Current State:**

- ✅ Basic experiment configuration (model, dataset, judge LLM, metrics)
- ✅ 4-step wizard for creating evaluations

**Needs Implementation:**

- [ ] Experiment comparison view (side-by-side)
- [ ] Version control for experiments
- [ ] Experiment baselines and performance tracking
- [ ] Experiment tags and labels
- [ ] Quick experiment duplication/cloning

**Implementation Steps:**

1. Add `experiments` field to project schema
2. Create comparison table showing multiple experiment results
3. Add baseline selection feature
4. Implement experiment versioning with git-like diff view

---

### 3. **Datasets** (Partially Implemented - Needs Enhancement)

**Current State:**

- ✅ Built-in dataset with 11 prompts
- ✅ Editable prompts via UI
- ✅ Category and difficulty metadata

**Needs Implementation:**

- [ ] Dataset versioning (snapshots)
- [ ] Dataset import/export (JSON, CSV)
- [ ] Dataset sharing across projects
- [ ] Dataset statistics and analysis
- [ ] Custom dataset upload (currently placeholder)
- [ ] Dataset preview with filtering

**Implementation Steps:**

1. Create dataset management service
2. Add dataset version control (store snapshots on each eval run)
3. Implement CSV/JSON parser for uploads
4. Add dataset library view (shared datasets)
5. Build dataset analytics (token counts, category distribution)

---

### 4. **Logs & Observability** (Not Implemented - Priority)

**What Braintrust Offers:**

- Real-time logging of model interactions
- Trace entire conversation flows
- Link logs to specific experiments
- Filter and search logs
- Attach metadata to logs

**Implementation Plan:**

#### A. Backend (Python/FastAPI)

```python
# New endpoint structure
POST /api/deepeval/logs
GET  /api/deepeval/logs?project_id=xxx&filter=xxx
GET  /api/deepeval/logs/{log_id}/trace

# Database schema
CREATE TABLE evaluation_logs (
    id UUID PRIMARY KEY,
    project_id VARCHAR,
    experiment_id VARCHAR,
    timestamp TIMESTAMP,
    input TEXT,
    output TEXT,
    model_name VARCHAR,
    latency_ms INTEGER,
    token_count INTEGER,
    cost DECIMAL,
    metadata JSONB,
    trace_id UUID,
    parent_trace_id UUID
);
```

#### B. Frontend Components

- `LogsView.tsx` - Main logs table with filtering
- `LogDetails.tsx` - Detailed log viewer with trace visualization
- `TraceTimeline.tsx` - Waterfall chart for request tracing

---

### 5. **Monitor** (Not Implemented - High Priority)

**What Braintrust Offers:**

- Real-time metrics dashboard
- Alerts and notifications
- Performance trends over time
- Error rate tracking
- Latency percentiles (p50, p95, p99)

**Implementation Plan:**

#### A. Metrics to Track

1. **Performance Metrics:**

   - Average latency
   - Token usage per request
   - Cost per request
   - Throughput (requests/minute)

2. **Quality Metrics:**

   - Average scores per metric
   - Pass/fail rates
   - Bias detection frequency
   - Hallucination rate

3. **System Metrics:**
   - API availability
   - Error rates
   - Queue depth

#### B. Implementation Steps

1. Create time-series database schema (PostgreSQL with TimescaleDB or separate InfluxDB)
2. Build metrics aggregation service
3. Implement real-time dashboard with Recharts
4. Add alerting system (email/webhook notifications)
5. Create monitoring rules (e.g., "Alert if latency > 5s for 5 minutes")

---

### 6. **Playgrounds** (Not Implemented - Medium Priority)

**What Braintrust Offers:**

- Interactive prompt testing
- Compare multiple models side-by-side
- Save playground sessions as experiments
- Quick iteration on prompts

**Implementation Plan:**

#### A. UI Components

```typescript
interface PlaygroundConfig {
  models: Array<{
    id: string;
    provider: string;
    name: string;
  }>;
  prompt: string;
  temperature: number;
  maxTokens: number;
  systemMessage?: string;
}
```

#### B. Features

1. Split-screen multi-model comparison
2. Prompt templates library
3. Save playground to experiment
4. Variables in prompts (`{{user_name}}`)
5. Streaming responses

---

### 7. **Scorers & Autoevals** (Partially Implemented)

**Current State:**

- ✅ Answer Relevancy
- ✅ Bias Detection
- ✅ Toxicity
- ✅ Faithfulness
- ✅ Hallucination

**Braintrust Autoevals Scorers to Add:**
Based on their [autoevals documentation](https://www.braintrust.dev/docs/reference/autoevals):

#### A. Factuality & Correctness

- [ ] **Factuality** - Check if answer is factually correct
- [ ] **ClosedQA** - For multiple choice questions
- [ ] **SQL** - Validate SQL query correctness
- [ ] **JSON** - Validate JSON structure

#### B. Security & Safety

- [ ] **Moderation** - Content moderation (violence, hate speech)
- [ ] **PII Detection** - Detect personally identifiable information
- [ ] **Jailbreak Detection** - Detect prompt injection attempts

#### C. Context & Retrieval

- [ ] **ContextPrecision** - Quality of retrieved context
- [ ] **ContextRecall** - Coverage of retrieved context
- [ ] **ContextRelevancy** - Relevance of context to query

#### D. Reasoning & Logic

- [ ] **Reasoning** - Evaluate logical reasoning
- [ ] **Summary** - Quality of summarization
- [ ] **Translation** - Translation accuracy

#### E. Code Quality

- [ ] **Battle** - Compare two outputs
- [ ] **EmbeddingSimilarity** - Semantic similarity
- [ ] **LevenshteinDistance** - String similarity

**Implementation:**

```python
# Backend: Add new scorer classes
from deepeval.metrics import (
    FactualityMetric,
    ContextPrecisionMetric,
    ContextRecallMetric,
    SummarizationMetric,
    # ... etc
)

# Add scorer registry
SCORER_REGISTRY = {
    "factuality": FactualityMetric,
    "context_precision": ContextPrecisionMetric,
    "context_recall": ContextRecallMetric,
    # ... etc
}
```

```typescript
// Frontend: Update metrics configuration
const AVAILABLE_METRICS = [
  // Existing
  { id: "answerRelevancy", name: "Answer Relevancy", category: "Quality" },
  { id: "bias", name: "Bias Detection", category: "Safety" },

  // New Factuality
  { id: "factuality", name: "Factuality", category: "Correctness" },
  { id: "closedQA", name: "Closed Q&A", category: "Correctness" },

  // New Security
  { id: "moderation", name: "Content Moderation", category: "Safety" },
  { id: "piiDetection", name: "PII Detection", category: "Security" },
  { id: "jailbreak", name: "Jailbreak Detection", category: "Security" },

  // New Context
  { id: "contextPrecision", name: "Context Precision", category: "RAG" },
  { id: "contextRecall", name: "Context Recall", category: "RAG" },
  { id: "contextRelevancy", name: "Context Relevancy", category: "RAG" },

  // New Reasoning
  { id: "reasoning", name: "Reasoning Quality", category: "Logic" },
  { id: "summarization", name: "Summarization", category: "Quality" },
];
```

---

### 8. **Review & Annotations** (Not Implemented)

**What Braintrust Offers:**

- Manual review of outputs
- Thumbs up/down feedback
- Comments and annotations
- Label data for fine-tuning
- Team collaboration on reviews

**Implementation Plan:**

#### A. Database Schema

```sql
CREATE TABLE evaluation_reviews (
    id UUID PRIMARY KEY,
    evaluation_run_id VARCHAR,
    prompt_id VARCHAR,
    reviewer_user_id INTEGER,
    rating INTEGER, -- 1-5 or thumbs up/down
    comment TEXT,
    labels JSONB, -- ["correct", "needs_improvement"]
    created_at TIMESTAMP
);
```

#### B. UI Components

- Add review panel to experiment results
- Inline commenting on outputs
- Bulk labeling interface
- Review queue (unreviewed items)

---

### 9. **Tracing** (Not Implemented - High Priority)

**What Braintrust Offers:**

- Distributed tracing across services
- Span-based tracing (like OpenTelemetry)
- Link traces to experiments
- Visualize request waterfall

**Implementation Plan:**

#### A. Backend Integration

```python
from braintrust import traced, current_span

@traced
async def run_evaluation(config):
    span = current_span()
    span.log(input=config.prompt)

    # Call model
    with span.start_span(name="model_call") as model_span:
        output = await call_model(config)
        model_span.log(output=output, latency=model_span.elapsed())

    # Run scorers
    with span.start_span(name="scoring") as score_span:
        scores = await score_output(output, config)
        score_span.log(scores=scores)

    return output, scores
```

#### B. Frontend Visualization

- Trace waterfall chart (like Jaeger/Zipkin)
- Span details with logs
- Filter traces by performance, errors

---

### 10. **Automations** (Partially Implemented)

**Current State:**

- Basic evaluation runs

**Needs Implementation:**

- [ ] Scheduled evaluations (cron-like)
- [ ] Webhook triggers (on deployment, on data change)
- [ ] Auto-alerts (performance degradation)
- [ ] CI/CD integration
- [ ] Slack/Email notifications

**Implementation:**

```typescript
// Backend: Add automation rules
interface AutomationRule {
  id: string;
  projectId: string;
  trigger: "schedule" | "webhook" | "threshold";
  config: {
    schedule?: string; // cron expression
    webhookUrl?: string;
    condition?: string; // "score < 0.7"
  };
  action: {
    type: "run_evaluation" | "send_alert" | "webhook";
    config: any;
  };
}
```

---

### 11. **Functions** (Not Implemented)

**What Braintrust Offers:**

- Custom JavaScript/TypeScript functions for scorers
- Reusable scoring logic
- Function versioning
- Function testing

**Implementation Plan:**

#### A. Function Management

1. Create function library UI
2. Monaco editor for writing custom scorers
3. Function testing environment
4. Version control for functions

#### B. Example Custom Scorer

```typescript
// User-defined custom scorer
export function customSentimentScorer(output: string, expected: any) {
  // Custom logic
  const sentiment = analyzeSentiment(output);
  return {
    name: "Custom Sentiment",
    score: sentiment > 0.5 ? 1 : 0,
    metadata: { sentiment },
  };
}
```

---

### 12. **Access Control** (Partially Implemented)

**Current State:**

- Basic multi-tenancy
- JWT authentication

**Needs Implementation:**

- [ ] Role-based access (Viewer, Editor, Admin)
- [ ] Project-level permissions
- [ ] API key management
- [ ] Audit logs
- [ ] Team management

---

## Implementation Priority

### Phase 1: Core Evaluation (2-3 weeks) ✅ MOSTLY COMPLETE

- [x] Projects
- [x] Basic experiments
- [x] Dataset management
- [x] Initial scorers

### Phase 2: Monitoring & Observability (3-4 weeks) 🔴 HIGH PRIORITY

- [ ] Logs implementation
- [ ] Real-time monitoring dashboard
- [ ] Performance metrics
- [ ] Alerting system
- [ ] Tracing infrastructure

### Phase 3: Advanced Evaluation (2-3 weeks) 🟡 MEDIUM PRIORITY

- [ ] Expand scorer library (add 10+ new scorers)
- [ ] Experiment comparison
- [ ] Dataset versioning
- [ ] Playground feature

### Phase 4: Collaboration & Review (2 weeks) 🟢 LOWER PRIORITY

- [ ] Review & annotations
- [ ] Team features
- [ ] Automations
- [ ] Custom functions

### Phase 5: Enterprise Features (2-3 weeks)

- [ ] Advanced access control
- [ ] Audit logs
- [ ] Self-hosting support
- [ ] SSO integration

---

## Technical Architecture

### Backend Stack

```
FastAPI (Python) - Main API server
PostgreSQL - Primary database
Redis - Caching & queue
BullMQ/Celery - Background jobs for long-running evaluations
TimescaleDB - Time-series metrics (optional)
```

### Frontend Stack

```
React + TypeScript - UI framework
Material-UI - Component library
Recharts - Charting library
React Query - Data fetching
Monaco Editor - Code editor (for custom functions)
```

### Evaluation Engine

```
DeepEval - Core evaluation framework
LangChain - Model integrations
OpenTelemetry - Tracing (optional)
```

---

## Database Schema Additions

```sql
-- Experiments table
CREATE TABLE experiments (
    id VARCHAR PRIMARY KEY,
    project_id VARCHAR REFERENCES deepeval_projects(id),
    name VARCHAR NOT NULL,
    description TEXT,
    config JSONB, -- model, dataset, metrics
    baseline_experiment_id VARCHAR REFERENCES experiments(id),
    status VARCHAR, -- pending, running, completed, failed
    results JSONB,
    created_at TIMESTAMP,
    created_by INTEGER
);

-- Logs table
CREATE TABLE evaluation_logs (
    id UUID PRIMARY KEY,
    project_id VARCHAR,
    experiment_id VARCHAR,
    trace_id UUID,
    parent_trace_id UUID,
    span_name VARCHAR,
    input TEXT,
    output TEXT,
    metadata JSONB,
    latency_ms INTEGER,
    timestamp TIMESTAMP
);

-- Metrics table (time-series)
CREATE TABLE metrics (
    project_id VARCHAR,
    experiment_id VARCHAR,
    metric_name VARCHAR,
    value FLOAT,
    timestamp TIMESTAMP,
    dimensions JSONB
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    experiment_id VARCHAR,
    prompt_id VARCHAR,
    user_id INTEGER,
    rating INTEGER,
    comment TEXT,
    labels TEXT[],
    created_at TIMESTAMP
);

-- Automations table
CREATE TABLE automations (
    id VARCHAR PRIMARY KEY,
    project_id VARCHAR,
    name VARCHAR,
    trigger_type VARCHAR,
    trigger_config JSONB,
    action_type VARCHAR,
    action_config JSONB,
    enabled BOOLEAN,
    last_run TIMESTAMP
);
```

---

## API Endpoints to Add

```
# Experiments
POST   /api/deepeval/projects/{id}/experiments
GET    /api/deepeval/projects/{id}/experiments
GET    /api/deepeval/experiments/{id}
PUT    /api/deepeval/experiments/{id}
DELETE /api/deepeval/experiments/{id}
POST   /api/deepeval/experiments/{id}/run
GET    /api/deepeval/experiments/{id}/results
GET    /api/deepeval/experiments/compare?ids=exp1,exp2

# Logs
POST   /api/deepeval/logs
GET    /api/deepeval/logs?project_id=xxx&experiment_id=xxx
GET    /api/deepeval/logs/{id}
GET    /api/deepeval/logs/{id}/trace

# Monitoring
GET    /api/deepeval/projects/{id}/metrics
GET    /api/deepeval/projects/{id}/monitor/dashboard
POST   /api/deepeval/projects/{id}/alerts

# Datasets
POST   /api/deepeval/datasets
GET    /api/deepeval/datasets
GET    /api/deepeval/datasets/{id}/versions
POST   /api/deepeval/datasets/{id}/snapshot

# Reviews
POST   /api/deepeval/reviews
GET    /api/deepeval/experiments/{id}/reviews
PUT    /api/deepeval/reviews/{id}

# Automations
POST   /api/deepeval/automations
GET    /api/deepeval/projects/{id}/automations
PUT    /api/deepeval/automations/{id}
DELETE /api/deepeval/automations/{id}
```

---

## Next Steps

1. **Immediate (This Week):**

   - [ ] Review this plan with team
   - [ ] Prioritize features based on user needs
   - [ ] Set up project tracking (GitHub Projects/Jira)

2. **Short Term (Next 2 Weeks):**

   - [ ] Implement Logs backend API
   - [ ] Create Monitor dashboard wireframes
   - [ ] Expand scorer library (+5 scorers)

3. **Medium Term (Month 1):**

   - [ ] Complete Logs & Monitor features
   - [ ] Implement experiment comparison
   - [ ] Add dataset versioning

4. **Long Term (Month 2-3):**
   - [ ] Build Playground
   - [ ] Implement Review system
   - [ ] Add Automations
   - [ ] Custom Functions

---

## Resources

- [Braintrust Documentation](https://www.braintrust.dev/docs)
- [Braintrust SDK GitHub](https://github.com/braintrustdata/braintrust-sdk)
- [DeepEval Documentation](https://docs.confident-ai.com/)
- [OpenTelemetry Tracing](https://opentelemetry.io/)

---

**Last Updated:** November 4, 2025
