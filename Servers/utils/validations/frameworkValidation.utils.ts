/**
 * Framework specific validation utilities
 * Contains validation schemas and functions specifically for framework operations
 */

import {
  validateString,
  validateForeignKey,
  validateSchema,
  ValidationResult,
  ValidationError
} from './validation.utils';

/**
 * Validation constants for frameworks
 */
export const FRAMEWORK_VALIDATION_LIMITS = {
  NAME: { MIN: 1, MAX: 255 },
  DESCRIPTION: { MIN: 1, MAX: 1000 },
  SEARCH_QUERY: { MIN: 1, MAX: 100 }
} as const;

/**
 * Validates framework name field
 */
export const validateFrameworkName = (value: any): ValidationResult => {
  return validateString(value, 'Framework name', {
    required: true,
    minLength: FRAMEWORK_VALIDATION_LIMITS.NAME.MIN,
    maxLength: FRAMEWORK_VALIDATION_LIMITS.NAME.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates framework description field
 */
export const validateFrameworkDescription = (value: any): ValidationResult => {
  return validateString(value, 'Framework description', {
    required: true,
    minLength: FRAMEWORK_VALIDATION_LIMITS.DESCRIPTION.MIN,
    maxLength: FRAMEWORK_VALIDATION_LIMITS.DESCRIPTION.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates framework ID parameter
 */
export const validateFrameworkIdParam = (id: any): ValidationResult => {
  return validateForeignKey(id, 'Framework ID', true);
};

/**
 * Validates project ID parameter for framework operations
 */
export const validateProjectIdParam = (id: any): ValidationResult => {
  return validateForeignKey(id, 'Project ID', true);
};

/**
 * Validates search query parameter
 */
export const validateSearchQuery = (value: any): ValidationResult => {
  return validateString(value, 'Search query', {
    required: true,
    minLength: FRAMEWORK_VALIDATION_LIMITS.SEARCH_QUERY.MIN,
    maxLength: FRAMEWORK_VALIDATION_LIMITS.SEARCH_QUERY.MAX,
    trimWhitespace: true
  });
};

/**
 * Validation schema for creating a new framework
 */
export const createFrameworkSchema = {
  name: validateFrameworkName,
  description: validateFrameworkDescription
};

/**
 * Validation schema for updating a framework
 * All fields are optional for updates
 */
export const updateFrameworkSchema = {
  name: (value: any) => value !== undefined ? validateFrameworkName(value) : { isValid: true },
  description: (value: any) => value !== undefined ? validateFrameworkDescription(value) : { isValid: true }
};

/**
 * Validates a complete framework object for creation
 */
export const validateCompleteFramework = (data: any): ValidationError[] => {
  return validateSchema(data, createFrameworkSchema);
};

/**
 * Validates a framework object for updates
 */
export const validateUpdateFramework = (data: any): ValidationError[] => {
  // Check if at least one field is provided for update
  const updateFields = ['name', 'description'];
  const hasUpdateField = updateFields.some(field => data[field] !== undefined);

  if (!hasUpdateField) {
    return [{
      field: 'body',
      message: 'At least one field must be provided for update',
      code: 'NO_UPDATE_FIELDS'
    }];
  }

  return validateSchema(data, updateFrameworkSchema);
};

/**
 * Business rule validation for framework creation
 */
export const validateFrameworkCreationBusinessRules = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Check for reserved framework names
  const reservedNames = ['system', 'admin', 'default', 'test', 'framework'];
  if (data.name && reservedNames.some(reserved =>
    data.name.toLowerCase().includes(reserved.toLowerCase())
  )) {
    errors.push({
      field: 'name',
      message: 'Framework name cannot contain reserved words',
      code: 'RESERVED_NAME'
    });
  }

  // Check for special characters in name (allow only alphanumeric, spaces, hyphens, underscores)
  if (data.name && !/^[a-zA-Z0-9\s\-_]+$/.test(data.name)) {
    errors.push({
      field: 'name',
      message: 'Framework name can only contain letters, numbers, spaces, hyphens, and underscores',
      code: 'INVALID_NAME_CHARACTERS'
    });
  }

  // Check for minimum meaningful description
  if (data.description && data.description.length < 10) {
    errors.push({
      field: 'description',
      message: 'Framework description should be at least 10 characters for meaningful content',
      code: 'DESCRIPTION_TOO_SHORT'
    });
  }

  return errors;
};

/**
 * Business rule validation for framework updates
 */
export const validateFrameworkUpdateBusinessRules = (data: any, existingFramework?: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Only validate name if it's being updated
  if (data.name !== undefined) {
    // Check for reserved framework names
    const reservedNames = ['system', 'admin', 'default', 'test', 'framework'];
    if (reservedNames.some(reserved =>
      data.name.toLowerCase().includes(reserved.toLowerCase())
    )) {
      errors.push({
        field: 'name',
        message: 'Framework name cannot contain reserved words',
        code: 'RESERVED_NAME'
      });
    }

    // Check for special characters in name
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(data.name)) {
      errors.push({
        field: 'name',
        message: 'Framework name can only contain letters, numbers, spaces, hyphens, and underscores',
        code: 'INVALID_NAME_CHARACTERS'
      });
    }
  }

  // Only validate description if it's being updated
  if (data.description !== undefined && data.description.length < 10) {
    errors.push({
      field: 'description',
      message: 'Framework description should be at least 10 characters for meaningful content',
      code: 'DESCRIPTION_TOO_SHORT'
    });
  }

  return errors;
};

/**
 * Validation for framework-to-project operations
 */
export const validateFrameworkProjectOperation = (frameworkId: any, projectId: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  const frameworkIdValidation = validateFrameworkIdParam(frameworkId);
  if (!frameworkIdValidation.isValid) {
    errors.push({
      field: 'frameworkId',
      message: frameworkIdValidation.message || 'Invalid framework ID',
      code: frameworkIdValidation.code || 'INVALID_FRAMEWORK_ID'
    });
  }

  const projectIdValidation = validateProjectIdParam(projectId);
  if (!projectIdValidation.isValid) {
    errors.push({
      field: 'projectId',
      message: projectIdValidation.message || 'Invalid project ID',
      code: projectIdValidation.code || 'INVALID_PROJECT_ID'
    });
  }

  // Business rule: framework ID and project ID cannot be the same
  if (frameworkId && projectId && frameworkId === projectId) {
    errors.push({
      field: 'frameworkId',
      message: 'Framework ID and Project ID cannot be the same',
      code: 'IDENTICAL_IDS'
    });
  }

  return errors;
};

/**
 * Complete validation for framework creation with business rules
 */
export const validateCompleteFrameworkCreation = (data: any): ValidationError[] => {
  const validationErrors = validateCompleteFramework(data);
  const businessErrors = validateFrameworkCreationBusinessRules(data);

  return [...validationErrors, ...businessErrors];
};

/**
 * Complete validation for framework updates with business rules
 */
export const validateCompleteFrameworkUpdate = (data: any, existingFramework?: any): ValidationError[] => {
  const validationErrors = validateUpdateFramework(data);
  const businessErrors = validateFrameworkUpdateBusinessRules(data, existingFramework);

  return [...validationErrors, ...businessErrors];
};

/**
 * Validates framework search parameters
 */
export const validateFrameworkSearch = (searchQuery: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!searchQuery) {
    errors.push({
      field: 'name',
      message: 'Search query is required',
      code: 'MISSING_SEARCH_QUERY'
    });
    return errors;
  }

  const queryValidation = validateSearchQuery(searchQuery);
  if (!queryValidation.isValid) {
    errors.push({
      field: 'name',
      message: queryValidation.message || 'Invalid search query',
      code: queryValidation.code || 'INVALID_SEARCH_QUERY'
    });
  }

  return errors;
};