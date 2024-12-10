export const TechnicalDocumentation = [
  {
    id: 1,
    title: "AI model capability assessment",
    questions: [
      {
        id: 1,
        question:
          "What is the source of the model being used? If it's a pre-existing model, how was it selected? If it's being developed in-house, what was the development process?",
        hint: "Detail your reasoning for choosing the high-risk AI system, referencing the AI provider’s documentation, or describe your involvement in any modifications or development processes.",
        priorityLevel: "high priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
      {
        id: 2,
        question:
          "What is your strategy for validating the model? How does this strategy ensure the model meets its intended purposes while minimizing unintended consequences?",
        hint: "Describe your organization’s validation processes for the AI system, emphasizing actions taken to mitigate risks in sensitive use cases.",
        priorityLevel: "medium priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
      {
        id: 3,
        question:
          "How is your organization documenting AI performance in the training environment? What metrics are being used, and how do they relate to the agreed objectives?",
        hint: "Outline your model evaluation process, including performance measures, model workflow, and updates based on project impact assessments.",
        priorityLevel: "high priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
    ],
  },
];
