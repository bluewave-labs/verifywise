from .base import PromptFormatter, PromptInput


class TinyLlamaFormatter(PromptFormatter):
    DEFAULTS = {
        "system_prompt": ("You are a strict classifier. You must answer with exactly one of "
                          "these two strings: '>50K' or '<=50K'. No explanation. No formatting."),
        "assistant_preamble": "The predicted income is ",
        "instruction": "Given the following demographic information about a person:",
    }
    
    def format(self, p: PromptInput) -> str:
        sys_text = p.system_prompt or ""
        assistant_prefix = p.assistant_preamble or ""

        if p.features:
            feat_lines = "\n".join(
                [f"- {k}: {v}" for k, v in p.features.items()]
            )
            user_text = f"{p.instruction}\n\nFeatures:\n{feat_lines}"
        else:
            user_text = p.instruction

        return f"<|system|>{sys_text}\n<|user|>{user_text}\n<|assistant|>{assistant_prefix}"
