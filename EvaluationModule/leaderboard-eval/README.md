# VerifyWise Arena - LLM Leaderboard Evaluation Pipeline

Evaluates 200+ LLM models using API providers, judged by GPT-4o.
Results are exported for import into VerifyWise LLM Arena leaderboard.

## Quick Start

```bash
# 1. Install dependencies
cd EvaluationModule/leaderboard-eval
pip install -r requirements.txt

# 2. Configure API keys
cp .env.example .env
# Edit .env with your keys

# 3. Run evaluation
python -m scripts.run_eval

# 4. Resume if interrupted
python -m scripts.run_eval --resume
```

## Cost Estimate

### Budget Mode (Default) - GPT-4o-mini Judge

| Component                                  | Cost     |
| ------------------------------------------ | -------- |
| Model inference (Groq/OpenRouter/Together) | ~$50     |
| GPT-4o-mini Judge                          | ~$8      |
| **Total**                                  | **~$58** |

### Premium Mode - GPT-4o Judge

| Component                                  | Cost      |
| ------------------------------------------ | --------- |
| Model inference (Groq/OpenRouter/Together) | ~$50      |
| GPT-4o Judge                               | ~$135     |
| **Total**                                  | **~$185** |

### Free Mode - Groq Llama Judge

| Component                                  | Cost     |
| ------------------------------------------ | -------- |
| Model inference (Groq/OpenRouter/Together) | ~$50     |
| Groq Llama 3.1 70B Judge                   | FREE     |
| **Total**                                  | **~$50** |

To switch modes, edit `configs/models.yaml` and change the `judge.model` setting.

## Runtime

- Full run (200 models): ~6-8 hours
- Recommended: Run overnight with checkpoint/resume

## Output

Results are saved to `results/run_YYYYMMDD_HHMM/`:

- `verifywise_import.json` - Import this to VerifyWise
- `full_results.json` - Detailed results with all scores
- `checkpoint.json` - Resume progress if interrupted

## Architecture

```
Your Machine (M1 Mac, etc.)
         │
         ▼
┌─────────────────────┐
│  Evaluation Runner  │
└─────────────────────┘
         │
    ┌────┴────┬────────────┬───────────┐
    ▼         ▼            ▼           ▼
 [Groq]  [OpenRouter]  [Together]  [Direct]
  FREE      cheap        cheap      premium
         │
         ▼
┌─────────────────────┐
│   GPT-4o Judge      │
└─────────────────────┘
         │
         ▼
   results.json
         │
         ▼
   VerifyWise Import
```
