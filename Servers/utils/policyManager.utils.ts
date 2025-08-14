import { sequelize } from "../database/db"
import { IPolicy, PolicyTag, PolicyTagsSet } from "../domain.layer/interfaces/i.policy"
import { PolicyManagerModel } from "../domain.layer/models/policy/policy.model"

export const getAllPoliciesQuery = async (
  tenant: string
) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".policy_manager`,
    {
      replacements: { tenant },
      mapToModel: true,
      model: PolicyManagerModel
    }
  )

  return result
}

export const getPolicyByIdQuery = async (
  tenant: string,
  id: number
) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".policy_manager WHERE id = :id`,
    {
      replacements: { tenant, id },
      mapToModel: true,
      model: PolicyManagerModel
    }
  )

  return result
}

const verifyPolicyTags = (policyTags: PolicyTag[]) => {
  for (const tag of policyTags) {
    if (!PolicyTagsSet.has(tag)) {
      throw new Error(`Invalid policy tag: ${tag}`);
    }
  }
}

export const createPolicyQuery = async (
  policy: IPolicy,
  tenant: string,
  userId: number
) => {
  verifyPolicyTags(policy.tags || []);

  // create a new table for policy reviewers and add assigned_reviewer_ids
  // to that just like project members and add transaction

  const result = await sequelize.query(
    `INSERT INTO "${tenant}".policy_manager (
      title, content_html, status, tags, next_review_date, author_id, assigned_reviewer_ids, last_updated_by, last_updated_at
    ) VALUES (
      :title, :content_html, :status, :tags, :next_review_date, :author_id, :assigned_reviewer_ids, :last_updated_by, :last_updated_at
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
        last_updated_at: new Date()
      },
      mapToModel: true,
      model: PolicyManagerModel
    }
  )

  return result[0]
}

export const updatePolicyByIdQuery = async (
  id: number,
  policy: Partial<IPolicy>,
  tenant: string,
  userId: number
) => {
  const updatePolicy: Partial<Record<keyof IPolicy, any>> = {};
  const setClause = [
    "title",
    "content_html",
    "status",
    "tags",
    "next_review_date",
    "assigned_reviewer_ids",
    "last_updated_by",
    "last_updated_at"
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
        updatePolicy[f as keyof IPolicy] =
          policy[f as keyof IPolicy];
        return true;
      }
    })
    .map((f) => {
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
    // type: QueryTypes.UPDATE,
  });
  return result[0];
}

export const deletePolicyByIdQuery = async (
  tenant: string,
  id: number
) => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".policy_manager WHERE id = :id`,
    {
      replacements: { tenant, id },
      mapToModel: true,
      model: PolicyManagerModel
    }
  )

  return result.length > 0
}