import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { EvidenceHubModel } from "../domain.layer/models/evidenceHub/evidenceHub.model";

// Get all evidences
export const getAllEvidencesQuery = async (tenant: string) => {
    const evidences = await sequelize.query(
        `SELECT * FROM "${tenant}".evidence_hub ORDER BY created_at DESC, id ASC`,
        {
            mapToModel: true,
            model: EvidenceHubModel,
        }
    );
    return evidences;
};

// Get evidence by ID
export const getEvidenceByIdQuery = async (id: number, tenant: string) => {
    const evidences = await sequelize.query(
        `SELECT * FROM "${tenant}".evidence_hub WHERE id = :id`,
        {
            replacements: { id },
            mapToModel: true,
            model: EvidenceHubModel,
        }
    );
    if (!evidences.length) return null;
    return evidences[0];
};

// Create new evidence
export const createNewEvidenceQuery = async (
    evidence: EvidenceHubModel,
    tenant: string,
    transaction: Transaction
) => {
    const created_at = new Date();
    try {
        const result = await sequelize.query(
            `INSERT INTO "${tenant}".evidence_hub (
                evidence_name,
                evidence_type,
                description,
                evidence_files,
                expiry_date,
                mapped_model_ids,
                created_at,
                updated_at
            ) VALUES (
                :evidence_name,
                :evidence_type,
                :description,
                :evidence_files,
                :expiry_date,
                :mapped_model_ids,
                :created_at,
                :updated_at
            ) RETURNING *`,
            {
                replacements: {
                    evidence_name: evidence.evidence_name,
                    evidence_type: evidence.evidence_type,
                    description: evidence.description,
                    evidence_files: JSON.stringify(evidence.evidence_files),
                    expiry_date: evidence.expiry_date,
                    mapped_model_ids: evidence.mapped_model_ids
                        ? `{${evidence.mapped_model_ids.join(",")}}`
                        : null,
                    created_at,
                    updated_at: created_at,
                },
                mapToModel: true,
                model: EvidenceHubModel,
                transaction,
            }
        );

        return result[0];
    } catch (error) {
        console.error("Error creating new evidence:", error);
        throw error;
    }
};

// Update evidence by ID
export const updateEvidenceByIdQuery = async (
    id: number,
    evidence: EvidenceHubModel,
    tenant: string,
    transaction: Transaction
) => {
    const updated_at = new Date();

    try {
        await sequelize.query(
            `UPDATE "${tenant}".evidence_hub SET
                evidence_name = :evidence_name,
                evidence_type = :evidence_type,
                description = :description,
                evidence_files = :evidence_files,
                expiry_date = :expiry_date,
                mapped_model_ids = :mapped_model_ids,
                updated_at = :updated_at
             WHERE id = :id`,
            {
                replacements: {
                    id,
                    evidence_name: evidence.evidence_name,
                    evidence_type: evidence.evidence_type,
                    description: evidence.description,
                    evidence_files: JSON.stringify(evidence.evidence_files),
                    expiry_date: evidence.expiry_date,
                    mapped_model_ids: evidence.mapped_model_ids
                        ? `{${evidence.mapped_model_ids.join(",")}}`
                        : null,
                    updated_at,
                },
                transaction,
            }
        );

        const result = await sequelize.query(
            `SELECT * FROM "${tenant}".evidence_hub WHERE id = :id`,
            {
                replacements: { id },
                mapToModel: true,
                model: EvidenceHubModel,
                transaction,
            }
        );

        return result[0];
    } catch (error) {
        console.error("Error updating evidence:", error);
        throw error;
    }
};

// Delete evidence by ID
export const deleteEvidenceByIdQuery = async (
    id: number,
    tenant: string,
    transaction: Transaction
) => {
    try {
        const result = (await sequelize.query(
            `DELETE FROM "${tenant}".evidence_hub WHERE id = :id RETURNING *`,
            { replacements: { id }, transaction }
        )) as [EvidenceHubModel[], number];

        return result[0][0];
    } catch (error) {
        console.error("Error deleting evidence:", error);
        throw error;
    }
};
