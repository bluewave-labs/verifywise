/**
 * Routes for Evaluation LLM API Keys
 *
 * Provides endpoints for managing LLM provider API keys used in evaluations.
 *
 * All routes require authentication.
 */

import express from 'express';
import { getAllKeys, addKey, deleteKey } from '../controllers/evaluationLlmApiKey.ctrl';
import { authenticateJWT } from '../middleware/auth.middleware';

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

export default router;
