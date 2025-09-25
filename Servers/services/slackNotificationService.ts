import logger from "../utils/logger/fileLogger";
import { decryptText } from "../tools/createSecureValue";
import { WebClient } from "@slack/web-api";
import { ISlackWebhook } from "../domain.layer/interfaces/i.slackWebhook";
import { getSlackWebhookByIdAndRoutingType } from "../utils/slackWebhook.utils";

const getClient = (accessToken: string, iv: string) => {
  const { data, success, error } = decryptText({ iv: iv, value: accessToken });
  if (!success) {
    throw new Error(`Failed to decrypt Slack access token: ${error}`);
  }
  return new WebClient(data);
};

export const sendSlackNotification = async (
  params: { userId: number; routingType: string },
  message: any,
) => {
  try {
    const { userId, routingType } = params;
    const slackIntegrations: ISlackWebhook[] =
      await getSlackWebhookByIdAndRoutingType(userId, routingType);
    await Promise.all(
      slackIntegrations.map((integration) =>
        sendImmediateMessage(integration, message),
      ),
    );
  } catch (error) {
    logger.error("Error sending Slack Notification:", error);
    throw error;
  }
};

export const sendImmediateMessage = async (
  integration: ISlackWebhook,
  message: any,
) => {
  try {
    const client = getClient(
      integration.access_token,
      integration.access_token_iv as string,
    );

    const channel = integration.channel;
    const msg = formatSlackMessage(message);

    const result = await client.chat.postMessage({
      channel,
      ...msg,
    });

    logger.info(`Message sent to ${channel}:`, {
      messageId: result.ts,
      channel: result.channel,
    });

    return {
      success: true,
      messageId: result.ts,
      channel: result.channel,
    };
  } catch (error: any) {
    logger.error("Error sending Slack message:", error);
    throw error;
  }
};

export const formatSlackMessage = (data: any) => {
  return {
    text: `A message from VerifyWise`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${data.title}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${data.message}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📅 ${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC`,
          },
        ],
      },
    ],
  };
};
