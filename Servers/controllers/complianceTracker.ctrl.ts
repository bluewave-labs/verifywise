import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockComplianceTracker,
  deleteMockComplianceTrackerById,
  getAllMockComplianceTrackers,
  getMockComplianceTrackerById,
  updateMockComplianceTrackerById
} from "../mocks/tools/complianceTracker.mock.db"
import {
  createNewComplianceTrackerQuery,
  deleteComplianceTrackerByIdQuery,
  getAllComplianceTrackersQuery,
  getComplianceTrackerByIdQuery,
  updateComplianceTrackerByIdQuery
} from "../utils/complianceTracker.util";

export async function getAllComplianceTrackers(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const complianceTrackers = getAllMockComplianceTrackers();

      if (complianceTrackers) {
        return res.status(200).json(STATUS_CODE[200](complianceTrackers));
      }

      return res.status(204).json(STATUS_CODE[204](complianceTrackers));
    } else {
      const complianceTrackers = await getAllComplianceTrackersQuery();

      if (complianceTrackers) {
        return res.status(200).json(STATUS_CODE[200](complianceTrackers));
      }

      return res.status(204).json(STATUS_CODE[204](complianceTrackers));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getComplianceTrackerById(req: Request, res: Response): Promise<any> {
  try {
    const complianceTrackerId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const complianceTracker = getMockComplianceTrackerById(complianceTrackerId);

      if (complianceTracker) {
        return res.status(200).json(STATUS_CODE[200](complianceTracker));
      }

      return res.status(404).json(STATUS_CODE[404](complianceTracker));
    } else {
      const complianceTracker = await getComplianceTrackerByIdQuery(complianceTrackerId);

      if (complianceTracker) {
        return res.status(200).json(STATUS_CODE[200](complianceTracker));
      }

      return res.status(404).json(STATUS_CODE[404](complianceTracker));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createComplianceTracker(req: Request, res: Response): Promise<any> {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const newComplianceTracker = createMockComplianceTracker({ name, description });

      if (newComplianceTracker) {
        return res.status(201).json(STATUS_CODE[201](newComplianceTracker));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newComplianceTracker = await createNewComplianceTrackerQuery({ name, description });

      if (newComplianceTracker) {
        return res.status(201).json(STATUS_CODE[201](newComplianceTracker));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateComplianceTrackerById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateComplianceTrackerById");
  try {
    const complianceTrackerId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedComplianceTracker = updateMockComplianceTrackerById(complianceTrackerId, { name, description });

      if (updatedComplianceTracker) {
        return res.status(202).json(STATUS_CODE[202](updatedComplianceTracker));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedComplianceTracker = await updateComplianceTrackerByIdQuery(complianceTrackerId, {
        name,
        description,
      });

      if (updatedComplianceTracker) {
        return res.status(202).json(STATUS_CODE[202](updatedComplianceTracker));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteComplianceTrackerById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const complianceTrackerId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedComplianceTracker = deleteMockComplianceTrackerById(complianceTrackerId);

      if (deletedComplianceTracker) {
        return res.status(202).json(STATUS_CODE[202](deletedComplianceTracker));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedComplianceTracker = await deleteComplianceTrackerByIdQuery(complianceTrackerId);

      if (deletedComplianceTracker) {
        return res.status(202).json(STATUS_CODE[202](deletedComplianceTracker));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
