from validate import reason_codes as R


def test_reason_codes_exist():
    assert R.TRIG_SEMANTIC_INVALID == "TRIG_SEMANTIC_INVALID"
    assert R.TRIG_SEMANTIC_PARSE_ERROR == "TRIG_SEMANTIC_PARSE_ERROR"
