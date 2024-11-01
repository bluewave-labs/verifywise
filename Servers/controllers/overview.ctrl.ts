import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockOverview,
  deleteMockOverviewById,
  getAllMockOverviews,
  getMockOverviewById,
  updateMockOverviewById
} from "../mocks/tools/overview.mock.db"
import {
  createNewOverviewQuery,
  deleteOverviewByIdQuery,
  getAllOverviewsQuery,
  getOverviewByIdQuery,
  updateOverviewByIdQuery
} from "../utils/overview.util";

export async function getAllOverviews(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const overviews = getAllMockOverviews();

      if (overviews) {
        return res.status(200).json(STATUS_CODE[200](overviews));
      }

      return res.status(204).json(STATUS_CODE[204](overviews));
    } else {
      const overviews = await getAllOverviewsQuery();

      if (overviews) {
        return res.status(200).json(STATUS_CODE[200](overviews));
      }

      return res.status(204).json(STATUS_CODE[204](overviews));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getOverviewById(req: Request, res: Response): Promise<any> {
  try {
    const overviewId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const overview = getMockOverviewById(overviewId);

      if (overview) {
        return res.status(200).json(STATUS_CODE[200](overview));
      }

      return res.status(404).json(STATUS_CODE[404](overview));
    } else {
      const overview = await getOverviewByIdQuery(overviewId);

      if (overview) {
        return res.status(200).json(STATUS_CODE[200](overview));
      }

      return res.status(404).json(STATUS_CODE[404](overview));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createOverview(req: Request, res: Response): Promise<any> {
  try {
    const {
      subrequirement_id,
      control_name,
      control_description,
      control_owner,
      control_status,
      implementation_description,
      implementation_evidence,
      effective_date,
      review_date,
      comments
    } = req.body;

    if (
      !subrequirement_id ||
      !control_name ||
      !control_description ||
      !control_owner ||
      !control_status ||
      !implementation_description ||
      !implementation_evidence ||
      !effective_date ||
      !review_date ||
      !comments
    ) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "subrequirement_id, control_name, control_description, control_owner, control_status, implementation_description, implementation_evidence, effective_date, review_date and comments are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const newOverview = createMockOverview({
        subrequirement_id,
        control_name,
        control_description,
        control_owner,
        control_status,
        implementation_description,
        implementation_evidence,
        effective_date,
        review_date,
        comments
      });

      if (newOverview) {
        return res.status(201).json(STATUS_CODE[201](newOverview));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newOverview = await createNewOverviewQuery({
        subrequirement_id,
        control_name,
        control_description,
        control_owner,
        control_status,
        implementation_description,
        implementation_evidence,
        effective_date,
        review_date,
        comments
      });

      if (newOverview) {
        return res.status(201).json(STATUS_CODE[201](newOverview));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateOverviewById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateOverviewById");
  try {
    const overviewId = parseInt(req.params.id);
    const {
      subrequirement_id,
      control_name,
      control_description,
      control_owner,
      control_status,
      implementation_description,
      implementation_evidence,
      effective_date,
      review_date,
      comments
    } = req.body;

    if (
      !subrequirement_id ||
      !control_name ||
      !control_description ||
      !control_owner ||
      !control_status ||
      !implementation_description ||
      !implementation_evidence ||
      !effective_date ||
      !review_date ||
      !comments
    ) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "subrequirement_id, control_name, control_description, control_owner, control_status, implementation_description, implementation_evidence, effective_date, review_date and comments are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedOverview = updateMockOverviewById(overviewId, {
        subrequirement_id,
        control_name,
        control_description,
        control_owner,
        control_status,
        implementation_description,
        implementation_evidence,
        effective_date,
        review_date,
        comments
      });

      if (updatedOverview) {
        return res.status(202).json(STATUS_CODE[202](updatedOverview));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedOverview = await updateOverviewByIdQuery(overviewId, {
        subrequirement_id,
        control_name,
        control_description,
        control_owner,
        control_status,
        implementation_description,
        implementation_evidence,
        effective_date,
        review_date,
        comments
      });

      if (updatedOverview) {
        return res.status(202).json(STATUS_CODE[202](updatedOverview));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteOverviewById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const overviewId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedOverview = deleteMockOverviewById(overviewId);

      if (deletedOverview) {
        return res.status(202).json(STATUS_CODE[202](deletedOverview));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedOverview = await deleteOverviewByIdQuery(overviewId);

      if (deletedOverview) {
        return res.status(202).json(STATUS_CODE[202](deletedOverview));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
