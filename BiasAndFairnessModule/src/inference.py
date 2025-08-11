from pathlib import Path
from typing import Any, Dict, List, Optional, Union, cast

import pandas as pd
from tqdm import tqdm

from .config import ConfigManager
from .data_loader import DataLoader
from .model_loader import ModelLoader


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
        self, batch_size: Optional[int] = None, limit_samples: Optional[int] = None
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
                flat_samples = [
                    sample
                    for batch in cast(List[List[Dict[str, Any]]], samples)
                    for sample in batch
                ]
                flat_samples = flat_samples[:limit_samples]
                samples = [
                    flat_samples[i : i + batch_size]
                    for i in range(0, len(flat_samples), batch_size)
                ]
                return samples

        return samples

    def _run_inference(
        self, prompts: Union[str, List[str]], system_prompt: Optional[str] = None
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
        limit_samples: Optional[int] = None,
        auto_save: bool = True,
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
            auto_save (bool, optional): If True, automatically saves results to the
                configured artifacts path after inference completes. Defaults to True.

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
            if auto_save:
                self.save_inference_results(samples_list)
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
        if auto_save:
            self.save_inference_results(results)
        return results

    def save_inference_results(self, results: List[Dict[str, Any]]) -> Path:
        """Save inference results to the configured artifacts path without column expansion.

        Args:
            results: List of result dictionaries returned by run_batch_inference.

        Returns:
            Path: The path where the CSV file was written.
        """
        artifacts_config = self.config_manager.get_artifacts_config()
        inference_results_path: Path = artifacts_config.inference_results_path
        inference_results_path.parent.mkdir(parents=True, exist_ok=True)

        pd.DataFrame(results).to_csv(inference_results_path, index=False)
        return inference_results_path
