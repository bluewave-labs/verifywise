import { PageTourStep } from "../../components/PageTour";
import { Shield, Layout, CirclePlus, Eye } from "lucide-react";

const BiasAndFairnessSteps: PageTourStep[] = [
  {
    target: '[data-joyride-id="fairness-tabs"]',
    content: {
      header: "Evaluation methods",
      body: "Choose between ML Evaluator for traditional classification models or LLM Evaluator for advanced bias detection in language models. Each provides specialized fairness metrics.",
      icon: <Layout size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="validate-fairness-button"]',
    content: {
      header: "Validate fairness",
      body: "Upload your model and dataset to perform comprehensive bias and fairness analysis. Assess demographic parity, equalized odds, and other fairness metrics.",
      icon: <Shield size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="new-evaluation-button"]',
    content: {
      header: "Create new evaluation",
      body: "Configure dataset and model parameters for comprehensive LLM bias evaluation. Select fairness metrics and define protected attribute groups for analysis.",
      icon: <CirclePlus size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="demo-evaluation-button"]',
    content: {
      header: "View demo results",
      body: "Explore a sample evaluation report to understand bias metrics, fairness analysis, and actionable insights before running your own evaluations.",
      icon: <Eye size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default BiasAndFairnessSteps;
