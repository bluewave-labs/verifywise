export type Question = {
  id: number;
  subtopicId: number;
  questionText: string;
  answerType: string;
  evidenceFileRequired: boolean;
  hint: string;
  isRequired: boolean;
  priorityLevel: "high priority" | "medium priority" | "low priority";
  evidenceFiles?: string[];
};
