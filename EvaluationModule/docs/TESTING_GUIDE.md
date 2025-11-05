# LLM Evaluations - Testing Guide

## ✅ What's Been Fixed

### 1. **Experiment Creation Now Works!**

The "Start Evaluation" button now:

- ✅ Creates an experiment via API (`POST /deepeval/experiments`)
- ✅ Saves all configuration (model, dataset, judge LLM, metrics)
- ✅ Shows success message with experiment ID
- ✅ You'll see the POST request in Network tab

### 2. **Monitor Tab is Live!**

The monitoring features ARE implemented! Just click the **"Monitor"** tab to see:

- 📊 **Total Logs** count
- ⚠️ **Error Rate** percentage
- ⏱️ **Average Latency** (ms)
- 💰 **Total Cost** ($)
- 📋 **Recent Experiments** list
- 📈 **Performance Metrics** (min/avg/max latency, token usage, quality scores)

---

## 🧪 How to Test

### Test 1: Create an Experiment

1. **Navigate to your project**

   - Go to `http://localhost:5173/evals`
   - Click on "Test project"

2. **Click "New Eval" button** (green button, top right)

3. **Step 1: Model**

   - Select "Ollama"
   - Enter model name: `tinyllama`
   - Click "Next"

4. **Step 2: Dataset**

   - Default dataset is already loaded with 11 prompts
   - Click "Next"

5. **Step 3: Judge LLM**

   - Select "Ollama"
   - Enter model name: `tinyllama`
   - Set temperature: `0.7`
   - Set max tokens: `500`
   - Click "Next"

6. **Step 4: Metrics**

   - Keep defaults (Answer Relevancy, Bias, Toxicity enabled)
   - Click **"Start Evaluation"**

7. **Expected Result:**
   - ✅ Network tab shows `POST /api/deepeval/experiments`
   - ✅ Alert shows "Experiment created successfully! ID: exp\_..."
   - ✅ Modal closes
   - ✅ Experiment appears in "Experiments" tab

### Test 2: View Monitor Dashboard

1. **Click the "Monitor" tab**

2. **What you should see:**

   ```
   Real-time Monitor                    [Refresh button]

   ┌─────────────┬─────────────┬─────────────┬─────────────┐
   │ Total Logs  │ Error Rate  │ Avg Latency │ Total Cost  │
   │     0       │    0.0%     │     N/A     │   $0.00     │
   └─────────────┴─────────────┴─────────────┴─────────────┘

   Recent Experiments          │  Performance Metrics
   ───────────────────         │  ───────────────────
   Your experiment should      │  Latency Distribution
   appear here!                │  Min | Avg | Max
                              │
                              │  Token Usage
                              │  Avg | Total
   ```

3. **If you see the dashboard:** ✅ Monitoring is working!

4. **Auto-refresh:** Dashboard updates every 30 seconds automatically

---

## 🔍 What's NOT Implemented Yet

### Actual Evaluation Execution ❌

**Current State:**

- ✅ Experiment is **created** and saved to database
- ❌ Evaluation **does NOT run** automatically

**What's Missing:**

- Background job to actually run the evaluation
- Call to DeepEval evaluation engine
- Results processing and storage

**Implementation Needed:**

```python
# Backend: Add evaluation runner
@router.post("/experiments/{experiment_id}/run")
async def run_experiment(experiment_id: str):
    # 1. Get experiment config
    # 2. Load dataset prompts
    # 3. Call model for each prompt
    # 4. Run judge LLM scoring
    # 5. Store results
    # 6. Update experiment status to "completed"
    pass
```

---

## 🚀 Next Steps to Complete Evaluation Flow

### Option A: Manual Trigger (Quick)

Add a "Run" button to start execution:

1. **Backend Endpoint:**

   ```python
   POST /deepeval/experiments/{id}/run
   ```

2. **Frontend Button in Experiments Tab:**
   ```typescript
   <Button onClick={() => runExperiment(exp.id)}>Run Evaluation</Button>
   ```

### Option B: Auto-Run (Better UX)

Automatically start evaluation after creation:

1. **In `handleSubmit`:**

   ```typescript
   // After creating experiment
   const response = await experimentsService.createExperiment(config);

   // Immediately trigger run
   await runEvaluation(response.experiment.id);
   ```

2. **Background Processing:**
   - Use FastAPI BackgroundTasks
   - Or integrate with existing job queue

---

## 📊 Testing Logs & Monitoring

### Create Test Data (Via API)

```bash
# Use this script to populate test data
curl -X POST "http://localhost:8000/deepeval/logs" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -H "x-user-id: 1" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "input": "Test prompt",
    "output": "Test response",
    "model_name": "gpt-4",
    "latency_ms": 1200,
    "token_count": 150,
    "cost": 0.0025,
    "status": "success"
  }'

curl -X POST "http://localhost:8000/deepeval/metrics" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "metric_name": "latency",
    "metric_type": "performance",
    "value": 1200
  }'
```

After creating test data, refresh the Monitor tab to see:

- Total Logs: 1
- Avg Latency: 1200ms
- Total Cost: $0.0025

---

## 🎯 Summary

| Feature             | Status               | How to Access      |
| ------------------- | -------------------- | ------------------ |
| Create Project      | ✅ Working           | Projects list page |
| New Eval Wizard     | ✅ Working           | "New Eval" button  |
| Experiment Creation | ✅ **JUST FIXED**    | Submit wizard      |
| Monitor Dashboard   | ✅ Working           | "Monitor" tab      |
| Logs View           | ✅ Backend ready     | API endpoints      |
| Run Evaluation      | ❌ Not implemented   | Need to add runner |
| Real Results        | ❌ Waiting on runner | Need to add runner |

---

## 🔧 Immediate Action Items

1. **Test experiment creation:** Follow Test 1 above
2. **View Monitor tab:** Click "Monitor" tab to see dashboard
3. **Check Network tab:** You'll now see `POST /api/deepeval/experiments`
4. **Next:** Implement evaluation runner to actually execute evaluations

---

**TL;DR:**

- ✅ Monitor features ARE there - just click the "Monitor" tab!
- ✅ Experiment creation now works - you'll see POST requests
- ❌ Evaluation execution (running the actual test) is not implemented yet
- 📝 Need to add `/experiments/{id}/run` endpoint to execute evaluations
