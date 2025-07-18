from langfair.metrics.toxicity import ToxicityMetrics
from langfair.metrics.stereotype import StereotypeMetrics

def evaluate_toxicity(prompts, responses):
    tox = ToxicityMetrics()
    results = tox.evaluate(prompts=prompts, responses=responses)
    return results

def evaluate_stereotypes(prompts, responses):
    stereo = StereotypeMetrics()
    results = stereo.evaluate(prompts=prompts, responses=responses)
    return results
