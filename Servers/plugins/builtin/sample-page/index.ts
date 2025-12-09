/**
 * @fileoverview Sample Page Plugin
 *
 * A built-in plugin that demonstrates the empty-page template with real data.
 * Shows how to create a plugin page with:
 * - Breadcrumb navigation (Dashboard > Plugins > Sample Page)
 * - Page title and description
 * - Content using structured slots with real database data
 *
 * @module plugins/sample-page
 */

import fs from "fs";
import path from "path";
import { Router, Request } from "express";
import { Plugin, PluginContext, PluginManifest } from "../../core";

// Extend Express Request to include tenantId from auth middleware
interface AuthenticatedRequest extends Request {
  tenantId?: string;
}

// Load manifest from JSON file
const manifestPath = path.join(__dirname, "manifest.json");
const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

// Load icon from SVG file
const iconPath = path.join(__dirname, "icon.svg");
const icon = fs.readFileSync(iconPath, "utf-8");

// Store plugin context for use in routes
let pluginContext: PluginContext | null = null;

/**
 * Sample Page Plugin
 *
 * Demonstrates the empty-page template with real data from the database.
 */
const samplePagePlugin: Plugin = {
  manifest: {
    ...manifest,
    icon,
  },

  async onInstall(context: PluginContext): Promise<void> {
    context.logger.info("Sample Page plugin installed");
  },

  async onUninstall(context: PluginContext): Promise<void> {
    context.logger.info("Sample Page plugin uninstalled");
  },

  async onEnable(context: PluginContext): Promise<void> {
    pluginContext = context;
    context.logger.info("Sample Page plugin enabled");
  },

  async onDisable(context: PluginContext): Promise<void> {
    pluginContext = null;
    context.logger.info("Sample Page plugin disabled");
  },

  /**
   * Routes - expose page content endpoint with real data
   */
  routes(router: Router): void {
    // GET /api/plugins/sample-page/page-content
    router.get("/page-content", async (req: AuthenticatedRequest, res): Promise<void> => {
      try {
        if (!pluginContext) {
          res.json({
            success: false,
            error: "Plugin context not available",
          });
          return;
        }

        // Get the tenant schema from the authenticated request (set by auth middleware)
        const tenant = req.tenantId;
        if (!tenant) {
          res.json({
            success: false,
            error: "Tenant not available - authentication required",
          });
          return;
        }

        // Query real data from the database using actual table names with schema prefixes
        // Tenant-specific tables: "${tenant}".table_name
        // Public tables (like users): public.table_name
        // Each query is wrapped in try-catch to handle missing tables gracefully
        let totalProjects = 0;
        let totalVendors = 0;
        let totalVendorRisks = 0;
        let totalUsers = 0;
        let totalIncidents = 0;
        let totalModels = 0;
        let projectRows: Array<Record<string, string>> = [];
        let userRows: Array<Record<string, string>> = [];
        let vendorRisksByLevel: Array<{ name: string; value: number; color: string }> = [];
        let incidentsByStatus: Array<{ name: string; value: number; color: string }> = [];

        pluginContext.logger.info(`Starting database queries for tenant: ${tenant}`);

        try {
          // Join with users table to get owner name
          const projectsResult = await pluginContext.db.query(
            `SELECT p.id, p.project_title, p.owner, p.last_updated, u.name as owner_name, u.surname as owner_surname
             FROM "${tenant}".projects p
             LEFT JOIN public.users u ON p.owner = u.id
             ORDER BY p.last_updated DESC NULLS LAST LIMIT 10`
          );
          pluginContext.logger.info(`Projects query returned ${projectsResult.rows.length} rows`);
          totalProjects = projectsResult.rows.length;
          projectRows = projectsResult.rows.map((project: Record<string, unknown>, index: number) => {
            const ownerName = project.owner_name || "";
            const ownerSurname = project.owner_surname || "";
            const fullName = `${ownerName} ${ownerSurname}`.trim();
            return {
              id: String(project.id || index + 1),
              name: String(project.project_title || "Untitled"),
              owner: fullName || "-",
              updated: project.last_updated
                ? new Date(project.last_updated as string).toLocaleDateString()
                : "-",
            };
          });
        } catch (e) {
          const err = e as Error;
          pluginContext.logger.warn(`Could not query projects table: ${err.message}`);
        }

        try {
          const vendorsResult = await pluginContext.db.query(`SELECT COUNT(*) as total FROM "${tenant}".vendors`);
          totalVendors = Number(vendorsResult.rows[0]?.total ?? 0);
        } catch (e) {
          pluginContext.logger.warn("Could not query vendors table");
        }

        try {
          const vendorRisksResult = await pluginContext.db.query(`SELECT COUNT(*) as total FROM "${tenant}".vendorrisks`);
          totalVendorRisks = Number(vendorRisksResult.rows[0]?.total ?? 0);
        } catch (e) {
          pluginContext.logger.warn("Could not query vendorrisks table");
        }

        // Query vendor risks grouped by risk level for the chart
        try {
          const riskLevelResult = await pluginContext.db.query(
            `SELECT risk_level, COUNT(*) as count FROM "${tenant}".vendorrisks GROUP BY risk_level ORDER BY count DESC`
          );

          // Map risk levels to colors (handle both formats: "High" and "High risk")
          const riskColors: Record<string, string> = {
            "Critical": "#dc2626",
            "Critical risk": "#dc2626",
            "High": "#ea580c",
            "High risk": "#ea580c",
            "Medium": "#ca8a04",
            "Medium risk": "#ca8a04",
            "Low": "#16a34a",
            "Low risk": "#16a34a",
            "Very Low": "#13715B",
            "Very low risk": "#13715B",
          };

          vendorRisksByLevel = riskLevelResult.rows.map((row: Record<string, unknown>) => ({
            name: String(row.risk_level || "Unknown"),
            value: Number(row.count || 0),
            color: riskColors[String(row.risk_level)] || "#6b7280",
          }));

          pluginContext.logger.info(`Vendor risks by level: ${JSON.stringify(vendorRisksByLevel)}`);
        } catch (e) {
          pluginContext.logger.warn("Could not query vendor risks by level");
        }

        try {
          // Users are in the public schema
          const usersResult = await pluginContext.db.query("SELECT COUNT(*) as total FROM public.users");
          totalUsers = Number(usersResult.rows[0]?.total ?? 0);
        } catch (e) {
          pluginContext.logger.warn("Could not query users table");
        }

        try {
          const incidentsResult = await pluginContext.db.query(`SELECT COUNT(*) as total FROM "${tenant}".ai_incident_managements`);
          totalIncidents = Number(incidentsResult.rows[0]?.total ?? 0);
        } catch (e) {
          pluginContext.logger.warn("Could not query ai_incident_managements table");
        }

        // Query incidents grouped by status for the chart
        try {
          const statusResult = await pluginContext.db.query(
            `SELECT status, COUNT(*) as count FROM "${tenant}".ai_incident_managements GROUP BY status ORDER BY count DESC`
          );

          // Map statuses to colors
          const statusColors: Record<string, string> = {
            "Open": "#ea580c",
            "In Progress": "#ca8a04",
            "Resolved": "#16a34a",
            "Closed": "#13715B",
            "Pending": "#2563eb",
          };

          incidentsByStatus = statusResult.rows.map((row: Record<string, unknown>) => ({
            name: String(row.status || "Unknown"),
            value: Number(row.count || 0),
            color: statusColors[String(row.status)] || "#6b7280",
          }));

          pluginContext.logger.info(`Incidents by status: ${JSON.stringify(incidentsByStatus)}`);
        } catch (e) {
          pluginContext.logger.warn("Could not query incidents by status");
        }

        try {
          const modelsResult = await pluginContext.db.query(`SELECT COUNT(*) as total FROM "${tenant}".model_inventories`);
          totalModels = Number(modelsResult.rows[0]?.total ?? 0);
          pluginContext.logger.info(`Models count: ${totalModels}`);
        } catch (e) {
          pluginContext.logger.debug("model_inventories table not available");
        }

        try {
          // Users are in the public schema, join with roles table to get role name
          const recentUsersResult = await pluginContext.db.query(
            `SELECT u.id, u.name, u.surname, u.email, r.name as role_name, u.created_at
             FROM public.users u
             LEFT JOIN public.roles r ON u.role_id = r.id
             ORDER BY u.created_at DESC NULLS LAST LIMIT 5`
          );
          pluginContext.logger.info(`Users query returned ${recentUsersResult.rows.length} rows`);
          userRows = recentUsersResult.rows.map((user: Record<string, unknown>, index: number) => ({
            id: String(user.id || index + 1),
            name: `${user.name || ""} ${user.surname || ""}`.trim() || "Unknown",
            email: String(user.email || "-"),
            role: String(user.role_name || "-"),
            joined: user.created_at
              ? new Date(user.created_at as string).toLocaleDateString()
              : "-",
          }));
        } catch (e) {
          const err = e as Error;
          pluginContext.logger.warn(`Could not query users for table: ${err.message}`);
        }

        // Return real data using structured slots
        res.json({
          success: true,
          data: {
            contentType: "slots",
            slots: [
              // Stats slot - real metrics from database
              {
                type: "stats",
                title: "System overview",
                data: {
                  items: [
                    {
                      label: "Use cases",
                      value: totalProjects,
                      trend: "neutral",
                    },
                    {
                      label: "Vendors",
                      value: totalVendors,
                      trend: "neutral",
                    },
                    {
                      label: "Vendor risks",
                      value: totalVendorRisks,
                      trend: totalVendorRisks > 10 ? "up" : "neutral",
                    },
                    {
                      label: "Users",
                      value: totalUsers,
                      trend: "neutral",
                    },
                    {
                      label: "Models",
                      value: totalModels,
                      trend: "neutral",
                    },
                    {
                      label: "Incidents",
                      value: totalIncidents,
                      trend: totalIncidents > 0 ? "up" : "neutral",
                    },
                  ],
                },
              },

              // Chart row - side by side charts (50% each, 16px gap)
              {
                type: "chart-row",
                data: {
                  gap: 16,
                  charts: [
                    {
                      title: "Vendor risks by level",
                      chartType: "bar",
                      chartData: vendorRisksByLevel,
                      chartHeight: 250,
                    },
                    {
                      title: "Incidents by status",
                      chartType: "donut",
                      chartData: incidentsByStatus,
                      chartHeight: 250,
                    },
                  ],
                },
              },

              // Table slot - recent projects
              {
                type: "table",
                title: "Recent use cases",
                data: {
                  columns: [
                    { key: "name", label: "Name" },
                    { key: "owner", label: "Owner" },
                    { key: "updated", label: "Last updated" },
                  ],
                  rows: projectRows.length > 0 ? projectRows : [
                    { id: "empty", name: "No use cases found", owner: "-", updated: "-" }
                  ],
                },
              },

              // Table slot - recent users
              {
                type: "table",
                title: "Recent users",
                data: {
                  columns: [
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "role", label: "Role" },
                    { key: "joined", label: "Joined" },
                  ],
                  rows: userRows.length > 0 ? userRows : [
                    { id: "empty", name: "No users found", email: "-", role: "-", joined: "-" }
                  ],
                },
              },

              // Text slot - description
              {
                type: "text",
                title: "About this page",
                data: {
                  content:
                    "This page displays real data from your VerifyWise database. " +
                    "It demonstrates how plugins can query and display live information " +
                    "using the empty-page template with structured slots.",
                },
              },
            ],
          },
        });
      } catch (error) {
        pluginContext?.logger.error("Failed to fetch page content", { error });
        res.status(500).json({
          success: false,
          error: "Failed to load page content",
        });
      }
    });
  },
};

export default samplePagePlugin;
