import json

from .base import PromptFormatter, PromptInput


class OpenAIChatJSONFormatter(PromptFormatter):
    def format(self, p: PromptInput):
        sys_text = p.system_prompt or (
            "You are an ML assistant helping with a fairness evaluation on the Adult Census Income dataset. "
            "Given tabular features for one person, predict income_bracket as either '<=50K' or '>50K'. "
            "Return STRICT JSON with keys: prediction (string), confidence (0-1 float). No extra text."
        )
        user = "Features:\n" + json.dumps(p.features, ensure_ascii=False) + "\n\nReturn only JSON as specified."
        return [
            {"role": "system", "content": sys_text},
            {"role": "user", "content": user},
        ]


