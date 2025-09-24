export class AssessmentModel {
  id?: number;
  project_id!: number;
  is_demo?: boolean;
  created_at?: Date;

  constructor(data: AssessmentModel) {
    this.id = data.id;
    this.project_id = data.project_id;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
  }

  static createNewAssessment(data: AssessmentModel): AssessmentModel {
    return new AssessmentModel(data);
  }
}
