from __future__ import annotations

from scorers.judge_runner import LLMJudgeRunner

import os
from dotenv import load_dotenv
load_dotenv()

os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")


def main() -> None:
    runner = LLMJudgeRunner()

    input_text = (
        "Machine learning is a field of study that gives computers the ability "
        "to learn without being explicitly programmed."
    )

    model_output = (
        "Machine learning lets computers learn from data instead of having "
        "all rules coded by hand."
    )

    expected_text = (
        "Machine learning is about algorithms that improve their performance "
        "at tasks through experience (data) rather than explicit instructions."
    )

    result = runner.judge(
        scorer_slug="summarization-quality",
        input_text=input_text,
        output_text=model_output,
        expected_text=expected_text,
    )

    print("Judge result:")
    print(f"  Label: {result.label}")
    print(f"  Score: {result.score}")
    print()
    print("Raw judge response:")
    print(result.raw_response)
    if result.total_tokens is not None:
        print()
        print("Token usage:")
        print(f"  prompt_tokens: {result.prompt_tokens}")
        print(f"  completion_tokens: {result.completion_tokens}")
        print(f"  total_tokens: {result.total_tokens}")


if __name__ == "__main__":
    main()