import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockControl,
  deleteMockControlById,
  getAllMockControls,
  getMockControlById,
  updateMockControlById,
} from "../mocks/tools/control.mock.db";
import {
  createNewControlQuery,
  deleteControlByIdQuery,
  getAllControlsQuery,
  getControlByIdQuery,
  updateControlByIdQuery,
} from "../utils/control.utils";
import { createNewSubcontrolQuery } from "../utils/subControl.utils";

export async function getAllControls(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCKDATA_ON === true) {
      const controls = getAllMockControls();

      if (controls) {
        return res.status(200).json(STATUS_CODE[200](controls));
      }

      return res.status(204).json(STATUS_CODE[204](controls));
    } else {
      const controls = await getAllControlsQuery();

      if (controls) {
        return res.status(200).json(STATUS_CODE[200](controls));
      }

      return res.status(204).json(STATUS_CODE[204](controls));
    }
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

    if (MOCKDATA_ON === true) {
      const control = getMockControlById(controlId);

      if (control) {
        return res.status(200).json(STATUS_CODE[200](control));
      }

      return res.status(204).json(STATUS_CODE[204](control));
    } else {
      const control = await getControlByIdQuery(controlId);

      if (control) {
        return res.status(200).json(STATUS_CODE[200](control));
      }

      return res.status(204).json(STATUS_CODE[204](control));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createControl(req: Request, res: Response): Promise<any> {
  try {
    const controlGroups: {
      id: number;
      controlGroupTitle: string;
      control: {
        id: number;
        controls: {
          id: number;
          projectId: number;
          status: string;
          approver: string;
          riskReview: string;
          owner: string;
          reviewer: string;
          dueDate: Date;
          implementationDetails: string;
          subControls: {
            id: number;
            status: string;
            approver: string;
            riskReview: string;
            owner: string;
            reviewer: string;
            dueDate: Date;
            implementationDetails: string;
            evidence: string;
            attachment: string;
            feedback: string;
          }[];
        }[];
      }[];
    }[] = req.body;

    if (MOCKDATA_ON === true) {
      // const control = createMockControl(newControl);

      // if (control) {
      //   return res.status(201).json(STATUS_CODE[201](control));
      // }

      // return res.status(400).json(STATUS_CODE[400](control));
    } else {
      let flag = true;
      mainLoop: for (const controlGroup of controlGroups) {
        for (const ctrl of controlGroup.control) {
          for (const control of ctrl.controls) {
            const controlId = control.id;
            for (const subControl of control.subControls) {
              const newSubControl = await createNewSubcontrolQuery(
                {controlId, ...subControl}
              );
              if (!newSubControl) {
                flag = false;
                break mainLoop;
              }
            }
            const newControl = await createNewControlQuery(control);
            if (!newControl) {
              flag = false;
              break mainLoop;
            }
          }
        }
      }

      if (flag) {
        return res.status(201).json(STATUS_CODE[201]({}));
      }

      return res.status(400).json(STATUS_CODE[400]({}));
    }
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

    if (MOCKDATA_ON === true) {
      const control = updateMockControlById(controlId, updatedControl);

      if (control) {
        return res.status(200).json(STATUS_CODE[200](control));
      }

      return res.status(400).json(STATUS_CODE[400](control));
    } else {
      const control = await updateControlByIdQuery(controlId, updatedControl);

      if (control) {
        return res.status(200).json(STATUS_CODE[200](control));
      }

      return res.status(400).json(STATUS_CODE[400](control));
    }
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

    if (MOCKDATA_ON === true) {
      const control = deleteMockControlById(controlId);

      if (control) {
        return res.status(200).json(STATUS_CODE[200](control));
      }

      return res.status(400).json(STATUS_CODE[400](control));
    } else {
      const control = await deleteControlByIdQuery(controlId);

      if (control) {
        return res.status(200).json(STATUS_CODE[200](control));
      }

      return res.status(400).json(STATUS_CODE[400](control));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
