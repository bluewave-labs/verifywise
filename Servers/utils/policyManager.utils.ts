import { Transaction, QueryTypes } from "sequelize";
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
    `SELECT
      pm.*,
      COALESCE(
        ARRAY_AGG(DISTINCT pmr.user_id) FILTER (WHERE pmr.user_id IS NOT NULL),
        ARRAY[]::INTEGER[]
      ) as assigned_reviewer_ids
    FROM "${tenant}".policy_manager pm
    LEFT JOIN "${tenant}".policy_manager__assigned_reviewer_ids pmr
      ON pm.id = pmr.policy_manager_id
    GROUP BY pm.id`,
    {
      replacements: { tenant },
      type: QueryTypes.SELECT,
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
    `SELECT
      pm.*,
      COALESCE(
        ARRAY_AGG(DISTINCT pmr.user_id) FILTER (WHERE pmr.user_id IS NOT NULL),
        ARRAY[]::INTEGER[]
      ) as assigned_reviewer_ids
    FROM "${tenant}".policy_manager pm
    LEFT JOIN "${tenant}".policy_manager__assigned_reviewer_ids pmr
      ON pm.id = pmr.policy_manager_id
    WHERE pm.id = :id
    GROUP BY pm.id`,
    {
      replacements: { tenant, id },
      type: QueryTypes.SELECT,
    }
  ) as any[];

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

  // Insert policy without assigned_reviewer_ids
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".policy_manager (
      title, content_html, status, tags, next_review_date, author_id, last_updated_by, last_updated_at
    ) VALUES (
      :title, :content_html, :status, ARRAY[:tags], :next_review_date, :author_id, :last_updated_by, :last_updated_at
    ) RETURNING *`,
    {
      replacements: {
        title: policy.title,
        content_html: policy.content_html,
        status: policy.status,
        tags: policy.tags,
        next_review_date: policy.next_review_date,
        author_id: userId,
        last_updated_by: userId,
        last_updated_at: new Date(),
      },
      transaction,
      type: QueryTypes.INSERT,
    }
  ) as any;

  const createdPolicy = result[0][0] as any;
  const policyId = createdPolicy.id;

  // Insert assigned reviewers into mapping table
  if (policy.assigned_reviewer_ids && policy.assigned_reviewer_ids.length > 0) {
    for (const reviewerId of policy.assigned_reviewer_ids) {
      await sequelize.query(
        `INSERT INTO "${tenant}".policy_manager__assigned_reviewer_ids
         (policy_manager_id, user_id)
         VALUES (:policyId, :userId)`,
        {
          replacements: { policyId, userId: reviewerId },
          transaction,
        }
      );
    }
  }

  // Add assigned_reviewer_ids to the returned object for consistency
  createdPolicy.assigned_reviewer_ids = policy.assigned_reviewer_ids || [];

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
            reviewer_ids: createdPolicy.assigned_reviewer_ids || [],
          },
          transaction,
          type: QueryTypes.SELECT,
        }
      )) as { full_name: string }[];

      const params = automation.params!;

      // Build replacements
      const replacements = buildPolicyReplacements({
        ...createdPolicy,
        reviewer_names: reviewer_names.map((r) => r.full_name).join(", "),
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
      if (f === "tags") {
        return `${f} = ARRAY[:${f}]`;
      }
      return `${f} = :${f}`;
    })
    .join(", ");

  const query = `UPDATE "${tenant}".policy_manager SET ${setClause} WHERE id = :id RETURNING *;`;

  updatePolicy.id = id;
  updatePolicy.last_updated_by = userId;
  updatePolicy.last_updated_at = new Date();

  await sequelize.query(query, {
    replacements: updatePolicy,
    transaction,
    type: QueryTypes.UPDATE,
  });

  // Handle assigned_reviewer_ids update
  if (policy.assigned_reviewer_ids !== undefined) {
    // Delete existing reviewer mappings
    await sequelize.query(
      `DELETE FROM "${tenant}".policy_manager__assigned_reviewer_ids
       WHERE policy_manager_id = :policyId`,
      {
        replacements: { policyId: id },
        transaction,
      }
    );

    // Insert new reviewer mappings
    if (policy.assigned_reviewer_ids && policy.assigned_reviewer_ids.length > 0) {
      for (const reviewerId of policy.assigned_reviewer_ids) {
        await sequelize.query(
          `INSERT INTO "${tenant}".policy_manager__assigned_reviewer_ids
           (policy_manager_id, user_id)
           VALUES (:policyId, :userId)`,
          {
            replacements: { policyId: id, userId: reviewerId },
            transaction,
          }
        );
      }
    }
  }

  // Get the updated policy with reviewer IDs
  const updatedPolicyResult = await getPolicyByIdQuery(tenant, id);
  if (!updatedPolicyResult || updatedPolicyResult.length === 0) {
    throw new Error('Policy not found after update');
  }
  const updatedPolicy = updatedPolicyResult[0];
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
            reviewer_ids: (updatedPolicy as any).assigned_reviewer_ids || [],
          },
          transaction,
          type: QueryTypes.SELECT,
        }
      )) as { full_name: string }[];

      const params = automation.params!;

      // Build replacements
      const replacements = buildPolicyUpdateReplacements(existingPolicy[0], {
        ...updatedPolicy,
        reviewer_names: reviewer_names.map((r) => r.full_name).join(", "),
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
  // Get policy data with reviewer IDs BEFORE deleting (CASCADE will delete mappings)
  const policyToDelete = await getPolicyByIdQuery(tenant, id);

  if (!policyToDelete || policyToDelete.length === 0) {
    return false;
  }

  const deletedPolicyData = policyToDelete[0] as any;

  // Delete the policy (CASCADE will handle mapping table deletion)
  await sequelize.query(
    `DELETE FROM "${tenant}".policy_manager WHERE id = :id RETURNING *`,
    {
      replacements: { tenant, id },
      transaction,
      type: QueryTypes.DELETE,
    }
  );

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
            reviewer_ids: deletedPolicyData.assigned_reviewer_ids || [],
          },
          transaction,
          type: QueryTypes.SELECT,
        }
      )) as { full_name: string }[];

      const params = automation.params!;

      // Build replacements
      const replacements = buildPolicyReplacements({
        ...deletedPolicyData,
        reviewer_names: reviewer_names.map((r) => r.full_name).join(", "),
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

  return true;
};
