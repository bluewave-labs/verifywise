# LLM Evaluations Dashboard

## Overview

The LLM Evaluations Dashboard is a comprehensive evaluation platform for testing and monitoring Large Language Model performance using LLM-as-a-Judge methodology.

## Features

### Project-Based Organization

- Create and manage multiple evaluation projects
- Track performance across runs
- Isolate configurations per project

### 4-Step Evaluation Wizard

#### Step 1: Model

Configure the model to be evaluated:

- **Providers**: OpenAI, Anthropic, Gemini, xAI, Mistral, HuggingFace, Ollama, Local, Custom API
- **Fields**:
  - Model Name (required)
  - Endpoint URL (for Local and Custom API)
  - API Key (for OpenAI, Anthropic, Gemini, xAI, Mistral, Custom API)

#### Step 2: Dataset

Choose evaluation prompts:

- **Default Dataset**: 11 curated prompts across 5 categories
  - Coding (3): Recursion, binary search, data structures
  - Mathematics (2): Equations, geometry
  - Reasoning (2): Logic, word problems
  - Creative (2): Haiku, storytelling
  - Knowledge (2): Geography, science
- **Custom Upload**: Coming soon
- **Editable**: All prompts can be modified inline
- **Features**: Category & difficulty chips, remove prompts, view details

#### Step 3: Judge LLM

Select the evaluator LLM:

- **Providers**: OpenAI, Anthropic, Gemini, xAI, Mistral, HuggingFace, Ollama
- **Configuration**:
  - API Key (conditional)
  - Model Name
  - Temperature
  - Max Tokens

#### Step 4: Metrics

Configure evaluation metrics:

- Answer Relevancy
- Bias Detection
- Toxicity Detection
- Faithfulness
- Hallucination Detection
- Custom thresholds per metric

## Architecture

```
Frontend (React/TypeScript)
├── EvalsDashboard.tsx          # Main container with tabs
├── ProjectsList.tsx            # Project grid view
├── ProjectOverview.tsx         # Dashboard with stats & charts
├── ProjectExperiments.tsx      # Detailed runs table
├── ProjectMonitor.tsx          # Real-time monitoring
└── NewExperimentModal.tsx      # 4-step wizard

Backend (Python/FastAPI)
├── /api/deepeval/projects      # CRUD for projects
└── /api/deepeval/evaluate      # Run evaluations

Evaluation Engine (Python)
└── EvaluationModule/
    └── src/deepeval_engine/    # Core evaluation logic
```

## API Endpoints

### Projects

- `GET /api/deepeval/projects` - List all projects
- `POST /api/deepeval/projects` - Create project
- `GET /api/deepeval/projects/{id}` - Get project
- `PUT /api/deepeval/projects/{id}` - Update project
- `DELETE /api/deepeval/projects/{id}` - Delete project

### Evaluations

- `POST /api/deepeval/evaluate` - Start evaluation
- `GET /api/deepeval/evaluations/{id}` - Get status
- `GET /api/deepeval/evaluations/{id}/results` - Get results

## UI Components

- **StepperModal**: Reusable multi-step wizard
- **PerformanceChart**: Recharts-based metric visualization
- **Field**: Custom input with validation
- **CustomizableButton**: Styled action buttons

## Workflow

1. User creates a project (name + description)
2. User clicks "New Eval" to start wizard
3. Wizard collects:
   - Model configuration (what to test)
   - Dataset (prompts to use)
   - Judge LLM (evaluator)
   - Metrics (what to measure)
4. Backend runs evaluation asynchronously
5. Results appear in Experiments tab
6. Performance tracked in Overview charts

## Key Decisions

- **Modal first, not Dataset first**: Cleaned separation of concerns
- **Radio group for dataset**: Clear choice between default/upload
- **Grid selection**: Visual, intuitive provider/model selection
- **Editable prompts**: Users can customize evaluation cases
- **Conditional fields**: Only show relevant configuration options
- **4-step flow**: Model → Dataset → Judge LLM → Metrics

## Next Steps

- [ ] Connect wizard to backend API
- [ ] Implement evaluation run endpoint
- [ ] Add background job processing
- [ ] Display real-time evaluation progress
- [ ] Show results in experiments table
- [ ] Add custom dataset upload
- [ ] Implement dataset filtering
