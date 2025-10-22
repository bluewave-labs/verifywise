from src.core.config import ConfigManager
from src.inference.inference_pipeline import InferencePipeline
from src.eval_engine.postprocessing import PostProcessor
from src.eval_engine.evaluation.evaluator import FairnessEvaluator


if __name__ == "__main__":
    config_manager = ConfigManager()
    # inference_pipeline = InferencePipeline(config_manager)
    # inference_pipeline.run()

    # post_processor = PostProcessor(config_manager)
    # post_processor.run()

    evaluator = FairnessEvaluator(config_manager)
    evaluator.run()