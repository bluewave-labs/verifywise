import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { uploadFile } from "../utils/fileUpload.utils";
import { DefaultReportName } from "../models/reporting.model";
import { getReportData } from '../services/reportService';

import marked from 'marked';
const htmlDocx = require("html-to-docx");

export async function generateReports(
  req: Request,
  res: Response
): Promise<any> {
  try {   
    const projectId = parseInt(req.body.projectId);
    const userId = parseInt(req.body.userId);
    if (isNaN(projectId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project ID"));
    }
    if (isNaN(userId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
    }

    const markdownData = getReportData(projectId, req.body.reportType);         
    const markdownDoc = await marked.parse(await markdownData); // markdown file             
    const generatedDoc = await htmlDocx(markdownDoc); // convert markdown to docx                
    
    let defaultFileName;
    if (req.body.reportName === ''){
      switch(req.body.reportType) {
        case "Project risks report":
          defaultFileName = DefaultReportName.PROJECTRISK_REPORT;
          break;
        case "Vendors and risks report":
          defaultFileName = DefaultReportName.VENDOR_REPORT;
          break;
        case "Assessment tracker report":
          defaultFileName = DefaultReportName.ASSESSMENT_REPORT;
          break;
        case "Compliance tracker report":
          defaultFileName = DefaultReportName.COMPLIANCE_REPORT;
          break;
        default:
          defaultFileName = DefaultReportName.ALL_REPORT;
      }
    }else {
      defaultFileName = req.body.reportName;
    }

    const docFile = {
      originalname: `${defaultFileName}.docx`,
      buffer: generatedDoc,
      fieldname: '',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    let uploadedFile;
    try {
      uploadedFile = await uploadFile(docFile, userId, projectId, "Assessment tracker group");
    } catch (error) {
      console.error("File upload error:", error);
      return res.status(500).json(STATUS_CODE[500]("Error uploading report file"));
    }    
    
    if (uploadedFile) {
      res.setHeader("Content-Disposition", `attachment; filename="${uploadedFile.filename}"`);
      res.setHeader("Content-Type", "application/json");
      const fileContent = {fileName: uploadedFile.filename, file: uploadedFile.content.toString("base64")};                
      return res.status(200).send(fileContent);
    } else {
      return res.status(500).json(STATUS_CODE[500]("Error uploading report file"));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}