import { AIliteracy } from "./controls/01-ai-literacy.controls";
import { TransparencyProvision } from "./controls/02-transparency-provision.controls";
import { HumanOversight } from "./controls/03-human-oversight.controls";
import { CorrectiveActionsDutyOfInfo } from "./controls/04-corrective-actions.controls";
import { ResponsibilitiesAlongAI } from "./controls/05-responsibilities.control";
import { ObligationsOfDeployersAIsystems } from "./controls/06-obligations-of-deployers.control";
import { FundamentalRightsImpactAssessments } from "./controls/07-fundamental-rights.control";
import { TransparencyObligationsForProviders } from "./controls/08-transparency-obligations-for-providers.control";
import { Registration } from "./controls/09-registration.control";
import { EUdatabaseForHighRiskAI } from "./controls/10-eu-database-for-high-risk.control";
import { PostMarketMonitoringByProviders } from "./controls/11-post-market-monitor-by-providers.control";
import { ReportingSeriousIncidents } from "./controls/12-report-serious-incidents.control";
import { GeneralPurposeAImodels } from "./controls/13-general-purpose-ai.control";

export const ControlCategories = [
  { order_no: 1, controlGroupTitle: "AI literacy", controls: AIliteracy },
  {
    order_no: 2,
    controlGroupTitle: "Transparency and provision of information to deployers",
    controls: TransparencyProvision,
  },
  {
    order_no: 3,
    controlGroupTitle: "Human oversight",
    controls: HumanOversight,
  },
  {
    order_no: 4,
    controlGroupTitle: "Corrective actions and duty of information",
    controls: CorrectiveActionsDutyOfInfo,
  },
  {
    order_no: 5,
    controlGroupTitle: "Responsibilities along the AI value chain",
    controls: ResponsibilitiesAlongAI,
  },
  {
    order_no: 6,
    controlGroupTitle: "Obligations of deployers of high-risk AI systems",
    controls: ObligationsOfDeployersAIsystems,
  },
  {
    order_no: 7,
    controlGroupTitle:
      "Fundamental rights impact assessments for high-risk AI systems",
    controls: FundamentalRightsImpactAssessments,
  },
  {
    order_no: 8,
    controlGroupTitle:
      "Transparency obligations for providers and users of certain AI systems",
    controls: TransparencyObligationsForProviders,
  },
  { order_no: 9, controlGroupTitle: "Registration", controls: Registration },
  {
    order_no: 10,
    controlGroupTitle:
      "EU database for high-risk AI systems listed in Annex III",
    controls: EUdatabaseForHighRiskAI,
  },
  {
    order_no: 11,
    controlGroupTitle:
      "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
    controls: PostMarketMonitoringByProviders,
  },
  {
    order_no: 12,
    controlGroupTitle: "Reporting of serious incidents",
    controls: ReportingSeriousIncidents,
  },
  {
    order_no: 13,
    controlGroupTitle: "General-purpose AI models",
    controls: GeneralPurposeAImodels,
  },
];
