import unittest

from tests.base_test_metrics import BaseMetricsTestCase
from src.metrics import balance_positive_class


class TestBalancePositiveClass(BaseMetricsTestCase):
    def test_balance_positive_class_ratio_and_difference(self):
        metric_frame = balance_positive_class(
            y_true=self.y_true,
            y_pred_proba=self.y_scores,
            protected_attributes=self.protected_attributes,
        )

        ratio = float(metric_frame.ratio(method="between_groups"))
        difference = float(metric_frame.difference(method="between_groups"))

        self.assertAlmostEqual(ratio, 0.648702328, places=9)
        self.assertAlmostEqual(difference, 0.213191682, places=9)


if __name__ == "__main__":
    unittest.main()

