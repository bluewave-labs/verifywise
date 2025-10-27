import { ModelInventoryModel } from "../domain.layer/models/modelInventory/modelInventory.model";
import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { TenantAutomationActionModel } from "../domain.layer/models/tenantAutomationAction/tenantAutomationAction.model";
import { buildVendorReplacements } from "./automation/vendor.automation.utils";
import { replaceTemplateVariables } from "./automation/automation.utils";
import { enqueueAutomationAction } from "../services/automations/automationProducer";
import { buildModelReplacements, buildModelUpdateReplacements } from "./automation/modelInventory.automation.utils";

export const getAllModelInventoriesQuery = async (tenant: string) => {
  const modelInventories = await sequelize.query(
    `SELECT * FROM "${tenant}".model_inventories ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: ModelInventoryModel,
    }
  );
  return modelInventories;
};

export const getModelByTenantIdQuery = async (tenant: string) => {
  const modelInventory = await sequelize.query(
    `SELECT * FROM "${tenant}".model_inventories`,
    {
      mapToModel: true,
      model: ModelInventoryModel,
    }
  );
  return modelInventory;
};

export const getModelInventoryByIdQuery = async (
  id: number,
  tenant: string
) => {
  const modelInventory = await sequelize.query(
    `SELECT * FROM "${tenant}".model_inventories WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: ModelInventoryModel,
    }
  );

  if (!modelInventory.length) return null;

  return modelInventory[0];
};

export const createNewModelInventoryQuery = async (
  modelInventory: ModelInventoryModel,
  tenant: string,
  transaction: Transaction
) => {
  const created_at = new Date();

  try {
    const result = await sequelize.query(
      `INSERT INTO "${tenant}".model_inventories (provider_model, provider, model, version, approver, capabilities, security_assessment, status, status_date, reference_link, biases, limitations, hosting_provider, used_in_projects, is_demo, created_at, updated_at)       
      VALUES (:provider_model, :provider, :model, :version, :approver, :capabilities, :security_assessment, :status, :status_date, :reference_link, :biases, :limitations, :hosting_provider, :used_in_projects, :is_demo, :created_at, :updated_at) RETURNING *`,
      {
        replacements: {
          provider_model: modelInventory.provider_model || '',
          provider: modelInventory.provider,
          model: modelInventory.model,
          version: modelInventory.version,
          approver: modelInventory.approver,
          capabilities: Array.isArray(modelInventory.capabilities)
            ? modelInventory.capabilities.join(", ")
            : modelInventory.capabilities,
          security_assessment: modelInventory.security_assessment,
          status: modelInventory.status,
          status_date: modelInventory.status_date,
          reference_link: modelInventory.reference_link,
          biases: modelInventory.biases,
          limitations: modelInventory.limitations,
          hosting_provider: modelInventory.hosting_provider,
          used_in_projects: modelInventory.used_in_projects,
          is_demo: modelInventory.is_demo,
          created_at: created_at,
          updated_at: created_at,
        },
        mapToModel: true,
        model: ModelInventoryModel,
        transaction,
      }
    );

    const createdModel = result[0];

    const automations = await sequelize.query(
      `SELECT
        pat.key AS trigger_key,
        paa.key AS action_key,
        aa.*
      FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'model_added' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
    ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string })[], number];
    if (automations[0].length > 0) {
      const automation = automations[0][0];
      if (automation["trigger_key"] === "model_added") {
        const params = automation.params!;

        // Build replacements
        const replacements = buildModelReplacements(createdModel);

        // Replace variables in subject and body
        const processedParams = {
          ...params,
          subject: replaceTemplateVariables(params.subject || '', replacements),
          body: replaceTemplateVariables(params.body || '', replacements)
        };

        // Enqueue with processed params
        await enqueueAutomationAction(automation.action_key, processedParams);
      } else {
        console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
      }
    }

    return createdModel;
  } catch (error) {
    console.error("Error creating new model inventory:", error);
    throw error;
  }
};

export const updateModelInventoryByIdQuery = async (
  id: number,
  modelInventory: ModelInventoryModel,
  tenant: string,
  transaction: Transaction
) => {
  const updated_at = new Date();
  const oldModel = await getModelInventoryByIdQuery(id, tenant);

  try {
    // First update the record
    await sequelize.query(
      `UPDATE "${tenant}".model_inventories SET provider_model = :provider_model, provider = :provider, model = :model, version = :version, approver = :approver, capabilities = :capabilities, security_assessment = :security_assessment, status = :status, status_date = :status_date, reference_link = :reference_link, biases = :biases, limitations = :limitations,  hosting_provider = :hosting_provider, used_in_projects = :used_in_projects, is_demo = :is_demo, updated_at = :updated_at WHERE id = :id`,
      {
        replacements: {
          id,
          provider_model: modelInventory.provider_model || '',
          provider: modelInventory.provider,
          model: modelInventory.model,
          version: modelInventory.version,
          approver: modelInventory.approver,
          capabilities: Array.isArray(modelInventory.capabilities)
            ? modelInventory.capabilities.join(", ")
            : modelInventory.capabilities,
          security_assessment: modelInventory.security_assessment,
          status: modelInventory.status,
          status_date: modelInventory.status_date,
          reference_link: modelInventory.reference_link,
          biases: modelInventory.biases,
          limitations: modelInventory.limitations,
          hosting_provider: modelInventory.hosting_provider,
          used_in_projects: modelInventory.used_in_projects,
          is_demo: modelInventory.is_demo,
          updated_at,
        },
        transaction,
      }
    );

    // Then fetch the updated record
    const result = await sequelize.query(
      `SELECT * FROM "${tenant}".model_inventories WHERE id = :id`,
      {
        replacements: { id },
        mapToModel: true,
        model: ModelInventoryModel,
        transaction,
      }
    );
    const updatedModel = result[0];

    const automations = await sequelize.query(
      `SELECT
        pat.key AS trigger_key,
        paa.key AS action_key,
        aa.*
      FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'model_updated' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
    ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string })[], number];
    if (automations[0].length > 0) {
      const automation = automations[0][0];
      if (automation["trigger_key"] === "model_updated") {
        const params = automation.params!;

        // Build replacements
        const replacements = buildModelUpdateReplacements(oldModel, updatedModel);

        // Replace variables in subject and body
        const processedParams = {
          ...params,
          subject: replaceTemplateVariables(params.subject || '', replacements),
          body: replaceTemplateVariables(params.body || '', replacements)
        };

        // Enqueue with processed params
        await enqueueAutomationAction(automation.action_key, processedParams);
      } else {
        console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
      }
    }

    return updatedModel;
  } catch (error) {
    console.error("Error updating model inventory:", error);
    throw error;
  }
};

export const deleteModelInventoryByIdQuery = async (
  id: number,
  deleteRisks: boolean,
  tenant: string,
  transaction: Transaction
) => {
  try {
    if (deleteRisks) {
      // Delete associated model risks first
      await sequelize.query(
        `DELETE FROM "${tenant}".model_risks WHERE model_id = :id`,
        {
          replacements: { id },
          transaction,
        }
      );
    }

    const result = await sequelize.query(
      `DELETE FROM "${tenant}".model_inventories WHERE id = :id RETURNING *`,
      {
        replacements: { id },
        transaction,
      }
    ) as [(ModelInventoryModel)[], number];
    const deletedModel = result[0][0];
    const automations = await sequelize.query(
      `SELECT
        pat.key AS trigger_key,
        paa.key AS action_key,
        aa.*
      FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'model_deleted' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
    ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string })[], number];
    if (automations[0].length > 0) {
      const automation = automations[0][0];
      if (automation["trigger_key"] === "model_deleted") {
        const params = automation.params!;

        // Build replacements
        const replacements = buildModelReplacements(deletedModel);

        // Replace variables in subject and body
        const processedParams = {
          ...params,
          subject: replaceTemplateVariables(params.subject || '', replacements),
          body: replaceTemplateVariables(params.body || '', replacements)
        };

        // Enqueue with processed params
        await enqueueAutomationAction(automation.action_key, processedParams);
      } else {
        console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
      }
    }

    return deletedModel;
  } catch (error) {
    console.error("Error deleting model inventory:", error);
    throw error;
  }
};
