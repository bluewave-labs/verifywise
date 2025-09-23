/**
 * Model Inventory specific validation utilities
 * Contains validation schemas and functions specifically for model inventory operations
 */

import {
  validateString,
  validateNumber,
  validateEnum,
  validateDate,
  validateForeignKey,
  validateSchema,
  ValidationResult,
  ValidationError
} from './validation.utils';

/**
 * Validation constants for model inventories
 */
export const MODEL_INVENTORY_VALIDATION_LIMITS = {
  PROVIDER_MODEL: { MIN: 2, MAX: 255 },
  PROVIDER: { MIN: 2, MAX: 100 },
  MODEL: { MIN: 2, MAX: 100 },
  VERSION: { MIN: 1, MAX: 50 },
  APPROVER: { MIN: 2, MAX: 100 },
  CAPABILITIES: { MIN: 10, MAX: 2000 },
  SECURITY_ASSESSMENT: { MIN: 10, MAX: 2000 }
} as const;

/**
 * Model inventory status enum values
 */
export const MODEL_INVENTORY_STATUS_ENUM = [
  'Development',
  'Testing',
  'Staging',
  'Production',
  'Deprecated',
  'Archived',
  'Under Review',
  'Approved',
  'Rejected'
] as const;

/**
 * AI model provider enum values
 */
export const MODEL_PROVIDER_ENUM = [
  'OpenAI',
  'Anthropic',
  'Google',
  'Microsoft',
  'Amazon',
  'Meta',
  'Hugging Face',
  'Cohere',
  'Stability AI',
  'Mistral AI',
  'Internal',
  'Custom',
  'Other'
] as const;

/**
 * Validates provider model field
 */
export const validateProviderModel = (value: any): ValidationResult => {
  return validateString(value, 'Provider model', {
    required: true,
    minLength: MODEL_INVENTORY_VALIDATION_LIMITS.PROVIDER_MODEL.MIN,
    maxLength: MODEL_INVENTORY_VALIDATION_LIMITS.PROVIDER_MODEL.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates provider field
 */
export const validateProvider = (value: any): ValidationResult => {
  return validateString(value, 'Provider', {
    required: true,
    minLength: MODEL_INVENTORY_VALIDATION_LIMITS.PROVIDER.MIN,
    maxLength: MODEL_INVENTORY_VALIDATION_LIMITS.PROVIDER.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates model field
 */
export const validateModel = (value: any): ValidationResult => {
  return validateString(value, 'Model', {
    required: true,
    minLength: MODEL_INVENTORY_VALIDATION_LIMITS.MODEL.MIN,
    maxLength: MODEL_INVENTORY_VALIDATION_LIMITS.MODEL.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates version field
 */
export const validateVersion = (value: any): ValidationResult => {
  return validateString(value, 'Version', {
    required: true,
    minLength: MODEL_INVENTORY_VALIDATION_LIMITS.VERSION.MIN,
    maxLength: MODEL_INVENTORY_VALIDATION_LIMITS.VERSION.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates approver field
 */
export const validateApprover = (value: any): ValidationResult => {
  return validateString(value, 'Approver', {
    required: true,
    minLength: MODEL_INVENTORY_VALIDATION_LIMITS.APPROVER.MIN,
    maxLength: MODEL_INVENTORY_VALIDATION_LIMITS.APPROVER.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates capabilities field
 */
export const validateCapabilities = (value: any): ValidationResult => {
  return validateString(value, 'Capabilities', {
    required: true,
    minLength: MODEL_INVENTORY_VALIDATION_LIMITS.CAPABILITIES.MIN,
    maxLength: MODEL_INVENTORY_VALIDATION_LIMITS.CAPABILITIES.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates security assessment field
 */
export const validateSecurityAssessment = (value: any): ValidationResult => {
  return validateString(value, 'Security assessment', {
    required: true,
    minLength: MODEL_INVENTORY_VALIDATION_LIMITS.SECURITY_ASSESSMENT.MIN,
    maxLength: MODEL_INVENTORY_VALIDATION_LIMITS.SECURITY_ASSESSMENT.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates model inventory status field
 */
export const validateModelInventoryStatus = (value: any): ValidationResult => {
  return validateEnum(value, 'Model inventory status', MODEL_INVENTORY_STATUS_ENUM, true);
};

/**
 * Validates status date field
 */
export const validateStatusDate = (value: any): ValidationResult => {
  return validateDate(value, 'Status date', { required: true });
};

/**
 * Validates is demo field
 */
export const validateIsDemo = (value: any): ValidationResult => {
  // Custom boolean validation since validateBoolean is not available
  if (value === undefined || value === null) {
    return {
      isValid: false,
      message: 'Is demo is required',
      code: 'REQUIRED_FIELD'
    };
  }

  if (typeof value !== 'boolean') {
    return {
      isValid: false,
      message: 'Is demo must be a boolean value',
      code: 'INVALID_TYPE'
    };
  }

  return { isValid: true };
};

/**
 * Validates model inventory ID parameter
 */
export const validateModelInventoryIdParam = (id: any): ValidationResult => {
  return validateForeignKey(id, 'Model inventory ID', true);
};

/**
 * Validation schema for creating a new model inventory
 */
export const createModelInventorySchema = {
  provider_model: validateProviderModel,
  provider: validateProvider,
  model: validateModel,
  version: validateVersion,
  approver: validateApprover,
  capabilities: validateCapabilities,
  security_assessment: validateSecurityAssessment,
  status: validateModelInventoryStatus,
  status_date: validateStatusDate,
  is_demo: validateIsDemo
};

/**
 * Validation schema for updating a model inventory
 * All fields are required for updates based on the controller logic
 */
export const updateModelInventorySchema = {
  provider_model: validateProviderModel,
  provider: validateProvider,
  model: validateModel,
  version: validateVersion,
  approver: validateApprover,
  capabilities: validateCapabilities,
  security_assessment: validateSecurityAssessment,
  status: validateModelInventoryStatus,
  status_date: validateStatusDate,
  is_demo: validateIsDemo
};

/**
 * Validates a complete model inventory object for creation
 */
export const validateCompleteModelInventory = (data: any): ValidationError[] => {
  return validateSchema(data, createModelInventorySchema);
};

/**
 * Validates a model inventory object for updates
 */
export const validateUpdateModelInventory = (data: any): ValidationError[] => {
  return validateSchema(data, updateModelInventorySchema);
};

/**
 * Business rule validation for model inventory creation
 */
export const validateModelInventoryCreationBusinessRules = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate version format (should follow semantic versioning)
  if (data.version) {
    const versionPattern = /^v?\d+(\.\d+)*(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/;
    if (!versionPattern.test(data.version)) {
      errors.push({
        field: 'version',
        message: 'Version should follow semantic versioning format (e.g., "1.0.0", "v2.1.3", "1.0.0-beta")',
        code: 'INVALID_VERSION_FORMAT'
      });
    }
  }

  // Validate provider and model consistency
  if (data.provider && data.model) {
    const providerModelCombinations = {
      'OpenAI': ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'dall-e', 'whisper', 'text-embedding'],
      'Anthropic': ['claude-3', 'claude-2', 'claude-instant'],
      'Google': ['gemini', 'palm', 'bard', 'vertex-ai'],
      'Microsoft': ['copilot', 'azure-openai'],
      'Amazon': ['bedrock', 'sagemaker'],
      'Meta': ['llama', 'llama-2'],
      'Hugging Face': ['transformers', 'diffusers'],
      'Stability AI': ['stable-diffusion'],
      'Mistral AI': ['mistral-7b', 'mistral-8x7b']
    };

    const validModels = providerModelCombinations[data.provider as keyof typeof providerModelCombinations];
    if (validModels && !validModels.some(validModel =>
      data.model.toLowerCase().includes(validModel.toLowerCase())
    )) {
      errors.push({
        field: 'model',
        message: `Model "${data.model}" may not be associated with provider "${data.provider}". Please verify this combination.`,
        code: 'PROVIDER_MODEL_MISMATCH'
      });
    }
  }

  // Validate status transitions for new models
  if (data.status) {
    const validInitialStatuses = ['Development', 'Under Review'];
    if (!validInitialStatuses.includes(data.status)) {
      errors.push({
        field: 'status',
        message: 'New model inventory items should start with "Development" or "Under Review" status',
        code: 'INVALID_INITIAL_STATUS'
      });
    }
  }

  // Validate security assessment requirements for production models
  if (data.status === 'Production' && data.security_assessment) {
    if (data.security_assessment.length < 100) {
      errors.push({
        field: 'security_assessment',
        message: 'Production models require comprehensive security assessment (minimum 100 characters)',
        code: 'INSUFFICIENT_SECURITY_ASSESSMENT'
      });
    }
  }

  // Validate capabilities description
  if (data.capabilities) {
    const requiredKeywords = ['text', 'generation', 'processing', 'analysis', 'prediction', 'classification'];
    const hasRequiredKeyword = requiredKeywords.some(keyword =>
      data.capabilities.toLowerCase().includes(keyword)
    );
    if (!hasRequiredKeyword) {
      errors.push({
        field: 'capabilities',
        message: 'Capabilities should describe model functionality (text processing, generation, analysis, etc.)',
        code: 'VAGUE_CAPABILITIES_DESCRIPTION'
      });
    }
  }

  // Validate demo flag consistency
  if (data.is_demo === true && data.status === 'Production') {
    errors.push({
      field: 'is_demo',
      message: 'Demo models cannot have Production status',
      code: 'DEMO_PRODUCTION_CONFLICT'
    });
  }

  // Validate approver field format
  if (data.approver) {
    if (!data.approver.includes(' ') || data.approver.length < 5) {
      errors.push({
        field: 'approver',
        message: 'Approver should include full name (first and last name)',
        code: 'INVALID_APPROVER_FORMAT'
      });
    }
  }

  return errors;
};

/**
 * Business rule validation for model inventory updates
 */
export const validateModelInventoryUpdateBusinessRules = (data: any, existingData?: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate status transitions
  if (data.status && existingData?.status) {
    const invalidTransitions = [
      { from: 'Production', to: 'Development', message: 'Cannot move production model back to development' },
      { from: 'Production', to: 'Testing', message: 'Cannot move production model back to testing' },
      { from: 'Archived', to: 'Production', message: 'Cannot reactivate archived model to production' },
      { from: 'Rejected', to: 'Production', message: 'Rejected models cannot be moved to production without re-approval' },
      { from: 'Deprecated', to: 'Production', message: 'Deprecated models cannot be moved back to production' }
    ];

    const invalidTransition = invalidTransitions.find(
      t => t.from === existingData.status && t.to === data.status
    );

    if (invalidTransition) {
      errors.push({
        field: 'status',
        message: invalidTransition.message,
        code: 'INVALID_STATUS_TRANSITION'
      });
    }
  }

  // Validate version updates
  if (data.version && existingData?.version) {
    if (data.version === existingData.version && data.status !== existingData.status) {
      errors.push({
        field: 'version',
        message: 'Version should be updated when changing model status significantly',
        code: 'VERSION_UPDATE_REQUIRED'
      });
    }
  }

  // Validate version format
  if (data.version) {
    const versionPattern = /^v?\d+(\.\d+)*(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/;
    if (!versionPattern.test(data.version)) {
      errors.push({
        field: 'version',
        message: 'Version should follow semantic versioning format (e.g., "1.0.0", "v2.1.3", "1.0.0-beta")',
        code: 'INVALID_VERSION_FORMAT'
      });
    }
  }

  // Validate security assessment for production promotion
  if (data.status === 'Production' && data.security_assessment) {
    if (data.security_assessment.length < 100) {
      errors.push({
        field: 'security_assessment',
        message: 'Production models require comprehensive security assessment (minimum 100 characters)',
        code: 'INSUFFICIENT_SECURITY_ASSESSMENT'
      });
    }
  }

  // Validate demo flag changes
  if (data.is_demo !== undefined && existingData?.is_demo !== undefined) {
    if (existingData.is_demo === false && data.is_demo === true && existingData.status === 'Production') {
      errors.push({
        field: 'is_demo',
        message: 'Cannot mark production model as demo without changing status first',
        code: 'PRODUCTION_TO_DEMO_INVALID'
      });
    }
  }

  return errors;
};

/**
 * Complete validation for model inventory creation with business rules
 */
export const validateCompleteModelInventoryCreation = (data: any): ValidationError[] => {
  const validationErrors = validateCompleteModelInventory(data);
  const businessErrors = validateModelInventoryCreationBusinessRules(data);

  return [...validationErrors, ...businessErrors];
};

/**
 * Complete validation for model inventory updates with business rules
 */
export const validateCompleteModelInventoryUpdate = (data: any, existingData?: any): ValidationError[] => {
  const validationErrors = validateUpdateModelInventory(data);
  const businessErrors = validateModelInventoryUpdateBusinessRules(data, existingData);

  return [...validationErrors, ...businessErrors];
};