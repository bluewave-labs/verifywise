import pandas as pd
from datasets import load_dataset

def load_tabular_dataset(path, protected_attr):
    df = pd.read_csv(path)
    
    if protected_attr not in df.columns:
        raise ValueError(f"Protected attribute '{protected_attr}' not found in dataset.")

    label_col = df.columns[-1]  # assume label is the last column
    if label_col == protected_attr:
        raise ValueError("Protected attribute and label column cannot be the same.")

    X = df.drop(columns=[label_col])
    y = df[label_col]
    A = df[protected_attr]

    return X, y, A



def load_llm_prompt_dataset(name="crows_pairs"):
    dataset = load_dataset(name, split="test")
    prompts = [row["sent_more"] for row in dataset] + [row["sent_less"] for row in dataset]
    return prompts


def load_holistic_bias_dataset(split="sentences"):
    dataset = load_dataset("fairnlp/holistic-bias", split="test", name=split)
    print(dataset.column_names)

    if split == "nouns":
        prompts = [row["pattern"].replace("{descriptor}", row["noun_phrase"]) for row in dataset]
        descriptors = [row["noun_phrase"] for row in dataset]
    elif split == "sentences":
        prompts = [row["text"] for row in dataset]
        descriptors = [row["descriptor"] for row in dataset]
    else:
        raise ValueError(f"Unsupported split '{split}' for holistic-bias dataset.")
    return prompts, descriptors




