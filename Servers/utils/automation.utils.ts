import { Transaction } from "sequelize";
import { sequelize } from "../database/db"
import { ITenantAutomationAction } from "../domain.layer/interfaces/i.tenantAutomationAction";
import { AutomationModel } from "../domain.layer/models/automation/automation.model";
import { AutomationActionModel } from "../domain.layer/models/automationAction/automationAction.model";
import { AutomationTriggerModel } from "../domain.layer/models/automationTrigger/automationTrigger.model"
import { TenantAutomationActionModel } from "../domain.layer/models/tenantAutomationAction/tenantAutomationAction.model";
import { IAutomation } from "../domain.layer/interfaces/i.automation";

export const getAllAutomationTriggersQuery = async () => {
  const result = await sequelize.query(
    `SELECT * FROM public.automation_triggers`,
    {
      mapToModel: true,
      model: AutomationTriggerModel
    }
  )
  return result;
}

export const getAllAutomationActionsByTriggerIdQuery = async (triggerId: number) => {
  const result = await sequelize.query(
    `SELECT aa.*
     FROM public.automation_triggers_actions ata
     JOIN public.automation_actions aa ON ata.action_id = aa.id
     WHERE ata.trigger_id = :triggerId
     ORDER BY ata.action_id`,
    {
      replacements: { triggerId },
      mapToModel: true,
      model: AutomationActionModel
    }
  )
  return result;
}

export const getAllAutomationsQuery = async (tenant: string) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".automations;`,
    {
      mapToModel: true,
      model: AutomationModel
    }
  )
  return result;
}

export const getAutomationByIdQuery = async (id: number, tenant: string) => {
  const automations = await sequelize.query(
    `SELECT * FROM "${tenant}".automations WHERE id = :id;`,
    {
      replacements: { id },
    }
  ) as [AutomationModel[], number]
  const automation = automations[0][0] as unknown as (ITenantAutomationAction & { actions: ITenantAutomationAction[] });
  automation.actions = [];
  if (automations[0].length > 0) {
    const actions = await sequelize.query(
      `SELECT * FROM "${tenant}".automation_actions WHERE automation_id = :id ORDER BY "order";`,
      {
        replacements: { id },
      }
    ) as [TenantAutomationActionModel[], number];
    automation["actions"] = actions[0];
  }
  return automation;
}

export const createAutomationQuery = async (
  triggerId: number,
  name: string,
  actions: Partial<ITenantAutomationAction>[],
  userId: number,
  tenant: string,
  transaction: Transaction
) => {
  const _automation = await sequelize.query(
    `INSERT INTO "${tenant}".automations(
      name, trigger_id, created_by) VALUES (
      :name, :triggerId, :userId) RETURNING *;`,
    {
      replacements: { name, triggerId, userId }, transaction
    }
  ) as [ITenantAutomationAction[], number];
  const automation = _automation[0][0] as unknown as (ITenantAutomationAction & { actions: ITenantAutomationAction[] });

  // add some validations for action params
  await Promise.all(actions.map((action, index) => {
    return sequelize.query(
      `INSERT INTO "${tenant}".automation_actions(
        automation_id, action_type_id, params, "order") VALUES (
        :automationId, :actionTypeId, :params, :order);`,
      {
        replacements: {
          automationId: automation.id,
          actionTypeId: action.action_type_id,
          params: action.params ? JSON.stringify(action.params) : null,
          order: index + 1
        }, transaction
      }
    )
  }))

  const _actions = await sequelize.query(
    `SELECT * FROM "${tenant}".automation_actions WHERE automation_id = :id ORDER BY "order";`,
    {
      replacements: { id: automation.id }, transaction
    }
  ) as [TenantAutomationActionModel[], number];
  automation["actions"] = _actions[0];

  return automation;
}

export const updateAutomationByIdQuery = async (
  id: number,
  currentAutomation: Partial<IAutomation>,
  actions: Partial<ITenantAutomationAction>[],
  tenant: string,
  transaction: Transaction
) => {
  let automation = null;
  const updatedAutomation: Partial<IAutomation> = {};
  console.log("Current Automation Data:", currentAutomation);
  const setClause = [
    "name",
    "trigger_id",
    "is_active"
  ].filter((field) => {
    if (field === "is_active" && currentAutomation[field as keyof IAutomation] !== undefined) {
      (updatedAutomation as any)[field] = currentAutomation[field as keyof IAutomation];
      return true;
    }
    if (currentAutomation[field as keyof IAutomation] !== undefined && currentAutomation[field as keyof IAutomation]) {
      (updatedAutomation as any)[field] = currentAutomation[field as keyof IAutomation];
      return true;
    }
    return false;
  }).map((field) => `${field} = :${field}`).join(", ");

  if (!setClause) {
    const result = await sequelize.query(
      `SELECT * FROM "${tenant}".automations WHERE id = :id;`,
      {
        replacements: { id }, transaction
      }
    ) as [ITenantAutomationAction[], number];
    automation = result[0][0] as unknown as (ITenantAutomationAction & { actions: ITenantAutomationAction[] });
  } else {
    updatedAutomation.id = id;
    const query = `UPDATE "${tenant}".automations SET ${setClause} WHERE id = :id RETURNING *;`;
    const result = await sequelize.query(query, { transaction }) as [ITenantAutomationAction[], number];
    automation = result[0][0] as unknown as (ITenantAutomationAction & { actions: ITenantAutomationAction[] });
  }

  await sequelize.query(
    `DELETE FROM "${tenant}".automation_actions WHERE automation_id = :id;`,
    {
      replacements: { id }, transaction
    }
  );

  await Promise.all((actions || []).map((action, index) => {
    return sequelize.query(
      `INSERT INTO "${tenant}".automation_actions(
        automation_id, action_type_id, params, "order") VALUES (
        :automationId, :actionTypeId, :params, :order);`,
      {
        replacements: {
          automationId: id,
          actionTypeId: action.action_type_id,
          params: action.params ? JSON.stringify(action.params) : null,
          order: index + 1
        }, transaction
      }
    )
  }))

  const _actions = await sequelize.query(
    `SELECT * FROM "${tenant}".automation_actions WHERE automation_id = :id ORDER BY "order";`,
    {
      replacements: { id }, transaction
    }
  ) as [TenantAutomationActionModel[], number];
  automation["actions"] = _actions[0];

  return automation;
}

export const deleteAutomationByIdQuery = async (id: number, tenant: string, transaction: Transaction) => {
  await sequelize.query(
    `DELETE FROM "${tenant}".automation_actions WHERE automation_id = :id;`,
    {
      replacements: { id }, transaction
    }
  );
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".automations WHERE id = :id;`,
    {
      replacements: { id }, transaction
    }
  );
  return result.length > 0;
}
