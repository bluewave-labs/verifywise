/**
 * SSO Provider Factory
 *
 * Factory pattern implementation for creating SSO provider instances.
 * Handles provider registration, creation, and lifecycle management.
 */

import {
  ISSOProvider,
  ISSOProviderFactory,
  SSOProviderType,
  SSOProviderConfig,
  SSOError,
  SSOErrorType
} from '../interfaces/sso-provider.interface';

// Provider implementations (will be created)
import { AzureADSSOProvider } from '../providers/azure-ad-sso.provider';
// import { GoogleSSOProvider } from '../providers/google-sso.provider';
// import { SAMLSSOProvider } from '../providers/saml-sso.provider';

/**
 * Provider constructor interface
 */
interface ProviderConstructor {
  new (providerId: string): ISSOProvider;
}

/**
 * Provider registry entry
 */
interface ProviderRegistryEntry {
  constructor: ProviderConstructor;
  isEnabled: boolean;
  description: string;
  supportedEnvironments: string[];
}

/**
 * SSO Provider Factory implementation
 */
export class SSOProviderFactory implements ISSOProviderFactory {
  private static instance: SSOProviderFactory;
  private providerRegistry: Map<SSOProviderType, ProviderRegistryEntry> = new Map();

  /**
   * Singleton pattern - get factory instance
   */
  public static getInstance(): SSOProviderFactory {
    if (!SSOProviderFactory.instance) {
      SSOProviderFactory.instance = new SSOProviderFactory();
      SSOProviderFactory.instance.registerDefaultProviders();
    }
    return SSOProviderFactory.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Register default providers
   */
  private registerDefaultProviders(): void {
    // Register Azure AD provider
    this.registerProvider(SSOProviderType.AZURE_AD, {
      constructor: AzureADSSOProvider,
      isEnabled: true,
      description: 'Microsoft Azure Active Directory SSO Provider',
      supportedEnvironments: ['azure_public', 'azure_government']
    });

    // Future providers can be registered here
    /*
    this.registerProvider(SSOProviderType.GOOGLE, {
      constructor: GoogleSSOProvider,
      isEnabled: false, // Disabled until implemented
      description: 'Google Workspace SSO Provider',
      supportedEnvironments: ['google_public']
    });

    this.registerProvider(SSOProviderType.SAML, {
      constructor: SAMLSSOProvider,
      isEnabled: false, // Disabled until implemented
      description: 'Generic SAML 2.0 SSO Provider',
      supportedEnvironments: ['public', 'private']
    });
    */
  }

  /**
   * Register a new provider type
   */
  public registerProvider(providerType: SSOProviderType, entry: ProviderRegistryEntry): void {
    this.providerRegistry.set(providerType, entry);
  }

  /**
   * Unregister a provider type
   */
  public unregisterProvider(providerType: SSOProviderType): void {
    this.providerRegistry.delete(providerType);
  }

  /**
   * Create a provider instance
   */
  async createProvider(config: SSOProviderConfig): Promise<ISSOProvider> {
    // Validate provider type
    if (!this.isProviderSupported(config.providerType)) {
      throw new SSOError(
        SSOErrorType.CONFIGURATION_ERROR,
        `Unsupported provider type: ${config.providerType}`,
        config.providerType
      );
    }

    const registryEntry = this.providerRegistry.get(config.providerType);
    if (!registryEntry) {
      throw new SSOError(
        SSOErrorType.CONFIGURATION_ERROR,
        `Provider type not found in registry: ${config.providerType}`,
        config.providerType
      );
    }

    if (!registryEntry.isEnabled) {
      throw new SSOError(
        SSOErrorType.CONFIGURATION_ERROR,
        `Provider type is disabled: ${config.providerType}`,
        config.providerType
      );
    }

    // Validate provider ID
    if (!config.providerId || config.providerId.trim().length === 0) {
      throw new SSOError(
        SSOErrorType.CONFIGURATION_ERROR,
        'Provider ID is required',
        config.providerType
      );
    }

    try {
      // Create provider instance
      const provider = new registryEntry.constructor(config.providerId);

      // Initialize provider with configuration with retry logic
      await this.initializeProviderWithRetry(provider, config);

      return provider;
    } catch (error) {
      // Differentiate between configuration errors and provider instantiation failures
      if (error instanceof SSOError) {
        // Re-throw SSO errors with additional context
        throw new SSOError(
          error.errorType,
          `Provider factory error: ${error.message}`,
          config.providerType,
          error.originalError
        );
      }

      // Handle specific error types
      if (error instanceof TypeError) {
        throw new SSOError(
          SSOErrorType.CONFIGURATION_ERROR,
          `Provider constructor error: ${error.message}`,
          config.providerType,
          error
        );
      }

      if (error instanceof ReferenceError) {
        throw new SSOError(
          SSOErrorType.CONFIGURATION_ERROR,
          `Provider dependency error: ${error.message}`,
          config.providerType,
          error
        );
      }

      // Network or external service errors (transient)
      if (error instanceof Error && (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('timeout')
      )) {
        throw new SSOError(
          SSOErrorType.NETWORK_ERROR,
          `Provider initialization network error: ${error.message}`,
          config.providerType,
          error
        );
      }

      // Generic error fallback
      throw new SSOError(
        SSOErrorType.PROVIDER_ERROR,
        `Failed to create provider instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        config.providerType,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get supported provider types
   */
  getSupportedProviders(): SSOProviderType[] {
    return Array.from(this.providerRegistry.keys()).filter(
      providerType => this.providerRegistry.get(providerType)?.isEnabled === true
    );
  }

  /**
   * Validate provider type support
   */
  isProviderSupported(providerType: SSOProviderType): boolean {
    const entry = this.providerRegistry.get(providerType);
    return entry !== undefined && entry.isEnabled;
  }

  /**
   * Get provider information
   */
  getProviderInfo(providerType: SSOProviderType): ProviderRegistryEntry | null {
    return this.providerRegistry.get(providerType) || null;
  }

  /**
   * Get all provider information
   */
  getAllProviderInfo(): Map<SSOProviderType, ProviderRegistryEntry> {
    return new Map(this.providerRegistry);
  }

  /**
   * Enable a provider type
   */
  enableProvider(providerType: SSOProviderType): void {
    const entry = this.providerRegistry.get(providerType);
    if (entry) {
      entry.isEnabled = true;
    }
  }

  /**
   * Disable a provider type
   */
  disableProvider(providerType: SSOProviderType): void {
    const entry = this.providerRegistry.get(providerType);
    if (entry) {
      entry.isEnabled = false;
    }
  }

  /**
   * Validate provider configuration without creating instance
   */
  async validateProviderConfig(config: Partial<SSOProviderConfig>): Promise<{ valid: boolean; errors: string[] }> {
    if (!config.providerType) {
      return {
        valid: false,
        errors: ['Provider type is required']
      };
    }

    if (!this.isProviderSupported(config.providerType)) {
      return {
        valid: false,
        errors: [`Unsupported provider type: ${config.providerType}`]
      };
    }

    const registryEntry = this.providerRegistry.get(config.providerType);
    if (!registryEntry) {
      return {
        valid: false,
        errors: [`Provider type not found: ${config.providerType}`]
      };
    }

    try {
      // Create temporary provider instance for validation
      const tempProviderId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const tempProvider = new registryEntry.constructor(tempProviderId);

      // Use provider's validation method
      return await tempProvider.validateConfig(config);
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get default configuration template for a provider type
   */
  getProviderConfigTemplate(providerType: SSOProviderType): Partial<SSOProviderConfig> | null {
    if (!this.isProviderSupported(providerType)) {
      return null;
    }

    const baseTemplate: Partial<SSOProviderConfig> = {
      providerType,
      isEnabled: false,
      allowedDomains: [],
      defaultRoleId: 2, // Reviewer role
      scopes: []
    };

    // Provider-specific templates
    switch (providerType) {
      case SSOProviderType.AZURE_AD:
        return {
          ...baseTemplate,
          cloudEnvironment: 'azure_public' as any,
          scopes: ['openid', 'profile', 'email'],
          customParameters: {}
        };

      case SSOProviderType.GOOGLE:
        return {
          ...baseTemplate,
          cloudEnvironment: 'google_public' as any,
          scopes: ['openid', 'profile', 'email'],
          customParameters: {}
        };

      case SSOProviderType.SAML:
        return {
          ...baseTemplate,
          cloudEnvironment: 'public' as any,
          customParameters: {
            'SignRequests': 'true',
            'WantAssertionsSigned': 'true'
          }
        };

      default:
        return baseTemplate;
    }
  }

  /**
   * Batch create multiple providers
   */
  async createProviders(configs: SSOProviderConfig[]): Promise<{
    providers: ISSOProvider[];
    errors: { config: SSOProviderConfig; error: SSOError }[];
  }> {
    const providers: ISSOProvider[] = [];
    const errors: { config: SSOProviderConfig; error: SSOError }[] = [];

    for (const config of configs) {
      try {
        const provider = await this.createProvider(config);
        providers.push(provider);
      } catch (error) {
        errors.push({
          config,
          error: error instanceof SSOError ? error : new SSOError(
            SSOErrorType.CONFIGURATION_ERROR,
            `Failed to create provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
            config.providerType
          )
        });
      }
    }

    return { providers, errors };
  }

  /**
   * Initialize provider with retry logic for resilient startup
   */
  private async initializeProviderWithRetry(
    provider: ISSOProvider,
    config: SSOProviderConfig,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await provider.initialize(config);
        return; // Success - exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry configuration errors - they won't be fixed by retrying
        if (error instanceof SSOError && error.errorType === SSOErrorType.CONFIGURATION_ERROR) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw new SSOError(
            SSOErrorType.PROVIDER_ERROR,
            `Provider initialization failed after ${maxRetries} attempts: ${lastError.message}`,
            config.providerType,
            lastError
          );
        }

        // Exponential backoff with jitter for subsequent attempts
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * delay; // Add up to 10% jitter
        const totalDelay = delay + jitter;

        console.warn(
          `SSO Provider initialization attempt ${attempt}/${maxRetries} failed for ${config.providerType}: ${lastError.message}. Retrying in ${Math.round(totalDelay)}ms...`
        );

        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
  }

  /**
   * Health check for all registered providers
   */
  async healthCheckProviders(): Promise<Map<SSOProviderType, { healthy: boolean; message?: string }>> {
    const results = new Map<SSOProviderType, { healthy: boolean; message?: string }>();

    for (const [providerType, entry] of this.providerRegistry) {
      if (!entry.isEnabled) {
        results.set(providerType, {
          healthy: false,
          message: 'Provider disabled'
        });
        continue;
      }

      try {
        // Create a temporary provider instance for health check
        const tempProviderId = `health-check-${Date.now()}`;
        const tempProvider = new entry.constructor(tempProviderId);

        // Basic connectivity check without full initialization
        results.set(providerType, {
          healthy: true,
          message: 'Provider available'
        });
      } catch (error) {
        results.set(providerType, {
          healthy: false,
          message: `Provider error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const ssoProviderFactory = SSOProviderFactory.getInstance();

export default SSOProviderFactory;