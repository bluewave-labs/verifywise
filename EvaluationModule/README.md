# Evaluation Module

Standalone LLM evaluation module using DeepEval for comprehensive model assessment.

## Directory Structure

```
EvaluationModule/
├── src/
│   └── deepeval_engine/      # Core DeepEval evaluation logic
│       ├── deepeval_evaluator.py
│       ├── evaluation_dataset.py
│       └── model_runner.py
├── configs/
│   └── deepeval_config.yaml  # Evaluation configuration
├── artifacts/
│   └── deepeval_results/     # Evaluation results and reports
├── scripts/
│   ├── verify_deepeval_installation.py
│   └── run_complete_evaluation_with_deepeval.sh
├── run_deepeval_evaluation.py       # Main evaluation script
├── run_deepeval_bias_evaluation.py  # Bias-focused evaluation
└── requirements.txt                  # Python dependencies
```

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run evaluation
python run_deepeval_evaluation.py --config configs/deepeval_config.yaml
```

## Features

- LLM-as-a-Judge evaluation with DeepEval metrics
- Configurable judge LLM (OpenAI, Anthropic, HuggingFace, Ollama, etc.)
- Built-in diverse prompt dataset
- Multiple evaluation metrics (Answer Relevancy, Bias, Toxicity, Faithfulness, Hallucination)
- Comprehensive reporting and visualization

## Configuration

Edit `configs/deepeval_config.yaml` to customize:
- Judge LLM model and parameters
- Dataset selection and filtering
- Enabled metrics and thresholds
- Output settings

## API Integration

This module is integrated with the VerifyWise backend:
- Backend: `BiasAndFairnessServers` (port 8000)
- Frontend: `Clients/src/presentation/pages/EvalsDashboard`
