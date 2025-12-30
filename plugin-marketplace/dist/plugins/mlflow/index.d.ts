/**
 * MLflow Plugin for VerifyWise
 *
 * This plugin provides MLflow integration for tracking and managing
 * machine learning experiments, models, and deployments.
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
interface TestConnectionResult {
    success: boolean;
    message: string;
    serverVersion: string;
    testedAt: string;
}
interface SyncResult {
    success: boolean;
    modelCount: number;
    syncedAt: string;
    status: string;
}
interface MLflowConfig {
    tracking_server_url?: string;
    auth_method?: 'none' | 'basic' | 'token';
    username?: string;
    password?: string;
    api_token?: string;
    verify_ssl?: boolean;
    timeout?: number;
}
/**
 * Install the MLflow plugin
 * Called when a user installs the plugin
 * Creates mlflow_model_records table (matches existing integration)
 */
export declare function install(_userId: number, tenantId: string, config: MLflowConfig, context: PluginContext): Promise<InstallResult>;
/**
 * Uninstall the MLflow plugin
 * Called when a user uninstalls the plugin
 * Drops mlflow_model_records table
 */
export declare function uninstall(_userId: number, tenantId: string, context: PluginContext): Promise<UninstallResult>;
/**
 * Configure the MLflow plugin
 * Called when a user saves plugin configuration
 * Configuration is stored in plugin_installations.configuration by PluginService
 */
export declare function configure(_userId: number, tenantId: string, config: MLflowConfig, context: PluginContext): Promise<ConfigureResult>;
/**
 * Validate plugin configuration
 * Matches the validation from MLflow integration service
 */
export declare function validateConfig(config: MLflowConfig): ValidationResult;
/**
 * Test connection to MLflow server
 */
export declare function testConnection(config: MLflowConfig): Promise<TestConnectionResult>;
/**
 * Sync models from MLflow server
 * Matches the logic from MLFlowService.getModels()
 * Fetches experiments and runs, transforms runs into models
 */
export declare function syncModels(tenantId: string, config: MLflowConfig, context: PluginContext): Promise<SyncResult>;
export declare const metadata: PluginMetadata;
export {};
//# sourceMappingURL=index.d.ts.map