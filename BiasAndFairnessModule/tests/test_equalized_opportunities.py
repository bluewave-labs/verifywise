import unittest

from src.metrics import equalized_opportunities
from tests.base_test_metrics import BaseMetricsTestCase


class TestEqualizedOpportunities(BaseMetricsTestCase):
    def test_equalized_opportunities_ratio_and_difference(self):
        metric_frame = equalized_opportunities(
            y_true=self.y_true,
            y_pred=self.y_pred,
            protected_attributes=self.protected_attributes,
        )

        ratio = float(metric_frame.ratio(method="between_groups"))
        difference = float(metric_frame.difference(method="between_groups"))

        self.assertAlmostEqual(ratio, 0.556430446, places=9)
        self.assertAlmostEqual(difference, 0.175753974, places=9)


if __name__ == "__main__":
    unittest.main()
