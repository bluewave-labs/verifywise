"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update hints for Project Scope questions (subtopic_id 1 and 2)
    // These are the 8 questions under "Project scope" topic

    const hints = [
      // General section (subtopic order_no 1)
      {
        question: "Describe the AI environment/application used.",
        hint: "Provide details about the infrastructure, platform, and primary use cases of your AI system. Include information about the deployment environment (cloud/on-premise), main functionalities, and target users.",
      },
      {
        question: "Is a new form of AI technology used?",
        hint: "Indicate whether you're using emerging or experimental AI technologies. Consider novel algorithms, cutting-edge architectures, or recent developments not yet widely adopted in the industry.",
      },
      {
        question: "Are personal sensitive data used?",
        hint: "Specify if the system processes personal data as defined by GDPR (e.g., health data, biometric data, financial information, location data). Describe any data anonymization or pseudonymization measures if applicable.",
      },
      {
        question: "Project scope documents description",
        hint: "Summarize the key project documentation including objectives, deliverables, boundaries, and constraints. Reference any formal project charter, requirements documents, or scope statements.",
      },
      // Technology details section (subtopic order_no 2)
      {
        question:
          "What type of AI technology are you using? Explain AI and ML technologies used.",
        hint: "Detail the specific AI/ML techniques employed (e.g., deep learning, NLP, computer vision, reinforcement learning). Include model architectures, frameworks, and key algorithms used in your system.",
      },
      {
        question:
          "Is there ongoing monitoring of the system to ensure that the system is operating as intended?",
        hint: "Describe monitoring mechanisms including performance metrics tracked, alerting thresholds, logging practices, and frequency of reviews. Include tools and dashboards used for observability.",
      },
      {
        question:
          "Have you considered unintended outcomes that could occur from the use of this system?",
        hint: "Document potential risks such as algorithmic bias, misuse scenarios, edge cases, and failure modes. Explain mitigation strategies and safeguards implemented to address these concerns.",
      },
      {
        question:
          "Add technology documentation. You can include a data flow diagram, MLops lifecycle diagram. Think of it as an executive summary of the technology you are using.",
        hint: "Upload or describe technical documentation including system architecture diagrams, data flow diagrams, API specifications, and MLOps pipeline documentation. Provide an executive-level overview of your technology stack.",
      },
    ];

    for (const item of hints) {
      await queryInterface.sequelize.query(
        `UPDATE public.questions_struct_eu SET hint = :hint WHERE question = :question`,
        {
          replacements: { hint: item.hint, question: item.question },
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert hints back to matching the question text
    const questions = [
      "Describe the AI environment/application used.",
      "Is a new form of AI technology used?",
      "Are personal sensitive data used?",
      "Project scope documents description",
      "What type of AI technology are you using? Explain AI and ML technologies used.",
      "Is there ongoing monitoring of the system to ensure that the system is operating as intended?",
      "Have you considered unintended outcomes that could occur from the use of this system?",
      "Add technology documentation. You can include a data flow diagram, MLops lifecycle diagram. Think of it as an executive summary of the technology you are using.",
    ];

    for (const question of questions) {
      await queryInterface.sequelize.query(
        `UPDATE public.questions_struct_eu SET hint = :hint WHERE question = :question`,
        {
          replacements: { hint: question, question: question },
        }
      );
    }
  },
};
