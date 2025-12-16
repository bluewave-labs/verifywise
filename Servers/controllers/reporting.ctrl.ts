import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { uploadFile } from "../utils/fileUpload.utils";
import {
  deleteReportByIdQuery,
  getGeneratedReportsQuery,
  getReportByIdQuery,
} from "../utils/reporting.utils";
import { sequelize } from "../database/db";
import { getOrganizationByIdQuery } from "../utils/organization.utils";
import { getUserByIdQuery } from "../utils/user.utils";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import logger from "../utils/logger/fileLogger";

// Reporting system imports (v2 - HTML/EJS based)
import {
  generateReport as generateReportV2,
  ReportFormat,
} from "../services/reporting";

export function mapReportTypeToFileSource(
  reportType: string | string[]
):
  | "Project risks report"
  | "Compliance tracker report"
  | "Assessment tracker report"
  | "Vendors and risks report"
  | "Clauses and annexes report"
  | "ISO 27001 report"
  | "Models and risks report"
  | "Training registry report"
  | "Policy manager report"
  | "All reports" {
  // These values must match the enum_files_source in the database
  if (Array.isArray(reportType) && reportType.length > 1) {
    return "All reports";
  }
  switch (reportType) {
    case "Project risks report":
      return "Project risks report";
    case "Compliance tracker report":
      return "Compliance tracker report";
    case "Assessment tracker report":
      return "Assessment tracker report";
    case "Vendors and risks report":
      return "Vendors and risks report";
    case "All reports":
      return "All reports";
    case "Clauses and annexes report":
      return "Clauses and annexes report";
    case "Models and risks report":
      return "Models and risks report";
    case "Training registry report":
      return "Training registry report";
    case "Policy manager report":
      return "Policy manager report";
    default:
      // fallback or throw error
      throw new Error(`Invalid report type for file source: ${reportType}`);
  }
}

/**
 * Legacy endpoint wrapper - redirects to v2 system
 * Kept for backward compatibility with old API calls
 */
export async function generateReports(
  req: Request,
  res: Response
): Promise<any> {
  return generateReportsV2(req, res);
}

export async function getAllGeneratedReports(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getAllGeneratedReports",
    functionName: "getAllGeneratedReports",
    fileName: "reporting.ctrl.ts",
  });
  logger.debug("📄 Fetching all generated reports");

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      await logFailure({
        eventType: "Read",
        description: "Unauthorized access attempt for getAllGeneratedReports",
        functionName: "getAllGeneratedReports",
        fileName: "reporting.ctrl.ts",
        error: new Error("Unauthorized"),
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reports = await getGeneratedReportsQuery(
      { userId, role },
      req.tenantId!
    );

    await logSuccess({
      eventType: "Read",
      description:
        reports && reports.length > 0
          ? `Retrieved ${reports.length} generated reports`
          : "No generated reports found",
      functionName: "getAllGeneratedReports",
      fileName: "reporting.ctrl.ts",
    });

    // Return 200 with empty array if no reports, not 404
    // 404 should be reserved for "endpoint not found" or "specific resource not found"
    return res.status(200).json(STATUS_CODE[200](reports || []));
  } catch (error) {
    console.error("Error in getAllGeneratedReports:", error);
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve generated reports",
      functionName: "getAllGeneratedReports",
      fileName: "reporting.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteGeneratedReportById(
  req: Request,
  res: Response
): Promise<any> {
  const reportId = parseInt(req.params.id);
  const transaction = await sequelize.transaction();

  logProcessing({
    description: `starting deleteGeneratedReportById for report ID ${reportId}`,
    functionName: "deleteGeneratedReportById",
    fileName: "reporting.ctrl.ts",
  });
  logger.debug(`🗑️ Deleting generated report ID ${reportId}`);

  try {
    const report = await getReportByIdQuery(reportId, req.tenantId!); // get report detail
    if (!report) {
      await logFailure({
        eventType: "Delete",
        description: `Report not found: ID ${reportId}`,
        functionName: "deleteGeneratedReportById",
        fileName: "reporting.ctrl.ts",
        error: new Error("Report not found"),
      });
      return res.status(404).json(STATUS_CODE[404]("Report not found"));
    }

    const deletedReport = await deleteReportByIdQuery(
      reportId,
      req.tenantId!,
      transaction
    );
    if (deletedReport) {
      await transaction.commit();
      await logSuccess({
        eventType: "Delete",
        description: `Successfully deleted generated report ID ${reportId}`,
        functionName: "deleteGeneratedReportById",
        fileName: "reporting.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](deletedReport));
    }

    await transaction.rollback();
    await logSuccess({
      eventType: "Delete",
      description: `No report to delete: ID ${reportId}`,
      functionName: "deleteGeneratedReportById",
      fileName: "reporting.ctrl.ts",
    });
    return res.status(204).json(STATUS_CODE[204](deletedReport));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete generated report ID ${reportId}`,
      functionName: "deleteGeneratedReportById",
      fileName: "reporting.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Generate reports using the new HTML/EJS-based system
 * Supports both PDF and DOCX formats with rich formatting
 */
export async function generateReportsV2(
  req: Request,
  res: Response
): Promise<any> {
  const {
    projectId: projectIdRaw,
    reportType,
    frameworkId: frameworkIdRaw,
    reportName,
    projectFrameworkId: projectFrameworkIdRaw,
    format = "docx", // Default to docx for backward compatibility
  } = req.body;

  const projectId = parseInt(projectIdRaw);
  const frameworkId = parseInt(frameworkIdRaw);
  const projectFrameworkId = parseInt(projectFrameworkIdRaw);
  const userId = req.userId;
  const reportFormat: ReportFormat = format === "pdf" ? "pdf" : "docx";

  logProcessing({
    description: `starting generateReportsV2 for project ID ${projectId}, report type: ${reportType}, format: ${reportFormat}`,
    functionName: "generateReportsV2",
    fileName: "reporting.ctrl.ts",
  });
  logger.debug(
    `📄 Generating ${reportType} report (${reportFormat}) for project ID ${projectId}`
  );

  try {
    const user = await getUserByIdQuery(userId!);
    if (!user) {
      await logFailure({
        eventType: "Create",
        description: `User not found: ID ${userId}`,
        functionName: "generateReportsV2",
        fileName: "reporting.ctrl.ts",
        error: new Error("User not found"),
      });
      return res.status(404).json(STATUS_CODE[404]("User not found"));
    }

    const organization = await getOrganizationByIdQuery(user.organization_id!);
    const organizationName = organization?.name || "VerifyWise";

    // Generate report using new system
    const result = await generateReportV2(
      {
        projectId,
        frameworkId,
        projectFrameworkId,
        reportType,
        reportName,
        format: reportFormat,
        branding: {
          organizationName,
        },
      },
      userId!,
      req.tenantId!
    );

    if (!result.success) {
      await logFailure({
        eventType: "Create",
        description: `Failed to generate ${reportType} report: ${result.error}`,
        functionName: "generateReportsV2",
        fileName: "reporting.ctrl.ts",
        error: new Error(result.error || "Unknown error"),
      });
      return res
        .status(500)
        .json(STATUS_CODE[500](result.error || "Failed to generate report"));
    }

    // Upload file to storage
    const docFile = {
      originalname: result.filename,
      buffer: result.content,
      fieldname: "file",
      mimetype: result.mimeType,
    };

    let uploadedFile;
    try {
      uploadedFile = await uploadFile(
        docFile,
        userId!,
        projectId,
        mapReportTypeToFileSource(reportType),
        req.tenantId!
      );
    } catch (error) {
      console.error("File upload error:", error);
      await logFailure({
        eventType: "Create",
        description: `Error uploading report file for project ID ${projectId}`,
        functionName: "generateReportsV2",
        fileName: "reporting.ctrl.ts",
        error: error as Error,
      });
      return res
        .status(500)
        .json(STATUS_CODE[500]("Error uploading report file"));
    }

    if (uploadedFile) {
      await logSuccess({
        eventType: "Create",
        description: `Successfully generated ${reportType} report (${reportFormat}) for project ID ${projectId}`,
        functionName: "generateReportsV2",
        fileName: "reporting.ctrl.ts",
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${uploadedFile.filename}"`
      );
      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      return res.status(200).send(uploadedFile.content);
    } else {
      await logFailure({
        eventType: "Create",
        description: `Failed to upload report file for project ID ${projectId}`,
        functionName: "generateReportsV2",
        fileName: "reporting.ctrl.ts",
        error: new Error("Upload failed"),
      });
      return res
        .status(500)
        .json(STATUS_CODE[500]("Error uploading report file"));
    }
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: `Failed to generate ${reportType} report for project ID ${projectId}`,
      functionName: "generateReportsV2",
      fileName: "reporting.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
