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
    console.error('Error fetching LLM API keys:', error);

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

    console.log(`LLM API key added for provider: ${provider} by user: ${authReq.userId}`);

    return res.status(201).json({
      success: true,
      message: 'API key added successfully',
      data: keyModel.toJSON(),
    });
  } catch (error: any) {
    console.error('Error adding LLM API key:', error);

    if (error instanceof ValidationException) {
      return res.status(400).json({
        success: false,
        message: error.message,
        field: error.metadata.field,
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
 * Get all decrypted LLM API keys for evaluations (internal endpoint)
 * 
 * This endpoint returns the actual decrypted API keys for use by the evaluation server.
 * Should only be accessible from internal services (localhost).
 * 
 * Query params:
 * - organizationId: number (required)
 */
export const getDecryptedKeys = async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.query.organizationId as string);

    if (!organizationId || isNaN(organizationId)) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    // Get all keys for the organization
    const keys = await EvaluationLlmApiKeyModel.findAll({
      where: { organization_id: organizationId },
    });

    // Build map of provider -> decrypted key
    const decryptedKeys: Record<string, string> = {};
    for (const key of keys) {
      try {
        decryptedKeys[key.provider] = key.getApiKey();
      } catch (err) {
        console.warn(`Failed to decrypt key for provider ${key.provider}:`, err);
      }
    }

    return res.status(200).json({
      success: true,
      data: decryptedKeys,
    });
  } catch (error: any) {
    console.error('Error fetching decrypted LLM API keys:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys',
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

    console.log(`LLM API key deleted for provider: ${provider} by user: ${authReq.userId}`);

    return res.status(200).json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting LLM API key:', error);

    if (error instanceof ValidationException) {
      return res.status(400).json({
        success: false,
        message: error.message,
        field: error.metadata.field,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete API key',
      error: error.message,
    });
  }
};
