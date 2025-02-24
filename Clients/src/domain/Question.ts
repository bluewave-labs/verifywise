export type Question = {
  id?: number;
  order_no?: number;
  question: string;
  hint: string;
  priority_level: "high priority" | "medium priority" | "low priority";
  answer_type: string;
  input_type: string;
  evidence_required: boolean;
  is_required: boolean;
  dropdown_options?: any[];
  evidence_files?: string[];
  answer?: string;
  subtopic_id: number;
};
