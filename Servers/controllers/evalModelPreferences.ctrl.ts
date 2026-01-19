/**
 * Controller for Evaluation Model Preferences
 *
 * Handles saving and retrieving model/judge preferences for experiments.
 * Preferences are stored per project and auto-loaded when creating new experiments.
 *
 * Endpoints:
 * - GET /api/eval-model-preferences/:projectId - Get preferences for a project
 * - POST /api/eval-model-preferences - Save/update preferences
 * - DELETE /api/eval-model-preferences/:projectId - Clear preferences
 */

import { Request, Response } from 'express';
import { sequelize } from '../database/db';
import { logSuccess } from '../utils/logger/logHelper';

export interface ModelPreferences {
  id?: number;
  project_id: string;
  user_id?: number;
  // Model being evaluated
  model_name?: string;
  model_access_method?: string;
  model_endpoint_url?: string;
  // Judge LLM settings
  judge_provider?: string;
  judge_model?: string;
  judge_temperature?: number;
  judge_max_tokens?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Get model preferences for a project
 */
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.userId;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    // Try to find user-specific preferences first, then fall back to project-wide
    const [results] = await sequelize.query(`
      SELECT * FROM "${tenantId}".deepeval_model_preferences
      WHERE project_id = :projectId
      AND (user_id = :userId OR user_id IS NULL)
      ORDER BY user_id DESC NULLS LAST
      LIMIT 1;
    `, {
      replacements: { projectId, userId },
    });

    const preferences = (results as ModelPreferences[])[0] || null;

    return res.status(200).json({
      success: true,
      data: preferences ? {
        projectId: preferences.project_id,
        model: {
          name: preferences.model_name || '',
          accessMethod: preferences.model_access_method || '',
          endpointUrl: preferences.model_endpoint_url || '',
        },
        judgeLlm: {
          provider: preferences.judge_provider || '',
          model: preferences.judge_model || '',
          temperature: preferences.judge_temperature ?? 0.7,
          maxTokens: preferences.judge_max_tokens ?? 2048,
        },
        updatedAt: preferences.updated_at,
      } : null,
    });
  } catch (error: unknown) {
    console.error('Error fetching model preferences:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch model preferences',
      error: errorMessage,
    });
  }
};

/**
 * Save or update model preferences for a project
 */
export const savePreferences = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId;
    const { projectId, model, judgeLlm } = req.body;

    if (!projectId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    // Upsert: insert or update on conflict
    await sequelize.query(`
      INSERT INTO "${tenantId}".deepeval_model_preferences (
        project_id,
        user_id,
        model_name,
        model_access_method,
        model_endpoint_url,
        judge_provider,
        judge_model,
        judge_temperature,
        judge_max_tokens
      ) VALUES (
        :projectId,
        :userId,
        :modelName,
        :modelAccessMethod,
        :modelEndpointUrl,
        :judgeProvider,
        :judgeModel,
        :judgeTemperature,
        :judgeMaxTokens
      )
      ON CONFLICT (project_id, user_id)
      DO UPDATE SET
        model_name = EXCLUDED.model_name,
        model_access_method = EXCLUDED.model_access_method,
        model_endpoint_url = EXCLUDED.model_endpoint_url,
        judge_provider = EXCLUDED.judge_provider,
        judge_model = EXCLUDED.judge_model,
        judge_temperature = EXCLUDED.judge_temperature,
        judge_max_tokens = EXCLUDED.judge_max_tokens,
        updated_at = NOW();
    `, {
      replacements: {
        projectId,
        userId: userId || null,
        modelName: model?.name || null,
        modelAccessMethod: model?.accessMethod || null,
        modelEndpointUrl: model?.endpointUrl || null,
        judgeProvider: judgeLlm?.provider || null,
        judgeModel: judgeLlm?.model || null,
        judgeTemperature: judgeLlm?.temperature ?? 0.7,
        judgeMaxTokens: judgeLlm?.maxTokens ?? 2048,
      },
      transaction,
    });

    await logSuccess({
      eventType: 'Update',
      description: `Saved model preferences for project: ${projectId}`,
      functionName: 'savePreferences',
      fileName: 'evalModelPreferences.ctrl.ts',
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Model preferences saved successfully',
    });
  } catch (error: unknown) {
    console.error('Error saving model preferences:', error);
    await transaction.rollback();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      message: 'Failed to save model preferences',
      error: errorMessage,
    });
  }
};

/**
 * Delete model preferences for a project
 */
export const deletePreferences = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { projectId } = req.params;
    const tenantId = req.tenantId!;
    const userId = req.userId;

    if (!projectId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    await sequelize.query(`
      DELETE FROM "${tenantId}".deepeval_model_preferences
      WHERE project_id = :projectId
      AND (user_id = :userId OR user_id IS NULL);
    `, {
      replacements: { projectId, userId },
      transaction,
    });

    await logSuccess({
      eventType: 'Delete',
      description: `Deleted model preferences for project: ${projectId}`,
      functionName: 'deletePreferences',
      fileName: 'evalModelPreferences.ctrl.ts',
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Model preferences deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting model preferences:', error);
    await transaction.rollback();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      message: 'Failed to delete model preferences',
      error: errorMessage,
    });
  }
};
