import Queue from "bull";
import redis from "redis";
import logger from "../utils/logger/fileLogger";
import { decryptText } from "../tools/createSecureValue";
import { WebClient } from "@slack/web-api";
import { ISlackWebhook } from "../domain.layer/interfaces/i.slackWebhook";

let redisClient;
let notificationQueue: any;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const getClient = (accessToken: string, iv: string) => {
  const { data, success, error } = decryptText({ iv: iv, value: accessToken });
  if (!success) {
    throw new Error(`Failed to decrypt Slack access token: ${error}`);
  }
  return new WebClient(data);
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
    text: `🚨 *Immediate Alert from VerifyWise*`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 Immediate Alert",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${data.title}*\n${data.message}`,
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
