type ProjectScope = {
  description: string;
  isNewAItechnology: boolean;
  personalSensitiveDataUsed: boolean;
  projectScopeDocuments: string[];
};

type TechnologyDetails = {
  technologyType: string;
  ongoingMonitoring: boolean;
  unintendedOutcomes: string[];
  technologyDocumentation: string[];
};

type ModelDevelopment = {
  modelSource: string;
  modelAssessment: string;
  riskMitigationStrategies: string;
  evidence: string[];
};

type ModelValidation = {
  validationStrategy: string;
  errorMarginImpact: string;
  validationTestEvidence: string[];
};

type HighRiskConformityAssessment = {
  projectScope: ProjectScope;
  technologyDetails: TechnologyDetails;
  modelDevelopment: ModelDevelopment;
  modelValidation: ModelValidation;
};

const mockAssessmentData: HighRiskConformityAssessment = {
  projectScope: {
    description: "This is an AI-driven chatbot that assists with customer support using natural language processing (NLP) and machine learning to automate responses.",
    isNewAItechnology: true,
    personalSensitiveDataUsed: true,
    projectScopeDocuments: ["scope_doc_1.pdf", "scope_doc_2.pdf", "scope_doc_3.pdf"],
  },
  technologyDetails: {
    technologyType: "Natural Language Processing (NLP) and Machine Learning",
    ongoingMonitoring: true,
    unintendedOutcomes: ["Biased responses", "Incorrect information delivery", "Sensitive data leakage"],
    technologyDocumentation: ["tech_doc_1.pdf", "tech_doc_2.pdf", "tech_doc_3.pdf"],
  },
  modelDevelopment: {
    modelSource: "In-house developed NLP model fine-tuned using company-specific data.",
    modelAssessment: "The model has been assessed for fairness, robustness, and explainability. Fairness assessment focuses on avoiding biases against certain demographic groups.",
    riskMitigationStrategies: "Bias detection algorithms are implemented, and training data is diversified to reduce bias. Robust testing has been performed under various conditions to ensure performance.",
    evidence: ["fairness_assessment.pdf", "robustness_report.pdf", "explainability_study.pdf"],
  },
  modelValidation: {
    validationStrategy: "The model is validated through a series of automated and manual test cases designed to evaluate accuracy, relevance, and bias. Continuous retraining ensures model updates over time.",
    errorMarginImpact: "There is a potential risk of different error rates across demographic groups, which is addressed by adding fairness constraints to the model during retraining.",
    validationTestEvidence: ["validation_test_1.pdf", "validation_test_2.pdf", "validation_test_3.pdf"],
  },
};

export { mockAssessmentData };
