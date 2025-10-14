export class ProjectScopeModel {
  id?: number;
  assessmentId!: number;
  describeAiEnvironment!: string;
  isNewAiTechnology!: boolean;
  usesPersonalData!: boolean;
  projectScopeDocuments!: string;
  technologyType!: string;
  hasOngoingMonitoring!: boolean;
  unintendedOutcomes!: string;
  technologyDocumentation!: string;
  is_demo?: boolean;
  created_at?: Date;

  constructor(data: ProjectScopeModel) {
    this.id = data.id;
    this.assessmentId = data.assessmentId;
    this.describeAiEnvironment = data.describeAiEnvironment;
    this.isNewAiTechnology = data.isNewAiTechnology;
    this.usesPersonalData = data.usesPersonalData;
    this.projectScopeDocuments = data.projectScopeDocuments;
    this.technologyType = data.technologyType;
    this.hasOngoingMonitoring = data.hasOngoingMonitoring;
    this.unintendedOutcomes = data.unintendedOutcomes;
    this.technologyDocumentation = data.technologyDocumentation;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
  }

  static createNewProjectScope(data: ProjectScopeModel): ProjectScopeModel {
    return new ProjectScopeModel(data);
  }
}
