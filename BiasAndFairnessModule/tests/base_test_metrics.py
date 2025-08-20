import unittest

import numpy as np


class BaseMetricsTestCase(unittest.TestCase):
    """
    Shared base class for fairness metric tests.

    Generates a small, reproducible synthetic dataset with bias across a
    protected attribute. Exposes:
      - self.n_samples
      - self.protected_attributes (group 0/1)
      - self.y_true (0/1)
      - self.y_pred (0/1)
      - self.y_scores ([0, 1])
      - self.legitimate_attributes (categorical strata for conditional metrics)
    """

    def setUp(self):
        # Global seed for reproducibility across all tests inheriting this base
        np.random.seed(42)

        # Match the provided generation spec exactly for deterministic results
        self.n_samples = 500

        # Protected attribute with class imbalance
        self.protected_attributes = np.random.choice(
            [0, 1], size=self.n_samples, p=[0.7, 0.3]
        ).astype(int)

        # Ground truth labels
        self.y_true = np.random.choice(
            [0, 1], size=self.n_samples, p=[0.6, 0.4]
        ).astype(int)

        # Biased predictions (group 1 has higher positive rate)
        self.y_pred = np.zeros(self.n_samples, dtype=int)
        for i in range(self.n_samples):
            if self.protected_attributes[i] == 0:
                self.y_pred[i] = np.random.choice([0, 1], p=[0.8, 0.2])
            else:
                self.y_pred[i] = np.random.choice([0, 1], p=[0.6, 0.4])

        # Continuous scores (clipped to [0,1] while preserving bias pattern)
        self.y_scores = (
            np.random.random(self.n_samples) * 0.8
        )  # Scale down initial values
        self.y_scores[
            self.protected_attributes == 1
        ] += 0.2  # Add bias while staying in [0,1]

        # Legitimate attribute for conditional metrics (e.g., conditional statistical parity)
        self.legitimate_attributes = np.random.choice(
            [0, 1, 2], size=self.n_samples, p=[0.5, 0.3, 0.2]
        ).astype(int)


# Intentionally no tests here; concrete test classes should inherit from BaseMetricsTestCase.
