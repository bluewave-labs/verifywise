export interface IProjectScope {
  id?: number;
  assessmentId: number;
  describeAiEnvironment: string;
  isNewAiTechnology: boolean;
  usesPersonalData: boolean;
  projectScopeDocuments: string;
  technologyType: string;
  hasOngoingMonitoring: boolean;
  unintendedOutcomes: string;
  technologyDocumentation: string;
  created_at?: Date;
}
