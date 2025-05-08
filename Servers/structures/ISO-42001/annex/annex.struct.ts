import { OrganizationalPoliciesAndGovernance } from "./annexcategories/05-organizational-policies-and-governance.annexcategory";
import { InternalOrganization } from "./annexcategories/06-internal-organization.annexcategory";
import { ResourcesForAISystems } from "./annexcategories/07-resource-for-AI-systems.annexcategory";
import { AISystemLifecycle } from "./annexcategories/08-AI-system-lifecycle.annexcategory";
import { DataForAISystems } from "./annexcategories/09-data-for-AI-systems.annexcategory";
import { ICT } from "./annexcategories/10-ict.annexcategory";
import { ThirdPartyRelationships } from "./annexcategories/11-third-party-relationships.annexcategory";

export const Annex = [
  {
    title: "Organizational policies and governance",
    annex_no: 5,
    annexcategories: OrganizationalPoliciesAndGovernance
  },
  {
    title: "Internal organization",
    annex_no: 6,
    annexcategories: InternalOrganization
  },
  {
    title: "Resources for AI systems",
    annex_no: 7,
    annexcategories: ResourcesForAISystems
  },
  {
    title: "AI system lifecycle",
    annex_no: 8,
    annexcategories: AISystemLifecycle
  },
  {
    title: "Data for AI systems",
    annex_no: 9,
    annexcategories: DataForAISystems
  },
  {
    title: "Information and communication technology (ICT)",
    annex_no: 10,
    annexcategories: ICT
  },
  {
    title: "Third party relationships",
    annex_no: 11,
    annexcategories: ThirdPartyRelationships
  }
]