/**
 * Authentication Middleware - Virtual Key validation
 * Based on spec: docs/SPEC.md Sections 4.1, 4.2, 4.3
 */
import { Request, Response, NextFunction } from 'express';
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Update quota usage after a request
 * Called from llm.routes.ts after successful completion
 */
export declare function updateQuotaUsage(keyId: string, tokens: number, windowSeconds: number): boolean;
/**
 * Check if quota would be exceeded
 */
export declare function checkQuota(keyId: string, profile: {
    max_total_tokens: number;
    window_seconds: number;
}): {
    allowed: boolean;
    currentTokens: number;
    remaining: number;
};
//# sourceMappingURL=auth.middleware.d.ts.map