import unittest

from src.metrics import equalized_odds
from tests.base_test_metrics import BaseMetricsTestCase


class TestEqualizedOdds(BaseMetricsTestCase):
    def test_equalized_odds_value(self):
        value = equalized_odds(
            y_true=self.y_true,
            y_pred=self.y_pred,
            protected_attributes=self.protected_attributes,
        )

        self.assertAlmostEqual(value, 0.306342963063, places=12)


if __name__ == "__main__":
    unittest.main()
