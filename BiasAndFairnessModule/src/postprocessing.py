import ast
from pathlib import Path
from typing import Dict, Optional

import pandas as pd

from .config import ConfigManager


class PostProcessor:
    """Class for handling post-processing operations on model predictions."""

    def __init__(self, config_manager: ConfigManager):
        """
        Initialize the PostProcessor with a configuration manager.

        Args:
            config_manager (ConfigManager): Manager used to access configuration sections.
        """

        # Store config manager and extract relevant sections
        self.config_manager = config_manager
        self.post_processing_config = self.config_manager.get_post_processing_config()
        self.artifacts_config = self.config_manager.get_artifacts_config()

        # Always use inference_results_path from artifacts for loading the dataset
        self.dataset_path = self.artifacts_config.inference_results_path

        # Store binary mapping
        self.favorable_outcome = (
            self.post_processing_config.binary_mapping.favorable_outcome
        )
        self.unfavorable_outcome = (
            self.post_processing_config.binary_mapping.unfavorable_outcome
        )

        # Create binary encoding mapping
        self.binary_mapping = {self.favorable_outcome: 1, self.unfavorable_outcome: 0}

        # Store attribute groups
        self.attribute_groups = {
            attr: {"privileged": group.privileged, "unprivileged": group.unprivileged}
            for attr, group in self.post_processing_config.attribute_groups.items()
        }

        # Initialize internal state
        self.df: Optional[pd.DataFrame] = None
        self._load_dataset()

    def _load_dataset(self) -> None:
        """Load the initial dataset from the provided path."""
        self.df = pd.read_csv(self.dataset_path)

    def expand_protected_attributes(self) -> None:
        """
        Expands the protected attributes column into separate columns.
        The protected_attributes column should contain string representations of dictionaries.
        """
        # Convert string representation of dict to actual dict using ast.literal_eval
        self.df["protected_attributes"] = self.df["protected_attributes"].apply(
            ast.literal_eval
        )

        # Expand the protected attributes into separate columns
        protected_attrs_expanded = pd.json_normalize(
            self.df["protected_attributes"].tolist()
        )

        # Combine the original dataframe with expanded attributes
        self.df = pd.concat(
            [self.df.drop("protected_attributes", axis=1), protected_attrs_expanded],
            axis=1,
        )

    def encode_binary_columns(self) -> None:
        """
        Encode the 'answer' and 'prediction' columns using binary mapping from config.

        Raises:
            ValueError: If required columns ('answer' or 'prediction') are missing
        """
        required_columns = ["answer", "prediction"]
        missing_columns = [
            col for col in required_columns if col not in self.df.columns
        ]

        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")

        # Encode both columns using the binary mapping
        for column in required_columns:
            self.df[column] = self.df[column].map(self.binary_mapping)

            # Check if any values couldn't be mapped
            unmapped = self.df[column].isna()
            if unmapped.any():
                invalid_values = self.df.loc[unmapped, column].unique()
                raise ValueError(
                    f"Found invalid values in {column} column that don't match binary mapping: {invalid_values}"
                )

    def encode_protected_attributes(self) -> None:
        """
        Encode protected attributes based on privileged/unprivileged groups from config.
        Privileged groups are encoded as 1, unprivileged groups as 0.

        Raises:
            ValueError: If any protected attribute column is missing or contains invalid values
        """
        # Check if all protected attributes exist in DataFrame
        missing_attrs = [
            attr for attr in self.attribute_groups.keys() if attr not in self.df.columns
        ]
        if missing_attrs:
            raise ValueError(f"Missing protected attribute columns: {missing_attrs}")

        # Encode each protected attribute
        for attr, groups in self.attribute_groups.items():
            # Create mapping dictionary for this attribute
            attr_mapping = {value: 1 for value in groups["privileged"]}
            attr_mapping.update({value: 0 for value in groups["unprivileged"]})

            # Apply mapping
            self.df[attr] = self.df[attr].map(attr_mapping)

            # Check for unmapped values
            unmapped = self.df[attr].isna()
            if unmapped.any():
                invalid_values = self.df.loc[unmapped, attr].unique()
                raise ValueError(
                    f"Found invalid values in {attr} column that don't match group definitions: {invalid_values}"
                )

    def run(self) -> pd.DataFrame:
        """
        Execute the full post-processing pipeline:
        1. Load and expand protected attributes
        2. Encode binary columns (answer and prediction)
        3. Encode protected attributes

        Returns:
            pd.DataFrame: Fully processed DataFrame with all encodings applied
        """
        try:
            # Step 1: Expand protected attributes
            self.expand_protected_attributes()

            # Step 2: Encode binary columns
            self.encode_binary_columns()

            # Step 3: Encode protected attributes
            self.encode_protected_attributes()

            # Persist results to disk
            self.save_results()

            return self.df.copy()

        except Exception as e:
            raise ValueError(f"Error during post-processing pipeline: {str(e)}") from e

    def get_encodings(self) -> Dict:
        """
        Get the encoding mappings used in the post-processing.

        Returns:
            Dict: Dictionary containing all encoding mappings used
        """
        return {
            "binary_mapping": self.binary_mapping,
            "protected_attributes": {
                attr: {
                    "privileged": 1,
                    "unprivileged": 0,
                    "mapping": {
                        **{val: 1 for val in groups["privileged"]},
                        **{val: 0 for val in groups["unprivileged"]},
                    },
                }
                for attr, groups in self.attribute_groups.items()
            },
        }

    def save_results(self) -> Path:
        """
        Save post-processed results to the configured artifacts path as a CSV file.

        Returns:
            Path: The file path where results were saved.

        Raises:
            ValueError: If there is no DataFrame available to save.
        """
        if self.df is None:
            raise ValueError(
                "No DataFrame available to save. Run processing or pass a DataFrame."
            )

        output_path = self.artifacts_config.postprocessed_results_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        self.df.to_csv(output_path, index=False)
        return output_path
