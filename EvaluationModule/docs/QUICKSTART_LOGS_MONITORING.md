# Quick Start: Logs & Monitoring

## 🚀 Getting Started

### 1. Backend Setup

```bash
# Navigate to backend
cd /Users/efeacar/verifywise/EvalServer/src

# Activate virtual environment
source venv/bin/activate

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**

```
INFO:     Will watch for changes in these directories: ['/Users/efeacar/verifywise/EvalServer/src']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using watchfiles
Running migrations...
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. Frontend Setup

The frontend is already configured! Just make sure it's running:

```bash
# In a new terminal
cd /Users/efeacar/verifywise/Clients
npm run dev
```

### 3. Test the Monitor Dashboard

1. Open browser: `http://localhost:5173/evals`
2. Click on a project (or create one)
3. Click the **"Monitor"** tab
4. You should see:
   - 4 metric cards (Total Logs, Error Rate, Avg Latency, Total Cost)
   - Recent Experiments list
   - Performance Metrics panel

---

## 🧪 Testing with Sample Data

### Option 1: Via API (Postman/cURL)

#### Create a Test Log

```bash
curl -X POST "http://localhost:8000/deepeval/logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "experiment_id": "exp_test_001",
    "input": "What is the capital of France?",
    "output": "The capital of France is Paris.",
    "model_name": "gpt-4",
    "latency_ms": 1250,
    "token_count": 45,
    "cost": 0.0015,
    "status": "success"
  }'
```

#### Create Test Metrics

```bash
curl -X POST "http://localhost:8000/deepeval/metrics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "metric_name": "latency",
    "metric_type": "performance",
    "value": 1250
  }'
```

#### Get Monitor Dashboard

```bash
curl -X GET "http://localhost:8000/deepeval/projects/YOUR_PROJECT_ID/monitor/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Option 2: Via Python Script

Create `test_monitoring.py`:

```python
import requests
import time

BASE_URL = "http://localhost:8000"
TOKEN = "YOUR_JWT_TOKEN"  # Get from browser dev tools
PROJECT_ID = "YOUR_PROJECT_ID"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Create 10 sample logs
for i in range(10):
    log_data = {
        "project_id": PROJECT_ID,
        "experiment_id": f"exp_test_{i}",
        "input": f"Test prompt {i}",
        "output": f"Test response {i}",
        "model_name": "gpt-4" if i % 2 == 0 else "claude-3",
        "latency_ms": 1000 + (i * 100),
        "token_count": 50 + (i * 10),
        "cost": 0.001 + (i * 0.0002),
        "status": "success" if i < 8 else "error"
    }

    response = requests.post(f"{BASE_URL}/deepeval/logs", json=log_data, headers=headers)
    print(f"Created log {i+1}: {response.status_code}")
    time.sleep(0.5)

# Create metrics
metrics = [
    {"name": "latency", "value": 1200},
    {"name": "token_count", "value": 75},
    {"name": "cost", "value": 0.0015},
    {"name": "score_average", "value": 0.85}
]

for metric in metrics:
    metric_data = {
        "project_id": PROJECT_ID,
        "metric_name": metric["name"],
        "metric_type": "performance",
        "value": metric["value"]
    }
    response = requests.post(f"{BASE_URL}/deepeval/metrics", json=metric_data, headers=headers)
    print(f"Created metric {metric['name']}: {response.status_code}")

print("\n✅ Test data created! Refresh your monitor dashboard.")
```

Run it:

```bash
python test_monitoring.py
```

---

## 🔍 Verify Everything Works

### Check Database

```bash
# Connect to PostgreSQL
psql -U your_user -d your_database

# Check tables
\dt

# View logs
SELECT COUNT(*) FROM evaluation_logs;
SELECT * FROM evaluation_logs LIMIT 5;

# View metrics
SELECT COUNT(*) FROM evaluation_metrics;
SELECT * FROM evaluation_metrics LIMIT 5;

# View experiments
SELECT * FROM experiments;
```

### Check API Endpoints

Visit these in your browser (or Postman):

- http://localhost:8000/docs - Interactive API docs
- Look for "Evaluation Logs & Monitoring" section
- Try out the endpoints with "Try it out" button

### Check Frontend

1. **Monitor Tab should show:**

   - Total Logs: Should match your test data count
   - Error Rate: Should show percentage based on failed logs
   - Avg Latency: Average of all latencies
   - Total Cost: Sum of all costs

2. **Recent Experiments:**

   - Should list any experiments you created
   - Status chips should be colored correctly

3. **Performance Metrics:**
   - Latency: Min/Avg/Max values
   - Token Usage: Average and total
   - Quality Score: Progress bar with percentage

---

## 🐛 Troubleshooting

### Issue: "Failed to load dashboard data"

**Check:**

1. Backend is running on port 8000
2. JWT token is valid
3. Project ID exists in database

**Fix:**

```bash
# Check backend logs
# Should show:
INFO:     "GET /deepeval/projects/YOUR_PROJECT_ID/monitor/dashboard HTTP/1.1" 200 OK
```

### Issue: "No monitoring data available"

**Possible Causes:**

1. No logs/metrics created yet
2. Wrong project ID
3. Database tables not migrated

**Fix:**

```bash
# Check if tables exist
psql -U your_user -d your_database -c "\dt"

# Run migrations if needed
cd EvalServer/src
alembic upgrade head
```

### Issue: Frontend shows 0 for all metrics

**Check:**

1. Logs were created for the correct project_id
2. Time range includes your test data
3. Network tab shows successful API call

**Fix:**

```bash
# Verify logs in database
psql -U your_user -d your_database -c "SELECT project_id, COUNT(*) FROM evaluation_logs GROUP BY project_id;"
```

---

## 📊 Expected Results

After creating test data, you should see:

**Monitor Dashboard:**

```
Total Logs: 10
Error Rate: 20.0% (2 errors out of 10)
Avg Latency: 1450ms
Total Cost: $0.0120

Recent Experiments: (your test experiments)

Performance Metrics:
- Latency: Min 1000ms | Avg 1450ms | Max 1900ms
- Token Usage: Avg 95 tokens | Total 950 tokens
- Quality Score: 85%
```

---

## 🎉 Success!

If you see data in all the cards and sections, congratulations! The Logs & Monitoring system is working correctly.

**Next Steps:**

1. Integrate logging into your evaluation runs
2. Add more metrics as needed
3. Build custom dashboards
4. Set up alerts (Phase 4)

**Need help?** Check:

- [Implementation Guide](./LOGS_AND_MONITORING_IMPLEMENTATION.md) - Full implementation docs
- [Backend API Reference](../../../../../EvalServer/EVALUATION_LOGS_API.md) - API documentation
- [Overall Plan](./BRAINTRUST_IMPLEMENTATION_PLAN.md) - Braintrust implementation roadmap
