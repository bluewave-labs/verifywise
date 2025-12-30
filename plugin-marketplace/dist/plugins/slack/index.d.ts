/**
 * Slack Plugin for VerifyWise
 *
 * This plugin provides Slack integration for sending notifications
 * about AI model updates, risk assessments, and compliance changes.
 */
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
interface SlackConfig {
    routing_type?: string[];
}
/**
 * Install the Slack plugin
 * Enables OAuth-based Slack integration (uses existing /integrations/slack flow)
 */
export declare function install(_userId: number, _tenantId: string, _config: SlackConfig, _context: PluginContext): Promise<InstallResult>;
/**
 * Uninstall the Slack plugin
 * Called when a user uninstalls the plugin
 */
export declare function uninstall(userId: number, _tenantId: string, context: PluginContext): Promise<UninstallResult>;
/**
 * Configure the Slack plugin
 * Updates routing preferences for existing OAuth integrations
 */
export declare function configure(userId: number, _tenantId: string, config: SlackConfig, context: PluginContext): Promise<ConfigureResult>;
/**
 * Validate plugin configuration
 */
export declare function validateConfig(config: SlackConfig): ValidationResult;
/**
 * Test Slack connection
 * Checks if user has OAuth-connected Slack workspaces
 */
export declare function testConnection(_config: SlackConfig, context?: {
    sequelize: any;
    userId: number;
}): Promise<{
    success: boolean;
    message: string;
    testedAt: string;
}>;
/**
 * Send notification to Slack by routing type
 * Matches the existing slackNotificationService.sendSlackNotification
 * Uses the actual Slack Web API through encrypted tokens (OAuth-based)
 */
export declare function sendNotificationByRoutingType(userId: number, routingType: string, message: {
    title: string;
    message: string;
}, sequelize: any): Promise<void>;
/**
 * Send notification about control or policy changes
 * Uses the routing type to send to all configured Slack webhooks
 */
export declare function notifyControlPolicyChange(userId: number, changeData: {
    type: string;
    name: string;
    action: string;
    changedBy: string;
}, sequelize: any): Promise<void>;
/**
 * Send notification about evidence and task alerts
 * Uses the routing type to send to all configured Slack webhooks
 */
export declare function notifyEvidenceTaskAlert(userId: number, alertData: {
    type: string;
    name: string;
    status: string;
    assignedTo?: string;
    dueDate?: string;
}, sequelize: any): Promise<void>;
/**
 * Send notification about policy reminders and status
 * Uses the routing type to send to all configured Slack webhooks
 */
export declare function notifyPolicyReminderStatus(userId: number, policyData: {
    policyName: string;
    status: string;
    reminderType?: string;
    dueDate?: string;
}, sequelize: any): Promise<void>;
/**
 * Send notification about membership and roles
 * Uses the routing type to send to all configured Slack webhooks
 */
export declare function notifyMembershipRoles(userId: number, memberData: {
    action: string;
    userName: string;
    role?: string;
    teamName?: string;
    changedBy: string;
}, sequelize: any): Promise<void>;
/**
 * Send notification about projects and organizations
 * Uses the routing type to send to all configured Slack webhooks
 */
export declare function notifyProjectOrganization(userId: number, projectData: {
    type: string;
    name: string;
    action: string;
    owner?: string;
    status?: string;
}, sequelize: any): Promise<void>;
export declare const metadata: PluginMetadata;
export {};
//# sourceMappingURL=index.d.ts.map