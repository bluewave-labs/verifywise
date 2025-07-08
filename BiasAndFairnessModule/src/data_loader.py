from typing import Optional

import pandas as pd
from datasets import Dataset, load_dataset


class DataLoader:
    """
    A class to load and preprocess datasets based on configuration parameters.
    """

    def __init__(self, dataset_config):
        """
        Initialize the DataLoader with dataset configuration.

        Args:
            dataset_config (DatasetConfig): Dataset configuration object containing:
                - name: Name of the dataset
                - source: Source path/identifier of the dataset
                - platform: Platform to load from (e.g., 'huggingface')
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
            # Load dataset and ensure we get a Dataset object
            dataset = load_dataset(self.dataset_config.source, split="train")
            if isinstance(dataset, Dataset):
                # Convert to pandas DataFrame
                self.data = pd.DataFrame(dataset)
            else:
                raise ValueError("Expected a Dataset object from Huggingface")
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
                )

        return self.data
