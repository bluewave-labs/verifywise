import { FileData } from "./File";

export type Question = {
  question_id?: number;
  order_no?: number;
  question: string;
  hint: string;
  priority_level: "high priority" | "medium priority" | "low priority";
  answer_type: string;
  input_type: string;
  evidence_required: boolean;
  is_required: boolean;
  dropdown_options?: any[];
  evidence_files?: FileData[];
  answer?: string;
  subtopic_id: number;
  status: string;
  answer_id: number;
};
