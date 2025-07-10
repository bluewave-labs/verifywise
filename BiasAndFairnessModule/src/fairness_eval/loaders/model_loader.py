import joblib
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch

# scikit-learn classifiers
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier


def load_sklearn_model(path):
    """Loads a serialized scikit-learn model from a .joblib file."""
    return joblib.load(path)


def load_hf_llm_model(model_name: str):
    """Loads a Hugging Face text generation pipeline (e.g., Mistral, GPT2)."""
    print("Device set to use", "cuda" if torch.cuda.is_available() else "mps:0" if torch.backends.mps.is_available() else "cpu")

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)

    device = 0 if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else -1

    return pipeline("text-generation", model=model, tokenizer=tokenizer, device=device)


def identify_model_type(model, config):
    """
    Determines whether the model is an LLM or tabular model,
    based on the config or model instance.
    """
    if config.get("model", {}).get("type") == "huggingface":
        return "llm"
    
    if isinstance(model, (LogisticRegression, RandomForestClassifier, SVC, MLPClassifier)):
        return "tabular_classification"
    
    return "unknown"

