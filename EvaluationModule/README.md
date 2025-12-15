# Evaluation Module

Standalone LLM evaluation system using DeepEval for comprehensive model assessment.

## Features

- **LLM-as-a-Judge evaluation** with DeepEval metrics
- **Multiple model providers**: OpenAI, Anthropic, Gemini, xAI, Mistral, Ollama, HuggingFace
- **Built-in dataset** with 11 diverse prompts across 5 categories
- **Evaluation metrics**: Answer Relevancy, Bias, Toxicity, Faithfulness, Hallucination
- **Frontend integration** with the VerifyWise dashboard

## Quick Start

### Via Frontend UI

1. Navigate to **LLM Evals** in the VerifyWise dashboard
2. Create or select a project
3. Click **"New Eval"** and follow the 4-step wizard:
   - **Step 1**: Select model to evaluate (Ollama, OpenAI, etc.)
   - **Step 2**: Choose dataset (built-in or custom)
   - **Step 3**: Configure judge LLM for scoring
   - **Step 4**: Select evaluation metrics

### Via Python CLI

```bash
cd EvaluationModule

# Install dependencies
pip install -r requirements.txt

# Run evaluation
python main.py --config configs/deepeval_config.yaml
```

## Directory Structure

```
EvaluationModule/
├── src/
│   └── deepeval_engine/      # Core evaluation logic
├── configs/
│   └── deepeval_config.yaml  # Evaluation configuration
├── artifacts/                # Evaluation results
├── data/                     # Datasets
└── requirements.txt          # Python dependencies
```

## Built-in Dataset

The module includes 11 curated prompts:

| Category    | Count | Examples                         |
| ----------- | ----- | -------------------------------- |
| Coding      | 3     | Recursion, binary search, stacks |
| Mathematics | 2     | Equations, geometry              |
| Reasoning   | 2     | Logic puzzles, word problems     |
| Creative    | 2     | Haiku, storytelling              |
| Knowledge   | 2     | Geography, science               |

## Supported Providers

| Provider    | API Key Required | Local/Cloud |
| ----------- | ---------------- | ----------- |
| OpenAI      | Yes              | Cloud       |
| Anthropic   | Yes              | Cloud       |
| Gemini      | Yes              | Cloud       |
| xAI         | Yes              | Cloud       |
| Mistral     | Yes              | Cloud       |
| Ollama      | No               | Local       |
| HuggingFace | No               | Local       |

## Configuration

Edit `configs/deepeval_config.yaml` to customize:

- Judge LLM model and parameters
- Dataset selection and filtering
- Enabled metrics and thresholds
- Output settings

## API Integration

This module is integrated with the VerifyWise platform:

- **Backend**: `EvalServer` (FastAPI, port 8000)
- **Frontend**: `Clients/src/presentation/pages/EvalsDashboard`
