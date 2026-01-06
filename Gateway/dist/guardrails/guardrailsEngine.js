"use strict";
/**
 * Guardrails Engine - Evaluates input/output against guardrail rules
 * Supports pattern (regex) matching and length limits
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateGuardrails = evaluateGuardrails;
exports.evaluateInputGuardrails = evaluateInputGuardrails;
exports.evaluateOutputGuardrails = evaluateOutputGuardrails;
exports.applyInputGuardrails = applyInputGuardrails;
// Cache compiled regex patterns for performance
const regexCache = new Map();
/**
 * Get or compile a regex pattern
 */
function getRegex(pattern) {
    if (regexCache.has(pattern)) {
        return regexCache.get(pattern);
    }
    try {
        const regex = new RegExp(pattern, 'gi');
        regexCache.set(pattern, regex);
        return regex;
    }
    catch (error) {
        console.error(`Invalid regex pattern: ${pattern}`, error);
        return null;
    }
}
/**
 * Apply mask action - replace matched content with ***
 */
function applyMask(content, pattern) {
    const regex = getRegex(pattern);
    if (!regex)
        return content;
    // Reset regex lastIndex for global patterns
    regex.lastIndex = 0;
    return content.replace(regex, '***');
}
/**
 * Apply truncate action - cut content at max length
 */
function applyTruncate(content, maxLength) {
    if (content.length <= maxLength)
        return content;
    return content.substring(0, maxLength) + '...';
}
/**
 * Evaluate a single rule against content
 */
function evaluateRule(content, rule) {
    if (rule.type === 'pattern' && rule.pattern) {
        const regex = getRegex(rule.pattern);
        if (!regex) {
            return { matched: false };
        }
        // Reset regex lastIndex for global patterns
        regex.lastIndex = 0;
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
            return {
                matched: true,
                match: {
                    rule_id: rule.rule_id,
                    type: 'pattern',
                    action: rule.action,
                    matched_content: matches[0],
                    pattern: rule.pattern,
                },
            };
        }
    }
    else if (rule.type === 'length' && rule.max_length !== undefined) {
        if (content.length > rule.max_length) {
            return {
                matched: true,
                match: {
                    rule_id: rule.rule_id,
                    type: 'length',
                    action: rule.action,
                    content_length: content.length,
                    max_length: rule.max_length,
                },
            };
        }
    }
    return { matched: false };
}
/**
 * Evaluate content against a set of guardrail rules
 */
function evaluateGuardrails(content, rules) {
    const result = {
        allowed: true,
        original_content: content,
        modified_content: content,
        triggered_rules: [],
        actions_taken: [],
    };
    if (!rules || rules.length === 0) {
        return result;
    }
    let modifiedContent = content;
    for (const rule of rules) {
        const evaluation = evaluateRule(modifiedContent, rule);
        if (evaluation.matched && evaluation.match) {
            result.triggered_rules.push(evaluation.match);
            switch (rule.action) {
                case 'block':
                    result.allowed = false;
                    result.actions_taken.push(`blocked:${rule.rule_id}`);
                    // Stop processing on block - return immediately
                    return result;
                case 'mask':
                    if (rule.type === 'pattern' && rule.pattern) {
                        modifiedContent = applyMask(modifiedContent, rule.pattern);
                        result.actions_taken.push(`masked:${rule.rule_id}`);
                    }
                    break;
                case 'truncate':
                    if (rule.type === 'length' && rule.max_length !== undefined) {
                        modifiedContent = applyTruncate(modifiedContent, rule.max_length);
                        result.actions_taken.push(`truncated:${rule.rule_id}`);
                    }
                    break;
                case 'flag_only':
                    // Just record the match, don't modify content
                    result.actions_taken.push(`flagged:${rule.rule_id}`);
                    break;
                case 'allow':
                    // Explicitly allowed - no action needed
                    break;
            }
        }
    }
    result.modified_content = modifiedContent;
    return result;
}
/**
 * Evaluate input messages against input guardrails
 * Returns evaluation for the combined message content
 */
function evaluateInputGuardrails(messages, guardrails) {
    if (!guardrails || !guardrails.input_rules || guardrails.input_rules.length === 0) {
        const combinedContent = messages.map(m => m.content).join('\n');
        return {
            allowed: true,
            original_content: combinedContent,
            modified_content: combinedContent,
            triggered_rules: [],
            actions_taken: [],
        };
    }
    // Evaluate each message's content
    const results = [];
    for (const message of messages) {
        const result = evaluateGuardrails(message.content, guardrails.input_rules);
        results.push(result);
        // If any message is blocked, return immediately
        if (!result.allowed) {
            return {
                allowed: false,
                original_content: message.content,
                modified_content: result.modified_content,
                triggered_rules: result.triggered_rules,
                actions_taken: result.actions_taken,
            };
        }
    }
    // Combine results
    const combinedOriginal = messages.map(m => m.content).join('\n');
    const combinedModified = results.map(r => r.modified_content || r.original_content).join('\n');
    const allTriggered = results.flatMap(r => r.triggered_rules);
    const allActions = results.flatMap(r => r.actions_taken);
    return {
        allowed: true,
        original_content: combinedOriginal,
        modified_content: combinedModified,
        triggered_rules: allTriggered,
        actions_taken: allActions,
    };
}
/**
 * Evaluate output content against output guardrails
 */
function evaluateOutputGuardrails(content, guardrails) {
    if (!guardrails || !guardrails.output_rules || guardrails.output_rules.length === 0) {
        return {
            allowed: true,
            original_content: content,
            modified_content: content,
            triggered_rules: [],
            actions_taken: [],
        };
    }
    return evaluateGuardrails(content, guardrails.output_rules);
}
/**
 * Apply guardrail modifications to messages
 * Returns modified messages array
 */
function applyInputGuardrails(messages, guardrails) {
    if (!guardrails || !guardrails.input_rules || guardrails.input_rules.length === 0) {
        const combinedContent = messages.map(m => m.content).join('\n');
        return {
            messages,
            result: {
                allowed: true,
                original_content: combinedContent,
                modified_content: combinedContent,
                triggered_rules: [],
                actions_taken: [],
            },
        };
    }
    const modifiedMessages = [];
    const allTriggered = [];
    const allActions = [];
    for (const message of messages) {
        const result = evaluateGuardrails(message.content, guardrails.input_rules);
        if (!result.allowed) {
            // Blocked - return immediately
            return {
                messages: [],
                result: {
                    allowed: false,
                    original_content: message.content,
                    modified_content: result.modified_content,
                    triggered_rules: result.triggered_rules,
                    actions_taken: result.actions_taken,
                },
            };
        }
        modifiedMessages.push({
            role: message.role,
            content: result.modified_content || message.content,
        });
        allTriggered.push(...result.triggered_rules);
        allActions.push(...result.actions_taken);
    }
    const combinedOriginal = messages.map(m => m.content).join('\n');
    const combinedModified = modifiedMessages.map(m => m.content).join('\n');
    return {
        messages: modifiedMessages,
        result: {
            allowed: true,
            original_content: combinedOriginal,
            modified_content: combinedModified,
            triggered_rules: allTriggered,
            actions_taken: allActions,
        },
    };
}
//# sourceMappingURL=guardrailsEngine.js.map