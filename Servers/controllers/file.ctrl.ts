import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { deleteFileById, getFileById, uploadFile } from "../utils/fileUpload.utils";
import { addFileToQuestion, RequestWithFile, UploadedFile } from "../utils/question.utils";

export async function getFileContentById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const file = await getFileById(parseInt(req.params.id));
    if (file) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
      return res.status(200).send(file.content);
    }
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    console.error("Error downloading file:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function postFileContent(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  try {
    const body = req.body as {
      question_id: string,
      delete: string
    }

    const filesToDelete = JSON.parse(body.delete) as number[]
    for (let fileToDelete of filesToDelete) {
      await deleteFileById(fileToDelete)
    }

    const questionId = parseInt(body.question_id)
    let uploadedFiles: { id: string; fileName: string }[] = [];
    for (let file of req.files! as UploadedFile[]) {
      const uploadedFile = await uploadFile(file);
      uploadedFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    }

    const question = await addFileToQuestion(questionId, uploadedFiles, filesToDelete)
    return res.status(201).json(STATUS_CODE[201](question.evidence_files))
  } catch (error) {
    console.error("Error downloading file:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
