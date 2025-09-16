import { sequelize } from "../database/db";
import { UploadedFile } from "./question.utils";
import { uploadFile } from "./fileUpload.utils";
import { QueryTypes, Transaction } from "sequelize";
import { FileType } from "../domain.layer/models/file/file.model";
import { ISlackWebhook } from "../domain.layer/interfaces/i.slackWebhook";
import { SlackWebhookModel } from "../domain.layer/models/slackNotification/slackWebhook.model";

export const getAllSlackWebhooksQuery = async (
  tenant: string,
): Promise<ISlackWebhook[]> => {
  const slackWebhooks = await sequelize.query(
    `SELECT * FROM public.slack_webhooks ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: SlackWebhookModel,
    },
  );
  return slackWebhooks;
};

export const getSlackWebhookByIdQuery = async (
  id: number,
  tenant: string,
): Promise<ISlackWebhook | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".slack_webhooks WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: SlackWebhookModel,
    },
  );
  return result[0];
};

export const createNewSlackWebhookQuery = async (
  data: Partial<ISlackWebhook>,
  tenant: string,
  transaction: Transaction,
): Promise<SlackWebhookModel> => {
  console.log(
    "Creating new Slack Webhook with data:",
    typeof data.access_token,
  );
  const result = await sequelize.query(
    `INSERT INTO public.slack_webhooks (
      access_token, access_token_iv, scope, user_id, team_name, team_id, channel, channel_id,
      configuration_url, url, url_iv, is_active
    ) VALUES (
      :access_token, :access_token_iv, :scope, :user_id, :team_name, :team_id, :channel, 
      :channel_id, :configuration_url, :url, :url_iv, :is_active
    ) RETURNING *`,
    {
      replacements: {
        access_token: data.access_token,
        access_token_iv: data.access_token_iv,
        scope: data.scope,
        user_id: data.user_id,
        team_name: data.team_name,
        team_id: data.team_id,
        channel: data.channel,
        channel_id: data.channel_id,
        configuration_url: data.configuration_url,
        url: data.url,
        url_iv: data.url_iv,
        created_at: data.created_at,
        is_active: data.is_active,
      },
      mapToModel: true,
      model: SlackWebhookModel,
      transaction,
    },
  );
  console.log("Created Slack Webhook:", result[0]);
  return result[0];
};

export const updateSlackWebhookByIdQuery = async (
  id: number,
  updateData: Partial<SlackWebhookModel>,
  tenant: string,
  transaction: Transaction,
): Promise<SlackWebhookModel | null> => {
  const updateSlackWebhookData: Partial<Record<keyof SlackWebhookModel, any>> =
    {};
  const setClause = [
    "access_token",
    "access_token_iv",
    "scope",
    "user_id",
    "team_name",
    "team_id",
    "channel",
    "channel_id",
    "configuration_url",
    "url",
    "url_iv",
    "is_active",
  ]
    .filter((f) => {
      if (updateData[f as keyof SlackWebhookModel] !== undefined) {
        updateSlackWebhookData[f as keyof SlackWebhookModel] =
          updateData[f as keyof SlackWebhookModel];
        return true;
      }
    })
    .map((f) => {
      return `${f} = :${f}`;
    })
    .join(", ");

  const query = `UPDATE "${tenant}".slack_webhooks SET ${setClause} WHERE id = :id RETURNING *;`;

  updateSlackWebhookData.id = id;

  const result = await sequelize.query(query, {
    replacements: updateSlackWebhookData,
    mapToModel: true,
    model: SlackWebhookModel,
    transaction,
  });

  return result[0];
};
