import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { uploadFile } from "../utils/fileUpload.utils";
import {
  getReportData,
  getFormattedReportName,
} from "../services/reportService";
import {
  deleteReportByIdQuery,
  getGeneratedReportsQuery,
  getReportByIdQuery,
} from "../utils/reporting.utils";
import { marked } from "marked";
import { sequelize } from "../database/db";
const htmlDocx = require("html-to-docx");
import { getOrganizationByIdQuery } from "../utils/organization.utils";
import { getUserByIdQuery } from "../utils/user.utils";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

function mapReportTypeToFileSource(
  reportType: string
):
  | "Project risks report"
  | "Compliance tracker report"
  | "Assessment tracker report"
  | "Vendors and risks report"
  | "Clauses and annexes report"
  | "ISO 27001 report"
  | "All reports" {
  // These values must match the enum_files_source in the database
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
    default:
      // fallback or throw error
      throw new Error(`Invalid report type for file source: ${reportType}`);
  }
}

export async function generateReports(
  req: Request,
  res: Response
): Promise<any> {
  const {
    projectId: projectIdRaw,
    reportType,
    projectTitle,
    projectOwner,
    frameworkId: frameworkIdRaw,
    reportName,
    projectFrameworkId,
  } = req.body;
  const projectId = parseInt(projectIdRaw);
  const frameworkId = parseInt(frameworkIdRaw);
  const userId = req.userId;

  logProcessing({
    description: `starting generateReports for project ID ${projectId}, report type: ${reportType}`,
    functionName: "generateReports",
    fileName: "reporting.ctrl.ts",
  });
  logger.debug(
    `📄 Generating ${reportType} report for project ID ${projectId}`
  );

  try {
    if (isNaN(projectId)) {
      await logFailure({
        eventType: "Create",
        description: `Invalid project ID: ${projectIdRaw}`,
        functionName: "generateReports",
        fileName: "reporting.ctrl.ts",
        error: new Error("Invalid project ID"),
      });
      return res.status(400).json(STATUS_CODE[400]("Invalid project ID"));
    }
    if (typeof userId !== "number" || isNaN(userId)) {
      await logFailure({
        eventType: "Create",
        description: `Invalid user ID: ${userId}`,
        functionName: "generateReports",
        fileName: "reporting.ctrl.ts",
        error: new Error("Invalid user ID"),
      });
      return res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
    }

    const user = await getUserByIdQuery(userId);
    if (!user) {
      await logFailure({
        eventType: "Create",
        description: `User not found: ID ${userId}`,
        functionName: "generateReports",
        fileName: "reporting.ctrl.ts",
        error: new Error("User not found"),
      });
      return res.status(404).json(STATUS_CODE[404]("User not found"));
    }

    const organization = await getOrganizationByIdQuery(user.organization_id!);
    const organizationName = organization?.name || "VerifyWise";

    const reportData = {
      projectTitle,
      projectOwner,
      organizationName,
    };

    const markdownData = await getReportData(
      projectId,
      frameworkId,
      reportType,
      reportData,
      projectFrameworkId,
      req.tenantId!
    );
    const markdownDoc = await marked.parse(markdownData); // markdown file
    const generatedDoc = await htmlDocx(markdownDoc); // convert markdown to docx

    let defaultFileName = getFormattedReportName(reportName, reportType);
    const docFile = {
      originalname: `${defaultFileName}.docx`,
      buffer: generatedDoc,
      fieldname: "file",
      mimetype:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    let uploadedFile;
    try {
      uploadedFile = await uploadFile(
        docFile,
        userId,
        projectId,
        mapReportTypeToFileSource(reportType),
        req.tenantId!
      );
    } catch (error) {
      console.error("File upload error:", error);
      await logFailure({
        eventType: "Create",
        description: `Error uploading report file for project ID ${projectId}`,
        functionName: "generateReports",
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
        description: `Successfully generated ${reportType} report for project ID ${projectId}`,
        functionName: "generateReports",
        fileName: "reporting.ctrl.ts",
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${uploadedFile.filename}"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      return res.status(200).send(uploadedFile.content);
    } else {
      await logFailure({
        eventType: "Create",
        description: `Failed to upload report file for project ID ${projectId}`,
        functionName: "generateReports",
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
      functionName: "generateReports",
      fileName: "reporting.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
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
    if (reports && reports.length > 0) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved ${reports.length} generated reports`,
        functionName: "getAllGeneratedReports",
        fileName: "reporting.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](reports));
    }

    await logSuccess({
      eventType: "Read",
      description: "No generated reports found",
      functionName: "getAllGeneratedReports",
      fileName: "reporting.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404]("No reports found"));
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
  const transaction = await sequelize.transaction();
  const reportId = parseInt(req.params.id);
  const userId = req.userId;

  logProcessing({
    description: `starting deleteGeneratedReportById for report ID ${reportId}`,
    functionName: "deleteGeneratedReportById",
    fileName: "reporting.ctrl.ts",
  });
  logger.debug(`🗑️ Deleting generated report ID ${reportId}`);

  try {
    if (isNaN(reportId)) {
      await logFailure({
        eventType: "Delete",
        description: `Invalid report ID: ${req.params.id}`,
        functionName: "deleteGeneratedReportById",
        fileName: "reporting.ctrl.ts",
        error: new Error("Invalid report ID"),
      });
      return res.status(400).json(STATUS_CODE[400]("Invalid report ID"));
    }
    if (typeof userId !== "number" || isNaN(userId)) {
      await logFailure({
        eventType: "Delete",
        description: `Invalid user ID: ${userId}`,
        functionName: "deleteGeneratedReportById",
        fileName: "reporting.ctrl.ts",
        error: new Error("Invalid user ID"),
      });
      return res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
    }

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
