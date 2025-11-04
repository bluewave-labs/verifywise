# DeepEval Usage Examples

This document provides practical examples for using the DeepEval integration in the BiasAndFairnessModule.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Metric Selection](#metric-selection)
- [Custom Thresholds](#custom-thresholds)
- [Working with Results](#working-with-results)
- [Advanced Scenarios](#advanced-scenarios)

## Basic Usage

### Example 1: First-Time Evaluation

```bash
# Step 1: Generate inference results
python run_full_evaluation.py

# Step 2: Run DeepEval with default metrics (quick test)
export OPENAI_API_KEY='your-api-key'
python run_deepeval_evaluation.py --limit 5
```

**Expected Output:**

```
DeepEval Evaluation for BiasAndFairnessModule
======================================

✓ Loaded configuration for dataset: adult-census-income
  Model: TinyLlama/TinyLlama-1.1B-Chat-v1.0

✓ Built 5 test cases

Running DeepEval Metrics Evaluation
======================================

[1/5] Evaluating Sample: 0
  Evaluating Answer Relevancy... ✓ PASS (score: 0.834)
  Evaluating Bias... ✓ PASS (score: 0.123)
  Evaluating Toxicity... ✓ PASS (score: 0.045)
...
```

### Example 2: Full Dataset Evaluation

```bash
# Evaluate all samples with default metrics
python run_deepeval_evaluation.py
```

## Metric Selection

### Example 3: Bias and Toxicity Only

```bash
# Focus on fairness-related metrics
python run_deepeval_evaluation.py \
  --use-bias \
  --use-toxicity
```

**Use Case:** When you're primarily concerned with fairness and safety.

### Example 4: Comprehensive Quality Check

```bash
# Enable all available metrics
python run_deepeval_evaluation.py --use-all-metrics
```

**Use Case:** Complete evaluation before production deployment.

**Note:** This requires OpenAI API key and may take longer.

### Example 5: Context-Aware Metrics

```bash
# Enable metrics that use context
python run_deepeval_evaluation.py \
  --use-faithfulness \
  --use-hallucination \
  --use-contextual-relevancy
```

**Use Case:** When evaluating RAG (Retrieval-Augmented Generation) systems.

## Custom Thresholds

### Example 6: Strict Bias Threshold

```bash
# Require very low bias scores to pass
python run_deepeval_evaluation.py \
  --use-bias \
  --threshold-bias 0.3  # Default is 0.5
```

**Use Case:** High-stakes applications requiring minimal bias.

### Example 7: Balanced Thresholds

```bash
# Different thresholds for different metrics
python run_deepeval_evaluation.py \
  --use-answer-relevancy --threshold-answer-relevancy 0.6 \
  --use-bias --threshold-bias 0.4 \
  --use-toxicity --threshold-toxicity 0.3
```

**Use Case:** Custom requirements per metric.

## Working with Results

### Example 8: Custom Output Directory

```bash
# Save results to specific directory
python run_deepeval_evaluation.py \
  --output-dir experiments/run_001/
```

**Use Case:** Organizing multiple experiment runs.

### Example 9: Processing CSV Results

```python
import pandas as pd

# Load DeepEval results
df = pd.read_csv('artifacts/deepeval_results/deepeval_results_20250130_120000.csv')

# Analyze by protected attributes
print("\nBias Scores by Sex:")
print(df.groupby('sex')['Bias_score'].mean())

print("\nToxicity Scores by Race:")
print(df.groupby('race')['Toxicity_score'].mean())

# Find samples that failed bias check
bias_failures = df[df['Bias_passed'] == False]
print(f"\nSamples failing bias check: {len(bias_failures)}")
print(bias_failures[['sample_id', 'Bias_score', 'actual_output']])
```

### Example 10: Reading JSON Summary

```python
import json

# Load summary
with open('artifacts/deepeval_results/deepeval_summary_20250130_120000.json', 'r') as f:
    summary = json.load(f)

# Print key metrics
print(f"Overall Accuracy: {summary['overall_accuracy']:.1%}")

for metric, scores in summary['metric_summaries'].items():
    print(f"\n{metric}:")
    print(f"  Average: {scores['average_score']:.3f}")
    print(f"  Pass Rate: {scores['pass_rate']:.1f}%")
```

## Advanced Scenarios

### Example 11: Batch Processing Multiple Datasets

```bash
#!/bin/bash
# evaluate_multiple.sh

DATASETS=("dataset1" "dataset2" "dataset3")

for dataset in "${DATASETS[@]}"; do
  echo "Evaluating $dataset..."

  # Run inference
  python run_full_evaluation.py --dataset $dataset

  # Run DeepEval
  python run_deepeval_evaluation.py \
    --inference-results "artifacts/${dataset}_results.csv" \
    --output-dir "artifacts/deepeval_${dataset}/"
done
```

### Example 12: A/B Testing Two Models

```bash
# Evaluate Model A
python run_full_evaluation.py --model TinyLlama/TinyLlama-1.1B-Chat-v1.0
python run_deepeval_evaluation.py --output-dir experiments/model_a/

# Evaluate Model B
python run_full_evaluation.py --model meta-llama/Llama-2-7b-chat-hf
python run_deepeval_evaluation.py --output-dir experiments/model_b/

# Compare results
python compare_models.py experiments/model_a/ experiments/model_b/
```

### Example 13: Continuous Monitoring

```bash
#!/bin/bash
# monitor.sh - Run daily evaluations

DATE=$(date +%Y%m%d)
OUTPUT_DIR="monitoring/${DATE}"

# Run evaluation
python run_full_evaluation.py
python run_deepeval_evaluation.py \
  --output-dir "$OUTPUT_DIR" \
  --use-bias \
  --use-toxicity

# Alert if bias score exceeds threshold
python check_alerts.py "$OUTPUT_DIR"
```

### Example 14: Debugging Specific Samples

```bash
# Evaluate only specific sample IDs
python run_deepeval_evaluation.py \
  --sample-ids 0 5 10 15 20 \
  --use-all-metrics
```

**Use Case:** Deep dive into problematic samples identified in previous runs.

### Example 15: Integration with CI/CD

```yaml
# .github/workflows/fairness_check.yml
name: Fairness Evaluation

on: [push, pull_request]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.12

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run fairness evaluation
        run: |
          python run_full_evaluation.py

      - name: Run DeepEval evaluation
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          python run_deepeval_evaluation.py --limit 10

      - name: Check results
        run: |
          python scripts/check_thresholds.py
```

## Configuration Examples

### Example 16: YAML Configuration

```yaml
# configs/my_config.yaml
deepeval:
  enabled: true
  metrics:
    answer_relevancy: true
    bias: true
    toxicity: true
    faithfulness: false
    hallucination: false
    contextual_relevancy: false

  metric_thresholds:
    answer_relevancy: 0.6
    bias: 0.4
    toxicity: 0.3

  output:
    save_detailed_results: true
    save_summary: true
    save_csv: true
    save_report: true
```

### Example 17: Programmatic Usage

```python
from src.core.config import ConfigManager
from src.deepeval_engine import DeepEvalEvaluator, DeepEvalDatasetBuilder

# Initialize
config_manager = ConfigManager()
dataset_builder = DeepEvalDatasetBuilder(config_manager, limit_samples=10)

# Build test cases
test_cases = dataset_builder.build_test_cases_from_inference_results()

# Run evaluation
evaluator = DeepEvalEvaluator(
    config_manager=config_manager,
    metric_thresholds={
        "bias": 0.4,
        "toxicity": 0.3,
    }
)

metrics_config = {
    "answer_relevancy": True,
    "bias": True,
    "toxicity": True,
}

results = evaluator.run_evaluation(test_cases, metrics_config)

# Access results
print(f"Evaluated {len(results)} samples")
for result in results:
    print(f"Sample {result['sample_id']}: {result['prediction_correct']}")
```

## Performance Optimization

### Example 18: Parallel Processing (Future Enhancement)

```python
# Conceptual example for future implementation
from concurrent.futures import ThreadPoolExecutor

def evaluate_batch(test_cases_batch):
    evaluator = DeepEvalEvaluator(config_manager)
    return evaluator.evaluate_test_cases(test_cases_batch)

# Split test cases into batches
batch_size = 10
batches = [test_cases[i:i+batch_size]
           for i in range(0, len(test_cases), batch_size)]

# Process in parallel
with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(evaluate_batch, batches))
```

### Example 19: Caching Expensive Computations

```bash
# Use pre-computed inference results
python run_deepeval_evaluation.py \
  --inference-results artifacts/cached_results.csv \
  --use-bias \
  --use-toxicity
```

## Troubleshooting Examples

### Example 20: Debugging API Issues

```bash
# Enable verbose logging
export LOG_LEVEL=DEBUG
python run_deepeval_evaluation.py --limit 1
```

### Example 21: Handling Rate Limits

```bash
# Evaluate in small batches with delays
for i in {0..100..10}; do
  python run_deepeval_evaluation.py \
    --inference-results artifacts/inference_results.csv \
    --sample-range $i $((i+10))
  sleep 60  # Wait between batches
done
```

## Best Practices

1. **Start Small**: Always use `--limit 5` for initial testing
2. **Version Results**: Use timestamped output directories
3. **Document Thresholds**: Keep a record of why you chose specific thresholds
4. **Monitor Costs**: DeepEval uses OpenAI API which incurs costs
5. **Compare Over Time**: Track metric changes across model versions
6. **Combine Approaches**: Use DeepEval + traditional fairness metrics
7. **Human Review**: Use metrics to identify samples for manual inspection

## Getting Help

```bash
# View all available options
python run_deepeval_evaluation.py --help

# Check configuration
cat configs/config.yaml

# View latest results
ls -lht artifacts/deepeval_results/ | head
```

## Additional Resources

- [DeepEval Documentation](https://docs.confident-ai.com/)
- [Quick Start Guide](DEEPEVAL_QUICKSTART.md)
- [Integration Summary](DEEPEVAL_INTEGRATION_SUMMARY.md)
- [Main README](README.md)
