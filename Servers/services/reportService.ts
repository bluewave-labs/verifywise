import { getMembersByProjectIdQuery } from "../utils/reporting.utils";
import { DefaultReportName, ReportType } from "../models/reporting.model";
import { getProjectRiskMarkdown } from "./markdowns/projectRiskMarkdown";
import { getVendorReportMarkdown } from "./markdowns/vendorAndRisksMarkdown";
import { getAssessmentTrackerMarkdown } from './markdowns/assessmentTrackerMarkdown';
import { getComplianceMarkdown } from './markdowns/complianceMarkdown';

export interface ReportBodyData {
  projectTitle: string,
  projectOwner: string
}

/** 
 * Format the report name
 * if request body includes report name, return the report name as user requested
 * If not, return as {type}_{YYYYMMDD}_{HHMMSS}
*/
export function getFormattedReportName(name: string, type: string) {
  let reportType;
  switch(type) {
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
    case ReportType.CLAUSES_REPORT:
      reportType = DefaultReportName.CLAUSES_REPORT;
      break;
    case ReportType.ANNEXES_REPORT:
      reportType = DefaultReportName.ANNEXES_REPORT;
      break;
    default:
      reportType = DefaultReportName.ALL_REPORT;
  }

  const date = new Date();
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  if(name.length === 0 ) {
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
  userId: number
) : Promise<any> {
  const members = await getMembersByProjectIdQuery(projectId);
  const membersArray = members.map(m => m.user_id);

  if(!membersArray.includes(userId)){
    return false;
  }else{
    return true;
  }
}

/*
  Get report data base on requested report type
*/
export async function getReportData(
    projectId: number,
    frameworkId: number,
    reportType: string,
    reportBody: ReportBodyData
  ) : Promise<any> {
  let markdownFormattedData;
  switch(reportType) {
    case ReportType.PROJECTRISK_REPORT:
      markdownFormattedData = await getProjectRiskMarkdown(projectId, reportBody)
      break;
    case ReportType.ASSESSMENT_REPORT:
      markdownFormattedData = await getAssessmentTrackerMarkdown(frameworkId, reportBody)
      break;
    case ReportType.VENDOR_REPORT:
      markdownFormattedData = await getVendorReportMarkdown(projectId, reportBody)
      break;
      case ReportType.COMPLIANCE_REPORT:
        markdownFormattedData = await getComplianceMarkdown(frameworkId, reportBody)
        break;
    default:
      throw new Error(`Report type "${reportType}" is not supported`);
  }
  return markdownFormattedData;
}
  


