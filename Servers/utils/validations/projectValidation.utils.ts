/**
 * Project specific validation utilities
 * Contains validation schemas and functions specifically for project operations
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
  VALIDATION_PATTERNS
} from './validation.utils';
import { IProjectAttributes } from '../../domain.layer/interfaces/i.project';
import { AiRiskClassification } from '../../domain.layer/enums/ai-risk-classification.enum';
import { HighRiskRole } from '../../domain.layer/enums/high-risk-role.enum';

/**
 * Validation constants for projects
 */
export const PROJECT_VALIDATION_LIMITS = {
  PROJECT_TITLE: { MIN: 1, MAX: 255 },
  GOAL: { MIN: 1, MAX: 1000 }
} as const;

/**
 * AI Risk Classification enum values
 */
export const AI_RISK_CLASSIFICATION_ENUM = Object.values(AiRiskClassification);

/**
 * High Risk Role enum values
 */
export const HIGH_RISK_ROLE_ENUM = Object.values(HighRiskRole);

/**
 * Validates project title field
 */
export const validateProjectTitle = (value: any): ValidationResult => {
  return validateString(value, 'Project title', {
    required: true,
    minLength: PROJECT_VALIDATION_LIMITS.PROJECT_TITLE.MIN,
    maxLength: PROJECT_VALIDATION_LIMITS.PROJECT_TITLE.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates project goal field
 */
export const validateGoal = (value: any): ValidationResult => {
  return validateString(value, 'Goal', {
    required: true,
    minLength: PROJECT_VALIDATION_LIMITS.GOAL.MIN,
    maxLength: PROJECT_VALIDATION_LIMITS.GOAL.MAX,
    trimWhitespace: true
  });
};

/**
 * Validates project owner foreign key
 */
export const validateOwner = (value: any): ValidationResult => {
  return validateForeignKey(value, 'Owner', true);
};

/**
 * Validates start date field
 */
export const validateStartDate = (value: any): ValidationResult => {
  return validateDate(value, 'Start date', {
    required: true
  });
};

/**
 * Validates AI risk classification enum field
 */
export const validateAiRiskClassification = (value: any): ValidationResult => {
  return validateEnum(value, 'AI risk classification', AI_RISK_CLASSIFICATION_ENUM, true);
};

/**
 * Validates type of high risk role enum field
 */
export const validateTypeOfHighRiskRole = (value: any): ValidationResult => {
  return validateEnum(value, 'Type of high risk role', HIGH_RISK_ROLE_ENUM, true);
};

/**
 * Validates last updated by foreign key
 */
export const validateLastUpdatedBy = (value: any): ValidationResult => {
  return validateForeignKey(value, 'Last updated by', true);
};

/**
 * Validates is_organizational boolean field
 */
export const validateIsOrganizational = (value: any): ValidationResult => {
  if (value === undefined || value === null) {
    return { isValid: true }; // Optional field
  }

  if (typeof value !== 'boolean') {
    return {
      isValid: false,
      message: 'Is organizational must be a boolean value',
      code: 'INVALID_BOOLEAN'
    };
  }

  return { isValid: true };
};

/**
 * Validates framework array field
 * Note: Specific framework ID validation (1,2,3) and organizational consistency
 * is handled by validateOrganizationalFrameworkConsistency in business rules
 */
export const validateFramework = (value: any): ValidationResult => {
  // Framework field is optional
  if (value === undefined || value === null) {
    return { isValid: true };
  }

  // Must be an array
  if (!Array.isArray(value)) {
    return {
      isValid: false,
      message: 'Framework must be an array',
      code: 'INVALID_ARRAY'
    };
  }

  // Validate each framework ID in the array
  for (let i = 0; i < value.length; i++) {
    const frameworkId = value[i];

    // Check if it's a valid positive integer
    if (!Number.isInteger(frameworkId) || frameworkId <= 0) {
      return {
        isValid: false,
        message: `Framework ID at index ${i} must be a positive integer`,
        code: 'INVALID_FRAMEWORK_ID'
      };
    }
  }

  // Check for duplicates
  const uniqueFrameworkIds = [...new Set(value)];
  if (uniqueFrameworkIds.length !== value.length) {
    return {
      isValid: false,
      message: 'Framework array cannot contain duplicate IDs',
      code: 'DUPLICATE_FRAMEWORK_IDS'
    };
  }

  return { isValid: true };
};

/**
 * Validates members array field
 */
export const validateMembers = (value: any): ValidationResult => {
  // Members field is optional
  if (value === undefined || value === null) {
    return { isValid: true };
  }

  // Must be an array
  if (!Array.isArray(value)) {
    return {
      isValid: false,
      message: 'Members must be an array',
      code: 'INVALID_ARRAY'
    };
  }

  // Validate each member ID in the array
  for (let i = 0; i < value.length; i++) {
    const memberId = value[i];
    const validation = validateForeignKey(memberId, `Member ID at index ${i}`, false);
    if (!validation.isValid) {
      return {
        isValid: false,
        message: `Invalid member ID at index ${i}: ${validation.message}`,
        code: validation.code || 'INVALID_MEMBER_ID'
      };
    }
  }

  return { isValid: true };
};

/**
 * Validates enable_ai_data_insertion boolean field
 */
export const validateEnableAiDataInsertion = (value: any): ValidationResult => {
  if (value === undefined || value === null) {
    return { isValid: true }; // Optional field
  }

  if (typeof value !== 'boolean') {
    return {
      isValid: false,
      message: 'Enable AI data insertion must be a boolean value',
      code: 'INVALID_BOOLEAN'
    };
  }

  return { isValid: true };
};

/**
 * Validates project ID for existing records
 */
export const validateProjectId = (value: any): ValidationResult => {
  return validateForeignKey(value, 'Project ID', true);
};

/**
 * Validation schema for creating a new project
 */
export const createProjectSchema = {
  project_title: validateProjectTitle,
  owner: validateOwner,
  start_date: validateStartDate,
  ai_risk_classification: validateAiRiskClassification,
  type_of_high_risk_role: validateTypeOfHighRiskRole,
  goal: validateGoal,
  is_organizational: validateIsOrganizational,
  framework: validateFramework,
  members: validateMembers,
  enable_ai_data_insertion: validateEnableAiDataInsertion
};

/**
 * Validation schema for updating a project
 * All fields are optional for updates
 * Note: framework is not included as it's only set during project creation
 */
export const updateProjectSchema = {
  project_title: (value: any) => value !== undefined ? validateProjectTitle(value) : { isValid: true },
  owner: (value: any) => value !== undefined ? validateOwner(value) : { isValid: true },
  start_date: (value: any) => value !== undefined ? validateStartDate(value) : { isValid: true },
  ai_risk_classification: (value: any) => value !== undefined ? validateAiRiskClassification(value) : { isValid: true },
  type_of_high_risk_role: (value: any) => value !== undefined ? validateTypeOfHighRiskRole(value) : { isValid: true },
  goal: (value: any) => value !== undefined ? validateGoal(value) : { isValid: true },
  is_organizational: (value: any) => value !== undefined ? validateIsOrganizational(value) : { isValid: true },
  members: (value: any) => value !== undefined ? validateMembers(value) : { isValid: true },
  enable_ai_data_insertion: (value: any) => value !== undefined ? validateEnableAiDataInsertion(value) : { isValid: true },
  last_updated_by: (value: any) => value !== undefined ? validateLastUpdatedBy(value) : { isValid: true }
};

/**
 * Validates a complete project object for creation
 */
export const validateCompleteProject = (data: any): ValidationError[] => {
  return validateSchema(data, createProjectSchema);
};

/**
 * Validates a project object for updates
 */
export const validateUpdateProject = (data: any): ValidationError[] => {
  // // Check if framework field is being passed (not allowed in updates)
  // if (data.framework !== undefined) {
  //   return [{
  //     field: 'framework',
  //     message: 'Framework cannot be updated after project creation',
  //     code: 'FRAMEWORK_UPDATE_NOT_ALLOWED'
  //   }];
  // }

  // Check if at least one field is provided for update
  const updateFields = [
    'project_title', 'owner', 'start_date', 'ai_risk_classification',
    'type_of_high_risk_role', 'goal', 'members', 'enable_ai_data_insertion',
    'last_updated_by'
  ];

  const hasUpdateField = updateFields.some(field => data[field] !== undefined);

  if (!hasUpdateField) {
    return [{
      field: 'body',
      message: 'At least one field must be provided for update',
      code: 'NO_UPDATE_FIELDS'
    }];
  }

  return validateSchema(data, updateProjectSchema);
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
 * Validates that start date is not in the future beyond reasonable limits
 */
export const validateStartDateReasonable = (startDate: Date): ValidationResult => {
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  if (startDate > oneYearFromNow) {
    return {
      isValid: false,
      message: 'Start date cannot be more than one year in the future',
      code: 'UNREASONABLE_START_DATE'
    };
  }

  return { isValid: true };
};

/**
 * Validates that frameworks are consistent with organizational status
 */
export const validateOrganizationalFrameworkConsistency = (
  isOrganizational: boolean,
  frameworks: number[]
): ValidationResult => {
  if (!frameworks || frameworks.length === 0) {
    return { isValid: true }; // Skip validation if no frameworks provided
  }

  // Organizational frameworks: ISO-42001 (2), ISO-27001 (3)
  const organizationalFrameworks = [2, 3];
  // Non-organizational framework: EU-AI-Act (1)
  const nonOrganizationalFrameworks = [1];

  if (isOrganizational) {
    // For organizational projects, only allow frameworks 2 and 3
    const hasInvalidFramework = frameworks.some(id => !organizationalFrameworks.includes(id));
    if (hasInvalidFramework) {
      return {
        isValid: false,
        message: 'Organizational projects can only use organizational frameworks: ISO-42001 (2) or ISO-27001 (3)',
        code: 'INVALID_ORGANIZATIONAL_FRAMEWORK'
      };
    }
  } else {
    // For non-organizational projects, only allow framework 1
    const hasInvalidFramework = frameworks.some(id => !nonOrganizationalFrameworks.includes(id));
    if (hasInvalidFramework) {
      return {
        isValid: false,
        message: 'Non-organizational projects can only use EU-AI-Act framework (1)',
        code: 'INVALID_NON_ORGANIZATIONAL_FRAMEWORK'
      };
    }
  }

  return { isValid: true };
};

/**
 * Validates that AI risk classification is consistent with high risk role
 */
export const validateRiskClassificationConsistency = (
  aiRiskClassification: AiRiskClassification,
  typeOfHighRiskRole: HighRiskRole
): ValidationResult => {
  // Business rule: High-risk AI systems should have appropriate high-risk roles
  // All defined HighRiskRole enum values are valid for high-risk systems
  if (aiRiskClassification === AiRiskClassification.HIGH_RISK) {
    // Any valid HighRiskRole is acceptable for high-risk systems
    const validHighRiskRoles = Object.values(HighRiskRole);
    if (!validHighRiskRoles.includes(typeOfHighRiskRole)) {
      return {
        isValid: false,
        message: 'High-risk AI classification requires a valid high-risk role designation',
        code: 'INCONSISTENT_RISK_CLASSIFICATION'
      };
    }
  }

  // For minimal/limited risk systems, we accept any role designation
  // as they might still need role definition for compliance tracking
  return { isValid: true };
};

/**
 * Validates that owner exists (placeholder for database check)
 */
export const validateOwnerExists = async (ownerId: number): Promise<ValidationResult> => {
  // This would be implemented to check if owner exists in database
  // For now, just validate the ID format
  return validateOwner(ownerId);
};

/**
 * Validates that framework IDs exist (placeholder for database check)
 */
export const validateFrameworksExist = async (frameworkIds: number[]): Promise<ValidationResult> => {
  // This would be implemented to check if frameworks exist in database
  // For now, just validate the array format
  return validateFramework(frameworkIds);
};

/**
 * Validates that member IDs exist (placeholder for database check)
 */
export const validateMembersExist = async (memberIds: number[]): Promise<ValidationResult> => {
  // This would be implemented to check if members exist in database
  // For now, just validate the array format
  return validateMembers(memberIds);
};

/**
 * Complete validation for project creation with business rules
 */
export const validateCompleteProjectWithBusinessRules = (data: any): ValidationError[] => {
  const errors = validateCompleteProject(data);

  // Add business rule validations if basic validation passes
  if (errors.length === 0) {
    // Check start date reasonableness
    if (data.start_date) {
      const startDateCheck = validateStartDateReasonable(new Date(data.start_date));
      if (!startDateCheck.isValid) {
        errors.push({
          field: 'start_date',
          message: startDateCheck.message || 'Start date is unreasonable',
          code: startDateCheck.code || 'BUSINESS_RULE_VIOLATION'
        });
      }
    }

    // Check organizational framework consistency
    if (data.is_organizational !== undefined && data.framework) {
      const frameworkConsistencyCheck = validateOrganizationalFrameworkConsistency(
        data.is_organizational,
        data.framework
      );
      if (!frameworkConsistencyCheck.isValid) {
        errors.push({
          field: 'framework',
          message: frameworkConsistencyCheck.message || 'Framework is inconsistent with organizational status',
          code: frameworkConsistencyCheck.code || 'BUSINESS_RULE_VIOLATION'
        });
      }
    }

    // Check risk classification consistency
    if (data.ai_risk_classification && data.type_of_high_risk_role) {
      const consistencyCheck = validateRiskClassificationConsistency(
        data.ai_risk_classification,
        data.type_of_high_risk_role
      );
      if (!consistencyCheck.isValid) {
        errors.push({
          field: 'type_of_high_risk_role',
          message: consistencyCheck.message || 'Risk classification is inconsistent',
          code: consistencyCheck.code || 'BUSINESS_RULE_VIOLATION'
        });
      }
    }
  }

  return errors;
};

/**
 * Complete validation for project updates with business rules
 */
export const validateUpdateProjectWithBusinessRules = (
  data: any,
  currentProject?: any
): ValidationError[] => {
  const errors = validateUpdateProject(data);

  // Add business rule validations if basic validation passes
  if (errors.length === 0 && currentProject) {
    // Check start date reasonableness if being updated
    const newStartDate = data.start_date !== undefined ? data.start_date : currentProject.start_date;
    if (newStartDate) {
      const startDateCheck = validateStartDateReasonable(new Date(newStartDate));
      if (!startDateCheck.isValid) {
        errors.push({
          field: 'start_date',
          message: startDateCheck.message || 'Start date is unreasonable',
          code: startDateCheck.code || 'BUSINESS_RULE_VIOLATION'
        });
      }
    }

    // Note: Framework consistency validation is not performed during updates
    // as frameworks are set only during project creation and cannot be changed

    // Check risk classification consistency
    const newAiRiskClassification = data.ai_risk_classification !== undefined
      ? data.ai_risk_classification
      : currentProject.ai_risk_classification;
    const newTypeOfHighRiskRole = data.type_of_high_risk_role !== undefined
      ? data.type_of_high_risk_role
      : currentProject.type_of_high_risk_role;

    if (newAiRiskClassification && newTypeOfHighRiskRole) {
      const consistencyCheck = validateRiskClassificationConsistency(
        newAiRiskClassification,
        newTypeOfHighRiskRole
      );
      if (!consistencyCheck.isValid) {
        errors.push({
          field: data.type_of_high_risk_role !== undefined ? 'type_of_high_risk_role' : 'ai_risk_classification',
          message: consistencyCheck.message || 'Risk classification is inconsistent',
          code: consistencyCheck.code || 'BUSINESS_RULE_VIOLATION'
        });
      }
    }
  }

  return errors;
};