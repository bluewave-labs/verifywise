import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { getProjectRisksReportQuery } from "../utils/reporting.utils";
import { uploadFile } from "../utils/fileUpload.utils";

import marked from 'marked';
const htmlDocx = require("html-to-docx");

export async function getProjectRiskReports(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project ID"));
    }
    const projectRisks = await getProjectRisksReportQuery(projectId);

    if (projectRisks) {
      let projectRows;

      if (projectRisks.length > 0) {
        projectRows = projectRisks.map(risk => 
          `| ${risk.risk_name} | ${risk.risk_owner} | ${risk.risk_severity} | ${risk.likelihood} | ${risk.approval_status} | ${risk.risk_level_autocalculated} | ${risk.deadline.toLocaleDateString()} |`
        ).join('\n');
      } else {
        projectRows = `| - | - | - | - | - | - | - |`
      }

      const riskMd = `
## **VerifyWise**

* **Report Date :** ${new Date().toLocaleDateString()}

## Project Risk Table
| Risk Name | Owner | Severity | Likelihood | Mitigation Status	| Risk Level | Target Date | 
|----|----|----|----|----|----|----|
${projectRows}
`     
      const markdownDoc = await marked.parse(riskMd); // markdown file             
      const generatedDoc = await htmlDocx(markdownDoc); // convert markdown to docx                

      const docFile = {
        originalname: "risk-report.docx",
        buffer: generatedDoc,
        fieldname: '',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }

      let uploadedFile;
      try {
        uploadedFile = await uploadFile(docFile, 3, projectId, "Assessment tracker group");
      } catch (error) {
        console.error("File upload error:", error);
        return res.status(500).json(STATUS_CODE[500]("Error uploading report file"));
      }
      
      if (uploadedFile) {
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="${uploadedFile.filename}"`);
        const fileContent = {fileName: uploadedFile.filename, file: uploadedFile.content}
        return res.status(200).send(fileContent);
      } else {
        return res.status(500).json(STATUS_CODE[500]("Error uploading report file"));
      }
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}