/**
 * Routes for Evaluation Model Preferences
 *
 * Provides endpoints for managing saved model/judge preferences for experiments.
 *
 * All routes require authentication.
 */

import express from 'express';
import { getPreferences, savePreferences, deletePreferences } from '../controllers/evalModelPreferences.ctrl';
import authenticateJWT from '../middleware/auth.middleware';

const router = express.Router();

/**
 * GET /api/eval-model-preferences/:projectId
 * Get saved model/judge preferences for a project
 */
router.get('/:projectId', authenticateJWT, getPreferences);

/**
 * POST /api/eval-model-preferences
 * Save or update model/judge preferences for a project
 *
 * Body:
 * - projectId: string (required)
 * - model: { name, accessMethod, endpointUrl }
 * - judgeLlm: { provider, model, temperature, maxTokens }
 */
router.post('/', authenticateJWT, savePreferences);

/**
 * DELETE /api/eval-model-preferences/:projectId
 * Clear saved preferences for a project
 */
router.delete('/:projectId', authenticateJWT, deletePreferences);

export default router;
