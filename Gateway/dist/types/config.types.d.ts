/**
 * Configuration types for the LLM Gateway
 * Based on the spec: docs/SPEC.md Section 14
 */
export interface Tenant {
    tenant_id: string;
    name: string;
}
export interface App {
    app_id: string;
    tenant_id: string;
    name: string;
}
export interface VirtualKey {
    key_id: string;
    key_value: string;
    tenant_id: string;
    app_id: string;
    active: boolean;
    allowed_routes: string[];
    rate_limit_profile_id: string;
    quota_profile_id: string;
}
export interface Provider {
    provider_id: string;
    type: 'openai' | 'azure_openai' | 'anthropic' | 'custom_http';
    base_url: string;
    api_key: string;
    deployment_name?: string;
    api_version?: string;
    version?: string;
    auth_header?: string;
    auth_value?: string;
}
export interface RouteTarget {
    provider_id: string;
    model: string;
    timeout_ms?: number;
}
export interface RetryConfig {
    max_retries: number;
    backoff_ms: number;
}
export interface Route {
    route_id: string;
    tenant_id: string;
    app_id: string;
    default: boolean;
    primary: RouteTarget;
    fallbacks: RouteTarget[];
    retry: RetryConfig;
}
export interface GuardrailRule {
    rule_id: string;
    type: 'pattern' | 'pii_detection' | 'category' | 'length';
    pattern?: string;
    category?: string;
    max_length?: number;
    action: 'allow' | 'block' | 'mask' | 'truncate' | 'flag_only';
}
export interface TenantGuardrails {
    input_rules: GuardrailRule[];
    output_rules: GuardrailRule[];
}
export interface RateLimitProfile {
    profile_id: string;
    window_seconds: number;
    max_requests: number;
}
export interface QuotaProfile {
    profile_id: string;
    window_seconds: number;
    max_total_tokens: number;
}
export interface LoggingConfig {
    mode: 'full' | 'redacted' | 'metadata';
}
export interface GatewaySettings {
    queue_max_events: number;
    queue_max_size_mb: number;
}
export interface ConfigSnapshot {
    version: string;
    generated_at: string;
    tenants: Tenant[];
    apps: App[];
    virtual_keys: VirtualKey[];
    providers: Provider[];
    routes: Route[];
    guardrails: Record<string, TenantGuardrails>;
    rate_limits: RateLimitProfile[];
    quotas: QuotaProfile[];
    logging: LoggingConfig;
    gateway_settings: GatewaySettings;
    checksum?: string;
}
export interface RequestContext {
    correlation_id: string;
    tenant_id: string;
    app_id: string;
    virtual_key: VirtualKey;
    rate_limit_profile: RateLimitProfile | null;
    quota_profile: QuotaProfile | null;
    start_time: number;
}
//# sourceMappingURL=config.types.d.ts.map