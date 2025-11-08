import { VendorModel } from "../domain.layer/models/vendor/vendor.model";
import { sequelize } from "../database/db";
import { deleteVendorRisksForVendorQuery } from "./vendorRisk.utils";
import { VendorsProjectsModel } from "../domain.layer/models/vendorsProjects/vendorsProjects.model";
import { QueryTypes, Sequelize, Transaction } from "sequelize";
import {
  getUserProjects,
  updateProjectUpdatedByIdQuery,
} from "./project.utils";
import { IVendor } from "../domain.layer/interfaces/i.vendor";
import { enqueueAutomationAction } from "../services/automations/automationProducer";
import { TenantAutomationActionModel } from "../domain.layer/models/tenantAutomationAction/tenantAutomationAction.model";
import { buildVendorReplacements, buildVendorUpdateReplacements } from "./automation/vendor.automation.utils";
import { replaceTemplateVariables } from "./automation/automation.utils";

export const getAllVendorsQuery = async (
  tenant: string
): Promise<IVendor[]> => {
  const vendors = await sequelize.query(
    `SELECT * FROM "${tenant}".vendors ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: VendorModel,
    }
  );
  for (let vendor of vendors as (VendorModel & { projects: number[], reviewer_name: string })[]) {
    const projects = await sequelize.query(
      `SELECT project_id FROM "${tenant}".vendors_projects WHERE vendor_id = :vendor_id`,
      {
        replacements: { vendor_id: vendor.id },
        mapToModel: true,
        model: VendorsProjectsModel,
      }
    );
    vendor["projects"] = projects.map((p) => p.project_id);

    const reviewer_name = await sequelize.query(
      `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id = :reviewer_id`,
      {
        replacements: { reviewer_id: vendor.reviewer },
      }
    ) as [{ full_name: string }[], number];
    vendor["reviewer_name"] =
      reviewer_name[0].length > 0 ? reviewer_name[0][0].full_name : "";
  }
  return vendors;
};

export const getVendorByIdQuery = async (
  id: number,
  tenant: string
): Promise<IVendor | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".vendors WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: VendorModel,
    }
  );
  if (!result.length) return null;
  const projects = await sequelize.query(
    `SELECT project_id FROM "${tenant}".vendors_projects WHERE vendor_id = :vendor_id`,
    {
      replacements: { vendor_id: id },
      mapToModel: true,
      model: VendorsProjectsModel,
    }
  );
  return {
    ...result[0].dataValues,
    projects: (projects || []).map((p) => p.project_id),
  };
};

export const getVendorByProjectIdQuery = async (
  project_id: number,
  tenant: string
): Promise<IVendor[] | null> => {
  const projectExists = await sequelize.query(
    `SELECT 1 AS exists FROM "${tenant}".projects WHERE id = :project_id`,
    { replacements: { project_id } }
  );
  if (!(projectExists[0].length > 0)) return null;
  const vendors_projects = await sequelize.query(
    `SELECT vendor_id FROM "${tenant}".vendors_projects WHERE project_id = :project_id`,
    {
      replacements: { project_id },
      mapToModel: true,
      model: VendorsProjectsModel,
    }
  );
  const vendors: IVendor[] = [];
  for (let vendors_project of vendors_projects || []) {
    const vendor = await sequelize.query(
      `SELECT * FROM "${tenant}".vendors WHERE id = :id ORDER BY created_at DESC, id ASC`,
      {
        replacements: {
          id: vendors_project.vendor_id,
        },
        mapToModel: true,
        model: VendorModel,
      }
    );
    // commenting as, for the current functionality, project and vendor have 1:1 mapping
    // const projects = await sequelize.query("SELECT project_id FROM vendors_projects WHERE vendor_id = $1", [vendors_project.vendor_id])
    // vendors.push({ ...vendor[0], projects: projects.map(p => p.project_id) })
    vendors.push({ ...vendor[0].dataValues, projects: [project_id] });
  }
  return vendors;
};

export const addVendorProjects = async (
  vendorId: number,
  projects: number[],
  tenant: string,
  transaction: Transaction
) => {
  let vendorsProjectFlat = [];
  let placeholdersArray = [];
  for (let project of projects) {
    vendorsProjectFlat.push(vendorId, project);
    placeholdersArray.push("(?, ?)");
  }
  let placeholders = placeholdersArray.join(", ");
  const query = `INSERT INTO "${tenant}".vendors_projects (vendor_id, project_id) VALUES ${placeholders} RETURNING *`;
  const vendors_projects = await sequelize.query(query, {
    replacements: vendorsProjectFlat,
    mapToModel: true,
    model: VendorsProjectsModel,
    transaction,
  });
  return vendors_projects;
};

export const createNewVendorQuery = async (
  vendor: IVendor,
  tenant: string,
  transaction: Transaction,
  is_demo: boolean = false
): Promise<VendorModel> => {
  // Build dynamic query for optional fields
  const fields = ['order_no', 'vendor_name', 'vendor_provides', 'assignee', 'website', 'vendor_contact_person', 'is_demo'];
  const values = ['order_no', 'vendor_name', 'vendor_provides', 'assignee', 'website', 'vendor_contact_person', 'is_demo'];
  const replacements: any = {
    order_no: vendor.order_no || null,
    vendor_name: vendor.vendor_name,
    vendor_provides: vendor.vendor_provides,
    assignee: vendor.assignee,
    website: vendor.website,
    vendor_contact_person: vendor.vendor_contact_person,
    is_demo: is_demo,
  };

  // Add optional review fields only if provided
  if (vendor.review_result !== undefined) {
    fields.push('review_result');
    values.push('review_result');
    replacements.review_result = vendor.review_result;
  }
  if (vendor.review_status !== undefined) {
    fields.push('review_status');
    values.push('review_status');
    replacements.review_status = vendor.review_status;
  }
  if (vendor.reviewer !== undefined) {
    fields.push('reviewer');
    values.push('reviewer');
    replacements.reviewer = vendor.reviewer;
  }
  if (vendor.review_date !== undefined) {
    fields.push('review_date');
    values.push('review_date');
    replacements.review_date = vendor.review_date;
  }

  const fieldsList = fields.join(', ');
  const valuesList = values.map(v => `:${v}`).join(', ');

  const result = await sequelize.query(
    `INSERT INTO "${tenant}".vendors (${fieldsList}) VALUES (${valuesList}) RETURNING *`,
    {
      replacements,
      mapToModel: true,
      model: VendorModel,
      transaction,
    }
  );
  const createdVendor = result[0] as VendorModel & { projects: number[] };
  const vendorId = createdVendor.id!;

  createdVendor["projects"] = [];
  if (vendor.projects && vendor.projects.length > 0) {
    const vendors_projects = await addVendorProjects(
      vendorId,
      vendor.projects,
      tenant,
      transaction
    );
    createdVendor["projects"] = vendors_projects.map((p) => p.project_id);
  }
  await updateProjectUpdatedByIdQuery(vendorId, "vendors", tenant, transaction);

  const automations = await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      a.id AS automation_id,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'vendor_added' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
  ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string, automation_id: number })[], number];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "vendor_added") {
      const params = automation.params!;

      // Build replacements
      const replacements = buildVendorReplacements(createdVendor);

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || '', replacements),
        body: replaceTemplateVariables(params.body || '', replacements),
        automation_id: automation.automation_id,
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, { ...processedParams, tenant });
    } else {
      console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
    }
  }
  return createdVendor;
};

export const updateVendorByIdQuery = async (
  {
    id,
    vendor,
    userId,
    role,
    transaction,
  }: {
    id: number;
    vendor: Partial<IVendor>;
    userId: number;
    role: string;
    transaction: Transaction;
  },
  tenant: string
): Promise<IVendor> => {
  const updateVendor: Partial<Record<keyof IVendor, any>> = {};
  const setClause = [
    "vendor_name",
    "vendor_provides",
    "assignee",
    "website",
    "vendor_contact_person",
    "review_result",
    "review_status",
    "reviewer",
    "review_date",
  ]
    .filter((f) => {
      // For review fields, allow undefined or null to be updated (to clear the field)
      // For other required fields, only update if they have a value
      const isReviewField = ["review_result", "review_status", "reviewer", "review_date"].includes(f);
      const value = vendor[f as keyof IVendor];

      if (isReviewField) {
        // Review fields: include if explicitly provided (even if null/empty)
        if (value !== undefined) {
          updateVendor[f as keyof IVendor] = value;
          return true;
        }
      } else {
        // Required fields: include only if they have a value
        if (value !== undefined && value) {
          updateVendor[f as keyof IVendor] = value;
          return true;
        }
      }
      return false;
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const oldVendor = await getVendorByIdQuery(id, tenant);

  const query = `UPDATE "${tenant}".vendors SET ${setClause} WHERE id = :id RETURNING *;`;

  updateVendor.id = id;

  const result: IVendor[] = await sequelize.query(query, {
    replacements: updateVendor,
    mapToModel: true,
    model: VendorModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  if (vendor.projects && vendor.projects.length > 0) {
    // Delete old projects first
    await deleteAuthorizedVendorProjectsQuery(
      {
        vendorId: id,
        userId,
        role,
        transaction,
      },
      tenant
    );

    const vendors_projects = await addVendorProjects(
      id,
      vendor.projects,
      tenant,
      transaction
    );
    result[0]["projects"] = vendors_projects.map((p) => p.project_id);
  } else {
    const projects = await sequelize.query(
      "SELECT project_id FROM vendors_projects WHERE vendor_id = :vendor_id",
      {
        replacements: { vendor_id: id },
        mapToModel: true,
        model: VendorsProjectsModel,
      }
    );
    result[0]["projects"] = projects.map((p) => p.project_id);
  }
  await updateProjectUpdatedByIdQuery(id, "vendors", tenant, transaction);
  const updatedVendor = result[0];
  const automations = await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      a.id AS automation_id,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'vendor_updated' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
  ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string, automation_id: number })[], number];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "vendor_updated") {
      const params = automation.params!;

      // Build replacements
      const replacements = buildVendorUpdateReplacements(oldVendor, updatedVendor);

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || '', replacements),
        body: replaceTemplateVariables(params.body || '', replacements),
        automation_id: automation.automation_id,
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, { ...processedParams, tenant });
    } else {
      console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
    }
  }
  return updatedVendor;
};

export const deleteVendorByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  await deleteVendorRisksForVendorQuery(id, tenant, transaction);
  await updateProjectUpdatedByIdQuery(id, "vendors", tenant, transaction);
  await sequelize.query(
    `DELETE FROM "${tenant}".vendors_projects WHERE vendor_id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: VendorsProjectsModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".vendors WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: VendorModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  const deletedVendor = result[0];
  const automations = await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      a.id AS automation_id,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'vendor_deleted' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
  ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string, automation_id: number })[], number];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "vendor_deleted") {
      const params = automation.params!;

      // Build replacements
      const replacements = buildVendorReplacements(deletedVendor);

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || '', replacements),
        body: replaceTemplateVariables(params.body || '', replacements),
        automation_id: automation.automation_id,
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, { ...processedParams, tenant });
    } else {
      console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
    }
  }
  return result.length > 0;
};

interface DeleteAuthorizedVendorProjectsParams {
  vendorId: number;
  userId: number;
  role: string;
  transaction?: Transaction;
}

export const deleteAuthorizedVendorProjectsQuery = async (
  { vendorId, userId, role, transaction }: DeleteAuthorizedVendorProjectsParams,
  tenant: string
) => {
  // 1. Get user-authorized project IDs
  const userProjects = await getUserProjects(
    { userId, role, transaction },
    tenant
  );
  const userProjectIds = userProjects
    .map((p) => p.id)
    .filter((value, index, self) => self.indexOf(value) === index);

  // 2. Delete old links (only authorized ones)
  if (userProjectIds.length > 0) {
    await sequelize.query(
      `
      DELETE FROM "${tenant}".vendors_projects 
      WHERE vendor_id = :vendorId
        AND project_id IN (:userProjectIds)
      `,
      {
        replacements: { vendorId, userProjectIds },
        transaction,
      }
    );
  }
};
