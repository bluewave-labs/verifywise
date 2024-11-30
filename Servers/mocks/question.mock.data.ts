import { Question } from "../models/question.model";

export const questions: Question[] = [
  {
    id: 1,
    subtopicId: 1,
    questionText:
      "Will you make substantial modifications to the high-risk AI system already on the EU market, and if so, what additional training or fine-tuning will be performed on the model after these modifications?",
    answerType: "Long text",
    evidenceFileRequired: false,
    hint: "As a deployer, you are responsible for any additional changes made to the high-risk AI system and must fulfill additional requirements based on the data used and the specific use case you are deploying.",
    isRequired: true,
    priorityLevel: "high priority",
  },
  {
    id: 2,
    subtopicId: 1,
    questionText:
      "What business problem does the AI system solve, and what are its capabilities? What other techniques were considered before deciding to use AI to address this problem?",
    answerType: "Long text",
    evidenceFileRequired: false,
    hint: "It''s important to provide transparent information about why you are choosing a high-risk AI system, including a mapping of key stages within the project and an assessment of resources and capabilities within your team or organization.",
    isRequired: true,
    priorityLevel: "high priority",
  },
  {
    id: 3,
    subtopicId: 1,
    questionText:
      "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
    answerType: "Long text",
    evidenceFileRequired: true,
    hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
    isRequired: true,
    priorityLevel: "high priority",
  },
  // Additional question data...
];
