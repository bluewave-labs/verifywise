import unittest

from tests.base_test_metrics import BaseMetricsTestCase
from src.metrics import calibration


class TestCalibrationMetric(BaseMetricsTestCase):
    def test_calibration_ratio_and_difference(self):
        metric_frame = calibration(
            y_true=self.y_true,
            y_pred_proba=self.y_scores,
            protected_attributes=self.protected_attributes,
        )

        ratio = float(metric_frame.ratio(method="between_groups"))
        difference = float(metric_frame.difference(method="between_groups"))

        self.assertAlmostEqual(ratio, 0.8464818194, places=10)
        self.assertAlmostEqual(difference, 0.051970213833, places=12)


if __name__ == "__main__":
    unittest.main()

