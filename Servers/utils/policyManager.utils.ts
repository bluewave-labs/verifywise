import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import {
  IPolicy,
  PolicyTag,
  PolicyTagsSet,
} from "../domain.layer/interfaces/i.policy";
import { PolicyManagerModel } from "../domain.layer/models/policy/policy.model";
import { TenantAutomationActionModel } from "../domain.layer/models/tenantAutomationAction/tenantAutomationAction.model";
import { replaceTemplateVariables } from "./automation/automation.utils";
import { enqueueAutomationAction } from "../services/automations/automationProducer";
import {
  buildPolicyReplacements,
  buildPolicyUpdateReplacements,
} from "./automation/policy.automation.utils";

export const getAllPoliciesQuery = async (tenant: string) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".policy_manager`,
    {
      replacements: { tenant },
      mapToModel: true,
      model: PolicyManagerModel,
    }
  );

  return result;
};

export const getAllPoliciesDueSoonQuery = async (
  tenant: string,
  daysAhead: number = 7
) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".policy_manager
     WHERE next_review_date IS NOT NULL
     AND next_review_date <= NOW() + INTERVAL '${daysAhead} days'
     AND next_review_date >= NOW()
     ORDER BY next_review_date ASC`,
    {
      replacements: { tenant },
      mapToModel: true,
      model: PolicyManagerModel,
    }
  );

  return result;
};

export const getPolicyByIdQuery = async (tenant: string, id: number) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".policy_manager WHERE id = :id`,
    {
      replacements: { tenant, id },
      mapToModel: true,
      model: PolicyManagerModel,
    }
  );
  const reviewer_names = (await sequelize.query(
    `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id IN(:reviewer_ids);`,
    {
      replacements: {
        reviewer_ids: result[0].dataValues.assigned_reviewer_ids,
      },
    }
  )) as [{ full_name: string }[], number];
  (result[0].dataValues as any)["reviewer_names"] = reviewer_names[0].map(
    (r) => r.full_name
  );

  return result;
};

const verifyPolicyTags = (policyTags: PolicyTag[]) => {
  for (const tag of policyTags) {
    if (!PolicyTagsSet.has(tag)) {
      throw new Error(`Invalid policy tag: ${tag}`);
    }
  }
};

export const createPolicyQuery = async (
  policy: IPolicy,
  tenant: string,
  userId: number,
  transaction: Transaction
) => {
  verifyPolicyTags(policy.tags || []);

  // create a new table for policy reviewers and add assigned_reviewer_ids
  // to that just like project members and add transaction

  const result = await sequelize.query(
    `INSERT INTO "${tenant}".policy_manager (
      title, content_html, status, tags, next_review_date, author_id, assigned_reviewer_ids, last_updated_by, last_updated_at
    ) VALUES (
      :title, :content_html, :status, ARRAY[:tags], :next_review_date, :author_id, ARRAY[:assigned_reviewer_ids], :last_updated_by, :last_updated_at
    ) RETURNING *`,
    {
      replacements: {
        title: policy.title,
        content_html: policy.content_html,
        status: policy.status,
        tags: policy.tags,
        next_review_date: policy.next_review_date,
        author_id: userId,
        assigned_reviewer_ids: policy.assigned_reviewer_ids,
        last_updated_by: userId,
        last_updated_at: new Date(),
      },
      transaction,
      mapToModel: true,
      model: PolicyManagerModel,
    }
  );
  const createdPolicy = result[0];

  const automations = (await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      a.id AS automation_id,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'policy_added' AND a.is_active ORDER BY aa."order" ASC;`,
    { transaction }
  )) as [
    (TenantAutomationActionModel & {
      trigger_key: string;
      action_key: string;
      automation_id: number;
    })[],
    number,
  ];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "policy_added") {
      const reviewer_names = (await sequelize.query(
        `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id IN(:reviewer_ids);`,
        {
          replacements: {
            reviewer_ids: createdPolicy.dataValues.assigned_reviewer_ids,
          },
          transaction,
        }
      )) as [{ full_name: string }[], number];

      const params = automation.params!;

      // Build replacements
      const replacements = buildPolicyReplacements({
        ...createdPolicy.dataValues,
        reviewer_names: reviewer_names[0].map((r) => r.full_name).join(", "),
      });

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || "", replacements),
        body: replaceTemplateVariables(params.body || "", replacements),
        automation_id: automation.automation_id,
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, {
        ...processedParams,
        tenant,
      });
    } else {
      console.warn(
        `No matching trigger found for key: ${automation["trigger_key"]}`
      );
    }
  }

  return createdPolicy;
};

export const updatePolicyByIdQuery = async (
  id: number,
  policy: Partial<IPolicy>,
  tenant: string,
  userId: number,
  transaction: Transaction
) => {
  const existingPolicy = await getPolicyByIdQuery(tenant, id);
  const updatePolicy: Partial<Record<keyof IPolicy, any>> = {};
  const setClause = [
    "title",
    "content_html",
    "status",
    "tags",
    "next_review_date",
    "assigned_reviewer_ids",
    "last_updated_by",
    "last_updated_at",
  ]
    .filter((f) => {
      if (f === "last_updated_by" || f === "last_updated_at") {
        return true;
      }

      if (
        policy[f as keyof IPolicy] !== undefined &&
        policy[f as keyof IPolicy]
      ) {
        if (f === "tags") {
          verifyPolicyTags(policy[f as keyof IPolicy] as PolicyTag[]);
        }
        updatePolicy[f as keyof IPolicy] = policy[f as keyof IPolicy];
        return true;
      }
      return false;
    })
    .map((f) => {
      if (f === "tags" || f === "assigned_reviewer_ids") {
        return `${f} = ARRAY[:${f}]`;
      }
      return `${f} = :${f}`;
    })
    .join(", ");

  const query = `UPDATE "${tenant}".policy_manager SET ${setClause} WHERE id = :id RETURNING *;`;

  updatePolicy.id = id;
  updatePolicy.last_updated_by = userId;
  updatePolicy.last_updated_at = new Date();

  const result = await sequelize.query(query, {
    replacements: updatePolicy,
    mapToModel: true,
    model: PolicyManagerModel,
    transaction,
    // type: QueryTypes.UPDATE,
  });
  const updatedPolicy = result[0];
  const automations = (await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      a.id AS automation_id,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'policy_updated' AND a.is_active ORDER BY aa."order" ASC;`,
    { transaction }
  )) as [
    (TenantAutomationActionModel & {
      trigger_key: string;
      action_key: string;
      automation_id: number;
    })[],
    number,
  ];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "policy_updated") {
      const reviewer_names = (await sequelize.query(
        `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id IN(:reviewer_ids);`,
        {
          replacements: {
            reviewer_ids: updatedPolicy.dataValues.assigned_reviewer_ids,
          },
          transaction,
        }
      )) as [{ full_name: string }[], number];

      const params = automation.params!;

      // Build replacements
      const replacements = buildPolicyUpdateReplacements(existingPolicy[0], {
        ...updatedPolicy.dataValues,
        reviewer_names: reviewer_names[0].map((r) => r.full_name).join(", "),
      });

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || "", replacements),
        body: replaceTemplateVariables(params.body || "", replacements),
        automation_id: automation.automation_id,
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, {
        ...processedParams,
        tenant,
      });
    } else {
      console.warn(
        `No matching trigger found for key: ${automation["trigger_key"]}`
      );
    }
  }
  return updatedPolicy;
};

export const deletePolicyByIdQuery = async (
  tenant: string,
  id: number,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".policy_manager WHERE id = :id RETURNING *`,
    {
      replacements: { tenant, id },
      transaction,
      mapToModel: true,
      model: PolicyManagerModel,
    }
  );
  const deletedPolicy = result[0];
  const automations = (await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      a.id AS automation_id,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'policy_deleted' AND a.is_active ORDER BY aa."order" ASC;`,
    { transaction }
  )) as [
    (TenantAutomationActionModel & {
      trigger_key: string;
      action_key: string;
      automation_id: number;
    })[],
    number,
  ];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "policy_deleted") {
      const reviewer_names = (await sequelize.query(
        `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id IN(:reviewer_ids);`,
        {
          replacements: {
            reviewer_ids: deletedPolicy.dataValues.assigned_reviewer_ids,
          },
          transaction,
        }
      )) as [{ full_name: string }[], number];

      const params = automation.params!;

      // Build replacements
      const replacements = buildPolicyReplacements({
        ...deletedPolicy.dataValues,
        reviewer_names: reviewer_names[0].map((r) => r.full_name).join(", "),
      });

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || "", replacements),
        body: replaceTemplateVariables(params.body || "", replacements),
        automation_id: automation.automation_id,
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, {
        ...processedParams,
        tenant,
      });
    } else {
      console.warn(
        `No matching trigger found for key: ${automation["trigger_key"]}`
      );
    }
  }

  return result.length > 0;
};
