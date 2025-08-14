import unittest

from tests.base_test_metrics import BaseMetricsTestCase
from src.metrics import conditional_statistical_parity


class TestConditionalStatisticalParity(BaseMetricsTestCase):
    def test_conditional_statistical_parity_values(self):
        result = conditional_statistical_parity(
            y_pred=self.y_pred,
            protected_attributes=self.protected_attributes,
            legitimate_attributes=self.legitimate_attributes,
        )

        # Expected values as specified
        expected = [
            {
                "stratum": "0",
                "group_selection_rates": {"0": 0.19886363636363635, "1": 0.48},
                "disparity": 0.28113636363636363,
            },
            {
                "stratum": "2",
                "group_selection_rates": {"0": 0.2753623188405797, "1": 0.5625},
                "disparity": 0.2871376811594203,
            },
            {
                "stratum": "1",
                "group_selection_rates": {"0": 0.2376237623762376, "1": 0.44680851063829785},
                "disparity": 0.20918474826206024,
            },
        ]

        # Compare ignoring list order by indexing by stratum
        result_by_stratum = {entry["stratum"]: entry for entry in result}
        expected_by_stratum = {entry["stratum"]: entry for entry in expected}

        self.assertEqual(set(result_by_stratum.keys()), set(expected_by_stratum.keys()))

        # Tolerance for floating point comparisons
        for stratum, expected_entry in expected_by_stratum.items():
            self.assertIn(stratum, result_by_stratum)
            got_entry = result_by_stratum[stratum]

            # Check group_selection_rates
            exp_rates = expected_entry["group_selection_rates"]
            got_rates = got_entry["group_selection_rates"]
            self.assertEqual(set(exp_rates.keys()), set(got_rates.keys()))
            for group_key, exp_val in exp_rates.items():
                self.assertAlmostEqual(got_rates[group_key], exp_val, places=12)

            # Check disparity
            self.assertAlmostEqual(got_entry["disparity"], expected_entry["disparity"], places=12)


if __name__ == "__main__":
    unittest.main()

