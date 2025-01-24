import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { getFileById } from "../utils/fileUpload.utils";

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
