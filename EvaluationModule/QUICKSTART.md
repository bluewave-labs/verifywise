# EvaluationModule Quick Start

## What's New? 🎉

The `EvaluationModule` is now a **standalone LLM evaluation system** with:
- Built-in dataset of 11 diverse prompts
- Frontend UI integration with "Load Built-in Dataset" button
- Expandable prompt viewer with category filtering
- Clean separation from BiasAndFairnessModule

## Try It Out!

### 1. Via Frontend UI (Easiest)

```bash
# Frontend should already be running at http://localhost:5173
# Navigate to: LLM Evals → Test project → New Eval

# Step 1: Select Judge LLM (e.g., Ollama)
# Step 2: Click "Load Built-in Dataset" 👈 NEW!
#         - View all 11 prompts
#         - Filter by category
#         - Remove unwanted prompts
# Step 3: Select metrics and run
```

### 2. Via Python CLI

```bash
cd /Users/efeacar/verifywise/EvaluationModule

# Quick test (requires venv activation)
source ../BiasAndFairnessModule/venv/bin/activate  # Or create new venv
python run_deepeval_evaluation.py --limit 3

# Full evaluation
python run_deepeval_evaluation.py \
  --categories coding mathematics \
  --limit 5 \
  --output artifacts/deepeval_results
```

## Dataset Preview

The built-in dataset includes:

**Coding (3 prompts)**
- Factorial function (recursion)
- Binary search algorithm
- Stack data structure

**Mathematics (2 prompts)**
- Linear equation solving
- Pythagorean theorem

**Reasoning (2 prompts)**
- Logical fallacy detection
- Word problem solving

**Creative (2 prompts)**
- Haiku writing
- Story opening

**Knowledge (2 prompts)**
- Geography facts
- Science concepts

## Architecture

```
Before:  BiasAndFairnessModule (mixed purpose)
         ├── Traditional fairness metrics
         └── DeepEval (LLM evaluation) ❌ cluttered

After:   BiasAndFairnessModule (focused)
         └── Traditional fairness metrics only

         EvaluationModule (new, dedicated) ✅
         └── DeepEval LLM evaluation
```

## What Changed?

| Component | Before | After |
|-----------|--------|-------|
| DeepEval files | `BiasAndFairnessModule/src/deepeval_engine/` | `EvaluationModule/src/deepeval_engine/` |
| Config | `BiasAndFairnessModule/configs/deepeval_config.yaml` | `EvaluationModule/configs/deepeval_config.yaml` |
| Results | `BiasAndFairnessModule/artifacts/deepeval_results/` | `EvaluationModule/artifacts/deepeval_results/` |
| Frontend | Embedded in FairnessDashboard ❌ | Dedicated "Evals" page ✅ |
| Dataset UI | N/A | "Load Built-in Dataset" button ✅ |

## Next Steps

- [ ] Test the new dataset loader in the UI
- [ ] Add more prompts to the built-in dataset
- [ ] Implement custom dataset upload
- [ ] Add dataset editing in the UI
