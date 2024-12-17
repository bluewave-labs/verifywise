export const RiskManagementSystem = [
  {
    id: 1,
    title: "Transparency and provision of information to deployers",
    questions: [
      {
        id: 1,
        question:
          "Will you make substantial modifications to the high-risk AI system already on the EU market, and if so, what additional training or fine-tuning will be performed on the model after these modifications?",
        hint: "As a deployer, you are responsible for any additional changes made to the high-risk AI system and must fulfill additional requirements based on the data used and the specific use case you are deploying.",
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
          "What business problem does the AI system solve, and what are its capabilities? What other techniques were considered before deciding to use AI to address this problem?",
        hint: "It's important to provide transparent information about why you are choosing a high-risk AI system, including a mapping of key stages within the project and an assessment of resources and capabilities within your team or organization.",
        priorityLevel: "high priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
      {
        id: 3,
        question:
          "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
        hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
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
    title: "Responsibilities along the AI value chain",
    questions: [
      {
        id: 1,
        question:
          "Specify details of any third-party involvement in the design, development, deployment, and support of the AI system.",
        hint: "Ensure you map out all high-risk AI system providers and other parties involved in the AI lifecycle. If personal information is used by the high-risk AI system, conduct a privacy impact assessment to mitigate privacy threats. Request documentation from the provider to start addressing this.",
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
          "What risks were identified in the data impact assessment? How have these risks been addressed or mitigated?",
        hint: "Make sure perosnal infomration is used by the high risk AI system, we need to conduct a privacy impact assessment to make sure privacy threats are mitigated ask for this from the provider to start thinking about it",
        priorityLevel: "high priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
      {
        id: 3,
        question:
          "How has the selection or development of the model been assessed with regard to fairness, explainability, and robustness? What specific risks were identified in this assessment?",
        hint: "Responsible AI principles should be evulauated on your high risk system indivaually, and make sure your high risk ai provider has an effective AI governance mechanism to continously test and validate metrics regarding to fairness explianavbility and robostnuss of theirn high risk system",
        priorityLevel: "high priority",
        answerType: "Long text",
        inputType: "Tiptap area",
        evidenceFileRequired: false,
        isRequired: true,
        evidenceFiles: [],
      },
      {
        id: 4,
        question:
          "What strategies have been implemented to address the risks identified in the model assessment? How effective have these strategies been?",
        hint: "Provide a breakdown of the risk mitigation strategies identified during due diligence and how your contractual and organizational measures were implemented.",
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
