import { Question } from "../models/question.model";

export const questions: Question[] = [
  {
    id: 1,
    subtopicId: 1,
    questionText: "What is the purpose of this feature?",
    answerType: "Multiple Choice",
    dropdownOptions: "Option A,Option B,Option C",
    hasFileUpload: false,
    hasHint: true,
    isRequired: true,
    priorityOptions: "High,Medium,Low",
  },
  {
    id: 2,
    subtopicId: 2,
    questionText: "How often do you use this functionality?",
    answerType: "Short Answer",
    dropdownOptions: "",
    hasFileUpload: false,
    hasHint: false,
    isRequired: true,
    priorityOptions: "High,Medium,Low",
  },
  {
    id: 3,
    subtopicId: 3,
    questionText: "Please upload any relevant documents.",
    answerType: "File Upload",
    dropdownOptions: "",
    hasFileUpload: true,
    hasHint: true,
    isRequired: true,
    priorityOptions: "High,Medium,Low",
  },
  // Additional question data...
];
