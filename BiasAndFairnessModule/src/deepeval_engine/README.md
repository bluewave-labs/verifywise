# DeepEval Integration for BiasAndFairnessModule

This module integrates [DeepEval](https://docs.confident-ai.com/) - a comprehensive LLM evaluation framework - with the BiasAndFairnessModule.

## 📋 Overview

DeepEval provides advanced metrics to evaluate LLM outputs, including:

- **Answer Relevancy**: Measures if the answer is relevant to the input
- **Faithfulness**: Checks if the answer is faithful to the provided context
- **Contextual Relevancy**: Evaluates if context is relevant to the input
- **Hallucination Detection**: Identifies fabricated or incorrect information
- **Bias Detection**: Identifies potential biases in responses
- **Toxicity Detection**: Detects toxic or harmful content

## 🚀 Quick Start

### Prerequisites

1. **OpenAI API Key** (required for most metrics)

   ```bash
   export OPENAI_API_KEY='your-api-key-here'
   ```

   Or add to your `.env` file:

   ```
   OPENAI_API_KEY=your-api-key-here
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Basic Usage

1. **Run the standard evaluation first** to generate inference results:

   ```bash
   python run_full_evaluation.py
   ```

2. **Run DeepEval evaluation** on the inference results:
   ```bash
   python run_deepeval_evaluation.py
   ```

## 📊 Usage Examples

### Example 1: Basic Evaluation with Default Metrics

```bash
python run_deepeval_evaluation.py
```

This runs with the default metrics (Answer Relevancy, Bias, Toxicity) on all samples.

### Example 2: Enable All Metrics

```bash
python run_deepeval_evaluation.py --use-all-metrics
```

### Example 3: Select Specific Metrics

```bash
python run_deepeval_evaluation.py \
  --use-answer-relevancy \
  --use-bias \
  --use-toxicity \
  --use-hallucination
```

### Example 4: Custom Thresholds

```bash
python run_deepeval_evaluation.py \
  --use-bias \
  --threshold-bias 0.7 \
  --use-toxicity \
  --threshold-toxicity 0.8
```

### Example 5: Limit Number of Samples

```bash
python run_deepeval_evaluation.py --limit 20
```

### Example 6: Custom Inference Results Path

```bash
python run_deepeval_evaluation.py \
  --inference-results path/to/custom_results.csv
```

### Example 7: Custom Output Directory

```bash
python run_deepeval_evaluation.py \
  --output-dir my_custom_results/
```

## 📁 Output Files

DeepEval evaluation generates several output files in `artifacts/deepeval_results/`:

1. **`deepeval_results_TIMESTAMP.json`**

   - Detailed JSON with all evaluation results
   - Includes metric scores, predictions, and metadata

2. **`deepeval_summary_TIMESTAMP.json`**

   - Summary statistics
   - Aggregated metric scores
   - Accuracy breakdowns

3. **`deepeval_results_TIMESTAMP.csv`**

   - Tabular format for easy analysis in spreadsheets
   - Includes sample IDs, predictions, scores

4. **`deepeval_report_TIMESTAMP.txt`**
   - Human-readable text report
   - Detailed results for each sample
   - Summary statistics

## ⚙️ Configuration

You can configure DeepEval settings in `configs/config.yaml`:

```yaml
deepeval:
  enabled: true
  metrics:
    answer_relevancy: true
    faithfulness: false
    contextual_relevancy: false
    hallucination: false
    bias: true
    toxicity: true

  metric_thresholds:
    answer_relevancy: 0.5
    faithfulness: 0.5
    contextual_relevancy: 0.5
    hallucination: 0.5
    bias: 0.5
    toxicity: 0.5

  output:
    save_detailed_results: true
    save_summary: true
    save_csv: true
    save_report: true
```

## 🔧 Architecture

### Core Components

1. **`DeepEvalEvaluator`** (`deepeval_evaluator.py`)

   - Main evaluation orchestrator
   - Manages metric initialization and execution
   - Generates reports and saves results

2. **`DeepEvalDatasetBuilder`** (`deepeval_dataset.py`)

   - Loads inference results
   - Builds DeepEval test cases
   - Formats data for evaluation

3. **`run_deepeval_evaluation.py`**
   - Command-line interface
   - Argument parsing
   - Workflow orchestration

### Data Flow

```
Inference Results (CSV)
    ↓
DeepEvalDatasetBuilder
    ↓
LLMTestCase objects
    ↓
DeepEvalEvaluator
    ↓
Metric Evaluation
    ↓
Results (JSON, CSV, TXT)
```

## 📊 Metrics Details

### Answer Relevancy

- **Purpose**: Measures how relevant the answer is to the input question
- **Requires**: OpenAI API key
- **Threshold**: 0.0 - 1.0 (higher is better)
- **Use Case**: Ensure model provides on-topic responses

### Faithfulness

- **Purpose**: Checks if the answer is faithful to the provided context
- **Requires**: OpenAI API key, context data
- **Threshold**: 0.0 - 1.0 (higher is better)
- **Use Case**: Verify model doesn't hallucinate or contradict context

### Bias Detection

- **Purpose**: Identifies potential biases in responses
- **Requires**: OpenAI API key
- **Threshold**: 0.0 - 1.0 (lower is better for bias)
- **Use Case**: Detect unfair treatment of protected attributes

### Toxicity Detection

- **Purpose**: Detects toxic, harmful, or inappropriate content
- **Requires**: OpenAI API key
- **Threshold**: 0.0 - 1.0 (lower is better for toxicity)
- **Use Case**: Ensure safe and appropriate model outputs

### Hallucination Detection

- **Purpose**: Identifies fabricated or incorrect information
- **Requires**: OpenAI API key, context data
- **Threshold**: 0.0 - 1.0 (lower is better for hallucination)
- **Use Case**: Verify factual accuracy of responses

### Contextual Relevancy

- **Purpose**: Evaluates if provided context is relevant to the input
- **Requires**: OpenAI API key, context data
- **Threshold**: 0.0 - 1.0 (higher is better)
- **Use Case**: Assess quality of retrieved context (for RAG systems)

## 🔍 Interpreting Results

### Understanding Scores

- **Pass/Fail**: Each metric has a threshold; scores above/below indicate pass/fail
- **Aggregate Scores**: Average scores across all samples for each metric
- **Protected Attributes**: Breakdowns by sex and race to identify disparities

### Example Summary Output

```
DEEPEVAL EVALUATION SUMMARY
==================================================

Total samples evaluated: 10
Prediction accuracy: 80.0% (8/10)
Average response length: 5 characters
Average word count: 1.0 words

METRIC SCORES SUMMARY
--------------------------------------------------

Answer Relevancy:
  Average Score: 0.723
  Pass Rate: 90.0% (9/10)
  Score Range: 0.550 - 0.892

Bias:
  Average Score: 0.234
  Pass Rate: 100.0% (10/10)
  Score Range: 0.100 - 0.345

PROTECTED ATTRIBUTES BREAKDOWN
--------------------------------------------------

By Sex:
  Female: 75.0% accuracy (3/4)
  Male: 83.3% accuracy (5/6)

By Race:
  Black: 66.7% accuracy (2/3)
  White: 85.7% accuracy (6/7)
```

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY not found"

**Solution**: Set your OpenAI API key in environment or .env file

### Issue: "Inference results not found"

**Solution**: Run `python run_full_evaluation.py` first to generate results

### Issue: "All metrics disabled"

**Solution**: Ensure OpenAI API key is set; most metrics require it

### Issue: Metric evaluation taking too long

**Solution**: Use `--limit N` to evaluate fewer samples for testing

### Issue: Out of memory errors

**Solution**: Process samples in smaller batches using `--limit`

## 📚 Additional Resources

- [DeepEval Documentation](https://docs.confident-ai.com/)
- [DeepEval Metrics Guide](https://docs.confident-ai.com/docs/metrics-introduction)
- [BiasAndFairnessModule Documentation](../README.md)

## 🤝 Integration with Fairness Evaluation

DeepEval complements the fairness metrics in BiasAndFairnessModule:

1. **Traditional Fairness Metrics** (demographic parity, equalized odds, etc.)

   - Focus on statistical disparities between groups
   - Quantify unfairness in predictions

2. **DeepEval Metrics** (bias, toxicity, relevancy, etc.)
   - Focus on content quality and safety
   - Evaluate individual response characteristics

Together, they provide a comprehensive evaluation of model fairness and quality.

## 💡 Best Practices

1. **Run traditional fairness evaluation first**: Generate baseline metrics
2. **Use DeepEval for detailed analysis**: Dive deeper into specific samples
3. **Compare across protected attributes**: Look for disparities in metric scores
4. **Adjust thresholds based on use case**: Different applications need different standards
5. **Monitor over time**: Track metric changes across model versions
6. **Combine with human review**: Use metrics to identify samples for manual inspection

## 📝 Citation

If you use DeepEval in your research, please cite:

```
DeepEval: https://docs.confident-ai.com/
```
