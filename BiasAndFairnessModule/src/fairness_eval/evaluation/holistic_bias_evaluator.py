from collections import defaultdict
import numpy as np

def evaluate_holistic_bias(prompts, responses, descriptors):
    # Example: count negative sentiment or qualifiers per descriptor
    bias_counts = defaultdict(int)
    total = len(responses)
    for prompt, resp, desc in zip(prompts, responses, descriptors):
        if desc.lower() in resp.lower():
            bias_counts[desc] += 1
    return {f"Bias rate for {k}": v/total for k, v in bias_counts.items()}
