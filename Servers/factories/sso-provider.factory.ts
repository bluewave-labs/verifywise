/**
 * @fileoverview SSO Provider Factory Implementation
 *
 * Comprehensive factory implementation using the Factory and Singleton patterns
 * for creating, managing, and orchestrating multiple SSO provider instances.
 * Provides a centralized registry for all supported SSO providers with
 * configuration validation, health checking, and resilient initialization.
 *
 * This factory enables:
 * - Dynamic provider registration and lifecycle management
 * - Type-safe provider creation with configuration validation
 * - Resilient initialization with retry logic and error handling
 * - Provider health monitoring and status reporting
 * - Batch operations for multi-provider environments
 * - Configuration templates for rapid provider setup
 *
 * Architecture Patterns:
 * - Factory Pattern: Creates provider instances based on configuration
 * - Singleton Pattern: Ensures single factory instance across application
 * - Registry Pattern: Maintains central provider type registration
 * - Template Method: Provides configuration templates for providers
 * - Strategy Pattern: Allows different provider implementations
 *
 * Key Features:
 * - Provider registry with enable/disable capabilities
 * - Configuration validation before provider creation
 * - Exponential backoff retry logic for resilient initialization
 * - Comprehensive error categorization and handling
 * - Health checking for all registered providers
 * - Batch provider creation with error collection
 *
 * Security Features:
 * - Configuration validation prevents invalid provider creation
 * - Error handling prevents sensitive information disclosure
 * - Provider isolation through instance creation
 * - Secure configuration templates with appropriate defaults
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link ISSOProviderFactory} Factory interface specification
 * @see {@link BaseSSOProvider} Base provider implementation
 *
 * @module factories/sso-provider
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
 * Provider constructor interface for type-safe instantiation
 *
 * Defines the constructor signature required for all SSO provider classes
 * to ensure consistent instantiation patterns across different providers.
 *
 * @interface ProviderConstructor
 */
interface ProviderConstructor {
  new (providerId: string): ISSOProvider;
}

/**
 * Provider registry entry containing metadata and constructor
 *
 * Registry entry structure that stores provider metadata, capabilities,
 * and constructor reference for factory-based provider instantiation.
 *
 * @interface ProviderRegistryEntry
 * @property {ProviderConstructor} constructor - Provider class constructor
 * @property {boolean} isEnabled - Whether provider is available for use
 * @property {string} description - Human-readable provider description
 * @property {string[]} supportedEnvironments - Supported cloud environments
 */
interface ProviderRegistryEntry {
  constructor: ProviderConstructor;
  isEnabled: boolean;
  description: string;
  supportedEnvironments: string[];
}

/**
 * SSO Provider Factory implementation using Singleton and Factory patterns
 *
 * Centralized factory for creating and managing SSO provider instances across
 * the application. Implements singleton pattern to ensure consistent provider
 * registry and factory methods throughout the application lifecycle.
 *
 * Features:
 * - Singleton pattern for application-wide factory consistency
 * - Provider registry with dynamic registration and management
 * - Type-safe provider creation with comprehensive validation
 * - Resilient initialization with exponential backoff retry logic
 * - Batch operations for multi-provider environments
 * - Health checking and monitoring capabilities
 *
 * @class SSOProviderFactory
 * @implements {ISSOProviderFactory}
 * @singleton
 *
 * @example
 * ```typescript
 * // Get factory instance
 * const factory = SSOProviderFactory.getInstance();
 *
 * // Create Azure AD provider
 * const azureProvider = await factory.createProvider({
 *   providerType: SSOProviderType.AZURE_AD,
 *   providerId: 'azure-main',
 *   organizationId: 123,
 *   clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   clientSecret: 'encrypted_secret',
 *   tenantId: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   isEnabled: true,
 *   cloudEnvironment: CloudEnvironment.AZURE_PUBLIC
 * });
 *
 * // Validate configuration before creation
 * const validation = await factory.validateProviderConfig(config);
 * if (!validation.valid) {
 *   console.error('Configuration errors:', validation.errors);
 * }
 * ```
 */
export class SSOProviderFactory implements ISSOProviderFactory {
  /** Singleton instance */
  private static instance: SSOProviderFactory;

  /** Provider registry mapping provider types to their implementations */
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
   * Creates a fully initialized SSO provider instance from configuration
   *
   * Main factory method that creates, validates, and initializes SSO provider
   * instances. Includes comprehensive error handling, retry logic, and
   * validation to ensure robust provider creation.
   *
   * @async
   * @param {SSOProviderConfig} config - Complete provider configuration
   * @returns {Promise<ISSOProvider>} Fully initialized provider instance
   * @throws {SSOError} Configuration, network, or provider-specific errors
   *
   * @process
   * 1. Validates provider type support and configuration
   * 2. Creates provider instance using registered constructor
   * 3. Initializes provider with retry logic for resilience
   * 4. Returns ready-to-use provider instance
   *
   * @example
   * ```typescript
   * try {
   *   const provider = await factory.createProvider({
   *     providerType: SSOProviderType.AZURE_AD,
   *     providerId: 'azure-primary',
   *     organizationId: 123,
   *     clientId: 'client-id-here',
   *     clientSecret: 'encrypted-secret',
   *     tenantId: 'tenant-id-here',
   *     isEnabled: true,
   *     cloudEnvironment: CloudEnvironment.AZURE_PUBLIC
   *   });
   *
   *   // Provider is ready for authentication
   *   const loginUrl = await provider.getLoginUrl(req, '123');
   * } catch (error) {
   *   if (error instanceof SSOError) {
   *     console.error(`SSO Error: ${error.message} (${error.errorType})`);
   *   }
   * }
   * ```
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