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
import { getAllOrganizationsQuery } from "../utils/organization.utils";

function mapReportTypeToFileSource(
  reportType: string
):
  "Project risks report"
  | "Compliance tracker report"
  | "Assessment tracker report"
  | "Vendors and risks report"
  | "Clauses and annexes report"
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

  try {
    const {
      projectId: projectIdRaw,
      reportType,
      projectTitle,
      projectOwner,
      frameworkId: frameworkIdRaw,
      reportName,
      projectFrameworkId
    } = req.body;
    const projectId = parseInt(projectIdRaw);
    const frameworkId = parseInt(frameworkIdRaw);
    const userId = req.userId;
    if (isNaN(projectId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project ID"));
    }
    if (typeof userId !== "number" || isNaN(userId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
    }
    const organizations = await getAllOrganizationsQuery();
    let organizationName = "VerifyWise";
    if (organizations && organizations.length > 0) {
      organizationName = organizations[0].name;
    }

    const reportData = {
      projectTitle, projectOwner, organizationName
    };

    const markdownData = await getReportData(
      projectId,
      frameworkId,
      reportType,
      reportData,
      projectFrameworkId
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
        mapReportTypeToFileSource(reportType)
      );
    } catch (error) {
      console.error("File upload error:", error);
      return res
        .status(500)
        .json(STATUS_CODE[500]("Error uploading report file"));
    }

    if (uploadedFile) {
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
      return res
        .status(500)
        .json(STATUS_CODE[500]("Error uploading report file"));
    }

  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllGeneratedReports(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const { userId, role } = req;
     if (!userId || !role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const reports = await getGeneratedReportsQuery({userId, role});
    if (reports && reports.length > 0) {
      return res.status(200).json(STATUS_CODE[200](reports));
    }
    return res.status(404).json(STATUS_CODE[404]("No reports found"));
  } catch (error) {
    console.error("Error in getAllGeneratedReports:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteGeneratedReportById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const reportId = parseInt(req.params.id);
    const userId = req.userId;
    if (isNaN(reportId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid report ID"));
    }
    if (typeof userId !== "number" || isNaN(userId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
    }

    const report = await getReportByIdQuery(reportId); // get report detail
    if (!report) {
      return res.status(404).json(STATUS_CODE[404]("Report not found"));
    }

    const deletedReport = await deleteReportByIdQuery(reportId, transaction);
    if (deletedReport) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](deletedReport));
    }
    await transaction.rollback();
    return res.status(204).json(STATUS_CODE[204](deletedReport));

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
