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
import { LLMProvider } from '../domain.layer/models/evaluationLlmApiKey/evaluationLlmApiKey.model';
import { ValidationException } from '../domain.layer/exceptions/custom.exception';
import {
  getAllKeysForOrganizationQuery,
  createKeyQuery,
  getDecryptedKeysForOrganizationQuery,
  deleteKeyQuery,
} from '../utils/evaluationLlmApiKey.utils';
import { sequelize } from '../database/db';

/**
 * Get all LLM API keys for the authenticated user's organization
 *
 * Returns masked keys for security
 */
export const getAllKeys = async (req: Request, res: Response) => {
  try {
    const keys = await getAllKeysForOrganizationQuery(req.tenantId!);

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
  const transaction = await sequelize.transaction();
  try {
    const { provider, apiKey } = req.body;

    // Validate inputs
    if (!provider) {
      throw new ValidationException('Provider is required', 'provider', provider);
    }

    if (!apiKey) {
      throw new ValidationException('API key is required', 'apiKey', apiKey);
    }

    // Create key
    const keyData = await createKeyQuery(
      req.tenantId!,
      provider as LLMProvider,
      apiKey,
      transaction
    );

    console.log(`LLM API key added for provider: ${provider} by user: ${req.userId}`);

    await transaction.commit();
    return res.status(201).json({
      success: true,
      message: 'API key added successfully',
      data: keyData,
    });
  } catch (error: any) {
    console.error('Error adding LLM API key:', error);
    await transaction.rollback();
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
 * - tenantId: string (required)
 */
export const getDecryptedKeys = async (req: Request, res: Response) => {
  try {
    // Get all decrypted keys for the tenant
    const decryptedKeys = await getDecryptedKeysForOrganizationQuery(req.tenantId!);

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
    const { provider } = req.params;

    if (!provider) {
      throw new ValidationException('Provider is required', 'provider', provider);
    }

    const deleted = await deleteKeyQuery(
      req.tenantId!,
      provider as LLMProvider
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `No API key found for provider: ${provider}`,
      });
    }

    console.log(`LLM API key deleted for provider: ${provider} by user: ${req.userId}`);

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
