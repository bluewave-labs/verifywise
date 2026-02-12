import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getReviewsQuery,
  createReviewQuery,
  updateReviewQuery,
} from "../utils/shadowAi.utils";

export async function getReviews(req: Request, res: Response): Promise<any> {
  try {
    const filters = {
      review_type: req.query.review_type,
      status: req.query.status,
      assigned_to: req.query.assigned_to ? parseInt(req.query.assigned_to as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    };

    const reviews = await getReviewsQuery(filters, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](reviews));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createReview(req: Request, res: Response): Promise<any> {
  try {
    const data = req.body;
    if (!data.review_type || !data.subject_id || !data.subject_type) {
      return res.status(400).json(STATUS_CODE[400]("review_type, subject_id, and subject_type are required"));
    }
    const review = await createReviewQuery(data, req.tenantId!);
    return res.status(201).json(STATUS_CODE[201](review));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateReview(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const data = { ...req.body };

    // If completing, set completed_at
    if (data.status === "completed") {
      data.completed_at = new Date();
    }

    const result = await updateReviewQuery(id, data, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
