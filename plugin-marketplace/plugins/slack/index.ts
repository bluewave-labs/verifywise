/**
 * Slack Plugin for VerifyWise
 *
 * This plugin provides Slack integration for sending notifications
 * about AI model updates, risk assessments, and compliance changes.
 */

// Type declaration for Node.js Buffer global
declare const Buffer: {
  from(str: string, encoding?: string): { toString(encoding?: string): string };
};

// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any;
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;
}

interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;
}

interface ConfigureResult {
  success: boolean;
  message: string;
  configuredAt: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface SendMessageResult {
  success: boolean;
  message: string;
  messageId?: string;
  sentAt: string;
}

interface SlackConfig {
  // Configuration is managed through OAuth at /integrations/slack
  // This plugin just enables the integration and manages routing preferences
  routing_type?: string[]; // Notification routing types: 'Membership and roles', 'Projects and organizations', 'Policy reminders and status', 'Evidence and task alerts', 'Control or policy changes'
}

interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  attachments?: any[];
  blocks?: any[];
}

// ========== PLUGIN LIFECYCLE METHODS ==========

/**
 * Install the Slack plugin
 * Enables OAuth-based Slack integration (uses existing /integrations/slack flow)
 */
export async function install(
  _userId: number,
  _tenantId: string,
  _config: SlackConfig,
  _context: PluginContext
): Promise<InstallResult> {
  try {
    return {
      success: true,
      message: "Slack plugin installed successfully. Go to /integrations/slack to connect via 'Add to Slack' button.",
      installedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Installation failed: ${error.message}`);
  }
}

/**
 * Uninstall the Slack plugin
 * Called when a user uninstalls the plugin
 */
export async function uninstall(
  userId: number,
  _tenantId: string,
  context: PluginContext
): Promise<UninstallResult> {
  try {
    const { sequelize } = context;

    // Delete webhook configuration from slack_webhooks table
    const result: any = await sequelize.query(
      `DELETE FROM public.slack_webhooks WHERE user_id = :userId`,
      { replacements: { userId } }
    );

    const deletedCount = result[0]?.rowCount || 0;

    return {
      success: true,
      message: `Slack plugin uninstalled successfully. Removed ${deletedCount} webhook configuration(s).`,
      uninstalledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Uninstallation failed: ${error.message}`);
  }
}

/**
 * Configure the Slack plugin
 * Updates routing preferences for existing OAuth integrations
 */
export async function configure(
  userId: number,
  _tenantId: string,
  config: SlackConfig,
  context: PluginContext
): Promise<ConfigureResult> {
  try {
    const { sequelize } = context;

    // Update routing types if provided
    if (config.routing_type && config.routing_type.length > 0) {
      const routingTypeArray = `{${config.routing_type.map((t: string) => `"${t}"`).join(',')}}`;

      const result: any = await sequelize.query(
        `UPDATE public.slack_webhooks
         SET routing_type = :routing_type,
             updated_at = NOW()
         WHERE user_id = :userId`,
        {
          replacements: {
            userId,
            routing_type: routingTypeArray
          }
        }
      );

      const updatedCount = result[1] || 0;

      if (updatedCount > 0) {
        return {
          success: true,
          message: `Notification routing updated for ${updatedCount} Slack workspace(s). ${config.routing_type.length} notification type(s) enabled.`,
          configuredAt: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "No Slack workspaces connected. Go to /integrations/slack to connect via 'Add to Slack' button first.",
        configuredAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: "Configuration saved.",
      configuredAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Configuration failed: ${error.message}`);
  }
}

// ========== VALIDATION METHODS ==========

/**
 * Validate plugin configuration
 */
export function validateConfig(config: SlackConfig): ValidationResult {
  const errors: string[] = [];

  if (!config) {
    return { valid: true, errors }; // Empty config is valid
  }

  // Validate routing types if provided
  if (config.routing_type) {
    const validRoutingTypes = [
      "Membership and roles",
      "Projects and organizations",
      "Policy reminders and status",
      "Evidence and task alerts",
      "Control or policy changes",
    ];

    const invalidTypes = config.routing_type.filter(
      (type) => validRoutingTypes.indexOf(type) === -1
    );

    if (invalidTypes.length > 0) {
      errors.push(
        `Invalid routing types: ${invalidTypes.join(", ")}. Valid types are: ${validRoutingTypes.join(", ")}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ========== INTEGRATION METHODS ==========

/**
 * Test Slack connection
 * Checks if user has OAuth-connected Slack workspaces
 */
export async function testConnection(
  _config: SlackConfig,
  context?: { sequelize: any; userId: number }
): Promise<{ success: boolean; message: string; testedAt: string }> {
  try {
    if (!context || !context.sequelize || !context.userId) {
      return {
        success: true,
        message: "Slack plugin is installed. Connect workspace at /integrations/slack",
        testedAt: new Date().toISOString(),
      };
    }

    const { sequelize, userId } = context;

    // Check for OAuth-connected workspaces
    const webhooks: any = await sequelize.query(
      `SELECT COUNT(*) as count FROM public.slack_webhooks
       WHERE user_id = :userId AND is_active = true`,
      { replacements: { userId } }
    );

    const count = parseInt(webhooks[0]?.[0]?.count || '0');

    if (count > 0) {
      return {
        success: true,
        message: `${count} Slack workspace(s) connected via OAuth`,
        testedAt: new Date().toISOString(),
      };
    }

    return {
      success: false,
      message: "No Slack workspaces connected. Go to /integrations/slack and click 'Add to Slack'",
      testedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection check failed: ${error.message}`,
      testedAt: new Date().toISOString(),
    };
  }
}

/**
 * Format message for Slack (matches existing integration format)
 */
function formatSlackMessage(data: { title: string; message: string }): any {
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
}

/**
 * Send message to Slack using webhook
 * Internal helper function for notification functions
 */
async function sendMessageViaWebhook(
  webhookUrl: string,
  message: SlackMessage
): Promise<SendMessageResult> {
  try {
    // Prepare payload
    const payload = {
      text: message.text,
      channel: message.channel,
      username: message.username || "VerifyWise Bot",
      icon_emoji: message.icon_emoji || ":robot_face:",
      attachments: message.attachments,
      blocks: message.blocks,
    };

    // Send to Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API returned ${response.status}: ${errorText}`);
    }

    return {
      success: true,
      message: "Message sent to Slack successfully",
      messageId: `msg_${Date.now()}`,
      sentAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to send message: ${error.message}`,
      sentAt: new Date().toISOString(),
    };
  }
}

/**
 * Send notification to Slack by routing type
 * Matches the existing slackNotificationService.sendSlackNotification
 * Uses the actual Slack Web API through encrypted tokens (OAuth-based)
 */
export async function sendNotificationByRoutingType(
  userId: number,
  routingType: string,
  message: { title: string; message: string },
  sequelize: any
): Promise<void> {
  try {
    // Get all active webhooks for this user with this routing type
    const webhooks: any = await sequelize.query(
      `SELECT * FROM public.slack_webhooks
       WHERE user_id = :userId
       AND is_active = true
       AND routing_type && :routing_type`,
      {
        replacements: {
          userId,
          routing_type: `{${routingType}}`
        }
      }
    );

    const activeWebhooks = webhooks[0] || [];

    // Format message using integration's standard format
    const formattedMessage = formatSlackMessage(message);

    // Send message to all matching webhooks
    // Note: This uses the existing slackNotificationService in production
    // This is a simplified version for the plugin
    await Promise.all(
      activeWebhooks.map(async (webhook: any) => {
        try {
          // Decode the webhook URL (encoded during storage)
          const decodedUrl = Buffer.from(webhook.url, 'base64').toString('utf-8');

          await sendMessageViaWebhook(decodedUrl, {
            text: formattedMessage.text,
            blocks: formattedMessage.blocks,
          });
        } catch (error: any) {
          console.error(`Failed to send to webhook ${webhook.id}:`, error.message);
        }
      })
    );
  } catch (error: any) {
    console.error('Error sending Slack notification by routing type:', error);
    throw error;
  }
}

/**
 * Send notification about control or policy changes
 * Uses the routing type to send to all configured Slack webhooks
 */
export async function notifyControlPolicyChange(
  userId: number,
  changeData: {
    type: string;
    name: string;
    action: string;
    changedBy: string;
  },
  sequelize: any
): Promise<void> {
  await sendNotificationByRoutingType(
    userId,
    "Control or policy changes",
    {
      title: `${changeData.type} ${changeData.action}`,
      message: `*Name:* ${changeData.name}\n*Changed By:* ${changeData.changedBy}`,
    },
    sequelize
  );
}

/**
 * Send notification about evidence and task alerts
 * Uses the routing type to send to all configured Slack webhooks
 */
export async function notifyEvidenceTaskAlert(
  userId: number,
  alertData: {
    type: string;
    name: string;
    status: string;
    assignedTo?: string;
    dueDate?: string;
  },
  sequelize: any
): Promise<void> {
  await sendNotificationByRoutingType(
    userId,
    "Evidence and task alerts",
    {
      title: `${alertData.type} Alert`,
      message: `*Name:* ${alertData.name}\n*Status:* ${alertData.status}${alertData.assignedTo ? `\n*Assigned To:* ${alertData.assignedTo}` : ''}${alertData.dueDate ? `\n*Due Date:* ${alertData.dueDate}` : ''}`,
    },
    sequelize
  );
}

/**
 * Send notification about policy reminders and status
 * Uses the routing type to send to all configured Slack webhooks
 */
export async function notifyPolicyReminderStatus(
  userId: number,
  policyData: {
    policyName: string;
    status: string;
    reminderType?: string;
    dueDate?: string;
  },
  sequelize: any
): Promise<void> {
  await sendNotificationByRoutingType(
    userId,
    "Policy reminders and status",
    {
      title: `Policy ${policyData.reminderType || 'Update'}`,
      message: `*Policy:* ${policyData.policyName}\n*Status:* ${policyData.status}${policyData.dueDate ? `\n*Due Date:* ${policyData.dueDate}` : ''}`,
    },
    sequelize
  );
}

/**
 * Send notification about membership and roles
 * Uses the routing type to send to all configured Slack webhooks
 */
export async function notifyMembershipRoles(
  userId: number,
  memberData: {
    action: string;
    userName: string;
    role?: string;
    teamName?: string;
    changedBy: string;
  },
  sequelize: any
): Promise<void> {
  await sendNotificationByRoutingType(
    userId,
    "Membership and roles",
    {
      title: memberData.action,
      message: `*User:* ${memberData.userName}${memberData.role ? `\n*Role:* ${memberData.role}` : ''}${memberData.teamName ? `\n*Team:* ${memberData.teamName}` : ''}\n*Changed By:* ${memberData.changedBy}`,
    },
    sequelize
  );
}

/**
 * Send notification about projects and organizations
 * Uses the routing type to send to all configured Slack webhooks
 */
export async function notifyProjectOrganization(
  userId: number,
  projectData: {
    type: string;
    name: string;
    action: string;
    owner?: string;
    status?: string;
  },
  sequelize: any
): Promise<void> {
  await sendNotificationByRoutingType(
    userId,
    "Projects and organizations",
    {
      title: `${projectData.type} ${projectData.action}`,
      message: `*Name:* ${projectData.name}${projectData.owner ? `\n*Owner:* ${projectData.owner}` : ''}${projectData.status ? `\n*Status:* ${projectData.status}` : ''}`,
    },
    sequelize
  );
}



// ========== PLUGIN METADATA ==========

export const metadata: PluginMetadata = {
  name: "Slack",
  version: "1.0.0",
  author: "VerifyWise",
  description: "Slack integration for real-time notifications",
};
