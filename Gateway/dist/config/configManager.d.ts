/**
 * Config Manager - Loads and manages configuration snapshots
 * Based on spec: docs/SPEC.md Sections 4.4, 4.5, 5
 */
import { ConfigSnapshot, VirtualKey, Provider, Route, RateLimitProfile, QuotaProfile, TenantGuardrails } from '../types/config.types';
export declare class ConfigManager {
    private config;
    private configPath;
    private backupPath;
    private virtualKeyIndex;
    private providerIndex;
    private routeIndex;
    private rateLimitIndex;
    private quotaIndex;
    private defaultRouteIndex;
    constructor(configPath?: string);
    /**
     * Load config from disk on startup
     */
    load(): Promise<void>;
    /**
     * Push new config (called by /internal/config/push)
     */
    push(newConfig: unknown): Promise<{
        status: string;
        loaded_version: string;
    }>;
    /**
     * Validate cross-references in config
     */
    private validateReferences;
    /**
     * Build in-memory indexes for fast lookups
     */
    private buildIndexes;
    getConfig(): ConfigSnapshot | null;
    getVirtualKey(keyValue: string): VirtualKey | undefined;
    getProvider(providerId: string): Provider | undefined;
    getRoute(routeId: string): Route | undefined;
    getDefaultRoute(tenantId: string, appId: string): Route | undefined;
    getRateLimitProfile(profileId: string): RateLimitProfile | undefined;
    getQuotaProfile(profileId: string): QuotaProfile | undefined;
    getGuardrails(tenantId: string): TenantGuardrails | undefined;
    isLoaded(): boolean;
    getVersion(): string | null;
    getLoggingMode(): 'full' | 'redacted' | 'metadata';
    getGatewaySettings(): import("../types/config.types").GatewaySettings;
}
export declare const configManager: ConfigManager;
//# sourceMappingURL=configManager.d.ts.map