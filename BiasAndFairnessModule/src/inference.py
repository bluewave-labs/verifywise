from typing import List, Optional, Union, Dict, Any, cast

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
            RuntimeError: If data loading fails
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
        
        self.model_loader = ModelLoader(
            model_id=model_config.huggingface.model_id,
            device=model_config.huggingface.device,
            max_new_tokens=model_config.huggingface.max_new_tokens,
            temperature=model_config.huggingface.temperature,
            top_p=model_config.huggingface.top_p,
            system_prompt=model_config.huggingface.system_prompt,
        )

    def generate_prompts(
        self, batch_size: Optional[int] = None
    ) -> Union[List[Dict[str, Any]], List[List[Dict[str, Any]]]]:
        """
        Generate prompts from the loaded data.

        Args:
            batch_size (Optional[int], optional): If provided, return samples in batches. 
                Defaults to None.

        Returns:
            Union[List[Dict[str, Any]], List[List[Dict[str, Any]]]]: List of dictionaries 
                containing prompts and metadata, or list of batches if batch_size is provided.
                Each dictionary has:
                - sample_id: Index of the row
                - prompt: Formatted prompt for the row
                - answer: Target column value for the row
                - protected_attributes: Dictionary of protected attribute values
        """
        return self.data_loader.generate_prompts_and_metadata(batch_size)

    def run_inference(
        self, 
        prompts: Union[str, List[str]], 
        system_prompt: Optional[str] = None
    ) -> List[str]:
        """
        Run model inference on the given prompts.

        Args:
            prompts (Union[str, List[str]]): Input prompt(s) for prediction
            system_prompt (Optional[str], optional): System prompt for the model.
                If None, uses the one from model_config. Defaults to None.

        Returns:
            List[str]: Generated responses

        Raises:
            RuntimeError: If no model has been loaded
        """
        return self.model_loader.predict(prompts, system_prompt)

    def run_batch_inference(
        self, 
        batch_size: Optional[int] = None,
        system_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Run inference on batches of data.

        Args:
            batch_size (Optional[int], optional): Size of batches to process. 
                If None, processes all data at once. Defaults to None.
            system_prompt (Optional[str], optional): System prompt for the model.
                If None, uses the one from model_config. Defaults to None.

        Returns:
            List[Dict[str, Any]]: List of dictionaries containing inference results.
                Each dictionary has:
                - sample_id: Index of the row
                - prompt: Original prompt
                - answer: Ground truth answer
                - prediction: Model's prediction
                - protected_attributes: Dictionary of protected attribute values

        Raises:
            RuntimeError: If no model has been loaded
        """
        # Generate prompts and metadata
        samples = self.generate_prompts(batch_size)
        
        # If no batching, process all at once
        if batch_size is None:
            samples_list = cast(List[Dict[str, Any]], samples)
            prompts = [sample["prompt"] for sample in samples_list]
            predictions = self.run_inference(prompts, system_prompt)
            
            # Add predictions to samples
            for sample, prediction in zip(samples_list, predictions):
                sample["prediction"] = prediction
            
            return samples_list
        
        # Process in batches
        results: List[Dict[str, Any]] = []
        samples_batches = cast(List[List[Dict[str, Any]]], samples)
        for batch in samples_batches:
            prompts = [sample["prompt"] for sample in batch]
            predictions = self.run_inference(prompts, system_prompt)
            
            # Add predictions to samples
            for sample, prediction in zip(batch, predictions):
                sample["prediction"] = prediction
                results.append(sample)
        
        return results
