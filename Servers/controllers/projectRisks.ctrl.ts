import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createProjectRiskQuery,
  deleteProjectRiskByIdQuery,
  getAllProjectRisksQuery,
  getProjectRiskByIdQuery,
  updateProjectRiskByIdQuery,
} from "../utils/projectRisk.utils";

export async function getAllProjectRisks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRisks = await getAllProjectRisksQuery();

    if (projectRisks) {
      return res.status(200).json(STATUS_CODE[200](projectRisks));
    }

    return res.status(204).json(STATUS_CODE[204](projectRisks));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRiskId = parseInt(req.params.id);

    const projectRisk = await getProjectRiskByIdQuery(projectRiskId);

    if (projectRisk) {
      return res.status(200).json(STATUS_CODE[200](projectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](projectRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProjectRisk(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRisk: {
      project_id: number; // Foreign key to refer to the project
      risk_name: string;
      risk_owner: string;
      ai_lifecycle_phase: string;
      risk_description: string;
      risk_category: string;
      impact: string;
      assessment_mapping: string;
      controls_mapping: string;
      likelihood: string;
      severity: string;
      risk_level_autocalculated: string;
      review_notes: string;
      mitigation_status: string;
      current_risk_level: string;
      deadline: Date;
      mitigation_plan: string;
      implementation_strategy: string;
      mitigation_evidence_document: string;
      likelihood_mitigation: string;
      risk_severity: string;
      final_risk_level: string;
      risk_approval: string;
      approval_status: string;
      date_of_assessment: Date;
    } = req.body;

    const newProjectRisk = await createProjectRiskQuery(projectRisk);

    if (newProjectRisk) {
      return res.status(201).json(STATUS_CODE[201](newProjectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](newProjectRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRiskId = parseInt(req.params.id);
    const projectRisk: Partial<{
      project_id: number; // Foreign key to refer to the project
      risk_name: string;
      risk_owner: string;
      ai_lifecycle_phase: string;
      risk_description: string;
      risk_category: string;
      impact: string;
      assessment_mapping: string;
      controls_mapping: string;
      likelihood: string;
      severity: string;
      risk_level_autocalculated: string;
      review_notes: string;
      mitigation_status: string;
      current_risk_level: string;
      deadline: Date;
      mitigation_plan: string;
      implementation_strategy: string;
      mitigation_evidence_document: string;
      likelihood_mitigation: string;
      risk_severity: string;
      final_risk_level: string;
      risk_approval: string;
      approval_status: string;
      date_of_assessment: Date;
    }> = req.body;

    const updatedProjectRisk = await updateProjectRiskByIdQuery(
      projectRiskId,
      projectRisk
    );

    if (updatedProjectRisk) {
      return res.status(200).json(STATUS_CODE[200](updatedProjectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](updatedProjectRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRiskId = parseInt(req.params.id);

    const deletedProjectRisk = await deleteProjectRiskByIdQuery(
      projectRiskId
    );

    if (deletedProjectRisk) {
      return res.status(200).json(STATUS_CODE[200](deletedProjectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](deletedProjectRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
