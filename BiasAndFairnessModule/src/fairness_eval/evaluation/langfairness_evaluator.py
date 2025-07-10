# langfairness_evaluator.py
from langfair.metrics.toxicity.toxicity import ToxicityMetrics
from evaluate import load
from tqdm import tqdm

def evaluate_langfair_fairness(model_pipeline, prompts, responses, max_new_tokens=50):
    results = {}

    # Toxicity (LangFair)
    print("Computing LangFair Toxicity...")
    toxicity_metric = ToxicityMetrics()
    toxicity_results = toxicity_metric.evaluate(
        prompts=prompts, 
        responses=responses,
    )
    results["LangFairToxicity"] = toxicity_results

    return results
