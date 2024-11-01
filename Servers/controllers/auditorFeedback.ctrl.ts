import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockAuditorFeedback,
  deleteMockAuditorFeedbackById,
  getAllMockAuditorFeedbacks,
  getMockAuditorFeedbackById,
  updateMockAuditorFeedbackById
} from "../mocks/tools/auditorFeedback.mock.db"
import {
  createNewAuditorFeedbackQuery,
  deleteAuditorFeedbackByIdQuery,
  getAllAuditorFeedbacksQuery,
  getAuditorFeedbackByIdQuery,
  updateAuditorFeedbackByIdQuery
} from "../utils/auditorFeedback.util";

export async function getAllAuditorFeedbacks(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const auditorFeedbacks = getAllMockAuditorFeedbacks();

      if (auditorFeedbacks) {
        return res.status(200).json(STATUS_CODE[200](auditorFeedbacks));
      }

      return res.status(204).json(STATUS_CODE[204](auditorFeedbacks));
    } else {
      const auditorFeedbacks = await getAllAuditorFeedbacksQuery();

      if (auditorFeedbacks) {
        return res.status(200).json(STATUS_CODE[200](auditorFeedbacks));
      }

      return res.status(204).json(STATUS_CODE[204](auditorFeedbacks));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAuditorFeedbackById(req: Request, res: Response): Promise<any> {
  try {
    const auditorFeedbackId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const auditorFeedback = getMockAuditorFeedbackById(auditorFeedbackId);

      if (auditorFeedback) {
        return res.status(200).json(STATUS_CODE[200](auditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404](auditorFeedback));
    } else {
      const auditorFeedback = await getAuditorFeedbackByIdQuery(auditorFeedbackId);

      if (auditorFeedback) {
        return res.status(200).json(STATUS_CODE[200](auditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404](auditorFeedback));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAuditorFeedback(req: Request, res: Response): Promise<any> {
  try {
    const {
      subrequirement_id,
      assessment_type,
      assessment_date,
      auditor_id,
      compliance_status,
      findings,
      recommendations,
      corrective_actions,
      follow_up_date,
      follow_up_notes,
      attachments,
    } = req.body;

    if (
      !subrequirement_id ||
      !assessment_type ||
      !assessment_date ||
      !auditor_id ||
      !compliance_status ||
      !findings ||
      !recommendations ||
      !corrective_actions ||
      !follow_up_date ||
      !follow_up_notes ||
      !attachments) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "subrequirement_id, assessment_type, assessment_date, auditor_id, compliance_status, findings, recommendations, corrective_actions, follow_up_date, follow_up_notes and attachments are required" })
        );
    }

    var created_at, updated_at;
    created_at = updated_at = new Date().toISOString()

    if (MOCK_DATA_ON === "true") {
      const newAuditorFeedback = createMockAuditorFeedback({
        subrequirement_id,
        assessment_type,
        assessment_date,
        auditor_id,
        compliance_status,
        findings,
        recommendations,
        corrective_actions,
        follow_up_date,
        follow_up_notes,
        attachments,
        created_at,
        updated_at
      });

      if (newAuditorFeedback) {
        return res.status(201).json(STATUS_CODE[201](newAuditorFeedback));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newAuditorFeedback = await createNewAuditorFeedbackQuery({
        subrequirement_id,
        assessment_type,
        assessment_date,
        auditor_id,
        compliance_status,
        findings,
        recommendations,
        corrective_actions,
        follow_up_date,
        follow_up_notes,
        attachments,
        created_at,
        updated_at
      });

      if (newAuditorFeedback) {
        return res.status(201).json(STATUS_CODE[201](newAuditorFeedback));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAuditorFeedbackById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateAuditorFeedbackById");
  try {
    const auditorFeedbackId = parseInt(req.params.id);
    const {
      subrequirement_id,
      assessment_type,
      assessment_date,
      auditor_id,
      compliance_status,
      findings,
      recommendations,
      corrective_actions,
      follow_up_date,
      follow_up_notes,
      attachments,
      created_at,
      updated_at
    } = req.body;

    if (
      !subrequirement_id ||
      !assessment_type ||
      !assessment_date ||
      !auditor_id ||
      !compliance_status ||
      !findings ||
      !recommendations ||
      !corrective_actions ||
      !follow_up_date ||
      !follow_up_notes ||
      !attachments ||
      !created_at ||
      !updated_at
    ) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "subrequirement_id, assessment_type, assessment_date, auditor_id, compliance_status, findings, recommendations, corrective_actions, follow_up_date, follow_up_notes, attachments, created_at and updated_at are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedAuditorFeedback = updateMockAuditorFeedbackById(auditorFeedbackId, {
        subrequirement_id,
        assessment_type,
        assessment_date,
        auditor_id,
        compliance_status,
        findings,
        recommendations,
        corrective_actions,
        follow_up_date,
        follow_up_notes,
        attachments,
        created_at,
        updated_at
      });

      if (updatedAuditorFeedback) {
        return res.status(202).json(STATUS_CODE[202](updatedAuditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedAuditorFeedback = await updateAuditorFeedbackByIdQuery(auditorFeedbackId, {
        subrequirement_id,
        assessment_type,
        assessment_date,
        auditor_id,
        compliance_status,
        findings,
        recommendations,
        corrective_actions,
        follow_up_date,
        follow_up_notes,
        attachments,
        created_at,
        updated_at
      });

      if (updatedAuditorFeedback) {
        return res.status(202).json(STATUS_CODE[202](updatedAuditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAuditorFeedbackById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const auditorFeedbackId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedAuditorFeedback = deleteMockAuditorFeedbackById(auditorFeedbackId);

      if (deletedAuditorFeedback) {
        return res.status(202).json(STATUS_CODE[202](deletedAuditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedAuditorFeedback = await deleteAuditorFeedbackByIdQuery(auditorFeedbackId);

      if (deletedAuditorFeedback) {
        return res.status(202).json(STATUS_CODE[202](deletedAuditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
