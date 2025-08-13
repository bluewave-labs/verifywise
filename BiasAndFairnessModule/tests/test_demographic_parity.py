import unittest

import numpy as np

from tests.base_test_metrics import BaseMetricsTestCase
from src.metrics import demographic_parity


class TestDemographicParity(BaseMetricsTestCase):
    def test_value_in_range(self):
        value = demographic_parity(self.y_true, self.y_pred, self.protected_attributes)
        self.assertTrue(0.0 <= value <= 1.0)

    def test_value_close_to_expected(self):
        value = demographic_parity(self.y_true, self.y_pred, self.protected_attributes)
        self.assertTrue(
            np.isclose(value, 0.26157, atol=0.05),
            msg=f"demographic_parity={value}",
        )


if __name__ == "__main__":
    unittest.main()


