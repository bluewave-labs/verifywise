/**
 * @file assessments.req.structure.ts
 * @description This file provides an example of the request structure for the assessments page.
 */

/**
 * @constant {Object} assessmentsReqStructure
 * @description The structure of the request for the assessments page.
 * @property {number} assessmentId - The ID of the assessment that our assessment is related to.
 * @property {string} topic - The topic that is currently selected and will be used to filter the subtopics.
 * @property {Array<Object>} subtopic - The subtopics that are currently selected and will be used to filter the questions.
 * @property {number} subtopic[].topicId - The ID of the topic, will be placed here after the topic is created.
 * @property {string} subtopic[].name - The name of the subtopic.
 * @property {Array<Object>} subtopic[].questions - The questions that are currently being answered.
 * @property {number} subtopic[].questions[].subtopicId - The ID of the subtopic.
 * @property {string} subtopic[].questions[].questionText - The text of the question.
 * @property {string} subtopic[].questions[].answerType - The type of the answer (e.g., "Long text").
 * @property {boolean} subtopic[].questions[].evidenceFileRequired - Indicates if an evidence file is required.
 * @property {string} subtopic[].questions[].hint - A hint for answering the question.
 * @property {boolean} subtopic[].questions[].isRequired - Indicates if the question is required.
 * @property {string} subtopic[].questions[].priorityLevel - The priority level of the question (e.g., "high priority").
 * @property {string} subtopic[].questions[].answer - The content of the answer written by the user.
 * @property {Array<Object>} subtopic[].questions[].evidenceFiles - The evidence files that are currently uploaded.
 */
export const assessmentsReqStructure = {
  assessmentId: 1234, // the id of the assessment that our assessment is related to
  topic: "Risk management system", // topic that is currently selected and will be used to filter the subtopics
  subtopic: [
    // subtopics that are currently selected and will be used to filter the questions
    {
      topicId: 1, // Will be placed here after topic is created
      name: "Transparency and provision of information to deployers",
      questions: [
        // questions that are currently being answered
        {
          subtopicId: 1,
          questionText:
            "Will you make substantial modifications to the high-risk AI system already on the EU market, and if so, what additional training or fine-tuning will be performed on the model after these modifications?",
          answerType: "Long text",
          evidenceFileRequired: false,
          hint: "As a deployer, you are responsible for any additional changes made to the high-risk AI system and must fulfill additional requirements based on the data used and the specific use case you are deploying.",
          isRequired: true,
          priorityLevel: "high priority",
          answer: "Content of the answer written by the user",
          evidenceFiles: [
            // evidence files that are currently uploaded
          ],
        },
      ],
    },
  ],
};
