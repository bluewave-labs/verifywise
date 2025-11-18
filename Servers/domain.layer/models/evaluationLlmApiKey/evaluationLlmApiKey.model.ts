/**
 * @fileoverview Evaluation LLM API Key Model
 *
 * Manages encrypted storage of LLM provider API keys for running evaluations.
 * Each organization can store one API key per provider.
 *
 * Security Features:
 * - Automatic encryption/decryption of API keys
 * - Keys are never stored in plain text
 * - Unique constraint prevents duplicate providers per organization
 *
 * Supported Providers:
 * - openai: OpenAI GPT models
 * - anthropic: Anthropic Claude models
 * - google: Google Gemini models
 * - xai: xAI Grok models
 * - mistral: Mistral AI models
 * - huggingface: Hugging Face models
 *
 * @module domain.layer/models/evaluationLlmApiKey
 */

import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { OrganizationModel } from '../organization/organization.model';
import { encrypt, decrypt, maskApiKey } from '../../../utils/encryption.utils';
import { ValidationException } from '../../exceptions/custom.exception';

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'mistral' | 'huggingface';

export const VALID_PROVIDERS: LLMProvider[] = [
  'openai',
  'anthropic',
  'google',
  'xai',
  'mistral',
  'huggingface',
];

@Table({
  tableName: 'evaluation_llm_api_keys',
  timestamps: true,
  underscored: true,
})
export class EvaluationLlmApiKeyModel extends Model<EvaluationLlmApiKeyModel> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => OrganizationModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organization_id!: number;

  @BelongsTo(() => OrganizationModel)
  organization?: OrganizationModel;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  provider!: LLMProvider;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'encrypted_api_key',
  })
  private encrypted_api_key!: string;

  @Column({
    type: DataType.DATE,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
  })
  updated_at?: Date;

  /**
   * Set API key (encrypts automatically)
   */
  setApiKey(plainKey: string): void {
    if (!plainKey || plainKey.trim().length === 0) {
      throw new ValidationException('API key cannot be empty', 'apiKey', plainKey);
    }
    this.encrypted_api_key = encrypt(plainKey.trim());
  }

  /**
   * Get decrypted API key
   */
  getApiKey(): string {
    if (!this.encrypted_api_key) {
      throw new Error('No API key stored');
    }
    return decrypt(this.encrypted_api_key);
  }

  /**
   * Get masked API key for display
   */
  getMaskedKey(): string {
    try {
      const plainKey = this.getApiKey();
      return maskApiKey(plainKey);
    } catch {
      return '***';
    }
  }

  /**
   * Validate provider is supported
   */
  static validateProvider(provider: string): void {
    if (!VALID_PROVIDERS.includes(provider as LLMProvider)) {
      throw new ValidationException(
        `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
        'provider',
        provider
      );
    }
  }

  /**
   * Create a new LLM API key entry
   */
  static async createKey(
    organizationId: number,
    provider: LLMProvider,
    apiKey: string
  ): Promise<EvaluationLlmApiKeyModel> {
    // Validate inputs
    if (!organizationId || organizationId < 1) {
      throw new ValidationException('Valid organization ID is required', 'organizationId', organizationId);
    }

    this.validateProvider(provider);

    if (!apiKey || apiKey.trim().length === 0) {
      throw new ValidationException('API key cannot be empty', 'apiKey', apiKey);
    }

    // Check if key already exists for this provider
    const existing = await this.findOne({
      where: {
        organization_id: organizationId,
        provider,
      },
    });

    if (existing) {
      throw new ValidationException(
        `API key for provider '${provider}' already exists. Delete it first to add a new one.`,
        'provider',
        provider
      );
    }

    // Create new key
    const keyModel = new EvaluationLlmApiKeyModel();
    keyModel.organization_id = organizationId;
    keyModel.provider = provider;
    keyModel.setApiKey(apiKey);

    await keyModel.save();
    return keyModel;
  }

  /**
   * Get all API keys for an organization (returns masked keys)
   */
  static async getKeysForOrganization(organizationId: number): Promise<any[]> {
    if (!organizationId || organizationId < 1) {
      throw new ValidationException('Valid organization ID is required', 'organizationId', organizationId);
    }

    const keys = await this.findAll({
      where: { organization_id: organizationId },
      order: [['created_at', 'DESC']],
    });

    return keys.map(key => ({
      provider: key.provider,
      maskedKey: key.getMaskedKey(),
      createdAt: key.created_at,
      updatedAt: key.updated_at,
    }));
  }

  /**
   * Delete API key for a provider
   */
  static async deleteKey(organizationId: number, provider: LLMProvider): Promise<boolean> {
    if (!organizationId || organizationId < 1) {
      throw new ValidationException('Valid organization ID is required', 'organizationId', organizationId);
    }

    this.validateProvider(provider);

    const deleted = await this.destroy({
      where: {
        organization_id: organizationId,
        provider,
      },
    });

    return deleted > 0;
  }

  /**
   * Get decrypted API key for making LLM calls
   */
  static async getDecryptedKey(organizationId: number, provider: LLMProvider): Promise<string | null> {
    if (!organizationId || organizationId < 1) {
      throw new ValidationException('Valid organization ID is required', 'organizationId', organizationId);
    }

    this.validateProvider(provider);

    const keyModel = await this.findOne({
      where: {
        organization_id: organizationId,
        provider,
      },
    });

    if (!keyModel) {
      return null;
    }

    return keyModel.getApiKey();
  }

  /**
   * Convert to safe JSON (masks API key)
   */
  toJSON(): any {
    return {
      id: this.id,
      organizationId: this.organization_id,
      provider: this.provider,
      maskedKey: this.getMaskedKey(),
      createdAt: this.created_at,
      updatedAt: this.updated_at,
    };
  }
}
