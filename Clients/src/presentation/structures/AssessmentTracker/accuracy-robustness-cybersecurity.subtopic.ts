export const AccuracyRobustnessCyberSecurity = [
  {
    id: 1,
    title: "System validation and reliability documentation",
    questions: [
      {
        id: 1,
        question:
          "What is your strategy for testing the model? How does this strategy differ from the validation strategy, and why?",
        hint: "Explain how your model testing strategy differs from validation and why this approach is necessary.",
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
          "How will the AI system be served to end-users? What considerations have been made to ensure accessibility, reliability, and security?",
        hint: "Describe considerations for serving the AI system to end users, focusing on accessibility, reliability, and security.",
        priorityLevel: "high priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
    ],
  },
  {
    id: 2,
    title: "AI system change documentation",
    questions: [
      {
        id: 1,
        question:
          "What monitoring systems will be in place to track the AI system's performance in the production environment? How will this data be used to maintain or improve the system?",
        hint: "Detail the monitoring systems in place to track performance in production and how this data is used to maintain or improve the AI system.",
        priorityLevel: "medium priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
      {
        id: 2,
        question:
          "Are the details of the cloud provider and secure deployment architecture clearly defined, and what specific measures have been taken to address AI system security risks, including jailbreaks, and adversarial attacks?",
        hint: "Describe the security measures taken for the AI system, including secure deployment, protection against jailbreaks, and adversarial attacks.",
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
          "How will your organization detect and address risks associated with changing data quality, potential data drift, and model decay? What thresholds have been set to trigger intervention?",
        hint: "Explain how your organization monitors data quality, potential data drift, and model decay, including thresholds for intervention.",
        priorityLevel: "medium priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
    ],
  },
];
