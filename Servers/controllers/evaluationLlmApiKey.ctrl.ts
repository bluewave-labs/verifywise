/**
 * Controller for Evaluation LLM API Keys
 *
 * Handles CRUD operations for LLM provider API keys used in evaluations.
 *
 * Endpoints:
 * - GET /api/evaluation-llm-keys - Get all keys for organization
 * - POST /api/evaluation-llm-keys - Add new API key
 * - DELETE /api/evaluation-llm-keys/:provider - Delete API key
 */

import { Request, Response } from 'express';
import { EvaluationLlmApiKeyModel, LLMProvider } from '../domain.layer/models/evaluationLlmApiKey/evaluationLlmApiKey.model';
import { ValidationException } from '../domain.layer/exceptions/custom.exception';
import { logEngine } from './logEngine.ctrl';

// Extend Request type to include auth properties
interface AuthenticatedRequest extends Request {
  userId?: number;
  role?: string;
  tenantId?: string;
  organizationId?: number;
}

/**
 * Get all LLM API keys for the authenticated user's organization
 *
 * Returns masked keys for security
 */
export const getAllKeys = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const organizationId = authReq.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Organization ID not found in authentication context',
      });
    }

    const keys = await EvaluationLlmApiKeyModel.getKeysForOrganization(organizationId);

    return res.status(200).json({
      success: true,
      data: keys,
    });
  } catch (error: any) {
    logEngine({
      type: 'error',
      message: `Error fetching LLM API keys: ${error.message}`,
      user: (req as AuthenticatedRequest).userId?.toString(),
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys',
      error: error.message,
    });
  }
};

/**
 * Add a new LLM API key
 *
 * Request body:
 * - provider: string (openai, anthropic, google, xai, mistral, huggingface)
 * - apiKey: string (plain text - will be encrypted)
 */
export const addKey = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const organizationId = authReq.organizationId;
    const { provider, apiKey } = req.body;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Organization ID not found in authentication context',
      });
    }

    // Validate inputs
    if (!provider) {
      throw new ValidationException('Provider is required', 'provider', provider);
    }

    if (!apiKey) {
      throw new ValidationException('API key is required', 'apiKey', apiKey);
    }

    // Create key
    const keyModel = await EvaluationLlmApiKeyModel.createKey(
      organizationId,
      provider as LLMProvider,
      apiKey
    );

    logEngine({
      type: 'info',
      message: `LLM API key added for provider: ${provider}`,
      user: (req as AuthenticatedRequest).userId?.toString(),
    });

    return res.status(201).json({
      success: true,
      message: 'API key added successfully',
      data: keyModel.toJSON(),
    });
  } catch (error: any) {
    logEngine({
      type: 'error',
      message: `Error adding LLM API key: ${error.message}`,
      user: (req as AuthenticatedRequest).userId?.toString(),
    });

    if (error instanceof ValidationException) {
      return res.status(400).json({
        success: false,
        message: error.message,
        field: error.field,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to add API key',
      error: error.message,
    });
  }
};

/**
 * Delete an LLM API key
 *
 * URL params:
 * - provider: string (openai, anthropic, google, xai, mistral, huggingface)
 */
export const deleteKey = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const organizationId = authReq.organizationId;
    const { provider } = req.params;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Organization ID not found in authentication context',
      });
    }

    if (!provider) {
      throw new ValidationException('Provider is required', 'provider', provider);
    }

    const deleted = await EvaluationLlmApiKeyModel.deleteKey(
      organizationId,
      provider as LLMProvider
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `No API key found for provider: ${provider}`,
      });
    }

    logEngine({
      type: 'info',
      message: `LLM API key deleted for provider: ${provider}`,
      user: (req as AuthenticatedRequest).userId?.toString(),
    });

    return res.status(200).json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error: any) {
    logEngine({
      type: 'error',
      message: `Error deleting LLM API key: ${error.message}`,
      user: (req as AuthenticatedRequest).userId?.toString(),
    });

    if (error instanceof ValidationException) {
      return res.status(400).json({
        success: false,
        message: error.message,
        field: error.field,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete API key',
      error: error.message,
    });
  }
};
