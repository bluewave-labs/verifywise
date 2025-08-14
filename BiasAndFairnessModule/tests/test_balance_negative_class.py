import unittest

from src.metrics import balance_negative_class
from tests.base_test_metrics import BaseMetricsTestCase


class TestBalanceNegativeClass(BaseMetricsTestCase):
    def test_balance_negative_class_ratio_and_difference(self):
        metric_frame = balance_negative_class(
            y_true=self.y_true,
            y_pred_proba=self.y_scores,
            protected_attributes=self.protected_attributes,
        )

        ratio = float(metric_frame.ratio(method="between_groups"))
        difference = float(metric_frame.difference(method="between_groups"))

        self.assertAlmostEqual(ratio, 0.684072790, places=9)
        self.assertAlmostEqual(difference, 0.185452927, places=9)


if __name__ == "__main__":
    unittest.main()
