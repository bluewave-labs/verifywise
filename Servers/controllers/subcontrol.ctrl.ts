import { Request, Response } from "express";
import { Subcontrol } from "../models/subcontrol.model";
const MOCK_DATA_ON = true;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockSubcontrol,
  deleteMockSubcontrolById,
  getAllMockSubcontrols,
  getMockSubcontrolById,
  updateMockSubcontrolById,
} from "../mocks/tools/subcontrol.mock.db";
import {
  createNewSubcontrolQuery,
  deleteSubcontrolByIdQuery,
  getAllSubcontrolsQuery,
  getSubcontrolByIdQuery,
  updateSubcontrolByIdQuery,
} from "../utils/subControl.utils";

export async function getAllSubcontrols(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCK_DATA_ON === true) {
      const subcontrols = getAllMockSubcontrols();

      if (subcontrols) {
        return res.status(200).json(STATUS_CODE[200](subcontrols));
      }

      return res.status(204).json(STATUS_CODE[204](subcontrols));
    } else {
      const subcontrols = await getAllSubcontrolsQuery();

      if (subcontrols) {
        return res.status(200).json(STATUS_CODE[200](subcontrols));
      }

      return res.status(204).json(STATUS_CODE[204](subcontrols));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subcontrolId = parseInt(req.params.id);

    if (MOCK_DATA_ON === true) {
      const subcontrol = getMockSubcontrolById(subcontrolId);

      if (subcontrol) {
        return res.status(200).json(STATUS_CODE[200](subcontrol));
      }

      return res.status(204).json(STATUS_CODE[204](subcontrol));
    } else {
      const subcontrol = await getSubcontrolByIdQuery(subcontrolId);

      if (subcontrol) {
        return res.status(200).json(STATUS_CODE[200](subcontrol));
      }

      return res.status(204).json(STATUS_CODE[204](subcontrol));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewSubcontrol(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subcontrol: Subcontrol = req.body;

    if (MOCK_DATA_ON === true) {
      const newSubcontrol = createMockSubcontrol(subcontrol);

      if (newSubcontrol) {
        return res.status(200).json(STATUS_CODE[200](newSubcontrol));
      }

      return res.status(204).json(STATUS_CODE[204](newSubcontrol));
    } else {
      const newSubcontrol = await createNewSubcontrolQuery(subcontrol);

      if (newSubcontrol) {
        return res.status(200).json(STATUS_CODE[200](newSubcontrol));
      }

      return res.status(204).json(STATUS_CODE[204](newSubcontrol));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subcontrolId = parseInt(req.params.id);
    const subcontrol: Partial<Subcontrol> = req.body;

    if (MOCK_DATA_ON === true) {
      const updatedSubcontrol = updateMockSubcontrolById(
        subcontrolId,
        subcontrol
      );

      if (updatedSubcontrol) {
        return res.status(200).json(STATUS_CODE[200](updatedSubcontrol));
      }

      return res.status(204).json(STATUS_CODE[204](updatedSubcontrol));
    } else {
      const updatedSubcontrol = await updateSubcontrolByIdQuery(
        subcontrolId,
        subcontrol
      );

      if (updatedSubcontrol) {
        return res.status(200).json(STATUS_CODE[200](updatedSubcontrol));
      }

      return res.status(204).json(STATUS_CODE[204](updatedSubcontrol));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subcontrolId = parseInt(req.params.id);

    if (MOCK_DATA_ON === true) {
      const deletedSubcontrol = deleteMockSubcontrolById(subcontrolId);

      if (deletedSubcontrol) {
        return res.status(200).json(STATUS_CODE[200](deletedSubcontrol));
      }

      return res.status(204).json(STATUS_CODE[204](deletedSubcontrol));
    } else {
      const deletedSubcontrol = await deleteSubcontrolByIdQuery(subcontrolId);

      if (deletedSubcontrol) {
        return res.status(200).json(STATUS_CODE[200](deletedSubcontrol));
      }

      return res.status(204).json(STATUS_CODE[204](deletedSubcontrol));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
