import { ProjectScope } from "./subtopics/01-project-scope.subtopic";
import { RiskManagementSystem } from "./subtopics/02-risk-management-system.subtopic";
import { DataGovernance } from "./subtopics/03-data-governance.subtopic";
import { TechnicalDocumentation } from "./subtopics/04-technical-documentation.subtopic";
import { RecordKeeping } from "./subtopics/05-record-keeping.subtopic";
import { TransparencyAndUserInformation } from "./subtopics/06-transparency-user-information.subtopic";
import { HumanOversight } from "./subtopics/07-human-oversight.subtopic";
import { AccuracyRobustnessCyberSecurity } from "./subtopics/08-accuracy-robustness-cybersecurity.subtopic";
import { ConformityAssessment } from "./subtopics/09-conformity-assessment.subtopic";
import { PostMarketMonitoring } from "./subtopics/10-post-market-monitoring.subtopic";
import { BiasMonitoringAndMitigation } from "./subtopics/11-bias-monitoring-and-mitigation.subtopic";
import { AccountabilityAndGovernance } from "./subtopics/12-accountability-and-governance.subtopic";
import { Explainability } from "./subtopics/13-explainability.subtopic";
import { EnvironmentalImpact } from "./subtopics/14-environmental-impact.subtopic";

export const Topics = [
  { order_no: 0, title: "Project scope", subtopics: ProjectScope },
  {
    order_no: 1,
    title: "Risk management system",
    subtopics: RiskManagementSystem,
  },
  { order_no: 2, title: "Data governance", subtopics: DataGovernance },
  {
    order_no: 3,
    title: "Technical documentation",
    subtopics: TechnicalDocumentation,
  },
  { order_no: 4, title: "Record keeping", subtopics: RecordKeeping },
  {
    order_no: 5,
    title: "Transparency & user information",
    subtopics: TransparencyAndUserInformation,
  },
  { order_no: 6, title: "Human oversight", subtopics: HumanOversight },
  {
    order_no: 7,
    title: "Accuracy, robustness, cyber security",
    subtopics: AccuracyRobustnessCyberSecurity,
  },
  {
    order_no: 8,
    title: "Conformity assessment",
    subtopics: ConformityAssessment,
  },
  {
    order_no: 9,
    title: "Post-market monitoring",
    subtopics: PostMarketMonitoring,
  },
  {
    order_no: 10,
    title: "Bias monitoring and mitigation",
    subtopics: BiasMonitoringAndMitigation,
  },
  {
    order_no: 11,
    title: "Accountability and governance",
    subtopics: AccountabilityAndGovernance,
  },
  { order_no: 12, title: "Explainability", subtopics: Explainability },
  {
    order_no: 13,
    title: "Environmental impact",
    subtopics: EnvironmentalImpact,
  },
];
