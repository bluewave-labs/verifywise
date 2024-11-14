export type Question = {
  id: number;
  subtopicId: number;
  questionText: string;
  answerType: string;
  dropdownOptions: string;
  hasFileUpload: boolean;
  hasHint: boolean;
  isRequired: boolean;
  priorityOptions: string;
};
