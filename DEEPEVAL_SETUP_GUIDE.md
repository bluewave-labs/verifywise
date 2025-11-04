# DeepEval Complete Setup Guide

## 🎉 What You Have Now

A **complete full-stack DeepEval integration** with:

- ✅ **LLM-as-a-Judge** evaluation (GPT-4 judges responses)
- ✅ **Standalone CLI** tool
- ✅ **RESTful API** with background tasks
- ✅ **Frontend Dashboard** tab
- ✅ **20 diverse prompts** (coding, math, reasoning, etc.)
- ✅ **6 comprehensive metrics** (relevancy, bias, toxicity, etc.)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Set Up Environment

```bash
# In BiasAndFairnessModule directory
cd BiasAndFairnessModule

# Create .env file
echo "OPENAI_API_KEY=your-actual-api-key-here" > .env

# Verify installation
python scripts/verify_deepeval_installation.py
```

### Step 2: Test Standalone

```bash
# Run a quick evaluation (5 prompts)
python run_deepeval_evaluation.py --limit 5
```

**Expected Output:**

- ✅ 5 prompts evaluated
- ✅ Answer Relevancy scores (e.g., 0.745 avg)
- ✅ Bias scores (e.g., 0.000 - no bias)
- ✅ Toxicity scores (e.g., 0.000 - no toxicity)
- ✅ Results saved to `artifacts/deepeval_results/`

### Step 3: Start Full Stack

```bash
# Terminal 1: Start Backend API
cd BiasAndFairnessServers/src
source venv/bin/activate
uvicorn app:app --reload

# Terminal 2: Start Frontend
cd Clients
npm run dev

# Browser: Navigate to Fairness Dashboard
# Click "DeepEval - LLM Metrics" tab
```

---

## 📊 Understanding the Output

### What the Metrics Mean

**Answer Relevancy** (0.745 avg, 80% pass rate)

- GPT-4 judged that 4/5 responses were relevant to the prompts
- Scores 0.0-1.0, higher is better
- Threshold: 0.5 (default)

**Bias** (0.000 avg, 100% pass)

- GPT-4 found NO bias in any responses
- Scores 0.0-1.0, lower is better
- Perfect score = 0.000

**Toxicity** (0.000 avg, 100% pass)

- GPT-4 found NO toxicity in any responses
- Scores 0.0-1.0, lower is better
- Perfect score = 0.000

### Why No "Accuracy"?

We **removed accuracy** because it used string matching:

- ❌ Old: "x = 7" != "x equals 7" → FAIL (dumb!)
- ✅ New: GPT-4 judges semantic similarity → meaningful scores

**LLM-as-a-Judge is smarter** - it understands meaning, not just exact strings.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│ Frontend (React + TypeScript)                    │
│ - DeepEvalModule.tsx (Configuration & Results)  │
│ - deepEvalService.ts (API Client)               │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼ HTTP Requests
┌─────────────────────────────────────────────────┐
│ Backend API (FastAPI + Python)                   │
│ - routers/deepeval.py (Endpoints)                │
│ - controllers/deepeval.py (Business Logic)       │
│ - Background Tasks (Async Evaluation)            │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼ Calls
┌─────────────────────────────────────────────────┐
│ DeepEval Engine (BiasAndFairnessModule)          │
│ - evaluation_dataset.py (20 diverse prompts)     │
│ - model_runner.py (HF/OpenAI/Ollama)            │
│ - deepeval_evaluator.py (Metrics)                │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼ Evaluates via
┌─────────────────────────────────────────────────┐
│ DeepEval + OpenAI GPT-4 (LLM-as-a-Judge)         │
│ - Judges response quality                        │
│ - Returns scores (0.0 - 1.0)                     │
└─────────────────────────────────────────────────┘
```

---

## 📝 File Summary

### Created Files (18)

#### BiasAndFairnessModule

1. `src/deepeval_engine/__init__.py`
2. `src/deepeval_engine/evaluation_dataset.py` (20 diverse prompts)
3. `src/deepeval_engine/model_runner.py` (multi-provider)
4. `src/deepeval_engine/deepeval_evaluator.py` (LLM-as-judge)
5. `src/deepeval_engine/README.md`
6. `run_deepeval_evaluation.py` (standalone CLI)
7. `configs/deepeval_config.yaml`
8. `scripts/verify_deepeval_installation.py`
9. `scripts/run_complete_evaluation_with_deepeval.sh`
10. `.env.example`
11. `DEEPEVAL_QUICKSTART.md`
12. `DEEPEVAL_STANDALONE.md`
13. `DEEPEVAL_USAGE_EXAMPLES.md`
14. `DEEPEVAL_API_PROGRESS.md`
15. `DEEPEVAL_REFACTORING_SUMMARY.md`
16. `DEEPEVAL_FINAL_SUMMARY.md`

#### BiasAndFairnessServers

17. `src/routers/deepeval.py` (7 API endpoints)
18. `src/controllers/deepeval.py` (business logic)

#### Clients

19. `src/presentation/pages/FairnessDashboard/DeepEvalModule.tsx` (UI)
20. `src/infrastructure/api/deepEvalService.ts` (API client)

### Modified Files (5)

1. `BiasAndFairnessModule/requirements.txt` (+deepeval)
2. `BiasAndFairnessModule/configs/config.yaml` (+deepeval section)
3. `BiasAndFairnessModule/README.md` (+DeepEval docs)
4. `BiasAndFairnessServers/src/app.py` (+deepeval router)
5. `Clients/src/presentation/pages/FairnessDashboard/FairnessDashboard.tsx` (+tab)

---

## 🎯 Usage Examples

### 1. Standalone - Quick Test

```bash
python run_deepeval_evaluation.py --limit 3
```

### 2. Standalone - Specific Categories

```bash
python run_deepeval_evaluation.py --categories coding mathematics --limit 10
```

### 3. Standalone - All Metrics

```bash
python run_deepeval_evaluation.py --use-all-metrics --limit 5
```

### 4. API - Create Evaluation

```python
import requests

config = {
    "model": {
        "name": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "provider": "huggingface"
    },
    "dataset": {
        "use_builtin": True,
        "limit": 5
    },
    "metrics": {
        "answer_relevancy": True,
        "bias": True,
        "toxicity": True
    }
}

response = requests.post(
    "http://localhost:8000/deepeval/evaluate",
    json=config,
    headers={"x-tenant-id": "test"}
)

print(response.json())
# Output: {"eval_id": "deepeval_test_20250130_120000", "status": "pending", ...}
```

### 5. Frontend - Through UI

1. Navigate to `http://localhost:3000/fairness`
2. Click "DeepEval - LLM Metrics" tab
3. Configure:
   - Model: TinyLlama/TinyLlama-1.1B-Chat-v1.0
   - Limit: 5 prompts
   - Metrics: Answer Relevancy ✓, Bias ✓, Toxicity ✓
4. Click "Run DeepEval Evaluation"
5. Wait for completion (auto-updates every 3 seconds)
6. View results with metric scores

---

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY not found"

```bash
# Solution: Set in .env file
echo "OPENAI_API_KEY=your-key" > BiasAndFairnessModule/.env
```

### Issue: "deepeval is NOT installed"

```bash
# Solution: Install dependencies
cd BiasAndFairnessModule
pip install -r requirements.txt
```

### Issue: API returns 404

```bash
# Solution: Ensure server is running
cd BiasAndFairnessServers/src
uvicorn app:app --reload
```

### Issue: Frontend can't connect

```bash
# Solution: Check CORS settings
# Ensure backend allows frontend origin
# Default: http://localhost:3000
```

---

## 📚 Documentation Index

**Start Here:**

- `DEEPEVAL_QUICKSTART.md` - 5-minute quick start

**Standalone Usage:**

- `DEEPEVAL_STANDALONE.md` - Complete CLI guide
- `DEEPEVAL_USAGE_EXAMPLES.md` - 21 examples

**API/Integration:**

- `DEEPEVAL_API_PROGRESS.md` - API implementation details
- `DEEPEVAL_REFACTORING_SUMMARY.md` - Architecture changes

**Complete Reference:**

- `DEEPEVAL_FINAL_SUMMARY.md` - Full feature list
- `src/deepeval_engine/README.md` - Technical docs

---

## ✨ Key Takeaways

1. **LLM-as-a-Judge Works!**

   - GPT-4 provides meaningful scores
   - No more useless 0% accuracy from string matching
   - Semantic evaluation of open-ended responses

2. **Separated from BiasAndFairness**

   - DeepEval = General LLM capability testing
   - BiasAndFairness = Statistical fairness on demographics
   - Both valuable, different purposes

3. **Full-Stack Ready**

   - CLI for quick tests
   - API for automation
   - Frontend for user-friendly access

4. **Production Quality**
   - Error handling
   - Background tasks
   - Status tracking
   - Multi-tenant
   - Well-documented

---

**You're all set! Start with the Quick Start guide and explore from there.** 🚀
