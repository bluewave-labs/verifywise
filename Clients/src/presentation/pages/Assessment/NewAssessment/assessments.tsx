import { RiskManagementSystem } from "../../../structures/AssessmentTracker/risk-management-system.subtopic";
import { DataGovernance } from "../../../structures/AssessmentTracker/data-governance.subtopic";
import { TechnicalDocumentation } from "../../../structures/AssessmentTracker/technical-documentation.subtopic";
import { RecordKeeping } from "../../../structures/AssessmentTracker/record-keeping.subtopic";
import { TransparencyAndUserInformation } from "../../../structures/AssessmentTracker/transparency-user-information.subtopic";
import { HumanOversight } from "../../../structures/AssessmentTracker/human-oversight.subtopic";
import { AccuracyRobustnessCyberSecurity } from "../../../structures/AssessmentTracker/accuracy-robustness-cybersecurity.subtopic";
import { ConformityAssessment } from "../../../structures/AssessmentTracker/conformity-assessment.subtopic";
import { PostMarketMonitoring } from "../../../structures/AssessmentTracker/post-market-monitoring.subtopic";
import { BiasMonitoringAndMitigation } from "../../../structures/AssessmentTracker/bias-monitoring-and-mitigation.subtopic";
import { AccountabilityAndGovernance } from "../../../structures/AssessmentTracker/accountability-and-governance.subtopic";
import { Explainability } from "../../../structures/AssessmentTracker/explainability.subtopic";
import { EnvironmentalImpact } from "../../../structures/AssessmentTracker/environmental-impact.subtopic";
import { ProjectScope } from "../../../structures/AssessmentTracker/project-scope.subtopic";

export const assessments = [
  { id: 0, title: "ProjectScope", component: ProjectScope },
  { id: 1, title: "RiskManagementSystem", component: RiskManagementSystem },
  { id: 2, title: "DataGovernance", component: DataGovernance },
  { id: 3, title: "TechnicalDocumentation", component: TechnicalDocumentation },
  { id: 4, title: "RecordKeeping", component: RecordKeeping },
  {
    id: 5,
    title: "TransparencyAndUserInformation",
    component: TransparencyAndUserInformation,
  },
  { id: 6, title: "HumanOversight", component: HumanOversight },
  {
    id: 7,
    title: "AccuracyRobustnessCyberSecurity",
    component: AccuracyRobustnessCyberSecurity,
  },
  { id: 8, title: "ConformityAssessment", component: ConformityAssessment },
  { id: 9, title: "PostMarketMonitoring", component: PostMarketMonitoring },
  {
    id: 10,
    title: "BiasMonitoringAndMitigation",
    component: BiasMonitoringAndMitigation,
  },
  {
    id: 11,
    title: "AccountabilityAndGovernance",
    component: AccountabilityAndGovernance,
  },
  { id: 12, title: "Explainability", component: Explainability },
  { id: 13, title: "EnvironmentalImpact", component: EnvironmentalImpact },
];
