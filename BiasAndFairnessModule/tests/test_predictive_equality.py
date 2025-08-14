import unittest

from tests.base_test_metrics import BaseMetricsTestCase
from src.metrics import predictive_equality


class TestPredictiveEquality(BaseMetricsTestCase):
    def test_predictive_equality_ratio_and_difference(self):
        metric_frame = predictive_equality(
            y_true=self.y_true,
            y_pred=self.y_pred,
            protected_attributes=self.protected_attributes,
        )

        ratio = float(metric_frame.ratio(method="between_groups"))
        difference = float(metric_frame.difference(method="between_groups"))

        self.assertAlmostEqual(ratio, 0.427025199, places=9)
        self.assertAlmostEqual(difference, 0.306342963, places=9)


if __name__ == "__main__":
    unittest.main()

