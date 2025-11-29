class OllamaClient:
    def __init__(self, model: str, host: str = "http://localhost:11434", timeout_s: int = 60):
        self.model = model
        self.host = host
        self.timeout_s = timeout_s

def batch_infer(rows, model_cfg: dict):
    return [], [], []  # placeholder for Step 3
