/**
 * Event types for the LLM Gateway logging
 * Based on the spec: docs/SPEC.md Sections 3.2, 7
 */
export type EventType = 'request_received' | 'vendor_request_sent' | 'vendor_response_received' | 'vendor_stream_started' | 'vendor_stream_completed' | 'vendor_retry_attempt' | 'vendor_timeout' | 'vendor_error_occurred' | 'request_completed' | 'request_failed' | 'policy_violation' | 'guardrail_evaluated' | 'fallback_executed' | 'rate_limit_exceeded' | 'quota_exceeded' | 'auth_failed' | 'config_loaded' | 'queue_overflow' | 'internal_error';
export type Decision = 'allowed' | 'blocked' | 'fallback_success' | 'throttled' | 'error';
export type ViolationType = 'input_guardrail' | 'output_guardrail' | 'rate_limit' | 'quota' | 'model_not_allowed' | 'route_not_allowed';
export interface BaseEvent {
    event_id: string;
    correlation_id: string;
    event_type: EventType;
    timestamp: string;
    gateway_id: string;
    tenant_id: string;
    app_id: string;
}
export interface RequestReceivedEvent extends BaseEvent {
    event_type: 'request_received';
    payload: {
        route_hint?: string;
        model_hint?: string;
        metadata?: Record<string, unknown>;
    };
}
export interface VendorRequestSentEvent extends BaseEvent {
    event_type: 'vendor_request_sent';
    payload: {
        provider_id: string;
        model: string;
        route_id: string;
    };
}
export interface VendorResponseReceivedEvent extends BaseEvent {
    event_type: 'vendor_response_received';
    payload: {
        provider_id: string;
        model: string;
        status_code: number;
        latency_ms: number;
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        finish_reason?: string;
    };
}
export interface RequestCompletedEvent extends BaseEvent {
    event_type: 'request_completed';
    payload: {
        decision: Decision;
        route_id: string;
        provider_id: string;
        model: string;
        request_timestamp: string;
        response_timestamp: string;
        latency_ms: number;
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        violation_type?: ViolationType;
    };
}
export interface PolicyViolationEvent extends BaseEvent {
    event_type: 'policy_violation';
    payload: {
        violation_type: ViolationType;
        rule_id?: string;
        profile_id?: string;
        severity: 'low' | 'medium' | 'high';
        action_taken: 'blocked' | 'masked' | 'truncated' | 'flagged';
    };
}
export interface GuardrailEvaluatedEvent extends BaseEvent {
    event_type: 'guardrail_evaluated';
    payload: {
        type: 'input' | 'output';
        applied_rules: string[];
        triggered_rules: string[];
        actions_taken: string[];
    };
}
export interface FallbackExecutedEvent extends BaseEvent {
    event_type: 'fallback_executed';
    payload: {
        from_provider_id: string;
        to_provider_id: string;
        from_model: string;
        to_model: string;
        reason: string;
    };
}
export interface RateLimitExceededEvent extends BaseEvent {
    event_type: 'rate_limit_exceeded';
    payload: {
        profile_id: string;
        current_count: number;
        max_requests: number;
        window_seconds: number;
    };
}
export interface AuthFailedEvent extends BaseEvent {
    event_type: 'auth_failed';
    payload: {
        reason: string;
    };
}
export interface VendorErrorEvent extends BaseEvent {
    event_type: 'vendor_error_occurred';
    payload: {
        provider_id: string;
        model: string;
        error_code: string;
        status_code?: number;
        message: string;
    };
}
export interface RequestFailedEvent extends BaseEvent {
    event_type: 'request_failed';
    payload: {
        error_code: string;
        message: string;
    };
}
export interface VendorRetryAttemptEvent extends BaseEvent {
    event_type: 'vendor_retry_attempt';
    payload: {
        provider_id: string;
        model: string;
        retry_count: number;
        reason: string;
    };
}
export interface InternalErrorEvent extends BaseEvent {
    event_type: 'internal_error';
    payload: {
        error_code: string;
        message: string;
    };
}
export type GatewayEvent = RequestReceivedEvent | VendorRequestSentEvent | VendorResponseReceivedEvent | RequestCompletedEvent | PolicyViolationEvent | GuardrailEvaluatedEvent | FallbackExecutedEvent | RateLimitExceededEvent | AuthFailedEvent | VendorErrorEvent | RequestFailedEvent | VendorRetryAttemptEvent | InternalErrorEvent;
export interface QueuedEvent {
    id?: number;
    correlation_id: string;
    event_type: EventType;
    payload: string;
    created_at: number;
    last_attempt_at?: number;
    retry_count: number;
    sent: boolean;
    sent_at?: number;
}
//# sourceMappingURL=events.types.d.ts.map