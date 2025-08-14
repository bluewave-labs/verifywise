import unittest

import numpy as np

from src.metrics import equal_selection_parity
from tests.base_test_metrics import BaseMetricsTestCase


class TestEqualSelectionParity(BaseMetricsTestCase):
    def test_output_and_expected_counts(self):
        result = equal_selection_parity(
            self.y_true, self.y_pred, self.protected_attributes
        )

        # Output format: keys are np.int64 group labels, values are Python ints
        self.assertIn(np.int64(0), result)
        self.assertIn(np.int64(1), result)
        self.assertIsInstance(result[np.int64(0)], int)
        self.assertIsInstance(result[np.int64(1)], int)

        # Exact expected counts
        self.assertEqual(result[np.int64(0)], 78)
        self.assertEqual(result[np.int64(1)], 75)


if __name__ == "__main__":
    unittest.main()
