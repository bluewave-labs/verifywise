
import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { IAITrustCentreOverview } from "../domain.layer/interfaces/i.aiTrustCentreOverview";
import { AITrustCenterResourcesModel } from "../domain.layer/models/aiTrustCentre/aiTrustCentreResources.model";
import { AITrustCenterSubprocessorsModel } from "../domain.layer/models/aiTrustCentre/aiTrustCentreSubprocessors.model";
import { AITrustCenterIntroModel } from "../domain.layer/models/aiTrustCentre/aiTrustCentreIntro.model";
import { AITrustCenterComplianceBadgesModel } from "../domain.layer/models/aiTrustCentre/aiTrustCentreComplianceBadges.model";
import { AITrustCenterCompanyDescriptionModel } from "../domain.layer/models/aiTrustCentre/aiTrustCentreCompanyDescription.model";
import { AITrustCenterTermsAndContactModel } from "../domain.layer/models/aiTrustCentre/aiTrustCentreTermsAndContract.model";
import { AITrustCenterInfoModel } from "../domain.layer/models/aiTrustCentre/aiTrustCenterInfo.model";
import { IAITrustCentreResources } from "../domain.layer/interfaces/i.aiTrustCentreResources";
import { IAITrustCentreSubprocessors } from "../domain.layer/interfaces/i.aiTrustCentreSubprocessors";
import { IAITrustCentrePublic } from "../domain.layer/interfaces/i.aiTrustCentrePublic";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import { deleteFileById } from "./fileUpload.utils";

export const getIsVisibleQuery = async (
  tenant: string
) => {
  try {
    const result = await sequelize.query(`SELECT visible FROM "${tenant}".ai_trust_center LIMIT 1;`) as [{ visible: boolean }[], number];
    return result[0][0]?.visible || false;
  } catch (error) {
    return false;
  }
}

export const getAITrustCentrePublicPageQuery = async (
  tenant: string
) => {
  const output: Partial<IAITrustCentrePublic> = {};
  const visible = await sequelize.query(
    `SELECT intro_visible, compliance_badges_visible, company_description_visible, terms_and_contact_visible, resources_visible, subprocessor_visible FROM "${tenant}".ai_trust_center LIMIT 1;`
  ) as [{ intro_visible: boolean, compliance_badges_visible: boolean, company_description_visible: boolean, terms_and_contact_visible: boolean, resources_visible: boolean, subprocessor_visible: boolean }[], number];

  type VisibleKeys = "intro_visible" | "compliance_badges_visible" | "company_description_visible" | "terms_and_contact_visible" | "resources_visible" | "subprocessor_visible";
  const visibleRow = visible[0][0] as Record<VisibleKeys, boolean>;

  const keysQueryMap = {
    intro_visible: `
      SELECT CASE
        WHEN purpose_visible THEN purpose_text
        ELSE NULL
      END AS purpose,
      CASE
        WHEN our_statement_visible THEN our_statement_text
        ELSE NULL
      END AS statement,
      CASE
        WHEN our_mission_visible THEN our_mission_text
        ELSE NULL
      END AS mission
      FROM "${tenant}".ai_trust_center_intro LIMIT 1;
    `,
    compliance_badges_visible: `
      SELECT SOC2_Type_I, SOC2_Type_II, ISO_27001, ISO_42001, CCPA, GDPR, HIPAA, EU_AI_Act
      FROM "${tenant}".ai_trust_center_compliance_badges LIMIT 1;
    `,
    company_description_visible: `
      SELECT CASE
        WHEN background_visible THEN background_text
        ELSE NULL
      END AS background,
      CASE
        WHEN core_benefits_visible THEN core_benefits_text
        ELSE NULL
      END AS core_benefits,
      CASE
        WHEN compliance_doc_visible THEN compliance_doc_text
        ELSE NULL
      END AS compliance_doc
      FROM "${tenant}".ai_trust_center_company_description LIMIT 1;
    `,
    terms_and_contact_visible: `
      SELECT CASE
        WHEN terms_visible THEN terms_text
        ELSE NULL
      END AS terms,
      CASE
        WHEN privacy_visible THEN privacy_text
        ELSE NULL
      END AS privacy,
      CASE
        WHEN email_visible THEN email_text
        ELSE NULL
      END AS email
      FROM "${tenant}".ai_trust_center_terms_and_contact LIMIT 1;
    `,
    resources_visible: `
      SELECT id, name, description, file_id, visible
      FROM "${tenant}".ai_trust_center_resources WHERE visible = true ORDER BY id ASC;
    `,
    subprocessor_visible: `
      SELECT id, name, purpose, location, url
      FROM "${tenant}".ai_trust_center_subprocessor ORDER BY id ASC;
    `
  }

  for (let key of Object.keys(visibleRow) as VisibleKeys[]) {
    if (visibleRow[key] === true) {
      const query = keysQueryMap[key];
      const result = await sequelize.query(query) as [any[], number];
      const field = key.replace("_visible", "") as keyof IAITrustCentrePublic;
      if (key === "resources_visible" || key === "subprocessor_visible") {
        output[field as "resources" | "subprocessors"] = result[0] || [];
      } else {
        output[field] = result[0][0] || {};
      }
    }
  }

  return output
}

export const getAITrustCentreOverviewQuery = async (
  tenant: string
) => {
  let updatedOverview: Partial<Record<keyof IAITrustCentreOverview, any>> = {};

  const models = [AITrustCenterIntroModel, AITrustCenterComplianceBadgesModel, AITrustCenterCompanyDescriptionModel, AITrustCenterTermsAndContactModel, AITrustCenterInfoModel];

  await Promise.all(["intro", "compliance_badges", "company_description", "terms_and_contact", "info"].map(async (section, i) => {
    const model = models[i];
    const query = `SELECT 
      ${section === "info" ? "id, title, header_color, visible, intro_visible, compliance_badges_visible, company_description_visible, terms_and_contact_visible, resources_visible, subprocessor_visible, updated_at" : "*"}
    FROM "${tenant}".ai_trust_center${section === "info" ? "" : `_${section}`} LIMIT 1;`;
    const result = await sequelize.query(query) as [any[], number];
    updatedOverview[section as keyof IAITrustCentreOverview] = result[0][0] || {};
  }));

  return updatedOverview as IAITrustCentreOverview;
}

export const getAITrustCentreResourcesQuery = async (
  tenant: string
) => {
  const query = `SELECT * FROM "${tenant}".ai_trust_center_resources ORDER BY id ASC;`;
  const resources = await sequelize.query(query, {
    mapToModel: true,
    model: AITrustCenterResourcesModel, // Using the same model for resources
  });
  return resources;
}

export const getAITrustCentreSubprocessorsQuery = async (
  tenant: string
) => {
  const query = `SELECT * FROM "${tenant}".ai_trust_center_subprocessor ORDER BY id ASC;`;
  const subprocessors = await sequelize.query(query, {
    mapToModel: true,
    model: AITrustCenterSubprocessorsModel, // Using the same model for subprocessors
  });
  return subprocessors;
}

export const createAITrustCentreResourceQuery = async (
  resource: Partial<IAITrustCentreResources>,
  tenant: string,
  transaction: Transaction
) => {
  const query = `INSERT INTO "${tenant}".ai_trust_center_resources (
    name, description, file_id) VALUES (:name, :description, :fileId) RETURNING *`;

  const result = await sequelize.query(query, {
    replacements: {
      name: resource.name,
      description: resource.description,
      fileId: resource.file_id,
    },
    mapToModel: true,
    model: AITrustCenterResourcesModel,
    transaction,
  });
  return result[0];
}

export const createAITrustCentreSubprocessorQuery = async (
  subprocessor: IAITrustCentreSubprocessors,
  tenant: string,
  transaction: Transaction
) => {
  const query = `INSERT INTO "${tenant}".ai_trust_center_subprocessor (
    name, purpose, location, url) VALUES (:name, :purpose, :location, :url) RETURNING *`;
  const result = await sequelize.query(query, {
    replacements: {
      name: subprocessor.name,
      purpose: subprocessor.purpose,
      location: subprocessor.location,
      url: subprocessor.url,
    },
    mapToModel: true,
    model: AITrustCenterSubprocessorsModel,
    transaction,
  });
  return result[0];
}

export const updateAITrustCentreOverviewQuery = async (
  overview: Partial<IAITrustCentreOverview>,
  tenant: string,
  transaction: Transaction
) => {
  let updatedOverview: Partial<Record<keyof IAITrustCentreOverview, any>> = {};

  const metadata = [
    { key: "intro", tableName: "ai_trust_center_intro", columns: ["purpose_visible", "purpose_text", "our_statement_visible", "our_statement_text", "our_mission_visible", "our_mission_text"] },
    { key: "compliance_badges", tableName: "ai_trust_center_compliance_badges", columns: ["SOC2_Type_I", "SOC2_Type_II", "ISO_27001", "ISO_42001", "CCPA", "GDPR", "HIPAA", "EU_AI_Act"] },
    { key: "company_description", tableName: "ai_trust_center_company_description", columns: ["background_visible", "background_text", "core_benefits_visible", "core_benefits_text", "compliance_doc_visible", "compliance_doc_text"] },
    { key: "terms_and_contact", tableName: "ai_trust_center_terms_and_contact", columns: ["terms_visible", "terms_text", "privacy_visible", "privacy_text", "email_visible", "email_text"] },
    { key: "info", tableName: "ai_trust_center", columns: ["title", "header_color", "visible", "intro_visible", "compliance_badges_visible", "company_description_visible", "terms_and_contact_visible", "resources_visible", "subprocessor_visible"] }
  ]

  await Promise.all(metadata.map(async ({ key, tableName, columns }) => {
    if (overview[key as keyof IAITrustCentreOverview]) {
      const updatedData: Partial<Record<string, any>> = {};
      const setClause = columns
        .filter((f) => {
          const section = overview[key as keyof IAITrustCentreOverview];
          if (section && (section as Record<string, any>)[f] !== undefined) {
            updatedData[f] = (section as Record<string, any>)[f];
            return true;
          }
        })
        .map((f) => `${f} = :${f}`)
        .join(", ");
      let query = `UPDATE "${tenant}".${tableName} SET ${setClause} RETURNING ${columns.concat(['id'])};`;
      if (setClause.length === 0) {
        query = `SELECT ${columns} FROM "${tenant}".${tableName};`
      }
      updatedData.id = overview[key as keyof IAITrustCentreOverview]?.id;
      const result = await sequelize.query(query, {
        replacements: updatedData,
        transaction,
      });
      updatedOverview[key as keyof IAITrustCentreOverview] = result[0];
    }
  }))

  return updatedOverview as IAITrustCentreOverview;
}

export const updateAITrustCentreResourceQuery = async (
  id: number,
  resource: Partial<IAITrustCentreResources>,
  deleteFile: number | undefined,
  tenant: string,
  transaction: Transaction
) => {
  const updatedResource: Partial<Record<keyof IAITrustCentreResources, any>> = {};
  let toDeleteFile = false;

  if (resource.file_id !== undefined && deleteFile !== undefined) {
    // verify if the file exists in the resource before deleting
    const currentFile = await sequelize.query(`SELECT file_id FROM "${tenant}".ai_trust_center_resources WHERE id = :id;`, { replacements: { id }, transaction }) as [{ file_id: number }[], number];

    if (currentFile[0][0]?.file_id !== deleteFile) {
      throw new ValidationException(
        "The file ID provided does not match the current file ID for this resource.",
        "File ID Mismatch",
        deleteFile
      );
    }
    toDeleteFile = true;
  }

  const setClause = ["name", "description", "file_id", "visible"]
    .filter((f) => {
      if (resource[f as keyof typeof resource] !== undefined) {
        updatedResource[f as keyof typeof resource] = resource[f as keyof typeof resource];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");
  const query = `UPDATE "${tenant}".ai_trust_center_resources SET ${setClause} WHERE id = :id RETURNING *;`;
  updatedResource.id = id;
  const result = await sequelize.query(query, {
    replacements: updatedResource,
    mapToModel: true,
    model: AITrustCenterResourcesModel,
    transaction
  });

  if (toDeleteFile) {
    await deleteFileById(deleteFile!, tenant, transaction);
  }

  return result[0];
}

export const updateAITrustCentreSubprocessorQuery = async (
  id: number,
  subprocessor: Partial<IAITrustCentreSubprocessors>,
  tenant: string,
  transaction: Transaction
) => {
  const updatedSubprocessor: Partial<Record<keyof {
    id: number;
    name: string;
    purpose: string;
    location: string;
    url: string;
  }, any>> = {};

  const setClause = ["name", "purpose", "location", "url"]
    .filter((f) => {
      if (subprocessor[f as keyof typeof subprocessor] !== undefined) {
        updatedSubprocessor[f as keyof typeof subprocessor] = subprocessor[f as keyof typeof subprocessor];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");
  const query = `UPDATE "${tenant}".ai_trust_center_subprocessor SET ${setClause} WHERE id = :id RETURNING *;`;
  updatedSubprocessor.id = id;
  const result = await sequelize.query(query, {
    replacements: updatedSubprocessor,
    mapToModel: true,
    model: AITrustCenterSubprocessorsModel,
    transaction,
  });
  return result[0];
}

export const deleteAITrustCentreResourceQuery = async (
  id: number,
  tenant: string,
) => {
  const query = `DELETE FROM "${tenant}".ai_trust_center_resources WHERE id = :id RETURNING *;`;
  const result = await sequelize.query(query, {
    replacements: { id },
  });
  return result[0].length > 0;
}

export const deleteAITrustCentreSubprocessorQuery = async (
  id: number,
  tenant: string,
) => {
  const query = `DELETE FROM "${tenant}".ai_trust_center_subprocessor WHERE id = :id RETURNING *;`;
  const result = await sequelize.query(query, {
    replacements: { id },
  });
  return result[0].length > 0;
}