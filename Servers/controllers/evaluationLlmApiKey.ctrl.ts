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
import { logSuccess } from '../utils/logger/logHelper';

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
 * - provider: string (openai, anthropic, google, xai, mistral, huggingface, bedrock)
 * - apiKey: string (plain text - will be encrypted)
 * - region: string (optional for bedrock - AWS region)
 * 
 * AWS Bedrock-specific fields:
 * - authMethod: 'iam_role' | 'api_key' | 'access_keys'
 * - roleArn: string (for iam_role method)
 * - externalId: string (optional, for iam_role method)
 * - accessKeyId: string (for access_keys method)
 * - secretAccessKey: string (for access_keys method)
 */
export const addKey = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      provider,
      apiKey,
      region,
      authMethod,
      roleArn,
      externalId,
      accessKeyId,
      secretAccessKey
    } = req.body;

    // Validate inputs
    if (!provider) {
      throw new ValidationException('Provider is required', 'provider', provider);
    }

    // Bedrock validation based on auth method
    if (provider === 'bedrock') {
      if (!authMethod) {
        throw new ValidationException('Authentication method is required for Bedrock', 'authMethod', authMethod);
      }
      if (authMethod === 'iam_role' && !roleArn) {
        throw new ValidationException('IAM Role ARN is required', 'roleArn', roleArn);
      }
      if (authMethod === 'api_key' && !apiKey) {
        throw new ValidationException('Bedrock API key is required', 'apiKey', '[REDACTED]');
      }
      if (authMethod === 'access_keys') {
        if (!accessKeyId) {
          throw new ValidationException('AWS Access Key ID is required', 'accessKeyId', '[REDACTED]');
        }
        if (!secretAccessKey) {
          throw new ValidationException('AWS Secret Access Key is required', 'secretAccessKey', '[REDACTED]');
        }
      }
    } else if (!apiKey) {
      throw new ValidationException('API key is required', 'apiKey', '[REDACTED]');
    }

    // Create key with all Bedrock-specific fields
    const keyData = await createKeyQuery(
      req.tenantId!,
      provider as LLMProvider,
      apiKey,
      transaction,
      region,
      authMethod,
      roleArn,
      externalId,
      accessKeyId,
      secretAccessKey
    );

    await logSuccess({
      eventType: 'Create',
      description: `Added LLM API key for provider: ${provider} by user: ${req.userId}`,
      functionName: 'addKey',
      fileName: 'evaluationLlmApiKey.ctrl.ts',
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

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
 * Verify an LLM API key by making a test call to the provider
 *
 * This endpoint allows the frontend to verify API keys without CORS issues.
 * The backend makes the request to the provider API on behalf of the client.
 *
 * Request body:
 * - provider: string (openai, anthropic, google, xai, mistral, huggingface, openrouter)
 * - apiKey: string (plain text API key to verify)
 */
export const verifyKey = async (req: Request, res: Response) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Provider is required',
      });
    }

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'API key is required',
      });
    }

    // Provider-specific verification endpoints
    const endpoints: Record<string, { url: string; headers: Record<string, string>; method?: string }> = {
      openai: {
        url: 'https://api.openai.com/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      anthropic: {
        url: 'https://api.anthropic.com/v1/models',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
      google: {
        url: `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
        headers: {},
      },
      xai: {
        url: 'https://api.x.ai/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      mistral: {
        url: 'https://api.mistral.ai/v1/models',
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      huggingface: {
        url: 'https://huggingface.co/api/whoami',
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      openrouter: {
        url: 'https://openrouter.ai/api/v1/auth/key',
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    };

    const config = endpoints[provider];
    if (!config) {
      // For Bedrock, validate the Bearer token format
      if (provider === 'bedrock') {
        const isValidFormat = /^(ABSK|bedrock-api-key-)[A-Za-z0-9+/=_-]{20,}$/.test(apiKey);
        return res.status(200).json({
          success: true,
          valid: isValidFormat,
          message: isValidFormat
            ? 'Bedrock API key format is valid'
            : 'Invalid Bedrock API key format. Should start with "ABSK" (long-term) or "bedrock-api-key-" (short-term).',
        });
      }
      // Unknown provider, skip verification
      return res.status(200).json({
        success: true,
        valid: true,
        message: 'Provider not configured for verification, assuming valid',
      });
    }

    try {
      const response = await fetch(config.url, {
        method: config.method || 'GET',
        headers: {
          ...config.headers,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return res.status(200).json({
          success: true,
          valid: true,
          message: 'API key verified successfully',
        });
      } else if (response.status === 401 || response.status === 403) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Invalid API key - authentication failed',
        });
      } else if (response.status === 400) {
        let errorMsg = 'Invalid API key';
        try {
          const data = await response.json();
          errorMsg = data?.error?.message || data?.message || errorMsg;
        } catch {
          // Ignore JSON parse errors
        }
        return res.status(200).json({
          success: true,
          valid: false,
          message: errorMsg,
        });
      } else if (response.status === 429) {
        // Rate limited - key might be valid
        return res.status(200).json({
          success: true,
          valid: true,
          message: 'Rate limited, but key appears valid',
        });
      } else {
        // Other errors - give benefit of doubt
        console.warn('API key verification got status', response.status, 'for provider:', provider);
        return res.status(200).json({
          success: true,
          valid: true,
          message: 'Could not verify key, assuming valid',
        });
      }
    } catch (fetchError: any) {
      console.error('Error verifying API key for provider:', provider, '-', fetchError.message);
      // Network errors - give benefit of doubt
      return res.status(200).json({
        success: true,
        valid: true,
        message: 'Network error during verification, assuming valid',
      });
    }
  } catch (error: any) {
    console.error('Error in verifyKey controller:', error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Failed to verify API key',
      error: error.message,
    });
  }
};

/**
 * Get available AWS Bedrock models for the user
 * 
 * Uses the user's stored Bedrock credentials to fetch available inference profiles
 * from AWS Bedrock API. This allows dynamic model discovery instead of hardcoded lists.
 * 
 * Returns an array of models with id, name, and description
 */
export const getBedrockModels = async (req: Request, res: Response) => {
  try {
    // Get the user's Bedrock credentials
    const decryptedKeys = await getDecryptedKeysForOrganizationQuery(req.tenantId!);

    const authMethod = decryptedKeys['bedrock_auth_method'];
    const region = decryptedKeys['bedrock_region'] || 'us-east-1';

    if (!authMethod) {
      return res.status(400).json({
        success: false,
        message: 'Bedrock credentials not configured. Please add Bedrock API credentials in Settings.',
        models: [],
      });
    }

    // Dynamically import AWS SDK
    let BedrockClient: any, ListInferenceProfilesCommand: any;
    try {
      const bedrockModule = await import('@aws-sdk/client-bedrock');
      BedrockClient = bedrockModule.BedrockClient;
      ListInferenceProfilesCommand = bedrockModule.ListInferenceProfilesCommand;
    } catch {
      return res.status(500).json({
        success: false,
        message: 'AWS SDK not installed. Run: npm install @aws-sdk/client-bedrock',
        models: [],
      });
    }

    let client: any;

    // Configure AWS client based on auth method
    if (authMethod === 'api_key') {
      // Bearer token authentication - need to use custom fetch with Authorization header
      // AWS SDK doesn't directly support bearer tokens, so we'll use direct HTTP call
      const apiKey = decryptedKeys['bedrock'];
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: 'Bedrock API key not found',
          models: [],
        });
      }

      // Use fetch directly for bearer token auth
      const response = await fetch(
        `https://bedrock.${region}.amazonaws.com/inference-profiles?maxResults=100`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bedrock API error:', response.status, errorText);
        return res.status(response.status).json({
          success: false,
          message: `Bedrock API error: ${response.status}`,
          models: [],
        });
      }

      const data = await response.json();
      const models = (data.inferenceProfileSummaries || []).map((profile: any) => ({
        id: profile.inferenceProfileId,
        name: profile.inferenceProfileName || profile.inferenceProfileId,
        description: profile.description || `${profile.type || 'Inference'} profile`,
        status: profile.status,
        type: profile.type,
      }));

      return res.status(200).json({
        success: true,
        models,
        region,
      });

    } else if (authMethod === 'iam_role') {
      // IAM Role (AssumeRole) authentication
      const roleArn = decryptedKeys['bedrock_role_arn'];
      const externalId = decryptedKeys['bedrock_external_id'];

      if (!roleArn) {
        return res.status(400).json({
          success: false,
          message: 'IAM Role ARN not configured',
          models: [],
        });
      }

      // First assume the role
      const { STSClient, AssumeRoleCommand } = await import('@aws-sdk/client-sts');
      const stsClient = new STSClient({ region });

      const assumeRoleParams: any = {
        RoleArn: roleArn,
        RoleSessionName: 'VerifyWiseBedrockModels',
        DurationSeconds: 900, // 15 minutes
      };
      if (externalId) {
        assumeRoleParams.ExternalId = externalId;
      }

      const assumeRoleResponse = await stsClient.send(new AssumeRoleCommand(assumeRoleParams));
      const credentials = assumeRoleResponse.Credentials;

      if (!credentials) {
        return res.status(500).json({
          success: false,
          message: 'Failed to assume IAM role',
          models: [],
        });
      }

      client = new BedrockClient({
        region,
        credentials: {
          accessKeyId: credentials.AccessKeyId!,
          secretAccessKey: credentials.SecretAccessKey!,
          sessionToken: credentials.SessionToken,
        },
      });

    } else if (authMethod === 'access_keys') {
      // AWS Access Keys authentication
      const accessKeyId = decryptedKeys['bedrock_access_key_id'];
      const secretAccessKey = decryptedKeys['bedrock_secret_access_key'];

      if (!accessKeyId || !secretAccessKey) {
        return res.status(400).json({
          success: false,
          message: 'AWS Access Keys not configured',
          models: [],
        });
      }

      client = new BedrockClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }

    // If we have an SDK client (IAM role or access keys), use it
    if (client) {
      const command = new ListInferenceProfilesCommand({
        maxResults: 100,
      });

      const response = await client.send(command);

      const models = (response.inferenceProfileSummaries || []).map((profile: any) => ({
        id: profile.inferenceProfileId,
        name: profile.inferenceProfileName || profile.inferenceProfileId,
        description: profile.description || `${profile.type || 'Inference'} profile`,
        status: profile.status,
        type: profile.type,
      }));

      return res.status(200).json({
        success: true,
        models,
        region,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid Bedrock authentication method',
      models: [],
    });

  } catch (error: any) {
    console.error('Error fetching Bedrock models:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Bedrock models',
      models: [],
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

    logSuccess({
      eventType: 'Delete',
      description: `LLM API key deleted for provider: ${provider} by user: ${req.userId}`,
      functionName: 'deleteKey',
      fileName: 'evaluationLlmApiKey.ctrl.ts',
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

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
