import { SlackWebhookModel } from "../../domain.layer/models/slackNotification/slackWebhook.model";
import { getTenantHash } from "../../tools/getTenantHash";
import { sequelize } from "../../database/db";
import { QueryTypes } from "sequelize";

/**
 * Plugin Installation Service
 *
 * Handles plugin-specific installation and uninstallation logic
 */
export class PluginInstallationService {
  /**
   * Install Slack plugin
   * Creates necessary database records and initializes plugin
   */
  static async installSlackPlugin(
    userId: number,
    organizationId: number,
    config: any
  ): Promise<void> {
    try {
      console.log(
        `[PluginInstallationService] Installing Slack plugin for user ${userId}`
      );

      // Slack installation is handled through the existing Slack OAuth flow
      // The plugin installation just marks the plugin as "ready to configure"
      // Actual webhook creation happens when user completes OAuth flow at /integrations/slack

      // No additional setup needed here - existing slack_webhooks table is used
      // Plugin installation record tracks that user intends to use Slack
    } catch (error: any) {
      console.error("[PluginInstallationService] Slack install error:", error);
      throw error;
    }
  }

  /**
   * Uninstall Slack plugin
   * Removes all Slack webhooks for the user
   */
  static async uninstallSlackPlugin(
    userId: number,
    organizationId: number
  ): Promise<void> {
    try {
      console.log(
        `[PluginInstallationService] Uninstalling Slack plugin for user ${userId}`
      );

      // Delete all Slack webhooks for this user
      const webhooks = await SlackWebhookModel.findAll({
        where: { user_id: userId },
      });

      for (const webhook of webhooks) {
        await webhook.destroy();
      }

      console.log(
        `[PluginInstallationService] Deleted ${webhooks.length} Slack webhooks`
      );
    } catch (error: any) {
      console.error(
        "[PluginInstallationService] Slack uninstall error:",
        error
      );
      throw error;
    }
  }

  /**
   * Install MLflow plugin
   * Initializes tenant-specific MLflow integration
   */
  static async installMLflowPlugin(
    userId: number,
    organizationId: number,
    config: any
  ): Promise<void> {
    try {
      console.log(
        `[PluginInstallationService] Installing MLflow plugin for organization ${organizationId}`
      );

      // MLflow installation is handled through the existing MLflow configuration
      // The plugin installation just marks the plugin as "ready to configure"
      // Actual configuration happens when user visits /integrations/mlflow

      // No additional setup needed here - existing mlflow_integrations table is used
      // Plugin installation record tracks that tenant intends to use MLflow
    } catch (error: any) {
      console.error("[PluginInstallationService] MLflow install error:", error);
      throw error;
    }
  }

  /**
   * Uninstall MLflow plugin
   * Removes MLflow integration and model records for the tenant
   */
  static async uninstallMLflowPlugin(
    userId: number,
    organizationId: number
  ): Promise<void> {
    try {
      console.log(
        `[PluginInstallationService] Uninstalling MLflow plugin for organization ${organizationId}`
      );

      const tenantHash = getTenantHash(organizationId);

      // Delete MLflow integration records from tenant schema
      await sequelize.query(
        `DELETE FROM "${tenantHash}".mlflow_integrations WHERE id > 0`,
        { type: QueryTypes.DELETE }
      );

      // Delete MLflow model records from tenant schema
      await sequelize.query(
        `DELETE FROM "${tenantHash}".mlflow_model_records WHERE id > 0`,
        { type: QueryTypes.DELETE }
      );

      console.log(
        `[PluginInstallationService] Deleted MLflow data for organization ${organizationId}`
      );
    } catch (error: any) {
      console.error(
        "[PluginInstallationService] MLflow uninstall error:",
        error
      );
      throw error;
    }
  }

  /**
   * Check if plugin has actual data configured
   * This is used to sync installation status with existing integration data
   */
  static async checkPluginDataExists(
    pluginKey: string,
    userId: number,
    organizationId: number
  ): Promise<boolean> {
    try {
      if (pluginKey === "slack") {
        const webhooks = await SlackWebhookModel.findAll({
          where: { user_id: userId },
        });
        return webhooks.length > 0;
      }

      if (pluginKey === "mlflow") {
        const tenantHash = getTenantHash(organizationId);

        const results = await sequelize.query(
          `SELECT COUNT(*) as count FROM "${tenantHash}".mlflow_integrations`,
          { type: QueryTypes.SELECT }
        );

        return results && (results[0] as any).count > 0;
      }

      return false;
    } catch (error: any) {
      console.error(
        `[PluginInstallationService] Error checking data for ${pluginKey}:`,
        error
      );
      return false;
    }
  }
}
