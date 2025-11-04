# DeepEval Standalone Evaluation

## Overview

DeepEval is now **completely separate** from the BiasAndFairnessModule. It evaluates LLMs on **diverse prompts** (coding, reasoning, creative writing, etc.) rather than using the Adult Census Income dataset.

## Key Changes

### ✅ **What's New**

1. **Separate Evaluation Dataset** (`src/deepeval_engine/evaluation_dataset.py`)
   - 20+ diverse prompts across 8 categories
   - Coding, mathematics, reasoning, creative writing, knowledge, language, common sense, open-ended
   - Each prompt has expected output and keywords for evaluation

2. **Standalone Model Runner** (`src/deepeval_engine/model_runner.py`)
   - Supports HuggingFace, OpenAI, and Ollama models
   - Generates responses to evaluation prompts
   - Independent of BiasAndFairnessModule infrastructure

3. **Separate Configuration** (`configs/deepeval_config.yaml`)
   - DeepEval-specific settings
   - Model, dataset, and metrics configuration
   - Not tied to bias/fairness config

4. **New Evaluation Script** (`run_deepeval_evaluation.py`)
   - Clean, standalone evaluation flow
   - Evaluates on diverse prompts, not Adult Census data
   - Independent from bias/fairness pipeline

### 🗂️ **File Structure**

```
BiasAndFairnessModule/
├── src/deepeval_engine/
│   ├── __init__.py
│   ├── evaluation_dataset.py      # NEW: Diverse prompt dataset
│   ├── model_runner.py             # NEW: Standalone model runner
│   ├── deepeval_evaluator.py      # UPDATED: Works with new dataset
│   └── README.md
│
├── configs/
│   ├── config.yaml                 # BiasAndFairnessModule config
│   └── deepeval_config.yaml        # NEW: DeepEval-specific config
│
├── run_full_evaluation.py          # BiasAndFairnessModule pipeline
├── run_deepeval_evaluation.py      # NEW: Standalone DeepEval
└── run_deepeval_bias_evaluation.py # OLD: Bias-specific (legacy)
```

## Usage

### Basic Evaluation

```bash
# Evaluate on all prompts with default settings
python run_deepeval_evaluation.py
```

### Filter by Category

```bash
# Evaluate only coding and math prompts
python run_deepeval_evaluation.py --categories coding mathematics
```

### Filter by Difficulty

```bash
# Evaluate only easy and medium difficulty prompts
python run_deepeval_evaluation.py --difficulties easy medium
```

### Limit Number of Prompts

```bash
# Evaluate first 10 prompts
python run_deepeval_evaluation.py --limit 10
```

### Use Different Model

```bash
# Use OpenAI GPT-4
python run_deepeval_evaluation.py --model gpt-4 --provider openai

# Use Ollama Llama2
python run_deepeval_evaluation.py --model llama2 --provider ollama
```

### Enable All Metrics

```bash
# Run with all DeepEval metrics
python run_deepeval_evaluation.py --use-all-metrics
```

## Example Prompts

The evaluation dataset includes prompts like:

**Coding:**
- "Write a Python function to calculate factorial using recursion"
- "Explain how to implement a binary search algorithm"

**Mathematics:**
- "Solve: If x + 5 = 12, what is x?"
- "Explain the Pythagorean theorem with an example"

**Reasoning:**
- "If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?"
- "Explain the trolley problem and its ethical implications"

**Creative:**
- "Write a short story opening about a detective whose reflection has gone missing"
- "Write a haiku about artificial intelligence"

And many more across 8 categories!

## Output

Results are saved to `artifacts/deepeval_results/`:

- `deepeval_results_*.json` - Detailed results
- `deepeval_summary_*.json` - Summary statistics
- `deepeval_results_*.csv` - Spreadsheet format
- `deepeval_report_*.txt` - Human-readable report

## Configuration

Edit `configs/deepeval_config.yaml` to customize:

```yaml
model:
  name: "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
  provider: "huggingface"
  generation:
    max_tokens: 500
    temperature: 0.7

dataset:
  use_builtin: true
  # Optional filters:
  # categories: ["coding", "mathematics"]
  # difficulties: ["easy", "medium"]

metrics:
  answer_relevancy: true
  bias: true
  toxicity: true
  faithfulness: false
  hallucination: false
```

## Separation from BiasAndFairnessModule

### DeepEval (Standalone)
- **Purpose**: General LLM capability evaluation
- **Dataset**: Diverse prompts (coding, reasoning, creative, etc.)
- **Metrics**: Answer relevancy, bias, toxicity, faithfulness, etc.
- **Use Case**: Test model performance on varied tasks

### BiasAndFairnessModule
- **Purpose**: Fairness evaluation on structured data
- **Dataset**: Adult Census Income (demographic data)
- **Metrics**: Demographic parity, equalized odds, etc.
- **Use Case**: Detect bias in predictions on protected attributes

## Legacy Script

The old script that evaluated on Adult Census data is preserved as:
```bash
python run_deepeval_bias_evaluation.py
```

Use this if you want to run DeepEval metrics on the BiasAndFairnessModule pipeline results.

## Adding Custom Prompts

To add your own prompts, edit `src/deepeval_engine/evaluation_dataset.py`:

```python
{
    "id": "custom_001",
    "category": "custom",
    "prompt": "Your custom prompt here",
    "expected_keywords": ["keyword1", "keyword2"],
    "expected_output": "Expected answer description",
    "difficulty": "medium"
}
```

Or load from a JSON file:

```python
dataset = EvaluationDataset()
dataset.load_from_file("my_prompts.json")
```

## Requirements

```bash
pip install deepeval transformers torch pandas pydantic python-dotenv
```

For OpenAI:
```bash
pip install openai
```

For Ollama:
```bash
pip install ollama
```

## Environment Variables

```bash
# Required for DeepEval metrics
export OPENAI_API_KEY='your-api-key-here'

# Or add to .env file
echo "OPENAI_API_KEY=your-api-key-here" > .env
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set OpenAI API key
export OPENAI_API_KEY='your-key'

# 3. Run evaluation
python run_deepeval_evaluation.py --limit 5

# 4. Check results
ls -lh artifacts/deepeval_results/
```

## Summary

✅ DeepEval is now **standalone** and **independent**
✅ Uses **diverse prompts** for general LLM evaluation
✅ **Separate** from BiasAndFairnessModule
✅ Easy to **customize** and extend
✅ **Clean** separation of concerns

**BiasAndFairnessModule** = Fairness on structured data
**DeepEval** = General LLM capability evaluation

