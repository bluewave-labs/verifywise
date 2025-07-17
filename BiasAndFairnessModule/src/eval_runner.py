from pathlib import Path
from src.config import ConfigManager
from src.data_loader import DataLoader
from src.model_loader import load_sklearn_model, ModelLoader
from src.fairness_eval.evaluation.fairness_evaluator import evaluate_fairness
from src.fairness_eval.evaluation.llm_fairness_evaluator import evaluate_toxicity, evaluate_stereotypes
from src.fairness_eval.evaluation.holistic_bias_evaluator import evaluate_holistic_bias
from src.fairness_eval.evaluation.langfairness_evaluator import evaluate_langfair_fairness
from src.fairness_eval.engine.inference import generate_llm_responses
from src.fairness_eval.loaders.data_loader import load_llm_prompt_dataset, load_holistic_bias_dataset
import json


def main():
    # Load config using the main module's config system
    config_manager = ConfigManager()
    config = config_manager.config
    model_type = config.model.type
    print(f"Detected model type: {model_type}")
    results = {}

    if model_type == "sklearn":
        print("Running tabular fairness evaluation...")
        data_loader = DataLoader(config.dataset)
        df = data_loader.load_data()
        X = df.drop(columns=[config.dataset.target_column])
        y = df[config.dataset.target_column]
        A = df[config.dataset.protected_attributes[0]]
        model = load_sklearn_model(config.model.model_path)
        results = evaluate_fairness(X, y, A, model)
        for k, v in results.items():
            print(f"{k}: {v:.4f}")

    elif model_type == "huggingface":
        print("Running LLM fairness evaluation...")
        model_name = config.model.model_id
        # Use ModelLoader from src.model_loader
        model_loader = ModelLoader(
            model_id=model_name,
            device=config.model.device if hasattr(config.model, 'device') else 'cpu',
            max_new_tokens=config.model.max_new_tokens if hasattr(config.model, 'max_new_tokens') else 512,
            temperature=config.model.temperature if hasattr(config.model, 'temperature') else 0.7,
            top_p=config.model.top_p if hasattr(config.model, 'top_p') else 0.9,
            system_prompt=getattr(config.model, 'system_prompt', 'You are a helpful AI assistant.')
        )
        # Use fairness_eval's loader for prompts
        prompts = load_llm_prompt_dataset(config.dataset.name)
        prompts = prompts[:16]  # Dev testing
        responses = model_loader.predict(prompts)
        if "toxicity" in config.metrics.disparity:
            results["toxicity"] = evaluate_toxicity(prompts, responses)
        if "stereotype" in config.metrics.disparity:
            results["stereotype"] = evaluate_stereotypes(prompts, responses)
        if "holistic_bias" in config.metrics.disparity:
            prompts, descriptors = load_holistic_bias_dataset("sentences")
            prompts = prompts[:10]
            descriptors = descriptors[:10]
            responses = model_loader.predict(prompts)
            results["holistic_bias"] = evaluate_holistic_bias(prompts, responses, descriptors)
            results["langfair"] = evaluate_langfair_fairness(model_loader, prompts, responses)
        print(json.dumps(results, indent=2))
        with open("llm_eval_report.json", "w") as f:
            json.dump(results, f, indent=2)
            print("Saved LLM evaluation results to llm_eval_report.json")
    else:
        raise ValueError(f"Unsupported model type: {model_type}")

if __name__ == "__main__":
    main() 