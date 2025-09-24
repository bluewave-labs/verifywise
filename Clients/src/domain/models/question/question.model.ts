export class QuestionModel {
  id?: number;
  order_no?: number;
  question!: string;
  hint!: string;
  priority_level!: "high priority" | "medium priority" | "low priority";
  answer_type!: string;
  input_type!: string;
  evidence_required!: boolean;
  is_required!: boolean;
  dropdown_options?: any[];
  evidence_files?: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];
  answer?: string;
  subtopic_id!: number;
  is_demo?: boolean;
  created_at?: Date;
  status?: "Not started" | "In progress" | "Done";

  constructor(data: QuestionModel) {
    this.id = data.id;
    this.order_no = data.order_no;
    this.question = data.question;
    this.hint = data.hint;
    this.priority_level = data.priority_level;
    this.answer_type = data.answer_type;
    this.input_type = data.input_type;
    this.evidence_required = data.evidence_required;
    this.is_required = data.is_required;
    this.dropdown_options = data.dropdown_options;
    this.evidence_files = data.evidence_files;
    this.answer = data.answer;
    this.subtopic_id = data.subtopic_id;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
    this.status = data.status;
  }

  static createNewQuestion(data: QuestionModel): QuestionModel {
    return new QuestionModel(data);
  }
}
