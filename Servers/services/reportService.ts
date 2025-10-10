import { getMembersByProjectIdQuery } from "../utils/reporting.utils";
import {
  DefaultReportName,
  ReportType,
} from "../domain.layer/models/reporting/reporting.model";
import { getProjectRiskMarkdown } from "./markdowns/projectRiskMarkdown";
import { getVendorReportMarkdown } from "./markdowns/vendorAndRisksMarkdown";
import { getAssessmentTrackerMarkdown } from "./markdowns/assessmentTrackerMarkdown";
import { getClausesAndAnnexesMarkdown } from "./markdowns/annexesMarkdown";
import { getComplianceMarkdown } from "./markdowns/complianceMarkdown";
import { getModelReportMarkdown } from "./markdowns/modelAndRisksMarkdown";
import { getTrainingRegistryMarkdown } from "./markdowns/trainingRegistryMarkdown";
import { getPolicyManagerMarkdown } from "./markdowns/policyManagerMarkdown";
import { getAllReportMarkdown } from "./markdowns/allReportMarkdown";

export interface ReportBodyData {
  projectTitle: string;
  projectOwner: string;
  organizationName: string;
}

/**
 * Format the report name
 * if request body includes report name, return the report name as user requested
 * If not, return as {type}_{YYYYMMDD}_{HHMMSS}
 */
export function getFormattedReportName(name: string, type: string | string[]) {
  let reportType;
  switch (type) {
    case ReportType.PROJECTRISK_REPORT:
      reportType = DefaultReportName.PROJECTRISK_REPORT;
      break;
    case ReportType.VENDOR_REPORT:
      reportType = DefaultReportName.VENDOR_REPORT;
      break;
    case ReportType.ASSESSMENT_REPORT:
      reportType = DefaultReportName.ASSESSMENT_REPORT;
      break;
    case ReportType.COMPLIANCE_REPORT:
      reportType = DefaultReportName.COMPLIANCE_REPORT;
      break;
    case ReportType.CLAUSES_AND_ANNEXES_REPORT:
      reportType = DefaultReportName.CLAUSES_AND_ANNEXES_REPORT;
      break;
    case ReportType.ALL_REPORT:
      reportType = DefaultReportName.ALL_REPORT;
      break;
    default:
      reportType = DefaultReportName.MULTI_REPORT;
  }

  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  if (name.length === 0) {
    if (Array.isArray(type)) {
      return `Multi_reports_${year}${month}${day}_${hour}${minute}${second}`;
    }
    return `${type}_${year}${month}${day}_${hour}${minute}${second}`;
  } else {
    return name;
  }
}

/*
  Get member lists by projectId
  Check whether the user belongs to current project
*/
export async function isAuthorizedUser(
  projectId: number,
  userId: number,
  tenant: string
): Promise<any> {
  const members = await getMembersByProjectIdQuery(projectId, tenant);
  const membersArray = members.map((m) => m.user_id);

  if (!membersArray.includes(userId)) {
    return false;
  } else {
    return true;
  }
}

/*
  Get report data base on requested report type
*/
export async function getReportData(
  projectId: number,
  frameworkId: number,
  reportType: string | string[],
  reportBody: ReportBodyData,
  projectFrameworkId: number,
  tenant: string
): Promise<any> {
  async function getSingleReportMarkdown(type: string): Promise<string> {
    switch (type) {
      case ReportType.PROJECTRISK_REPORT:
        return await getProjectRiskMarkdown(projectId, reportBody, tenant);
      case ReportType.ASSESSMENT_REPORT:
        return await getAssessmentTrackerMarkdown(
          projectId,
          frameworkId,
          reportBody,
          tenant
        );
      case ReportType.VENDOR_REPORT:
        return await getVendorReportMarkdown(projectId, reportBody, tenant);
      case ReportType.CLAUSES_AND_ANNEXES_REPORT:
        return await getClausesAndAnnexesMarkdown(
          projectFrameworkId,
          reportBody,
          tenant
        );
      case ReportType.COMPLIANCE_REPORT:
        return await getComplianceMarkdown(
          projectFrameworkId,
          reportBody,
          tenant
        );
      case ReportType.MODEL_REPORT:
        return await getModelReportMarkdown(reportBody, tenant);
      case ReportType.TRAINING_REGISTRY_REPORT:
        return await getTrainingRegistryMarkdown(reportBody, tenant);
      case ReportType.POLICY_MANAGER_REPORT:
        return await getPolicyManagerMarkdown(reportBody, tenant);
      case ReportType.ALL_REPORT:
        return await getAllReportMarkdown(
          frameworkId,
          projectFrameworkId,
          projectId,
          reportBody,
          tenant
        );
      default:
        throw new Error(`Report type "${type}" is not supported`);
    }
  }

  if (Array.isArray(reportType)) {
    const markdownParts: string[] = [];
    for (const type of reportType) {
      const part = await getSingleReportMarkdown(type);
      markdownParts.push(part);
    }
    return markdownParts.join("\n\n");
  }

  return await getSingleReportMarkdown(reportType);
}
