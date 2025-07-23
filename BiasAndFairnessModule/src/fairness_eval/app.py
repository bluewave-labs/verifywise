import yaml
from loaders.data_loader import load_tabular_dataset, load_llm_prompt_dataset
from loaders.model_loader import load_sklearn_model, load_hf_llm_model
from engine.inference import generate_llm_responses
from evaluation.llm_fairness_evaluator import evaluate_toxicity, evaluate_stereotypes
from evaluation.fairness_evaluator import evaluate_fairness
from reporting.reporter import save_results
from loaders.data_loader import load_holistic_bias_dataset
from evaluation.holistic_bias_evaluator import evaluate_holistic_bias
from evaluation.langfairness_evaluator import evaluate_langfair_fairness 
from transformers import AutoTokenizer, pipeline, AutoModelForCausalLM
import torch

def load_config(path="config/config.yaml"):
    with open(path, "r") as f:
        return yaml.safe_load(f)

if __name__ == "__main__":
    config = load_config()
    model_type = config["model"]["type"]

    print(f"Detected model type: {model_type}")
    results = {}

    if model_type == "sklearn":
        print("Running tabular fairness evaluation...")
        X, y, A = load_tabular_dataset(config["dataset"]["path"], config["dataset"]["protected_attribute"])
        model = load_sklearn_model(config["model"]["path"])
        results = evaluate_fairness(X, y, A, model)
        for k, v in results.items():
            print(f"{k}: {v:.4f}")

    elif model_type == "huggingface":
        print("Running LLM fairness evaluation...")
        model_name = config["model"]["name"]
        model = AutoModelForCausalLM.from_pretrained(model_name)
        tokenizer = AutoTokenizer.from_pretrained(model_name)

        # Create pipeline for LangFair
        model_pipeline = load_hf_llm_model(config["model"]["name"])
        prompts = load_llm_prompt_dataset(config["dataset"]["name"])
        prompts = prompts[:16] #Dev testing
        responses = generate_llm_responses(model_pipeline, prompts)

        if "toxicity" in config["metrics"]:
            results["toxicity"] = evaluate_toxicity(prompts, responses)
        if "stereotype" in config["metrics"]:
            results["stereotype"] = evaluate_stereotypes(prompts, responses)
        if "holistic_bias" in config["metrics"]:
            prompts, descriptors = load_holistic_bias_dataset("sentences")
            prompts = prompts[:10]  # or 20/50 for a faster run
            descriptors = descriptors[:10]
            responses = generate_llm_responses(model_pipeline, prompts)
            llm_text_outputs = responses.copy()
            # LangFair metrics
            langfair_metrics = evaluate_langfair_fairness(model_pipeline, prompts, responses)
            results["langfair"] = langfair_metrics

            # Your own custom holistic metric
            results["holistic_bias"] = evaluate_holistic_bias(prompts, responses, descriptors)

        save_results(results)

    else:
        raise ValueError(f"Unsupported model type: {model_type}")
