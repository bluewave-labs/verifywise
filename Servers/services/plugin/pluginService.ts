import * as fs from "fs";
import * as path from "path";
// import axios from "axios"; // Uncomment for production (remote Git repo)
import { createInstallation, findByIdWithValidation, getInstalledPlugins, toJSON, updateConfiguration, deleteInstallation } from "../../utils/pluginInstallation.utils";
import { PluginInstallationStatus } from "../../domain.layer/enums/plugin.enum";
import {
  ValidationException,
  NotFoundException,
} from "../../domain.layer/exceptions/custom.exception";
import { sequelize } from "../../database/db";

// Environment configuration
const PLUGIN_MARKETPLACE_PATH = path.join(
  __dirname,
  "../../../../plugin-marketplace/plugins.json"
);
// const PLUGIN_MARKETPLACE_URL = process.env.PLUGIN_MARKETPLACE_URL ||
//   "https://raw.githubusercontent.com/verifywise/plugin-marketplace/main/plugins.json";

interface Plugin {
  key: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  version: string;
  author?: string;
  category: string;
  iconUrl?: string;
  documentationUrl?: string;
  supportUrl?: string;
  isOfficial: boolean;
  isPublished: boolean;
  requiresConfiguration: boolean;
  installationType: string;
  features: Array<{
    name: string;
    description: string;
    displayOrder: number;
  }>;
  tags: string[];
  pluginPath: string;
  entryPoint: string;
  dependencies?: Record<string, string>;
}

interface PluginMarketplace {
  version: string;
  plugins: Plugin[];
  categories: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

/**
 * Plugin Service
 *
 * Handles plugin marketplace operations and installation management
 */
export class PluginService {
  /**
   * Get all available plugins from marketplace
   * Development: Reads from local plugins.json
   * Production: Fetches from remote Git repository
   */
  static async getAllPlugins(category?: string): Promise<Plugin[]> {
    try {
      // DEVELOPMENT: Read from local file
      const marketplaceData = await this.readLocalMarketplace();

      // PRODUCTION: Uncomment below and comment out above for remote Git repo
      // const marketplaceData = await this.fetchRemoteMarketplace();

      let plugins = marketplaceData.plugins.filter((p) => p.isPublished);

      // Filter by category if provided
      if (category) {
        plugins = plugins.filter((p) => p.category === category);
      }

      return plugins;
    } catch (error: any) {
      console.error("[PluginService] Error fetching plugins:", error);
      throw new Error(`Failed to fetch plugins: ${error.message}`);
    }
  }

  /**
   * Get plugin by key
   */
  static async getPluginByKey(pluginKey: string): Promise<Plugin | null> {
    try {
      const marketplaceData = await this.readLocalMarketplace();
      // const marketplaceData = await this.fetchRemoteMarketplace(); // Production

      const plugin = marketplaceData.plugins.find(
        (p) => p.key === pluginKey && p.isPublished
      );

      return plugin || null;
    } catch (error: any) {
      console.error(
        `[PluginService] Error fetching plugin ${pluginKey}:`,
        error
      );
      throw new Error(`Failed to fetch plugin: ${error.message}`);
    }
  }

  /**
   * Search plugins by query
   */
  static async searchPlugins(query: string): Promise<Plugin[]> {
    try {
      const marketplaceData = await this.readLocalMarketplace();
      // const marketplaceData = await this.fetchRemoteMarketplace(); // Production

      const lowerQuery = query.toLowerCase();

      const plugins = marketplaceData.plugins.filter(
        (p) =>
          p.isPublished &&
          (p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)))
      );

      return plugins;
    } catch (error: any) {
      console.error("[PluginService] Error searching plugins:", error);
      throw new Error(`Failed to search plugins: ${error.message}`);
    }
  }

  /**
   * Install a plugin for a user
   */
  static async installPlugin(
    pluginKey: string,
    userId: number,
    tenantId: string
  ): Promise<any> {
    try {
      // Verify plugin exists in marketplace
      const plugin = await this.getPluginByKey(pluginKey);
      if (!plugin) {
        throw new NotFoundException(
          "Plugin not found in marketplace",
          "plugin",
          pluginKey
        );
      }

      // Load and execute plugin install method
      const pluginCode = await this.loadPluginCode(plugin);
      if (pluginCode && typeof pluginCode.install === "function") {
        const context = {
          sequelize,
        };
        const result = await pluginCode.install(userId, tenantId, {}, context);
        console.log(
          `[PluginService] Plugin ${pluginKey} installed:`,
          result
        );
      }

      // Create installation record (only after successful plugin installation)
      const installation = await createInstallation(
        pluginKey,
        tenantId
      );

      return toJSON(installation);
    } catch (error: any) {
      console.error(
        `[PluginService] Error installing plugin ${pluginKey}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  static async uninstallPlugin(
    installationId: number,
    userId: number,
    tenantId: string
  ): Promise<void> {
    try {
      const installation =
        await findByIdWithValidation(
          installationId,
          tenantId
        );

      // Load plugin and execute uninstall method
      const plugin = await this.getPluginByKey(installation.plugin_key);
      if (plugin) {
        const pluginCode = await this.loadPluginCode(plugin);
        if (pluginCode && typeof pluginCode.uninstall === "function") {
          const context = {
            sequelize,
          };
          const result = await pluginCode.uninstall(
            userId,
            tenantId,
            context
          );
          console.log(
            `[PluginService] Plugin ${installation.plugin_key} uninstalled:`,
            result
          );
        }
      }

      // Delete installation record
      await deleteInstallation(installationId, tenantId);
    } catch (error: any) {
      console.error(
        `[PluginService] Error uninstalling plugin ${installationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get installed plugins for a tenant
   */
  static async getInstalledPlugins(
    tenantId: string
  ): Promise<any[]> {
    try {
      const installations = await getInstalledPlugins(
        tenantId
      );

      // Fetch plugin metadata from marketplace for each installation
      const pluginsWithMetadata = await Promise.all(
        installations.map(async (installation) => {
          const plugin = await this.getPluginByKey(installation.plugin_key);
          return {
            ...toJSON(installation),
            plugin: plugin || {
              key: installation.plugin_key,
              name: installation.plugin_key,
              description: "Plugin not found in marketplace",
            },
          };
        })
      );

      return pluginsWithMetadata;
    } catch (error: any) {
      console.error("[PluginService] Error fetching installed plugins:", error);
      throw error;
    }
  }

  /**
   * Get plugin categories
   */
  static async getCategories(): Promise<any[]> {
    try {
      const marketplaceData = await this.readLocalMarketplace();
      // const marketplaceData = await this.fetchRemoteMarketplace(); // Production

      return marketplaceData.categories || [];
    } catch (error: any) {
      console.error("[PluginService] Error fetching categories:", error);
      throw error;
    }
  }

  /**
   * Update plugin configuration
   */
  static async updateConfiguration(
    installationId: number,
    userId: number,
    tenantId: string,
    configuration: Record<string, any>
  ): Promise<any> {
    try {
      // Verify installation exists
      const installation =
        await findByIdWithValidation(
          installationId,
          tenantId
        );

      // Validate that plugin is installed
      if (installation.status !== PluginInstallationStatus.INSTALLED) {
        throw new ValidationException(
          "Plugin must be installed before configuring",
          "installation_id",
          installationId
        );
      }

      // Update configuration
      const updated = await updateConfiguration(
        installationId,
        tenantId,
        configuration
      );

      // Load plugin and execute configure method if it exists
      const plugin = await this.getPluginByKey(installation.plugin_key);
      if (plugin) {
        const pluginCode = await this.loadPluginCode(plugin);
        if (pluginCode && typeof pluginCode.configure === "function") {
          const context = {
            sequelize,
          };
          const result = await pluginCode.configure(
            userId,
            tenantId,
            configuration,
            context
          );
          console.log(
            `[PluginService] Plugin ${installation.plugin_key} configured:`,
            result
          );
        }
      }

      return toJSON(updated);
    } catch (error: any) {
      console.error(
        `[PluginService] Error updating plugin configuration:`,
        error
      );
      throw error;
    }
  }

  /**
   * Test plugin connection
   */
  static async testConnection(
    pluginKey: string,
    configuration: Record<string, any>,
    context?: { userId: number; tenantId: string }
  ): Promise<any> {
    try {
      // Verify plugin exists in marketplace
      const plugin = await this.getPluginByKey(pluginKey);
      if (!plugin) {
        throw new NotFoundException(
          "Plugin not found in marketplace",
          "plugin",
          pluginKey
        );
      }

      // Load plugin and execute testConnection method if it exists
      const pluginCode = await this.loadPluginCode(plugin);
      if (pluginCode && typeof pluginCode.testConnection === "function") {
        const pluginContext = context ? { sequelize, ...context } : undefined;
        const result = await pluginCode.testConnection(configuration, pluginContext);
        console.log(
          `[PluginService] Plugin ${pluginKey} connection test:`,
          result
        );
        return result;
      }

      // If plugin doesn't implement testConnection, return not supported
      return {
        success: false,
        message: "Plugin does not support connection testing",
      };
    } catch (error: any) {
      console.error(
        `[PluginService] Error testing plugin connection:`,
        error
      );
      throw error;
    }
  }

  /**
   * Connect OAuth workspace (Slack)
   */
  static async connectOAuthWorkspace(
    pluginKey: string,
    code: string,
    userId: number,
    _tenantId: string
  ): Promise<any> {
    try {
      // Verify plugin exists
      const plugin = await this.getPluginByKey(pluginKey);
      if (!plugin) {
        throw new NotFoundException(
          "Plugin not found in marketplace",
          "plugin",
          pluginKey
        );
      }

      // Only Slack plugin supports OAuth for now
      if (pluginKey !== "slack") {
        throw new ValidationException(
          "OAuth is only supported for Slack plugin",
          "pluginKey",
          pluginKey
        );
      }

      // Validate OAuth code with Slack API
      const slackData = await this.validateSlackOAuth(code);

      // Create slack_webhooks entry
      const result: any = await sequelize.query(
        `INSERT INTO public.slack_webhooks
         (access_token, scope, team_name, team_id, channel, channel_id,
          configuration_url, url, user_id, is_active, created_at, updated_at)
         VALUES (:access_token, :scope, :team_name, :team_id, :channel, :channel_id,
                 :configuration_url, :url, :user_id, :is_active, NOW(), NOW())
         RETURNING *`,
        {
          replacements: {
            access_token: Buffer.from(slackData.access_token).toString('base64'),
            scope: slackData.scope,
            team_name: slackData.team.name,
            team_id: slackData.team.id,
            channel: slackData.incoming_webhook.channel,
            channel_id: slackData.incoming_webhook.channel_id,
            configuration_url: slackData.incoming_webhook.configuration_url,
            url: Buffer.from(slackData.incoming_webhook.url).toString('base64'),
            user_id: userId,
            is_active: true,
          },
        }
      );

      // Invite bot to channel
      if (slackData.authed_user && slackData.bot_user_id) {
        try {
          await this.inviteBotToChannel(
            slackData.authed_user.access_token,
            slackData.incoming_webhook.channel_id,
            slackData.bot_user_id
          );
        } catch (error) {
          console.warn('[PluginService] Failed to invite bot to channel:', error);
        }
      }

      const webhook = result[0][0];
      return {
        id: webhook.id,
        team_name: webhook.team_name,
        channel: webhook.channel,
        is_active: webhook.is_active,
        routing_type: webhook.routing_type || [],
      };
    } catch (error: any) {
      console.error(
        `[PluginService] Error connecting OAuth workspace:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get OAuth workspaces (Slack)
   */
  static async getOAuthWorkspaces(
    pluginKey: string,
    userId: number,
    _tenantId: string
  ): Promise<any[]> {
    try {
      // Only Slack plugin supports OAuth for now
      if (pluginKey !== "slack") {
        return [];
      }

      const result: any = await sequelize.query(
        `SELECT id, team_name, channel, channel_id, is_active, routing_type, created_at
         FROM public.slack_webhooks
         WHERE user_id = :userId
         ORDER BY created_at DESC`,
        {
          replacements: { userId },
        }
      );

      return result[0].map((row: any) => ({
        id: row.id,
        team_name: row.team_name,
        channel: row.channel,
        channel_id: row.channel_id,
        is_active: row.is_active,
        routing_type: row.routing_type || [],
        created_at: row.created_at,
      }));
    } catch (error: any) {
      console.error(
        `[PluginService] Error fetching OAuth workspaces:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update OAuth workspace (Slack routing types)
   */
  static async updateOAuthWorkspace(
    pluginKey: string,
    webhookId: number,
    userId: number,
    _tenantId: string,
    updateData: { routing_type?: string[]; is_active?: boolean }
  ): Promise<any> {
    try {
      // Only Slack plugin supports OAuth for now
      if (pluginKey !== "slack") {
        throw new ValidationException(
          "OAuth is only supported for Slack plugin",
          "pluginKey",
          pluginKey
        );
      }

      // Verify webhook belongs to user
      const checkResult: any = await sequelize.query(
        `SELECT id FROM public.slack_webhooks WHERE id = :webhookId AND user_id = :userId`,
        { replacements: { webhookId, userId } }
      );

      if (!checkResult[0] || checkResult[0].length === 0) {
        throw new NotFoundException(
          "Webhook not found or unauthorized",
          "webhook",
          webhookId
        );
      }

      // Build update query dynamically
      const updates: string[] = [];
      const replacements: any = { webhookId, userId };

      if (updateData.routing_type !== undefined) {
        const routingTypeArray = `{${updateData.routing_type.map((t: string) => `"${t}"`).join(',')}}`;
        updates.push("routing_type = :routing_type");
        replacements.routing_type = routingTypeArray;
      }

      if (updateData.is_active !== undefined) {
        updates.push("is_active = :is_active");
        replacements.is_active = updateData.is_active;
      }

      if (updates.length === 0) {
        throw new ValidationException(
          "No update data provided",
          "updateData",
          updateData
        );
      }

      updates.push("updated_at = NOW()");

      const result: any = await sequelize.query(
        `UPDATE public.slack_webhooks
         SET ${updates.join(", ")}
         WHERE id = :webhookId AND user_id = :userId
         RETURNING id, team_name, channel, is_active, routing_type`,
        { replacements }
      );

      const webhook = result[0][0];
      return {
        id: webhook.id,
        team_name: webhook.team_name,
        channel: webhook.channel,
        is_active: webhook.is_active,
        routing_type: webhook.routing_type || [],
      };
    } catch (error: any) {
      console.error(
        `[PluginService] Error updating OAuth workspace:`,
        error
      );
      throw error;
    }
  }

  /**
   * Disconnect OAuth workspace (Slack)
   */
  static async disconnectOAuthWorkspace(
    pluginKey: string,
    webhookId: number,
    userId: number,
    _tenantId: string
  ): Promise<void> {
    try {
      // Only Slack plugin supports OAuth for now
      if (pluginKey !== "slack") {
        throw new ValidationException(
          "OAuth is only supported for Slack plugin",
          "pluginKey",
          pluginKey
        );
      }

      // Verify webhook belongs to user
      const checkResult: any = await sequelize.query(
        `SELECT id FROM public.slack_webhooks WHERE id = :webhookId AND user_id = :userId`,
        { replacements: { webhookId, userId } }
      );

      if (!checkResult[0] || checkResult[0].length === 0) {
        throw new NotFoundException(
          "Webhook not found or unauthorized",
          "webhook",
          webhookId
        );
      }

      // Delete webhook
      await sequelize.query(
        `DELETE FROM public.slack_webhooks WHERE id = :webhookId AND user_id = :userId`,
        { replacements: { webhookId, userId } }
      );

      console.log(
        `[PluginService] OAuth workspace ${webhookId} disconnected for user ${userId}`
      );
    } catch (error: any) {
      console.error(
        `[PluginService] Error disconnecting OAuth workspace:`,
        error
      );
      throw error;
    }
  }

  // ========== OAUTH HELPER METHODS ==========

  /**
   * Validate Slack OAuth code
   */
  private static async validateSlackOAuth(code: string): Promise<any> {
    try {
      const url = process.env.SLACK_API_URL;
      const searchParams = {
        client_id: process.env.SLACK_CLIENT_ID || "",
        client_secret: process.env.SLACK_CLIENT_SECRET || "",
        code: code,
        redirect_uri: `${process.env.FRONTEND_URL}/plugins/slack/manage`,
      };

      if (!url) {
        throw new Error("Slack API URL is not configured");
      }

      const tokenResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(searchParams),
      });

      const data = await tokenResponse.json();

      if (data.ok) {
        return data;
      } else {
        throw new Error(data.error || "Slack OAuth failed");
      }
    } catch (error) {
      throw new Error("Failed to validate Slack OAuth code");
    }
  }

  /**
   * Invite bot to Slack channel
   */
  private static async inviteBotToChannel(
    userAccessToken: string,
    channelId: string,
    botUserId: string
  ): Promise<void> {
    try {
      const response = await fetch("https://slack.com/api/conversations.invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userAccessToken}`,
        },
        body: JSON.stringify({
          channel: channelId,
          users: botUserId,
        }),
      });

      const data = await response.json();

      if (!data.ok && data.error !== "already_in_channel") {
        console.warn(`[PluginService] Failed to invite bot to channel: ${data.error}`);
      }
    } catch (error) {
      console.warn(`[PluginService] Error inviting bot to channel:`, error);
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Read marketplace data from local file (Development)
   */
  private static async readLocalMarketplace(): Promise<PluginMarketplace> {
    try {
      const data = fs.readFileSync(PLUGIN_MARKETPLACE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error: any) {
      console.error("[PluginService] Error reading local marketplace:", error);
      throw new Error(`Failed to read local marketplace: ${error.message}`);
    }
  }

  /**
   * Fetch marketplace data from remote Git repository (Production)
   * Uncomment for production use
   */
  // private static async fetchRemoteMarketplace(): Promise<PluginMarketplace> {
  //   try {
  //     const response = await axios.get(PLUGIN_MARKETPLACE_URL, {
  //       timeout: 10000,
  //       headers: {
  //         "Accept": "application/json",
  //       },
  //     });
  //
  //     return response.data;
  //   } catch (error: any) {
  //     console.error("[PluginService] Error fetching remote marketplace:", error);
  //     throw new Error(`Failed to fetch remote marketplace: ${error.message}`);
  //   }
  // }

  /**
   * Load plugin code from local file system
   * In production, this would download the plugin from the Git repository
   */
  private static async loadPluginCode(plugin: Plugin): Promise<any> {
    try {
      // Register ts-node for TypeScript support if entry point is .ts
      if (plugin.entryPoint.endsWith(".ts")) {
        try {
          require("ts-node/register");
        } catch (error) {
          console.warn(
            "[PluginService] ts-node not available, attempting to load TypeScript file directly"
          );
        }
      }

      // DEVELOPMENT: Load from local file system
      const pluginPath = path.join(
        __dirname,
        "../../../../plugin-marketplace",
        plugin.pluginPath,
        plugin.entryPoint
      );

      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(pluginPath)];

      const pluginCode = require(pluginPath);
      return pluginCode;

      // PRODUCTION: Uncomment below for downloading from Git repository
      // const pluginCode = await this.downloadAndLoadPlugin(plugin);
      // return pluginCode;
    } catch (error: any) {
      console.error(
        `[PluginService] Error loading plugin ${plugin.key}:`,
        error
      );
      throw new Error(`Failed to load plugin code: ${error.message}`);
    }
  }

  /**
   * Download plugin code from Git repository and load it (Production)
   * Uncomment for production use
   */
  // private static async downloadAndLoadPlugin(plugin: Plugin): Promise<any> {
  //   try {
  //     // 1. Download plugin folder from Git repository
  //     const pluginUrl = `${PLUGIN_MARKETPLACE_URL.replace("plugins.json", "")}${plugin.pluginPath}/${plugin.entryPoint}`;
  //     const response = await axios.get(pluginUrl, {
  //       timeout: 10000,
  //     });
  //
  //     // 2. Save to temporary location
  //     const tempPath = path.join(__dirname, "../../../temp/plugins", plugin.key);
  //     fs.mkdirSync(tempPath, { recursive: true });
  //     const entryPointPath = path.join(tempPath, plugin.entryPoint);
  //     fs.writeFileSync(entryPointPath, response.data);
  //
  //     // 3. Load the plugin code
  //     const pluginCode = require(entryPointPath);
  //     return pluginCode;
  //   } catch (error: any) {
  //     console.error(`[PluginService] Error downloading plugin ${plugin.key}:`, error);
  //     throw new Error(`Failed to download plugin: ${error.message}`);
  //   }
  // }
}
