from typing import List, Optional, Union, Dict, Any, cast
from tqdm import tqdm

from .data_loader import DataLoader
from .model_loader import ModelLoader
from .config import ConfigManager


class ModelInferencePipeline:
    """
    A pipeline class that combines data loading and model inference for bias and fairness evaluation.
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the inference pipeline.

        Args:
            config_path (Optional[str], optional): Path to the config file. 
                If not provided, uses default config path. Defaults to None.

        Raises:
            ValueError: If Hugging Face model is not enabled in config
            RuntimeError: If data loading or model loading fails
        """
        # Load configuration
        self.config_manager = ConfigManager(config_path)
        
        # Initialize and load data
        self.data_loader = DataLoader(self.config_manager.get_dataset_config())
        try:
            self.data_loader.load_data()
        except Exception as e:
            raise RuntimeError(f"Failed to load dataset: {str(e)}")
        
        # Initialize model loader from config
        model_config = self.config_manager.get_model_config()
        if not model_config.huggingface.enabled:
            raise ValueError("Hugging Face model must be enabled in config")
        
        try:
            self.model_loader = ModelLoader(
                model_id=model_config.huggingface.model_id,
                device=model_config.huggingface.device,
                max_new_tokens=model_config.huggingface.max_new_tokens,
                temperature=model_config.huggingface.temperature,
                top_p=model_config.huggingface.top_p,
                system_prompt=model_config.huggingface.system_prompt,
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load model: {str(e)}")

    def generate_prompts(
        self, 
        batch_size: Optional[int] = None,
        limit_samples: Optional[int] = None
    ) -> Union[List[Dict[str, Any]], List[List[Dict[str, Any]]]]:
        """
        Generate prompts from the loaded data.

        Args:
            batch_size (Optional[int], optional): If provided, return samples in batches. 
                Defaults to None.
            limit_samples (Optional[int], optional): If provided, only generate prompts for 
                the first N samples. Useful for testing. Defaults to None.

        Returns:
            Union[List[Dict[str, Any]], List[List[Dict[str, Any]]]]: List of dictionaries 
                containing prompts and metadata, or list of batches if batch_size is provided.
                Each dictionary has:
                - sample_id: Index of the row
                - prompt: Formatted prompt for the row
                - answer: Target column value for the row
                - protected_attributes: Dictionary of protected attribute values
        """
        samples = self.data_loader.generate_prompts_and_metadata(batch_size)
        
        if limit_samples is not None:
            if batch_size is None:
                # For non-batched data, simply limit the samples
                samples_list = cast(List[Dict[str, Any]], samples)
                return samples_list[:limit_samples]
            else:
                flat_samples = [sample for batch in cast(List[List[Dict[str, Any]]], samples) for sample in batch]
                flat_samples = flat_samples[:limit_samples]
                samples = [flat_samples[i:i+batch_size] for i in range(0, len(flat_samples), batch_size)]
                return samples
        
        return samples

    def _run_inference(
        self, 
        prompts: Union[str, List[str]], 
        system_prompt: Optional[str] = None
    ) -> List[str]:
        """
        Internal method to run model inference on the given prompts.

        Args:
            prompts (Union[str, List[str]]): Input prompt(s) for prediction
            system_prompt (Optional[str], optional): System prompt for the model.
                If None, uses the one from model_config. Defaults to None.

        Returns:
            List[str]: Generated responses
        """
        return self.model_loader.predict(prompts, system_prompt)

    def run_batch_inference(
        self, 
        batch_size: Optional[int] = None,
        system_prompt: Optional[str] = None,
        limit_samples: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Run inference on data, with optional batching.

        Args:
            batch_size (Optional[int], optional): Size of batches to process. 
                If None, processes all data at once. Defaults to None.
            system_prompt (Optional[str], optional): System prompt for the model.
                If None, uses the one from model_config. Defaults to None.
            limit_samples (Optional[int], optional): If provided, only process the first N samples. 
                Useful for testing. Defaults to None.

        Returns:
            List[Dict[str, Any]]: List of dictionaries containing inference results.
                Each dictionary has:
                - sample_id: Index of the row
                - prompt: Original prompt
                - answer: Ground truth answer
                - prediction: Model's prediction
                - protected_attributes: Dictionary of protected attribute values
        """
        # Generate prompts and metadata
        samples = self.generate_prompts(batch_size, limit_samples)
        
        # If no batching, process all at once
        if batch_size is None:
            samples_list = cast(List[Dict[str, Any]], samples)
            prompts = [sample["prompt"] for sample in samples_list]
            predictions = self._run_inference(prompts, system_prompt)
            
            # Add predictions to samples
            for sample, prediction in zip(samples_list, predictions):
                sample["prediction"] = prediction
            
            return samples_list
        
        # Process in batches
        results: List[Dict[str, Any]] = []
        samples_batches = cast(List[List[Dict[str, Any]]], samples)
        
        for batch in tqdm(samples_batches, desc="Processing batches"):
            prompts = [sample["prompt"] for sample in batch]
            predictions = self._run_inference(prompts, system_prompt)
            
            # Add predictions to samples
            for sample, prediction in zip(batch, predictions):
                sample["prediction"] = prediction
                results.append(sample)
        
        return results


def run_all_evaluations(config_path: Optional[str] = None, limit_samples: Optional[int] = 16, 
                       compass_config: Optional[Dict[str, Any]] = None):
    """
    Run all evaluations using the ModelInferencePipeline and EvaluationRunner.
    
    Args:
        config_path (Optional[str], optional): Path to the config file. Defaults to None.
        limit_samples (Optional[int], optional): Number of samples to evaluate. Defaults to 16.
        compass_config (Optional[Dict[str, Any]], optional): Configuration for Fairness Compass Engine.
            Defaults to None.
    
    Returns:
        Dict[str, Any]: Evaluation results
    """
    # Import here to avoid circular imports
    from .eval_runner import EvaluationRunner
    import json
    
    try:
        # Create inference pipeline
        inference_pipeline = ModelInferencePipeline(config_path)
        
        # Generate prompts and run inference
        samples = inference_pipeline.generate_prompts(limit_samples=limit_samples)
        prompts = [sample["prompt"] for sample in samples]
        responses = inference_pipeline.model_loader.predict(prompts)
        
        # Create evaluation runner and run evaluations
        evaluator = EvaluationRunner(
            df=inference_pipeline.data_loader.data,
            inference_pipeline=inference_pipeline,
            config=inference_pipeline.config_manager.config
        )
        
        results = evaluator.run_all_evaluations("llm", prompts=prompts, responses=responses)
        
        # Add fairness compass information to results
        if compass_config is None:
            compass_config = {
                "enforce_policy": False,
                "ground_truth_available": True,
                "output_type": "label",
                "fairness_focus": "precision"
            }
        
        # Add compass configuration to results
        results["fairness_compass_config"] = compass_config
        
        # Save results
        print(json.dumps(results, indent=2))
        with open("llm_eval_report.json", "w") as f:
            json.dump(results, f, indent=2)
            print("Saved LLM evaluation results to llm_eval_report.json")
        
        return results
        
    except Exception as e:
        print(f"Error running evaluations: {str(e)}")
        raise


def run_fairness_compass_evaluation(config_path: Optional[str] = None, 
                                   compass_config: Optional[Dict[str, Any]] = None):
    """
    Run fairness compass evaluation specifically for tabular data.
    
    Args:
        config_path (Optional[str], optional): Path to the config file. Defaults to None.
        compass_config (Optional[Dict[str, Any]], optional): Configuration for Fairness Compass Engine.
            Defaults to None.
    
    Returns:
        Dict[str, Any]: Fairness compass evaluation results
    """
    # Import here to avoid circular imports
    from .eval_runner import evaluate_fairness_compass
    from .data_loader import DataLoader
    from .model_loader import load_sklearn_model
    from .config import ConfigManager
    import json
    
    try:
        # Load configuration
        config_manager = ConfigManager(config_path)
        config = config_manager.config
        
        # Load dataset
        data_loader = DataLoader(config.dataset)
        df = data_loader.load_data()
        print(f"Loaded dataset with {len(df)} samples")
        
        # Prepare data for tabular evaluation
        X = df.drop(columns=[config.dataset.target_column])
        y = df[config.dataset.target_column]
        A = df[config.dataset.protected_attributes[0]]
        
        # Load model
        model_path = "model.joblib"
        model = load_sklearn_model(model_path)
        
        # Run fairness compass evaluation
        results = evaluate_fairness_compass(X, y, A, model, compass_config)
        
        # Save results
        print(json.dumps(results, indent=2))
        with open("fairness_compass_report.json", "w") as f:
            json.dump(results, f, indent=2)
            print("Saved Fairness Compass evaluation results to fairness_compass_report.json")
        
        return results
        
    except Exception as e:
        print(f"Error running fairness compass evaluation: {str(e)}")
        raise
