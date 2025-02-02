import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewControlQuery,
  deleteControlByIdQuery,
  getAllControlsQuery,
  getControlByIdQuery,
  updateControlByIdQuery,
} from "../utils/control.utils";
import {
  createNewSubcontrolQuery,
  updateSubcontrolByIdQuery,
} from "../utils/subControl.utils";
import {
  createControlCategoryQuery,
  updateControlCategoryByIdQuery,
} from "../utils/controlCategory.util";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";

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
    const newControl: {
      projectId: number;
      status: string;
      approver: string;
      riskReview: string;
      owner: string;
      reviewer: string;
      dueDate: Date;
      implementationDetails: string;
      controlGroup: number;
    } = req.body;

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
    const updatedControl: {
      projectId: number;
      status: string;
      approver: string;
      riskReview: string;
      owner: string;
      reviewer: string;
      dueDate: Date;
      implementationDetails: string;
    } = req.body;

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

export async function saveControls(req: RequestWithFile, res: Response): Promise<any> {
  try {
    const projectId = req.body.projectId;

    if (!projectId) {
      res
        .status(400)
        .json(STATUS_CODE[400]({ message: "project_id is required" }));
    }

    // first the id of the project is needed and will be sent inside the req.body
    const controlCategoryTitle = req.body.controlCategoryTitle;

    // then we need to create the control category and use the projectId as the foreign key
    const controlCategory: any = await createControlCategoryQuery({
      projectId,
      name: controlCategoryTitle,
    });

    const controlCategoryId = controlCategory.id;
    const requestControl = JSON.parse(req.body.control)

    // now we need to create the control for the control category, and use the control category id as the foreign key
    const control: any = await createNewControlQuery({
      status: requestControl.status,
      approver: requestControl.approver,
      riskReview: requestControl.riskReview,
      owner: requestControl.owner,
      reviewer: requestControl.reviewer,
      dueDate: requestControl.date,
      implementationDetails: requestControl.description,
      controlGroup: controlCategoryId
    });

    const controlId = control.id;

    // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
    const subcontrols = requestControl.subControls;
    const subControlResp = []
    for (const subcontrol of subcontrols) {
      const subcontrolToSave: any = await createNewSubcontrolQuery(
        controlId,
        subcontrol,
        (req.files as {
          [key: string]: UploadedFile[]
        }).evidenceFiles || [],
        (req.files as {
          [key: string]: UploadedFile[]
        }).feedbackFiles || []
      );
      subControlResp.push(subcontrolToSave)
    }
    const response = { ...{ controlCategory, ...{ control, subControls: subControlResp } } }
    return res.status(200).json(
      STATUS_CODE[200]({
        message: response,
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateControls(
  req: Request,
  res: Response
): Promise<any> {
  const requestBody = req.body as {
    projectId: number;
    controlCategoryTitle: string;
    controlCategoryId: number;
    control: {
      id: number;
      controlCategoryId: number;
      controlId: number;
      controlTitle: string;
      controlDescription: string;
      status: string;
      approver: string;
      riskReview: string;
      owner: string;
      reviewer: string;
      date: Date;
      description: string;
      subControls: {
        id: number;
        controlId: number;
        subControlTitle: string;
        subControlDescription: string;
        status: string;
        approver: string;
        riskReview: string;
        owner: string;
        reviewer: string;
        date: Date;
        description: string;
        evidence: string;
        evidenceFiles: [];
        feedback: string;
        feedbackFiles: [];
      }[];
    };
  };
  try {
    const projectId = requestBody.projectId;

    if (!projectId) {
      res
        .status(400)
        .json(STATUS_CODE[400]({ message: "project_id is required" }));
    }

    // first the id of the project is needed and will be sent inside the requestBody
    const controlCategoryId = requestBody.controlCategoryId;
    const controlCategoryTitle = requestBody.controlCategoryTitle;

    // then we need to create the control category and use the projectId as the foreign key
    await updateControlCategoryByIdQuery(controlCategoryId, {
      projectId,
      name: controlCategoryTitle,
    });

    const controlId = requestBody.control.id;
    // now we need to create the control for the control category, and use the control category id as the foreign key
    await updateControlByIdQuery(controlId, {
      // title: requestBody.control.title,
      status: requestBody.control.status,
      approver: requestBody.control.approver,
      riskReview: requestBody.control.riskReview,
      owner: requestBody.control.owner,
      reviewer: requestBody.control.reviewer,
      dueDate: requestBody.control.date,
      implementationDetails: requestBody.control.description,
      controlGroup: controlCategoryId
    });

    // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
    const subcontrols = requestBody.control.subControls;
    for (const subcontrol of subcontrols) {
      const subControlId = subcontrol.id;
      const subcontrolToSave: any = await updateSubcontrolByIdQuery(
        subControlId,
        subcontrol
      );
      console.log("subcontrolToSave : ", subcontrolToSave);
    }

    res.status(200).json(
      STATUS_CODE[200]({
        message: "Controls saved",
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
