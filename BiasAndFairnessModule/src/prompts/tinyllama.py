from .base import PromptFormatter, PromptInput


class TinyLlamaFormatter(PromptFormatter):
    def format(self, p: PromptInput) -> str:
        sys_text = p.system_prompt or ""
        assistant_prefix = p.assistant_preamble or ""

        if p.features:
            feat_lines = "\n".join(
                [f"- {k.replace('_', '.')}: {v}" for k, v in p.features.items()]
            )
            user_text = f"{p.instruction}\n\nFeatures:\n{feat_lines}"
        else:
            user_text = p.instruction

        return f"<|system|>{sys_text}\n<|user|>{user_text}\n<|assistant|>{assistant_prefix}"
