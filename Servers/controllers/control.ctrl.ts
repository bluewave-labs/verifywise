import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewControlQuery,
  deleteControlByIdQuery,
  getAllControlsByControlGroupQuery,
  getAllControlsQuery,
  getControlByIdAndControlTitleAndControlDescriptionQuery,
  getControlByIdQuery,
  updateControlByIdQuery,
} from "../utils/control.utils";
import {
  createNewSubcontrolQuery,
  getAllSubcontrolsByControlIdQuery,
  updateSubcontrolByIdQuery,
} from "../utils/subControl.utils";
import {
  createControlCategoryQuery,
  getControlCategoryByIdQuery,
  getControlCategoryByTitleAndProjectIdQuery,
  updateControlCategoryByIdQuery,
} from "../utils/controlCategory.util";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { Control } from "../models/control.model";
import { Subcontrol } from "../models/subcontrol.model";
import { addFileToTableTest, deleteFileById, uploadFile } from "../utils/fileUpload.utils";

export async function getAllControls(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controls = await getAllControlsQuery();

    if (controls) {
      return res.status(200).json(STATUS_CODE[200](controls));
    }

    return res.status(204).json(STATUS_CODE[204](controls));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);

    const control = await getControlByIdQuery(controlId);

    if (control) {
      return res.status(200).json(STATUS_CODE[200](control));
    }

    return res.status(204).json(STATUS_CODE[204](control));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createControl(req: Request, res: Response): Promise<any> {
  try {
    const newControl: Control = req.body;

    const createdControl = await createNewControlQuery(newControl);

    if (createdControl) {
      return res.status(201).json(STATUS_CODE[201](createdControl));
    }

    return res.status(400).json(STATUS_CODE[400]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateControlById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);
    const updatedControl: Control = req.body;

    const control = await updateControlByIdQuery(controlId, updatedControl);

    if (control) {
      return res.status(200).json(STATUS_CODE[200](control));
    }

    return res.status(400).json(STATUS_CODE[400](control));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteControlById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);

    const control = await deleteControlByIdQuery(controlId);

    if (control) {
      return res.status(200).json(STATUS_CODE[200](control));
    }

    return res.status(400).json(STATUS_CODE[400](control));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function saveControls(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.params.id);
    const Control = req.body as Control & {
      subControls: string,
      user_id: number,
      project_id: number,
      evidence_files_delete: string,
      feedback_files_delete: string
    };

    // now we need to create the control for the control category, and use the control category id as the foreign key
    const control: any = await updateControlByIdQuery(controlId, {
      title: Control.title,
      description: Control.description,
      order_no: Control.order_no,
      status: Control.status,
      approver: Control.approver,
      risk_review: Control.risk_review,
      owner: Control.owner,
      reviewer: Control.reviewer,
      due_date: Control.due_date,
      implementation_details: Control.implementation_details,
      control_category_id: Control.control_category_id,
    });

    // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
    const subControlResp = [];
    if (Control.subControls) {
      for (const subcontrol of JSON.parse(Control.subControls)) {
        const evidenceFiles =
          (req.files as { [key: string]: UploadedFile[] })?.evidence_files ||
          [];
        const evidenceFilesToDelete = JSON.parse(Control.evidence_files_delete || '[]') as number[];
        for (let f of evidenceFilesToDelete) {
          if (!isNaN(f)) {
            await deleteFileById(f);
          }
        }
        let evidenceUploadedFiles: {
          id: string;
          fileName: string;
          project_id: number;
          uploaded_by: number;
          uploaded_time: Date;
        }[] = [];
        for (let f of evidenceFiles) {
          const evidenceUploadedFile = await uploadFile(
            f,
            Control.user_id,
            Control.project_id
          );
          evidenceUploadedFiles.push({
            id: evidenceUploadedFile.id.toString(),
            fileName: evidenceUploadedFile.filename,
            project_id: evidenceUploadedFile.project_id,
            uploaded_by: evidenceUploadedFile.uploaded_by,
            uploaded_time: evidenceUploadedFile.uploaded_time,
          });
        }

        const feedbackFiles =
          (req.files as { [key: string]: UploadedFile[] })?.feedback_files ||
          [];
        const feedbackFilesToDelete = JSON.parse(Control.feedback_files_delete || '[]') as number[];
        for (let f of feedbackFilesToDelete) {
          if (!isNaN(f)) {
            await deleteFileById(f);
          }
        }
        let feedbackUploadedFiles: {
          id: string;
          fileName: string;
          project_id: number;
          uploaded_by: number;
          uploaded_time: Date;
        }[] = [];
        for (let f of feedbackFiles) {
          const feedbackUploadedFile = await uploadFile(
            f,
            Control.user_id,
            Control.project_id
          );
          feedbackUploadedFiles.push({
            id: feedbackUploadedFile.id.toString(),
            fileName: feedbackUploadedFile.filename,
            project_id: feedbackUploadedFile.project_id,
            uploaded_by: feedbackUploadedFile.uploaded_by,
            uploaded_time: feedbackUploadedFile.uploaded_time,
          });
        }

        const subcontrolToSave: any = await updateSubcontrolByIdQuery(
          subcontrol.id!,
          {
            title: subcontrol.title,
            description: subcontrol.description,
            order_no: subcontrol.order_no,
            status: subcontrol.status as
              | "Waiting"
              | "In progress"
              | "Done"
              | undefined,
            approver: subcontrol.approver,
            risk_review: subcontrol.risk_review as
              | "Acceptable risk"
              | "Residual risk"
              | "Unacceptable risk"
              | undefined,
            owner: subcontrol.owner,
            reviewer: subcontrol.reviewer,
            due_date: subcontrol.due_date,
            implementation_details: subcontrol.implementation_details,
            evidence_description: subcontrol.evidence_description,
            feedback_description: subcontrol.feedback_description,
            evidence_files: subcontrol.evidence_files,
            feedback_files: subcontrol.feedback_files,
            control_id: subcontrol.control_id,
          },
          Control.project_id,
          Control.user_id,
          // evidenceFiles,
          // feedbackFiles
        );

        await addFileToTableTest(
          subcontrol.id!,
          evidenceUploadedFiles || [],
          evidenceFilesToDelete || [],
          "evidence_files",
          "subcontrols"
        );

        await addFileToTableTest(
          subcontrol.id!,
          feedbackUploadedFiles || [],
          feedbackFilesToDelete || [],
          "feedback_files",
          "subcontrols"
        );
        subControlResp.push(subcontrolToSave);
      }
    }
    // const response = {
    //   ...{ control, subcontrols: subControlResp },
    // };
    return res.status(200).json(
      STATUS_CODE[200]({
        message: "Updated",
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getComplianceById(
  req: Request,
  res: Response
): Promise<any> {
  const control_id = req.params.id;
  try {
    const control = await getControlByIdQuery(parseInt(control_id));
    if (control && control.id) {
      const subControls = await getAllSubcontrolsByControlIdQuery(control.id);
      control.subControls = subControls;
      return res.status(200).json(STATUS_CODE[200](control));
    } else {
      return res.status(404).json(STATUS_CODE[404]("Control not found"));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlsByControlCategoryId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlCategoryId = parseInt(req.params.id);
    const controls: Control[] = await getAllControlsByControlGroupQuery(
      controlCategoryId
    );
    for (const control of controls) {
      if (control && control.id !== undefined) {
        const subControls = await getAllSubcontrolsByControlIdQuery(control.id);
        let numberOfSubcontrols = 0;
        let numberOfDoneSubcontrols = 0;

        for (const subControl of subControls) {
          numberOfSubcontrols++;
          if (subControl.status === "Done") {
            numberOfDoneSubcontrols++;
          }
        }

        control.numberOfSubcontrols = numberOfSubcontrols;
        control.numberOfDoneSubcontrols = numberOfDoneSubcontrols;
        control.subControls = subControls;
      }
    }
    return res.status(200).json(STATUS_CODE[200](controls));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
