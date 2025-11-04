# DeepEval Quick Start Guide

Get started with DeepEval evaluation in 5 minutes! 🚀

## Step 1: Install Dependencies

```bash
cd BiasAndFairnessModule
pip install -r requirements.txt
```

## Step 2: Set Up OpenAI API Key

DeepEval metrics require an OpenAI API key. Add it to your environment:

```bash
export OPENAI_API_KEY='your-api-key-here'
```

Or create a `.env` file:

```
OPENAI_API_KEY=your-api-key-here
```

## Step 3: Generate Inference Results

First, run the standard evaluation to generate model predictions:

```bash
python run_full_evaluation.py
```

This will create inference results at `artifacts/cleaned_inference_results.csv`.

## Step 4: Run DeepEval Evaluation

Now run the DeepEval evaluation:

```bash
python run_deepeval_evaluation.py
```

This will:

- Load your inference results
- Evaluate each sample with DeepEval metrics
- Save comprehensive results to `artifacts/deepeval_results/`

## Step 5: Review Results

Check the output directory for results:

```bash
ls -lh artifacts/deepeval_results/
```

You'll find:

- `deepeval_results_*.json` - Detailed JSON results
- `deepeval_summary_*.json` - Summary statistics
- `deepeval_results_*.csv` - Spreadsheet-friendly format
- `deepeval_report_*.txt` - Human-readable report

## 🎯 Common Use Cases

### Use Case 1: Quick Test (Limited Samples)

```bash
python run_deepeval_evaluation.py --limit 5
```

### Use Case 2: Focus on Bias and Toxicity

```bash
python run_deepeval_evaluation.py \
  --use-bias \
  --use-toxicity
```

### Use Case 3: Comprehensive Evaluation

```bash
python run_deepeval_evaluation.py --use-all-metrics
```

### Use Case 4: Custom Thresholds

```bash
python run_deepeval_evaluation.py \
  --use-bias \
  --threshold-bias 0.7
```

## 📊 Understanding the Output

### Console Output

During evaluation, you'll see:

```
[1/10] Evaluating Sample: 0
Protected Attributes: {'sex': 'Male', 'race': 'White'}
==========================================
Input (truncated): Given the following demographic information...

Actual Output: >50K
Expected Output: >50K

  Evaluating Answer Relevancy... ✓ PASS (score: 0.834)
  Evaluating Bias... ✓ PASS (score: 0.123)
  Evaluating Toxicity... ✓ PASS (score: 0.045)
```

### Summary Statistics

At the end, you'll see:

```
DEEPEVAL EVALUATION SUMMARY
======================================

Total samples evaluated: 10
Prediction accuracy: 80.0% (8/10)

METRIC SCORES SUMMARY
--------------------------------------

Answer Relevancy:
  Average Score: 0.723
  Pass Rate: 90.0% (9/10)

Bias:
  Average Score: 0.234
  Pass Rate: 100.0% (10/10)

PROTECTED ATTRIBUTES BREAKDOWN
--------------------------------------

By Sex:
  Female: 75.0% accuracy (3/4)
  Male: 83.3% accuracy (5/6)
```

## 🔧 Configuration

Edit `configs/config.yaml` to customize settings:

```yaml
deepeval:
  enabled: true
  metrics:
    answer_relevancy: true
    bias: true
    toxicity: true

  metric_thresholds:
    answer_relevancy: 0.5
    bias: 0.5
    toxicity: 0.5
```

## 💡 Tips

1. **Start small**: Use `--limit 5` for quick tests
2. **Focus on key metrics**: Enable only the metrics you need
3. **Adjust thresholds**: Different use cases need different standards
4. **Check protected attributes**: Look for disparities between groups
5. **Combine approaches**: Use DeepEval + traditional fairness metrics

## 🆘 Getting Help

### Command Help

```bash
python run_deepeval_evaluation.py --help
```

### Common Issues

**Problem**: "OPENAI_API_KEY not found"
**Solution**: Set your API key in environment or .env file

**Problem**: "Inference results not found"
**Solution**: Run `python run_full_evaluation.py` first

**Problem**: Evaluation is slow
**Solution**: Use `--limit N` to evaluate fewer samples

## 📚 Next Steps

- Read the [full README](src/deepeval_engine/README.md) for detailed documentation
- Check [DeepEval docs](https://docs.confident-ai.com/) for metric details
- Explore the [BiasAndFairnessModule documentation](README.md)

## 🎉 You're Ready!

You now have a comprehensive evaluation setup combining:

- ✅ Traditional fairness metrics (demographic parity, equalized odds, etc.)
- ✅ DeepEval LLM evaluation (bias, toxicity, relevancy, etc.)
- ✅ Detailed reports and analysis

Happy evaluating! 🚀
