/**
 * Routes for Evaluation LLM API Keys
 *
 * Provides endpoints for managing LLM provider API keys used in evaluations.
 *
 * All routes require authentication.
 */

import express from 'express';
import { getAllKeys, addKey, deleteKey, getDecryptedKeys } from '../controllers/evaluationLlmApiKey.ctrl';
import authenticateJWT from '../middleware/auth.middleware';

/**
 * Middleware to restrict access to internal services only (localhost)
 * For production, this should also check for an internal API key
 */
const internalOnly = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost');
  
  // In development, allow all requests; in production, require localhost
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev || isLocalhost) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'This endpoint is only accessible from internal services',
  });
};

const router = express.Router();

/**
 * GET /api/evaluation-llm-keys
 * Get all LLM API keys for the authenticated user's organization
 * Returns masked keys for security
 */
router.get('/', authenticateJWT, getAllKeys);

/**
 * POST /api/evaluation-llm-keys
 * Add a new LLM API key
 *
 * Body:
 * - provider: string (openai, anthropic, google, xai, mistral, huggingface)
 * - apiKey: string (will be encrypted before storage)
 */
router.post('/', authenticateJWT, addKey);

/**
 * DELETE /api/evaluation-llm-keys/:provider
 * Delete an LLM API key
 *
 * Params:
 * - provider: string (openai, anthropic, google, xai, mistral, huggingface)
 */
router.delete('/:provider', authenticateJWT, deleteKey);

/**
 * GET /api/evaluation-llm-keys/internal/decrypted
 * Get all decrypted API keys for an organization (internal endpoint)
 * Used by the evaluation server to get actual API keys for LLM calls
 *
 * Query:
 * - organizationId: number (required)
 *
 * Note: This endpoint is restricted to internal services (localhost in production)
 */
router.get('/internal/decrypted', internalOnly, getDecryptedKeys);

export default router;
