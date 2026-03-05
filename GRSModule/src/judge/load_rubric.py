from __future__ import annotations

from pathlib import Path
from config import load_yaml_model
from judge.rubric import JudgeRubric


def load_judge_rubric(path: Path) -> JudgeRubric:
    return load_yaml_model(path, JudgeRubric)
