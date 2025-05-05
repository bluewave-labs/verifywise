import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { uploadFile } from "../utils/fileUpload.utils";
import { DefaultReportName } from "../models/reporting.model";
import { getReportData, isAuthorizedUser } from '../services/reportService';

import marked from 'marked';
import { sequelize } from "../database/db";
const htmlDocx = require("html-to-docx");

export async function generateReports(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {   
    const projectId = parseInt(req.body.projectId);
    const userId = req.userId;
    if (isNaN(projectId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project ID"));
    }
    if (typeof userId !== 'number' || isNaN(userId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid user ID"));
    }

    const authorizedUser = await isAuthorizedUser(projectId, userId); // check whether the user is authorized to download the report or not
    const reportData = {
      projectTitle: req.body.projectTitle,
      projectOwner: req.body.projectOwner,
    }
    if(authorizedUser){
      const markdownData = getReportData(projectId, req.body.reportType, reportData);         
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
        fieldname: 'file',
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
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader('Access-Control-Expose-Headers','Content-Disposition');
        return res.status(200).send(uploadedFile.content);
      } else {
        return res.status(500).json(STATUS_CODE[500]("Error uploading report file"));
      }
    }else{
      return res.status(403).json(STATUS_CODE[500]("Unauthorized user to download the report."));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}