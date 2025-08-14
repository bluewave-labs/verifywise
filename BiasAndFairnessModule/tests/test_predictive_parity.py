import unittest

from src.metrics import predictive_parity
from tests.base_test_metrics import BaseMetricsTestCase


class TestPredictiveParity(BaseMetricsTestCase):
    def test_predictive_parity_ratio_and_difference(self):
        metric_frame = predictive_parity(
            y_true=self.y_true,
            y_pred=self.y_pred,
            protected_attributes=self.protected_attributes,
        )

        ratio = float(metric_frame.ratio(method="between_groups"))
        difference = float(metric_frame.difference(method="between_groups"))

        self.assertAlmostEqual(ratio, 0.78, places=9)
        self.assertAlmostEqual(difference, 0.0789743589, places=9)


if __name__ == "__main__":
    unittest.main()
