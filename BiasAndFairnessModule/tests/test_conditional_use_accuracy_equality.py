import unittest

from src.metrics import conditional_use_accuracy_equality
from tests.base_test_metrics import BaseMetricsTestCase


class TestConditionalUseAccuracyEquality(BaseMetricsTestCase):
    def test_npv_and_ppv_ratio_and_difference(self):
        result = conditional_use_accuracy_equality(
            y_true=self.y_true,
            y_pred=self.y_pred,
            protected_attributes=self.protected_attributes,
        )

        # NPV checks
        npv_ratio = float(result.npv.ratio(method="between_groups"))
        npv_diff = float(result.npv.difference(method="between_groups"))
        self.assertAlmostEqual(npv_ratio, 0.943449929, places=9)
        self.assertAlmostEqual(npv_diff, 0.035660306, places=9)

        # PPV checks
        ppv_ratio = float(result.ppv.ratio(method="between_groups"))
        ppv_diff = float(result.ppv.difference(method="between_groups"))
        self.assertAlmostEqual(ppv_ratio, 0.78, places=9)
        self.assertAlmostEqual(ppv_diff, 0.078974359, places=9)


if __name__ == "__main__":
    unittest.main()
