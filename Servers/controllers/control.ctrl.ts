import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewControlQuery,
  deleteControlByIdQuery,
  getAllControlsByControlGroupQuery,
  getAllControlsQuery,
  getControlByIdQuery,
  updateControlByIdQuery,
} from "../utils/control.utils";
import {
  getAllSubcontrolsByControlIdQuery,
  updateSubcontrolByIdQuery,
} from "../utils/subControl.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { Control, ControlModel } from "../models/control.model";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { FileType } from "../models/file.model";
import { updateProjectUpdatedByIdQuery } from "../utils/project.utils";

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
      subControls: string;
      user_id: number;
      project_id: number;
      delete: string;
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

    const filesToDelete = JSON.parse(Control.delete || "[]") as number[];
    for (let f of filesToDelete) {
      await deleteFileById(f);
    }

    // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
    const subControlResp = [];
    if (Control.subControls) {
      for (const subcontrol of JSON.parse(Control.subControls)) {
        const evidenceFiles = ((req.files as UploadedFile[]) || []).filter(
          (f) => f.fieldname === `evidence_files_${parseInt(subcontrol.id)}`
        );
        const feedbackFiles = ((req.files as UploadedFile[]) || []).filter(
          (f) => f.fieldname === `feedback_files_${parseInt(subcontrol.id)}`
        );

        let evidenceUploadedFiles: FileType[] = [];
        for (let f of evidenceFiles) {
          const evidenceUploadedFile = await uploadFile(
            f,
            Control.user_id,
            Control.project_id,
            "Compliance tracker group"
          );
          evidenceUploadedFiles.push({
            id: evidenceUploadedFile.id!.toString(),
            fileName: evidenceUploadedFile.filename,
            project_id: evidenceUploadedFile.project_id,
            uploaded_by: evidenceUploadedFile.uploaded_by,
            uploaded_time: evidenceUploadedFile.uploaded_time,
            source: evidenceUploadedFile.source,
          });
        }

        let feedbackUploadedFiles: FileType[] = [];
        for (let f of feedbackFiles) {
          const feedbackUploadedFile = await uploadFile(
            f,
            Control.user_id,
            Control.project_id,
            "Compliance tracker group"
          );
          feedbackUploadedFiles.push({
            id: feedbackUploadedFile.id!.toString(),
            fileName: feedbackUploadedFile.filename,
            project_id: feedbackUploadedFile.project_id,
            uploaded_by: feedbackUploadedFile.uploaded_by,
            uploaded_time: feedbackUploadedFile.uploaded_time,
            source: feedbackUploadedFile.source,
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
            control_id: subcontrol.control_id,
          },
          evidenceUploadedFiles,
          feedbackUploadedFiles,
          filesToDelete
        );
        subControlResp.push(subcontrolToSave);
      }
    }
    const response = {
      ...{ control, subControls: subControlResp },
    };
    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(controlId, "controls");

    return res.status(200).json(STATUS_CODE[200]({ response }));
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
    const control = (await getControlByIdQuery(
      parseInt(control_id)
    )) as ControlModel;
    if (control && control.id) {
      const subControls = await getAllSubcontrolsByControlIdQuery(control.id);
      control.dataValues.subControls = subControls;
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
    const controls = (await getAllControlsByControlGroupQuery(
      controlCategoryId
    )) as ControlModel[];
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

        control.dataValues.numberOfSubcontrols = numberOfSubcontrols;
        control.dataValues.numberOfDoneSubcontrols = numberOfDoneSubcontrols;
        control.dataValues.subControls = subControls;
      }
    }
    return res.status(200).json(STATUS_CODE[200](controls));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
