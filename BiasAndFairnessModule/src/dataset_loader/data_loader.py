from typing import Any, Dict, List, Optional, Union

import pandas as pd
from datasets import Dataset, load_dataset
from sklearn.datasets import fetch_openml
import numpy as np


class DataLoader:
    """
    A class to load and preprocess datasets based on configuration parameters.
    """

    def __init__(self, dataset_config):
        """
        Initialize the DataLoader with dataset configuration.

        Args:
            dataset_config (DatasetConfig): Dataset configuration objects
            containing:
                - name: Name of the dataset
                - source: Source path/identifier of the dataset
                - split: Split of the dataset to use
                - platform: Platform to load from (e.g., 'huggingface', 'scikit-learn')
                - protected_attributes: List of protected attribute columns
                - target_column: Name of the target column
                - sampling: Optional sampling configuration
        """
        self.dataset_config = dataset_config
        self.data: Optional[pd.DataFrame] = None

    def load_data(self) -> pd.DataFrame:
        """
        Load the dataset based on configuration parameters.

        Returns:
            pd.DataFrame: Loaded dataset
        """
        if self.dataset_config.platform.lower() == "huggingface":
            # Try to load the specified split, handle if unavailable
            split = self.dataset_config.split
            try:
                dataset = load_dataset(self.dataset_config.source, split=split)
            except Exception as e:
                raise ValueError(
                    f"Could not load split:'{split}' for dataset '{self.dataset_config.source}'. Error: {e}"
                )
            if isinstance(dataset, Dataset):
                # Convert to pandas DataFrame
                self.data = pd.DataFrame(dataset)
                # Replace "?" values with "unknown"
                self.data = self.data.replace("?", "Unknown")
            else:
                raise ValueError("Expected a Dataset object from Huggingface")
        elif self.dataset_config.platform.lower() == "scikit-learn":
            # Support for scikit-learn datasets
            if self.dataset_config.source == "scikit-learn/adult-census-income":
                data = fetch_openml("adult", version=2, as_frame=True)
                df = data.frame
                self.data = df
            else:
                raise ValueError(f"Unknown scikit-learn dataset: {self.dataset_config.source}")
        else:
            raise ValueError(f"Unsupported platform: {self.dataset_config.platform}")

        # Apply sampling if enabled
        if hasattr(self.dataset_config, "sampling") and getattr(
            self.dataset_config.sampling, "enabled", False
        ):
            sampling_config = self.dataset_config.sampling
            n_samples = sampling_config.n_samples
            random_seed = getattr(sampling_config, "random_seed", 42)

            if isinstance(self.data, pd.DataFrame):
                self.data = self.data.sample(
                    n=min(n_samples, len(self.data)), random_state=random_seed
                ).reset_index(drop=True)

        return self.data

    def _format_single_prompt(
        self, row: pd.Series, include_answer: bool = False
    ) -> Dict[str, Any]:
        """
        Convert a single row of data into a features dictionary for prompting.

        Args:
            row (pd.Series): A single row from the dataset
            include_answer (bool): Ignored; answer inclusion is handled downstream

        Returns:
            Dict[str, Any]: Feature dictionary with column names underscore-normalized
        """
        # Get all columns except the target column
        feature_columns = [
            col for col in self.data.columns if col != self.dataset_config.target_column
        ]

        # Normalize keys (convert periods and hyphens to underscores) and map values
        features: Dict[str, Any] = {}
        for col in feature_columns:
            key = col.replace(".", "_").replace("-", "_")
            value = row[col]
            # Convert NumPy scalar types (e.g., np.int64) to native Python types
            if isinstance(value, np.generic):
                value = value.item()
            features[key] = value

        return features

    def get_sample_prompts(
        self, indices: Union[int, List[int]], include_answer: bool = False
    ) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Get feature dictionaries for one or more rows by their indices.

        Args:
            indices (Union[int, List[int]]): Single index or list of
                                             indices to get prompts for
            include_answer (bool): Whether to include the target column
                                   value as answer

        Returns:
            Union[Dict[str, Any], List[Dict[str, Any]]]: Single features dict if
                                   indices is int, list of features dicts if list

        Raises:
            ValueError: If data hasn't been loaded yet or if indices are out
                        of range
        """
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first.")

        # Convert single index to list for uniform processing
        if isinstance(indices, int):
            indices = [indices]
            return_single = True
        else:
            return_single = False

        # Validate indices
        if not all(0 <= idx < len(self.data) for idx in indices):
            raise ValueError(
                f"Some indices are out of range. Valid range: 0 to "
                f"{len(self.data)-1}"
            )

        # Generate feature dicts for all requested indices
        items = [
            self._format_single_prompt(self.data.iloc[idx], include_answer)
            for idx in indices
        ]

        # Return single dict if input was single index, list otherwise
        return items[0] if return_single else items

    def _extract_protected_attributes(self, row: pd.Series) -> Dict[str, Any]:
        """
        Extract protected attributes from a row.

        Args:
            row (pd.Series): A single row from the dataset

        Returns:
            Dict[str, Any]: Dictionary containing protected attribute values
        """
        return {attr: row[attr] for attr in self.dataset_config.protected_attributes}

    def generate_prompts_and_metadata(
        self, batch_size: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate a list of sample dictionaries containing features and answers.

        Args:
            batch_size (Optional[int]): If provided, return samples in batches
                                         as nested lists

        Returns:
            If batch_size is None:
                List[Dict]: List of dictionaries with keys:
                - sample_id: Index of the row
                - prompt: Features dictionary for the row
                - answer: Target column value for the row
                - protected_attributes: Dictionary of protected attribute values
            If batch_size is provided:
                List[List[Dict]]: List of batches, where each batch is a list
                                   of dictionaries as described above

        Raises:
            ValueError: If data hasn't been loaded yet
        """
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first.")

        samples = []
        current_batch = []

        for idx in range(len(self.data)):
            row = self.data.iloc[idx]
            sample = {
                "sample_id": idx,
                "prompt": self._format_single_prompt(row),
                "answer": row[self.dataset_config.target_column],
                "protected_attributes": self._extract_protected_attributes(row),
            }

            if batch_size is None:
                samples.append(sample)
            else:
                current_batch.append(sample)
                if len(current_batch) == batch_size:
                    samples.append(current_batch)
                    current_batch = []

        # Add remaining samples if using batch_size
        if batch_size is not None and current_batch:
            samples.append(current_batch)

        return samples
