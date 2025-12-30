"use strict";
/**
 * Slack Plugin for VerifyWise
 *
 * This plugin provides Slack integration for sending notifications
 * about AI model updates, risk assessments, and compliance changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.install = install;
exports.uninstall = uninstall;
exports.configure = configure;
exports.validateConfig = validateConfig;
exports.testConnection = testConnection;
exports.sendNotificationByRoutingType = sendNotificationByRoutingType;
exports.notifyControlPolicyChange = notifyControlPolicyChange;
exports.notifyEvidenceTaskAlert = notifyEvidenceTaskAlert;
exports.notifyPolicyReminderStatus = notifyPolicyReminderStatus;
exports.notifyMembershipRoles = notifyMembershipRoles;
exports.notifyProjectOrganization = notifyProjectOrganization;
// ========== PLUGIN LIFECYCLE METHODS ==========
/**
 * Install the Slack plugin
 * Enables OAuth-based Slack integration (uses existing /integrations/slack flow)
 */
async function install(_userId, _tenantId, _config, _context) {
    try {
        return {
            success: true,
            message: "Slack plugin installed successfully. Go to /integrations/slack to connect via 'Add to Slack' button.",
            installedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        throw new Error(`Installation failed: ${error.message}`);
    }
}
/**
 * Uninstall the Slack plugin
 * Called when a user uninstalls the plugin
 */
async function uninstall(userId, _tenantId, context) {
    try {
        const { sequelize } = context;
        // Delete webhook configuration from slack_webhooks table
        const result = await sequelize.query(`DELETE FROM public.slack_webhooks WHERE user_id = :userId`, { replacements: { userId } });
        const deletedCount = result[0]?.rowCount || 0;
        return {
            success: true,
            message: `Slack plugin uninstalled successfully. Removed ${deletedCount} webhook configuration(s).`,
            uninstalledAt: new Date().toISOString(),
        };
    }
    catch (error) {
        throw new Error(`Uninstallation failed: ${error.message}`);
    }
}
/**
 * Configure the Slack plugin
 * Updates routing preferences for existing OAuth integrations
 */
async function configure(userId, _tenantId, config, context) {
    try {
        const { sequelize } = context;
        // Update routing types if provided
        if (config.routing_type && config.routing_type.length > 0) {
            const routingTypeArray = `{${config.routing_type.map((t) => `"${t}"`).join(',')}}`;
            const result = await sequelize.query(`UPDATE public.slack_webhooks
         SET routing_type = :routing_type,
             updated_at = NOW()
         WHERE user_id = :userId`, {
                replacements: {
                    userId,
                    routing_type: routingTypeArray
                }
            });
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
    }
    catch (error) {
        throw new Error(`Configuration failed: ${error.message}`);
    }
}
// ========== VALIDATION METHODS ==========
/**
 * Validate plugin configuration
 */
function validateConfig(config) {
    const errors = [];
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
        const invalidTypes = config.routing_type.filter((type) => validRoutingTypes.indexOf(type) === -1);
        if (invalidTypes.length > 0) {
            errors.push(`Invalid routing types: ${invalidTypes.join(", ")}. Valid types are: ${validRoutingTypes.join(", ")}`);
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
async function testConnection(_config, context) {
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
        const webhooks = await sequelize.query(`SELECT COUNT(*) as count FROM public.slack_webhooks
       WHERE user_id = :userId AND is_active = true`, { replacements: { userId } });
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
    }
    catch (error) {
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
function formatSlackMessage(data) {
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
async function sendMessageViaWebhook(webhookUrl, message) {
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
    }
    catch (error) {
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
async function sendNotificationByRoutingType(userId, routingType, message, sequelize) {
    try {
        // Get all active webhooks for this user with this routing type
        const webhooks = await sequelize.query(`SELECT * FROM public.slack_webhooks
       WHERE user_id = :userId
       AND is_active = true
       AND routing_type && :routing_type`, {
            replacements: {
                userId,
                routing_type: `{${routingType}}`
            }
        });
        const activeWebhooks = webhooks[0] || [];
        // Format message using integration's standard format
        const formattedMessage = formatSlackMessage(message);
        // Send message to all matching webhooks
        // Note: This uses the existing slackNotificationService in production
        // This is a simplified version for the plugin
        await Promise.all(activeWebhooks.map(async (webhook) => {
            try {
                // Decode the webhook URL (encoded during storage)
                const decodedUrl = Buffer.from(webhook.url, 'base64').toString('utf-8');
                await sendMessageViaWebhook(decodedUrl, {
                    text: formattedMessage.text,
                    blocks: formattedMessage.blocks,
                });
            }
            catch (error) {
                console.error(`Failed to send to webhook ${webhook.id}:`, error.message);
            }
        }));
    }
    catch (error) {
        console.error('Error sending Slack notification by routing type:', error);
        throw error;
    }
}
/**
 * Send notification about control or policy changes
 * Uses the routing type to send to all configured Slack webhooks
 */
async function notifyControlPolicyChange(userId, changeData, sequelize) {
    await sendNotificationByRoutingType(userId, "Control or policy changes", {
        title: `${changeData.type} ${changeData.action}`,
        message: `*Name:* ${changeData.name}\n*Changed By:* ${changeData.changedBy}`,
    }, sequelize);
}
/**
 * Send notification about evidence and task alerts
 * Uses the routing type to send to all configured Slack webhooks
 */
async function notifyEvidenceTaskAlert(userId, alertData, sequelize) {
    await sendNotificationByRoutingType(userId, "Evidence and task alerts", {
        title: `${alertData.type} Alert`,
        message: `*Name:* ${alertData.name}\n*Status:* ${alertData.status}${alertData.assignedTo ? `\n*Assigned To:* ${alertData.assignedTo}` : ''}${alertData.dueDate ? `\n*Due Date:* ${alertData.dueDate}` : ''}`,
    }, sequelize);
}
/**
 * Send notification about policy reminders and status
 * Uses the routing type to send to all configured Slack webhooks
 */
async function notifyPolicyReminderStatus(userId, policyData, sequelize) {
    await sendNotificationByRoutingType(userId, "Policy reminders and status", {
        title: `Policy ${policyData.reminderType || 'Update'}`,
        message: `*Policy:* ${policyData.policyName}\n*Status:* ${policyData.status}${policyData.dueDate ? `\n*Due Date:* ${policyData.dueDate}` : ''}`,
    }, sequelize);
}
/**
 * Send notification about membership and roles
 * Uses the routing type to send to all configured Slack webhooks
 */
async function notifyMembershipRoles(userId, memberData, sequelize) {
    await sendNotificationByRoutingType(userId, "Membership and roles", {
        title: memberData.action,
        message: `*User:* ${memberData.userName}${memberData.role ? `\n*Role:* ${memberData.role}` : ''}${memberData.teamName ? `\n*Team:* ${memberData.teamName}` : ''}\n*Changed By:* ${memberData.changedBy}`,
    }, sequelize);
}
/**
 * Send notification about projects and organizations
 * Uses the routing type to send to all configured Slack webhooks
 */
async function notifyProjectOrganization(userId, projectData, sequelize) {
    await sendNotificationByRoutingType(userId, "Projects and organizations", {
        title: `${projectData.type} ${projectData.action}`,
        message: `*Name:* ${projectData.name}${projectData.owner ? `\n*Owner:* ${projectData.owner}` : ''}${projectData.status ? `\n*Status:* ${projectData.status}` : ''}`,
    }, sequelize);
}
// ========== PLUGIN METADATA ==========
exports.metadata = {
    name: "Slack",
    version: "1.0.0",
    author: "VerifyWise",
    description: "Slack integration for real-time notifications",
};
//# sourceMappingURL=index.js.map