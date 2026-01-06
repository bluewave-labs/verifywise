"use strict";
/**
 * Config Manager - Loads and manages configuration snapshots
 * Based on spec: docs/SPEC.md Sections 4.4, 4.5, 5
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configManager = exports.ConfigManager = void 0;
const fs_1 = __importDefault(require("fs"));
const zod_1 = require("zod");
// Zod schemas for validation
const TenantSchema = zod_1.z.object({
    tenant_id: zod_1.z.string(),
    name: zod_1.z.string(),
});
const AppSchema = zod_1.z.object({
    app_id: zod_1.z.string(),
    tenant_id: zod_1.z.string(),
    name: zod_1.z.string(),
});
const VirtualKeySchema = zod_1.z.object({
    key_id: zod_1.z.string(),
    key_value: zod_1.z.string(),
    tenant_id: zod_1.z.string(),
    app_id: zod_1.z.string(),
    active: zod_1.z.boolean(),
    allowed_routes: zod_1.z.array(zod_1.z.string()),
    rate_limit_profile_id: zod_1.z.string(),
    quota_profile_id: zod_1.z.string(),
});
const ProviderSchema = zod_1.z.object({
    provider_id: zod_1.z.string(),
    type: zod_1.z.enum(['openai', 'azure_openai', 'anthropic', 'custom_http']),
    base_url: zod_1.z.string(),
    api_key: zod_1.z.string(),
    deployment_name: zod_1.z.string().optional(),
    api_version: zod_1.z.string().optional(),
    version: zod_1.z.string().optional(),
    auth_header: zod_1.z.string().optional(),
    auth_value: zod_1.z.string().optional(),
});
const RouteTargetSchema = zod_1.z.object({
    provider_id: zod_1.z.string(),
    model: zod_1.z.string(),
    timeout_ms: zod_1.z.number().optional(),
});
const RouteSchema = zod_1.z.object({
    route_id: zod_1.z.string(),
    tenant_id: zod_1.z.string(),
    app_id: zod_1.z.string(),
    default: zod_1.z.boolean(),
    primary: RouteTargetSchema,
    fallbacks: zod_1.z.array(RouteTargetSchema),
    retry: zod_1.z.object({
        max_retries: zod_1.z.number(),
        backoff_ms: zod_1.z.number(),
    }),
});
const GuardrailRuleSchema = zod_1.z.object({
    rule_id: zod_1.z.string(),
    type: zod_1.z.enum(['pattern', 'length']),
    pattern: zod_1.z.string().optional(),
    max_length: zod_1.z.number().optional(),
    action: zod_1.z.enum(['allow', 'block', 'mask', 'truncate', 'flag_only']),
});
const TenantGuardrailsSchema = zod_1.z.object({
    input_rules: zod_1.z.array(GuardrailRuleSchema),
    output_rules: zod_1.z.array(GuardrailRuleSchema),
});
const RateLimitProfileSchema = zod_1.z.object({
    profile_id: zod_1.z.string(),
    window_seconds: zod_1.z.number(),
    max_requests: zod_1.z.number(),
});
const QuotaProfileSchema = zod_1.z.object({
    profile_id: zod_1.z.string(),
    window_seconds: zod_1.z.number(),
    max_total_tokens: zod_1.z.number(),
});
const ConfigSnapshotSchema = zod_1.z.object({
    version: zod_1.z.string(),
    generated_at: zod_1.z.string(),
    tenants: zod_1.z.array(TenantSchema),
    apps: zod_1.z.array(AppSchema),
    virtual_keys: zod_1.z.array(VirtualKeySchema),
    providers: zod_1.z.array(ProviderSchema),
    routes: zod_1.z.array(RouteSchema),
    guardrails: zod_1.z.record(TenantGuardrailsSchema),
    rate_limits: zod_1.z.array(RateLimitProfileSchema),
    quotas: zod_1.z.array(QuotaProfileSchema),
    logging: zod_1.z.object({
        mode: zod_1.z.enum(['full', 'redacted', 'metadata']),
    }),
    gateway_settings: zod_1.z.object({
        queue_max_events: zod_1.z.number(),
        queue_max_size_mb: zod_1.z.number(),
    }),
    checksum: zod_1.z.string().optional(),
});
class ConfigManager {
    constructor(configPath) {
        this.config = null;
        // In-memory indexes for fast lookups
        this.virtualKeyIndex = new Map();
        this.providerIndex = new Map();
        this.routeIndex = new Map();
        this.rateLimitIndex = new Map();
        this.quotaIndex = new Map();
        this.defaultRouteIndex = new Map(); // key: tenant_id:app_id
        // Mutex to prevent concurrent config updates
        this.pushLock = Promise.resolve();
        this.pushLockRelease = null;
        this.configPath = configPath || process.env.CONFIG_PATH || './data/config.json';
        this.backupPath = this.configPath + '.bak';
    }
    /**
     * Acquire lock for config push operations
     */
    async acquirePushLock() {
        // Wait for any existing operation to complete
        await this.pushLock;
        // Create a new lock
        this.pushLock = new Promise((resolve) => {
            this.pushLockRelease = resolve;
        });
    }
    /**
     * Release the push lock
     */
    releasePushLock() {
        if (this.pushLockRelease) {
            this.pushLockRelease();
            this.pushLockRelease = null;
        }
    }
    /**
     * Load config from disk on startup
     */
    async load() {
        try {
            if (!fs_1.default.existsSync(this.configPath)) {
                console.warn(`Config file not found at ${this.configPath}. Gateway will start in safe mode.`);
                return;
            }
            const rawConfig = fs_1.default.readFileSync(this.configPath, 'utf-8');
            const parsed = JSON.parse(rawConfig);
            // Validate
            const validated = ConfigSnapshotSchema.parse(parsed);
            // Cross-reference validation
            this.validateReferences(validated);
            // Build indexes
            this.buildIndexes(validated);
            this.config = validated;
            console.log(`Config loaded: version=${validated.version}, generated_at=${validated.generated_at}`);
        }
        catch (error) {
            console.error('Failed to load config:', error);
            // Try backup
            if (fs_1.default.existsSync(this.backupPath)) {
                console.log('Attempting to load backup config...');
                try {
                    const backupRaw = fs_1.default.readFileSync(this.backupPath, 'utf-8');
                    const backupParsed = JSON.parse(backupRaw);
                    const validated = ConfigSnapshotSchema.parse(backupParsed);
                    this.validateReferences(validated);
                    this.buildIndexes(validated);
                    this.config = validated;
                    console.log('Backup config loaded successfully');
                }
                catch (backupError) {
                    console.error('Backup config also failed:', backupError);
                    throw new Error('Both primary and backup configs failed to load');
                }
            }
            else {
                throw error;
            }
        }
    }
    /**
     * Push new config (called by /internal/config/push)
     * Uses mutex to prevent race conditions from concurrent pushes
     */
    async push(newConfig) {
        // Acquire lock to prevent concurrent config updates
        await this.acquirePushLock();
        try {
            // Validate
            const validated = ConfigSnapshotSchema.parse(newConfig);
            // Cross-reference validation
            this.validateReferences(validated);
            // Write to temp file
            const tempPath = this.configPath + '.tmp';
            fs_1.default.writeFileSync(tempPath, JSON.stringify(validated, null, 2));
            // Backup current config
            if (fs_1.default.existsSync(this.configPath)) {
                fs_1.default.copyFileSync(this.configPath, this.backupPath);
            }
            // Atomic rename
            fs_1.default.renameSync(tempPath, this.configPath);
            // Build indexes and update in-memory config
            this.buildIndexes(validated);
            this.config = validated;
            console.log(`Config updated: version=${validated.version}`);
            return {
                status: 'ok',
                loaded_version: validated.version,
            };
        }
        finally {
            // Always release the lock
            this.releasePushLock();
        }
    }
    /**
     * Validate cross-references in config
     */
    validateReferences(config) {
        const tenantIds = new Set(config.tenants.map(t => t.tenant_id));
        const appIds = new Set(config.apps.map(a => a.app_id));
        const providerIds = new Set(config.providers.map(p => p.provider_id));
        const routeIds = new Set(config.routes.map(r => r.route_id));
        const rateLimitIds = new Set(config.rate_limits.map(r => r.profile_id));
        const quotaIds = new Set(config.quotas.map(q => q.profile_id));
        // Check apps reference valid tenants
        for (const app of config.apps) {
            if (!tenantIds.has(app.tenant_id)) {
                throw new Error(`App ${app.app_id} references unknown tenant ${app.tenant_id}`);
            }
        }
        // Check virtual keys
        const keyValues = new Set();
        for (const vk of config.virtual_keys) {
            if (keyValues.has(vk.key_value)) {
                throw new Error(`Duplicate virtual key value found`);
            }
            keyValues.add(vk.key_value);
            if (!tenantIds.has(vk.tenant_id)) {
                throw new Error(`Virtual key ${vk.key_id} references unknown tenant ${vk.tenant_id}`);
            }
            if (!appIds.has(vk.app_id)) {
                throw new Error(`Virtual key ${vk.key_id} references unknown app ${vk.app_id}`);
            }
            for (const routeId of vk.allowed_routes) {
                if (!routeIds.has(routeId)) {
                    throw new Error(`Virtual key ${vk.key_id} references unknown route ${routeId}`);
                }
            }
            if (!rateLimitIds.has(vk.rate_limit_profile_id)) {
                throw new Error(`Virtual key ${vk.key_id} references unknown rate limit profile ${vk.rate_limit_profile_id}`);
            }
            if (!quotaIds.has(vk.quota_profile_id)) {
                throw new Error(`Virtual key ${vk.key_id} references unknown quota profile ${vk.quota_profile_id}`);
            }
        }
        // Check routes reference valid providers
        for (const route of config.routes) {
            if (!providerIds.has(route.primary.provider_id)) {
                throw new Error(`Route ${route.route_id} references unknown provider ${route.primary.provider_id}`);
            }
            for (const fallback of route.fallbacks) {
                if (!providerIds.has(fallback.provider_id)) {
                    throw new Error(`Route ${route.route_id} fallback references unknown provider ${fallback.provider_id}`);
                }
            }
        }
    }
    /**
     * Build in-memory indexes for fast lookups
     */
    buildIndexes(config) {
        this.virtualKeyIndex.clear();
        this.providerIndex.clear();
        this.routeIndex.clear();
        this.rateLimitIndex.clear();
        this.quotaIndex.clear();
        this.defaultRouteIndex.clear();
        for (const vk of config.virtual_keys) {
            this.virtualKeyIndex.set(vk.key_value, vk);
        }
        for (const provider of config.providers) {
            this.providerIndex.set(provider.provider_id, provider);
        }
        for (const route of config.routes) {
            this.routeIndex.set(route.route_id, route);
            if (route.default) {
                this.defaultRouteIndex.set(`${route.tenant_id}:${route.app_id}`, route);
            }
        }
        for (const rl of config.rate_limits) {
            this.rateLimitIndex.set(rl.profile_id, rl);
        }
        for (const q of config.quotas) {
            this.quotaIndex.set(q.profile_id, q);
        }
    }
    // Getters
    getConfig() {
        return this.config;
    }
    getVirtualKey(keyValue) {
        return this.virtualKeyIndex.get(keyValue);
    }
    getProvider(providerId) {
        return this.providerIndex.get(providerId);
    }
    getRoute(routeId) {
        return this.routeIndex.get(routeId);
    }
    getDefaultRoute(tenantId, appId) {
        return this.defaultRouteIndex.get(`${tenantId}:${appId}`);
    }
    getRateLimitProfile(profileId) {
        return this.rateLimitIndex.get(profileId);
    }
    getQuotaProfile(profileId) {
        return this.quotaIndex.get(profileId);
    }
    getGuardrails(tenantId) {
        return this.config?.guardrails[tenantId];
    }
    isLoaded() {
        return this.config !== null;
    }
    getVersion() {
        return this.config?.version || null;
    }
    getLoggingMode() {
        return this.config?.logging.mode || 'metadata';
    }
    getGatewaySettings() {
        return this.config?.gateway_settings || { queue_max_events: 50000, queue_max_size_mb: 512 };
    }
}
exports.ConfigManager = ConfigManager;
// Singleton instance
exports.configManager = new ConfigManager();
//# sourceMappingURL=configManager.js.map