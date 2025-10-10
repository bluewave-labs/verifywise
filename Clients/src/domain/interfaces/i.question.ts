import { Question } from "../types/Question";

export interface IQuestionProps {
  question: Question;
  setRefreshKey: () => void;
  currentProjectId: number;
}
