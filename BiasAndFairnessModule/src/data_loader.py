from typing import List, Optional, Union

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
                # Replace "?" values with "unknown"
                self.data = self.data.replace("?", "Unknown")
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

    def _format_single_prompt(
        self, row: pd.Series, include_answer: bool = False
    ) -> str:
        """
        Format a single row of data into a prompt string.

        Args:
            row (pd.Series): A single row from the dataset
            include_answer (bool): Whether to include the target column value as answer

        Returns:
            str: Formatted prompt string

        Raises:
            ValueError: If data hasn't been loaded yet
        """
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first.")

        # Get all columns except the target column
        feature_columns = [
            col for col in self.data.columns if col != self.dataset_config.target_column
        ]

        # Create the demographic information string
        demographic_info = "\n".join(
            [
                f"- {col.replace('_', ' ').title()}: {row[col]}"
                for col in feature_columns
            ]
        )

        prompt = f"""Given the following demographic information about a person:\n{demographic_info}
        \nBased ONLY on the information provided, predict whether their income is '>50K' or '<=50K'. Respond with only the string '>50K' or '<=50K'."""

        if include_answer:
            answer = row[self.dataset_config.target_column]
            prompt += f"\nAnswer: {answer}"

        return prompt

    def get_prompts(
        self, indices: Union[int, List[int]], include_answer: bool = False
    ) -> Union[str, List[str]]:
        """
        Get formatted prompts for one or more rows by their indices.

        Args:
            indices (Union[int, List[int]]): Single index or list of indices to get prompts for
            include_answer (bool): Whether to include the target column value as answer

        Returns:
            Union[str, List[str]]: Single prompt string if indices is int, list of prompt strings if indices is list

        Raises:
            ValueError: If data hasn't been loaded yet or if indices are out of range
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
                f"Some indices are out of range. Valid range: 0 to {len(self.data)-1}"
            )

        # Generate prompts for all requested indices
        prompts = [
            self._format_single_prompt(self.data.iloc[idx], include_answer)
            for idx in indices
        ]

        # Return single string if input was single index, list otherwise
        return prompts[0] if return_single else prompts
