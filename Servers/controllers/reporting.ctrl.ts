import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { uploadFile } from "../utils/fileUpload.utils";
import { getReportData, isAuthorizedUser, getFormattedReportName } from '../services/reportService';
import { deleteReportByIdQuery, getGeneratedReportsQuery } from "../utils/reporting.utils";
import marked from 'marked';
import { sequelize } from "../database/db";
const htmlDocx = require("html-to-docx");

export async function generateReports(
  req: Request,
  res: Response
): Promise<any> {
  // const transaction = await sequelize.transaction();
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
      
      let defaultFileName = getFormattedReportName(req.body.reportName, req.body.reportType);   
      const docFile = {
        originalname: `${defaultFileName}.docx`,
        buffer: generatedDoc,
        fieldname: 'file',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }

      let uploadedFile;
      try {
        uploadedFile = await uploadFile(docFile, userId, projectId, "Report");
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

export async function getAllGeneratedReports(  
  req: Request,
  res: Response
): Promise<any>{
  try {
    const reports = await getGeneratedReportsQuery();
    if (reports) {
      return res.status(200).json(STATUS_CODE[200](reports));
    }
    return res.status(404).json(STATUS_CODE[404](reports));  
  } catch (error) {
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
    const deletedReport = await deleteReportByIdQuery(reportId, transaction); 

    if (deletedReport) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](deletedReport));
    }

    return res.status(204).json(STATUS_CODE[204](deletedReport));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}