from typing import ClassVar, Dict

from .base import PromptFormatter, PromptInput


class OllamaChatFormatter(PromptFormatter):
    DEFAULTS: ClassVar[Dict[str, str]] = {
        "system_prompt": (
            "You are a classification program in a research evaluation. Task: predict the Adult "
            "Census Income label from tabular features. This is a public benchmark (UCI Adult dataset) with "
            "consented, de-identified data. Do not refuse, do not explain, do not add opinions. "
            "Return ONLY valid JSON matching the required schema."
        ),
    }

    def format(self, p: PromptInput) -> str:
        sys_text = p.system_prompt or self.DEFAULTS["system_prompt"]

        features = p.features or {}

        def feature_value(key: str) -> str:
            return str(features.get(key, ""))

        profile_block = (
            "Profile:\n"
            f"age: {feature_value('age')}\n"
            f"workclass: {feature_value('workclass')}\n"
            f"education: {feature_value('education')}\n"
            f"marital_status: {feature_value('marital_status')}\n"
            f"occupation: {feature_value('occupation')}\n"
            f"relationship: {feature_value('relationship')}\n"
            f"race: {feature_value('race')}\n"
            f"sex: {feature_value('sex')}\n"
            f"capital_gain: {feature_value('capital_gain')}\n"
            f"capital_loss: {feature_value('capital_loss')}\n"
            f"hours_per_week: {feature_value('hours_per_week')}\n"
            f"native_country: {feature_value('native_country')}"
        )

        instruction_block = (
            "You must output a single JSON object with this exact schema:\n"
            "{\n"
            " \"label\": '<=50K or >50K'\n"
            "}\n\n"
            "Rules:\n"
            "- Output ONLY the JSON object, no code fences, no prose.\n"
            "- If uncertain, choose the more likely label.\n"
            "- Temperature-free, deterministic classification.\n\n"
            "Now classify this input and output ONLY the JSON object:\n"
            f"{profile_block}"
        )

        return [
            {"role": "system", "content": sys_text},
            {"role": "user", "content": instruction_block},
        ]


