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
    results = {}

    # Check if HuggingFace model is enabled
    if hasattr(config.model, "huggingface") and config.model.huggingface.enabled:
        print("Running LLM fairness evaluation...")
        hf_cfg = config.model.huggingface
        model_loader = ModelLoader(
            model_id=hf_cfg.model_id,
            device=hf_cfg.device,
            max_new_tokens=hf_cfg.max_new_tokens,
            temperature=hf_cfg.temperature,
            top_p=hf_cfg.top_p,
            system_prompt=hf_cfg.system_prompt
        )
        # Support both HuggingFace and scikit-learn tabular datasets for LLM fairness
        if config.dataset.platform.lower() == "huggingface":
            prompts = load_llm_prompt_dataset(config.dataset.name)
            prompts = prompts[:16]  # Dev testing
        elif config.dataset.platform.lower() == "scikit-learn":
            # Use DataLoader to load tabular data and generate prompts
            data_loader = DataLoader(config.dataset)
            df = data_loader.load_data()
            # Generate prompts for all rows (or a sample)
            prompts = data_loader.get_sample_prompts(list(range(min(16, len(df)))))
        else:
            raise ValueError(f"Unsupported dataset platform for LLM fairness: {config.dataset.platform}")
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
        print("Running tabular fairness evaluation...")
        data_loader = DataLoader(config.dataset)
        df = data_loader.load_data()
        X = df.drop(columns=[config.dataset.target_column])
        y = df[config.dataset.target_column]
        A = df[config.dataset.protected_attributes[0]]
        model_path = "model.joblib"  # Or use config.model.sklearn.model_path if available
        model = load_sklearn_model(model_path)
        results = evaluate_fairness(X, y, A, model)
        for k, v in results.items():
            print(f"{k}: {v:.4f}")

if __name__ == "__main__":
    main() 