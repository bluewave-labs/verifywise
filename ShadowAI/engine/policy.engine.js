"use strict";
/**
 * Policy Engine - Evaluates Shadow AI events against active policies
 * and generates violation records when rules are triggered.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEngine = void 0;
class PolicyEngine {
    /**
     * Evaluate a single event against all active policies.
     */
    evaluate(event, policies) {
        const activePolicies = policies.filter((p) => p.is_active);
        const violations = [];
        for (const policy of activePolicies) {
            // Check department scope
            if (policy.department_scope && policy.department_scope.length > 0) {
                if (!event.department || !policy.department_scope.includes(event.department)) {
                    continue; // Policy doesn't apply to this department
                }
            }
            // Evaluate rules
            if (this.evaluateRuleGroup(event, policy.rules)) {
                violations.push({
                    event_id: event.id,
                    policy_id: policy.id,
                    user_identifier: event.user_identifier,
                    department: event.department,
                    severity: policy.severity,
                    description: `Policy "${policy.name}" violated: ${this.generateViolationDescription(event, policy)}`,
                    status: "open",
                });
            }
        }
        return {
            violations,
            policies_evaluated: activePolicies.length,
            policies_triggered: violations.length,
        };
    }
    /**
     * Evaluate a batch of events against all active policies.
     */
    evaluateBatch(events, policies) {
        const allViolations = [];
        let totalTriggered = 0;
        for (const event of events) {
            const result = this.evaluate(event, policies);
            allViolations.push(...result.violations);
            totalTriggered += result.policies_triggered;
        }
        return {
            violations: allViolations,
            policies_evaluated: policies.filter((p) => p.is_active).length,
            policies_triggered: totalTriggered,
        };
    }
    /**
     * Evaluate a rule group (AND/OR logic).
     */
    evaluateRuleGroup(event, ruleGroup) {
        if (!ruleGroup.rules || ruleGroup.rules.length === 0)
            return false;
        if (ruleGroup.logic === "AND") {
            return ruleGroup.rules.every((rule) => this.evaluateRule(event, rule));
        }
        else {
            return ruleGroup.rules.some((rule) => this.evaluateRule(event, rule));
        }
    }
    /**
     * Evaluate a single rule against an event.
     */
    evaluateRule(event, rule) {
        const eventValue = this.getEventFieldValue(event, rule.field);
        if (eventValue === undefined || eventValue === null)
            return false;
        const eventStr = String(eventValue).toLowerCase();
        switch (rule.operator) {
            case "equals":
                return eventStr === String(rule.value).toLowerCase();
            case "not_equals":
                return eventStr !== String(rule.value).toLowerCase();
            case "contains":
                return eventStr.includes(String(rule.value).toLowerCase());
            case "in":
                if (Array.isArray(rule.value)) {
                    return rule.value.map((v) => v.toLowerCase()).includes(eventStr);
                }
                return false;
            case "not_in":
                if (Array.isArray(rule.value)) {
                    return !rule.value.map((v) => v.toLowerCase()).includes(eventStr);
                }
                return true;
            case "matches":
                try {
                    const regex = new RegExp(String(rule.value), "i");
                    return regex.test(eventStr);
                }
                catch (_a) {
                    return false;
                }
            default:
                return false;
        }
    }
    /**
     * Get the value of a field from an event.
     */
    getEventFieldValue(event, field) {
        switch (field) {
            case "ai_tool_name":
                return event.ai_tool_name;
            case "ai_tool_category":
                return event.ai_tool_category;
            case "action_type":
                return event.action_type;
            case "data_classification":
                return event.data_classification;
            case "destination_url":
                return event.destination_url;
            case "user_identifier":
                return event.user_identifier;
            default:
                return undefined;
        }
    }
    /**
     * Generate a human-readable violation description.
     */
    generateViolationDescription(event, policy) {
        const parts = [];
        if (event.user_identifier) {
            parts.push(`User "${event.user_identifier}"`);
        }
        if (event.department) {
            parts.push(`from department "${event.department}"`);
        }
        parts.push(`performed "${event.action_type}" on "${event.ai_tool_name}"`);
        if (event.data_classification && event.data_classification !== "unknown") {
            parts.push(`involving ${event.data_classification} data`);
        }
        return parts.join(" ");
    }
}
exports.PolicyEngine = PolicyEngine;
