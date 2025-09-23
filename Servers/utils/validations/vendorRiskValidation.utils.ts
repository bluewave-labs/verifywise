/**
 * Vendor Risk specific validation utilities
 * Contains validation schemas and functions specifically for vendor risk operations
 */

import {
  validateString,
  validateNumber,
  validateEnum,
  validateDate,
  validateForeignKey,
  validateSchema,
  ValidationResult,
  ValidationError,
  VENDOR_RISK_ENUMS
} from './validation.utils';
import { IVendorRisk } from '../../domain.layer/interfaces/i.vendorRisk';

/**
 * Validation constants for vendor risks
 */
export const VENDOR_RISK_VALIDATION_LIMITS = {
  RISK_DESCRIPTION: { MIN: 1, MAX: 500 },
  IMPACT_DESCRIPTION: { MIN: 1, MAX: 500 },
  ACTION_PLAN: { MIN: 1, MAX: 1000 },
  RISK_LEVEL: { MIN: 1, MAX: 50 }
} as const;

/**
 * Validates risk description field
 */
export const validateRiskDescription = (value: any): ValidationResult => {
  return validateString(value, 'Risk description', {
    required: true,
    minLength: VENDOR_RISK_VALIDATION_LIMITS.RISK_DESCRIPTION.MIN,
    maxLength: VENDOR_RISK_VALIDATION_LIMITS.RISK_DESCRIPTION.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates impact description field
 */
export const validateImpactDescription = (value: any): ValidationResult => {
  return validateString(value, 'Impact description', {
    required: true,
    minLength: VENDOR_RISK_VALIDATION_LIMITS.IMPACT_DESCRIPTION.MIN,
    maxLength: VENDOR_RISK_VALIDATION_LIMITS.IMPACT_DESCRIPTION.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates action plan field
 */
export const validateActionPlan = (value: any): ValidationResult => {
  return validateString(value, 'Action plan', {
    required: true,
    minLength: VENDOR_RISK_VALIDATION_LIMITS.ACTION_PLAN.MIN,
    maxLength: VENDOR_RISK_VALIDATION_LIMITS.ACTION_PLAN.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates impact enum field
 */
export const validateImpact = (value: any): ValidationResult => {
  return validateEnum(value, 'Impact', VENDOR_RISK_ENUMS.IMPACT, true);
};

/**
 * Validates likelihood enum field
 */
export const validateLikelihood = (value: any): ValidationResult => {
  return validateEnum(value, 'Likelihood', VENDOR_RISK_ENUMS.LIKELIHOOD, true);
};

/**
 * Validates risk severity enum field
 */
export const validateRiskSeverity = (value: any): ValidationResult => {
  return validateEnum(value, 'Risk severity', VENDOR_RISK_ENUMS.RISK_SEVERITY, true);
};

/**
 * Validates risk level field
 */
export const validateRiskLevel = (value: any): ValidationResult => {
  return validateString(value, 'Risk level', {
    required: true,
    minLength: VENDOR_RISK_VALIDATION_LIMITS.RISK_LEVEL.MIN,
    maxLength: VENDOR_RISK_VALIDATION_LIMITS.RISK_LEVEL.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates vendor ID foreign key
 */
export const validateVendorId = (value: any): ValidationResult => {
  return validateForeignKey(value, 'Vendor ID', true);
};

/**
 * Validates action owner foreign key
 */
export const validateActionOwner = (value: any): ValidationResult => {
  return validateForeignKey(value, 'Action owner', true);
};



/**
 * Validates vendor risk ID for existing records
 */
export const validateVendorRiskId = (value: any): ValidationResult => {
  return validateForeignKey(value, 'Vendor risk ID', true);
};

/**
 * Validates project ID for queries
 */
export const validateProjectId = (value: any): ValidationResult => {
  return validateForeignKey(value, 'Project ID', true);
};

/**
 * Validation schema for creating a new vendor risk
 */
export const createVendorRiskSchema = {
  vendor_id: validateVendorId,
  risk_description: validateRiskDescription,
  impact_description: validateImpactDescription,
  impact: validateImpact,
  likelihood: validateLikelihood,
  risk_severity: validateRiskSeverity,
  risk_level: validateRiskLevel,
  action_plan: validateActionPlan,
  action_owner: validateActionOwner
};

/**
 * Validation schema for updating a vendor risk
 * All fields are optional for updates
 */
export const updateVendorRiskSchema = {
  vendor_id: (value: any) => value !== undefined ? validateVendorId(value) : { isValid: true },
  risk_description: (value: any) => value !== undefined ? validateRiskDescription(value) : { isValid: true },
  impact_description: (value: any) => value !== undefined ? validateImpactDescription(value) : { isValid: true },
  impact: (value: any) => value !== undefined ? validateImpact(value) : { isValid: true },
  likelihood: (value: any) => value !== undefined ? validateLikelihood(value) : { isValid: true },
  risk_severity: (value: any) => value !== undefined ? validateRiskSeverity(value) : { isValid: true },
  risk_level: (value: any) => value !== undefined ? validateRiskLevel(value) : { isValid: true },
  action_plan: (value: any) => value !== undefined ? validateActionPlan(value) : { isValid: true },
  action_owner: (value: any) => value !== undefined ? validateActionOwner(value) : { isValid: true }
};

/**
 * Validates a complete vendor risk object for creation
 */
export const validateCreateVendorRisk = (data: any): ValidationError[] => {
  return validateSchema(data, createVendorRiskSchema);
};

/**
 * Validates a vendor risk object for updates
 */
export const validateUpdateVendorRisk = (data: any): ValidationError[] => {
  // Check if at least one field is provided for update
  const updateFields = [
    'vendor_id', 'risk_description', 'impact_description', 'impact',
    'likelihood', 'risk_severity', 'risk_level', 'action_plan', 'action_owner'
  ];

  const hasUpdateField = updateFields.some(field => data[field] !== undefined);

  if (!hasUpdateField) {
    return [{
      field: 'body',
      message: 'At least one field must be provided for update',
      code: 'NO_UPDATE_FIELDS'
    }];
  }

  return validateSchema(data, updateVendorRiskSchema);
};

/**
 * Validates vendor risk ID parameter
 */
export const validateVendorRiskIdParam = (id: any): ValidationResult => {
  return validateVendorRiskId(id);
};

/**
 * Validates project ID parameter
 */
export const validateProjectIdParam = (id: any): ValidationResult => {
  return validateProjectId(id);
};

/**
 * Business logic validations
 */

/**
 * Validates that risk level is consistent with impact and likelihood
 * This is a business rule validation
 */
export const validateRiskLevelConsistency = (
  impact: string,
  likelihood: string,
  riskLevel: string
): ValidationResult => {
  // Define risk level matrix (simplified example)
  const riskMatrix: Record<string, Record<string, string[]>> = {
    'Negligible': {
      'Rare': ['Low', 'Negligible'],
      'Unlikely': ['Low', 'Negligible'],
      'Possible': ['Low', 'Minor'],
      'Likely': ['Low', 'Minor'],
      'Almost certain': ['Minor', 'Moderate']
    },
    'Minor': {
      'Rare': ['Low', 'Minor'],
      'Unlikely': ['Low', 'Minor'],
      'Possible': ['Minor', 'Moderate'],
      'Likely': ['Moderate', 'Major'],
      'Almost certain': ['Major', 'High']
    },
    'Moderate': {
      'Rare': ['Minor', 'Moderate'],
      'Unlikely': ['Moderate', 'Major'],
      'Possible': ['Major', 'High'],
      'Likely': ['High', 'Critical'],
      'Almost certain': ['Critical', 'Very High']
    },
    'Major': {
      'Rare': ['Moderate', 'Major'],
      'Unlikely': ['Major', 'High'],
      'Possible': ['High', 'Critical'],
      'Likely': ['Critical', 'Very High'],
      'Almost certain': ['Very High', 'Extreme']
    },
    'Critical': {
      'Rare': ['Major', 'High'],
      'Unlikely': ['High', 'Critical'],
      'Possible': ['Critical', 'Very High'],
      'Likely': ['Very High', 'Extreme'],
      'Almost certain': ['Extreme', 'Extreme']
    }
  };

  const expectedLevels = riskMatrix[impact]?.[likelihood];

  if (!expectedLevels) {
    return { isValid: true }; // Skip validation if matrix not defined
  }

  // Check if the provided risk level is within expected range
  const normalizedRiskLevel = riskLevel.toLowerCase();
  const normalizedExpected = expectedLevels.map(level => level.toLowerCase());

  const isConsistent = normalizedExpected.some(level =>
    normalizedRiskLevel.includes(level) || level.includes(normalizedRiskLevel)
  );

  if (!isConsistent) {
    return {
      isValid: false,
      message: `Risk level "${riskLevel}" is not consistent with impact "${impact}" and likelihood "${likelihood}". Expected levels: ${expectedLevels.join(' or ')}`,
      code: 'INCONSISTENT_RISK_LEVEL'
    };
  }

  return { isValid: true };
};

/**
 * Validates that vendor exists (placeholder for database check)
 * In real implementation, this would query the database
 */
export const validateVendorExists = async (vendorId: number): Promise<ValidationResult> => {
  // This would be implemented to check if vendor exists in database
  // For now, just validate the ID format
  return validateVendorId(vendorId);
};

/**
 * Validates that user exists (placeholder for database check)
 * In real implementation, this would query the database
 */
export const validateUserExists = async (userId: number): Promise<ValidationResult> => {
  // This would be implemented to check if user exists in database
  // For now, just validate the ID format
  return validateActionOwner(userId);
};

/**
 * Complete validation for vendor risk creation with business rules
 */
export const validateCompleteVendorRisk = (data: any): ValidationError[] => {
  const errors = validateCreateVendorRisk(data);

  // Add business rule validations if basic validation passes
  if (errors.length === 0 && data.impact && data.likelihood && data.risk_level) {
    const consistencyResult = validateRiskLevelConsistency(
      data.impact,
      data.likelihood,
      data.risk_level
    );

    if (!consistencyResult.isValid) {
      errors.push({
        field: 'risk_level',
        message: consistencyResult.message || 'Risk level is inconsistent',
        code: consistencyResult.code || 'BUSINESS_RULE_VIOLATION'
      });
    }
  }

  return errors;
};