import { Request, Response } from "express";
import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { EvidenceHubModel } from "../domain.layer/models/evidenceHub/evidenceHub.model";
import {
    getAllEvidencesQuery,
    getEvidenceByIdQuery,
    createNewEvidenceQuery,
    updateEvidenceByIdQuery,
    deleteEvidenceByIdQuery,
} from "../utils/evidenceHub.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { ValidationError } from "../utils/validations/validation.utils";


export async function getAllEvidences(req: Request, res: Response) {
    logStructured("processing", "starting getAllEvidences", "getAllEvidences", "evidenceHub.controller.ts");
    logger.debug("🔍 Fetching all evidences");

    try {
        const evidences = await getAllEvidencesQuery(req.tenantId!) as EvidenceHubModel[];

        if (evidences && evidences.length > 0) {
            logStructured("successful", "evidences found", "getAllEvidences", "evidenceHub.controller.ts");
            return res.status(200).json(STATUS_CODE[200](evidences.map(e => e.toSafeJSON())));
        }

        logStructured("successful", "no evidences found", "getAllEvidences", "evidenceHub.controller.ts");
        return res.status(200).json(STATUS_CODE[200](evidences));
    } catch (error) {
        logStructured("error", "failed to retrieve evidences", "getAllEvidences", "evidenceHub.controller.ts");
        logger.error("❌ Error in getAllEvidences:", error);
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}

/**
 * Get evidence by ID
 */
export async function getEvidenceById(req: Request, res: Response) {
    const evidenceId = parseInt(req.params.id);

    if (isNaN(evidenceId)) {
        logStructured("error", `Invalid evidence ID parameter: ${req.params.id}`, "getEvidenceById", "evidenceHub.controller.ts");
        return res.status(400).json({
            status: "error",
            message: "Invalid evidence ID",
            code: "INVALID_PARAMETER",
        });
    }

    try {
        const evidence = await getEvidenceByIdQuery(evidenceId, req.tenantId!) as EvidenceHubModel;
        if (evidence) {
            logStructured("successful", `evidence found: ${evidenceId}`, "getEvidenceById", "evidenceHub.controller.ts");
            return res.status(200).json(STATUS_CODE[200](evidence.toSafeJSON()));
        }

        logStructured("successful", `no evidence found: ${evidenceId}`, "getEvidenceById", "evidenceHub.controller.ts");
        return res.status(204).json(STATUS_CODE[204](null));
    } catch (error) {
        logStructured("error", "failed to retrieve evidence", "getEvidenceById", "evidenceHub.controller.ts");
        logger.error("❌ Error in getEvidenceById:", error);
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}

/**
 * Create new evidence
 */
export async function createNewEvidence(req: Request, res: Response) {
    // You can add proper validation here if needed
    const transaction = await sequelize.transaction();
    try {
        const evidence = new EvidenceHubModel({
            ...req.body,
            // evidence_files: JSON.stringify(req.body.evidence_files),
            uploaded_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
        });

        const savedEvidence = await createNewEvidenceQuery(evidence, req.tenantId!, transaction);
        await transaction.commit();

        logStructured("successful", "new evidence created", "createNewEvidence", "evidenceHub.controller.ts");
        return res.status(201).json(STATUS_CODE[201](savedEvidence.toSafeJSON()));
    } catch (error) {
        await transaction.rollback();
        logStructured("error", "failed to create new evidence", "createNewEvidence", "evidenceHub.controller.ts");
        logger.error("❌ Error in createNewEvidence:", error);
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}

/**
 * Update evidence by ID
 */
export async function updateEvidenceById(req: Request, res: Response) {
    const evidenceId = parseInt(req.params.id);
    if (isNaN(evidenceId)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid evidence ID",
            code: "INVALID_PARAMETER",
        });
    }

    const transaction = await sequelize.transaction();
    try {
        const existingEvidence = await getEvidenceByIdQuery(evidenceId, req.tenantId!) as EvidenceHubModel;
        if (!existingEvidence) {
            return res.status(404).json(STATUS_CODE[404]("Evidence not found"));
        }

        Object.assign(existingEvidence, { ...req.body, updated_at: new Date() });
        const updatedEvidence = await updateEvidenceByIdQuery(evidenceId, existingEvidence, req.tenantId!, transaction);
        await transaction.commit();

        return res.status(200).json(STATUS_CODE[200](updatedEvidence.toSafeJSON()));
    } catch (error) {
        await transaction.rollback();
        logger.error("❌ Error in updateEvidenceById:", error);
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}

/**
 * Delete evidence by ID
 */
export async function deleteEvidenceById(req: Request, res: Response) {
    const evidenceId = parseInt(req.params.id);
    if (isNaN(evidenceId)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid evidence ID",
            code: "INVALID_PARAMETER",
        });
    }

    const transaction = await sequelize.transaction();
    try {
        const existingEvidence = await getEvidenceByIdQuery(evidenceId, req.tenantId!) as EvidenceHubModel;
        if (!existingEvidence) {
            return res.status(404).json(STATUS_CODE[404]("Evidence not found"));
        }

        await deleteEvidenceByIdQuery(evidenceId, req.tenantId!, transaction);
        await transaction.commit();

        return res.status(200).json(STATUS_CODE[200]("Evidence deleted successfully"));
    } catch (error) {
        await transaction.rollback();
        logger.error("❌ Error in deleteEvidenceById:", error);
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}