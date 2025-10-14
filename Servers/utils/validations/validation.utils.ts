/**
 * Reusable validation utilities for API endpoints
 * Provides comprehensive validation functions for various data types and business rules
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export class ValidationErrors extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationErrors';
    this.errors = errors;
  }
}

/**
 * String validation with comprehensive checks
 */
export const validateString = (
  value: any,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
    trimWhitespace?: boolean;
  } = {}
): ValidationResult => {
  const {
    required = false,
    minLength = 0,
    maxLength = Infinity,
    pattern,
    allowEmpty = false,
    trimWhitespace = true
  } = options;

  // Check if value exists
  if (value === undefined || value === null) {
    if (required) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      };
    }
    return { isValid: true };
  }

  // Convert to string and trim if needed
  let stringValue = String(value);
  if (trimWhitespace) {
    stringValue = stringValue.trim();
  }

  // Check empty string
  if (!allowEmpty && stringValue === '' && required) {
    return {
      isValid: false,
      message: `${fieldName} cannot be empty`,
      code: 'EMPTY_STRING'
    };
  }

  // Check length constraints
  if (stringValue.length < minLength) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${minLength} characters long`,
      code: 'MIN_LENGTH'
    };
  }

  if (stringValue.length > maxLength) {
    return {
      isValid: false,
      message: `${fieldName} cannot exceed ${maxLength} characters`,
      code: 'MAX_LENGTH'
    };
  }

  // Check pattern if provided
  if (pattern && !pattern.test(stringValue)) {
    return {
      isValid: false,
      message: `${fieldName} format is invalid`,
      code: 'INVALID_FORMAT'
    };
  }

  return { isValid: true };
};

/**
 * Number validation with range checks
 */
export const validateNumber = (
  value: any,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  } = {}
): ValidationResult => {
  const {
    required = false,
    min = -Infinity,
    max = Infinity,
    integer = false,
    positive = false
  } = options;

  // Check if value exists
  if (value === undefined || value === null || value === '') {
    if (required) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      };
    }
    return { isValid: true };
  }

  // Convert to number
  const numValue = Number(value);

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_NUMBER'
    };
  }

  // Check integer requirement
  if (integer && !Number.isInteger(numValue)) {
    return {
      isValid: false,
      message: `${fieldName} must be an integer`,
      code: 'INVALID_INTEGER'
    };
  }

  // Check positive requirement
  if (positive && numValue <= 0) {
    return {
      isValid: false,
      message: `${fieldName} must be positive`,
      code: 'INVALID_POSITIVE'
    };
  }

  // Check range
  if (numValue < min) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${min}`,
      code: 'MIN_VALUE'
    };
  }

  if (numValue > max) {
    return {
      isValid: false,
      message: `${fieldName} cannot exceed ${max}`,
      code: 'MAX_VALUE'
    };
  }

  return { isValid: true };
};

/**
 * Enum validation
 */
export const validateEnum = <T extends string>(
  value: any,
  fieldName: string,
  allowedValues: readonly T[],
  required: boolean = false
): ValidationResult => {
  // Check if value exists
  if (value === undefined || value === null || value === '') {
    if (required) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      };
    }
    return { isValid: true };
  }

  // Handle array values
  if (Array.isArray(value) && value.length > 1) {
    // Check if array is empty and required
    if (value.length === 0) {
      if (required) {
        return {
          isValid: false,
          message: `${fieldName} is required`,
          code: 'REQUIRED_FIELD'
        };
      }
      return { isValid: true };
    }

    // Validate each element in the array
    for (let i = 0; i < value.length; i++) {
      const element = value[i];
      if ((allowedValues as readonly string[]).indexOf(element as string) === -1) {
        return {
          isValid: false,
          message: `${fieldName}[${i}] must be one of: ${allowedValues.join(', ')}`,
          code: 'INVALID_ENUM'
        };
      }
    }
    return { isValid: true };
  }

  // Check if single value is in allowed values
  if ((allowedValues as readonly string[]).indexOf(value as string) === -1) {
    return {
      isValid: false,
      message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      code: 'INVALID_ENUM'
    };
  }

  return { isValid: true };
};

/**
 * Date validation
 */
export const validateDate = (
  value: any,
  fieldName: string,
  options: {
    required?: boolean;
    minDate?: Date;
    maxDate?: Date;
    futureOnly?: boolean;
    pastOnly?: boolean;
  } = {}
): ValidationResult => {
  const {
    required = false,
    minDate,
    maxDate,
    futureOnly = false,
    pastOnly = false
  } = options;

  // Check if value exists
  if (value === undefined || value === null || value === '') {
    if (required) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      };
    }
    return { isValid: true };
  }

  // Convert to date
  const dateValue = new Date(value);

  // Check if it's a valid date
  if (isNaN(dateValue.getTime())) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid date`,
      code: 'INVALID_DATE'
    };
  }

  const now = new Date();

  // Check future only
  if (futureOnly && dateValue <= now) {
    return {
      isValid: false,
      message: `${fieldName} must be a future date`,
      code: 'FUTURE_DATE_REQUIRED'
    };
  }

  // Check past only
  if (pastOnly && dateValue >= now) {
    return {
      isValid: false,
      message: `${fieldName} must be a past date`,
      code: 'PAST_DATE_REQUIRED'
    };
  }

  // Check min date
  if (minDate && dateValue < minDate) {
    return {
      isValid: false,
      message: `${fieldName} cannot be before ${minDate.toISOString().split('T')[0]}`,
      code: 'MIN_DATE'
    };
  }

  // Check max date
  if (maxDate && dateValue > maxDate) {
    return {
      isValid: false,
      message: `${fieldName} cannot be after ${maxDate.toISOString().split('T')[0]}`,
      code: 'MAX_DATE'
    };
  }

  return { isValid: true };
};

/**
 * Foreign key validation (checks if ID exists and is valid)
 */
export const validateForeignKey = (
  value: any,
  fieldName: string,
  required: boolean = false
): ValidationResult => {
  // Check if value exists
  if (value === undefined || value === null || value === '') {
    if (required) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD'
      };
    }
    return { isValid: true };
  }

  // Convert to number
  const numValue = Number(value);

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid ID`,
      code: 'INVALID_ID'
    };
  }

  // Check if it's a positive integer
  // For non-required fields, allow 0 as a valid "unassigned" value
  const minValue = required ? 1 : 0;
  if (!Number.isInteger(numValue) || numValue < minValue) {
    return {
      isValid: false,
      message: `${fieldName} must be a ${required ? 'positive ' : ''}valid integer${required ? '' : ' (0 or greater)'}`,
      code: 'INVALID_ID'
    };
  }

  return { isValid: true };
};

/**
 * Validation schema validator - validates an object against a schema
 */
export const validateSchema = (
  data: any,
  schema: Record<string, (value: any) => ValidationResult>
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Use for...in loop instead of Object.entries for better TypeScript compatibility
  for (const field in schema) {
    if (schema.hasOwnProperty(field)) {
      const validator = schema[field];
      const result = validator(data[field]);
      if (!result.isValid) {
        errors.push({
          field,
          message: result.message || 'Invalid value',
          code: result.code || 'INVALID_VALUE',
          value: data[field]
        });
      }
    }
  }

  return errors;
};

/**
 * Express middleware for validation
 */
export const validateRequest = (
  schema: Record<string, (value: any) => ValidationResult>
) => {
  return (req: any, res: any, next: any) => {
    const errors = validateSchema(req.body, schema);

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.map(err => ({
          field: err.field,
          message: err.message,
          code: err.code
        }))
      });
    }

    next();
  };
};

/**
 * Sanitization utilities
 */
export const sanitizeString = (value: string, options: {
  trim?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  removeSpecialChars?: boolean;
} = {}): string => {
  const { trim = true, toLowerCase = false, toUpperCase = false, removeSpecialChars = false } = options;

  let sanitized = value;

  if (trim) {
    sanitized = sanitized.trim();
  }

  if (toLowerCase) {
    sanitized = sanitized.toLowerCase();
  }

  if (toUpperCase) {
    sanitized = sanitized.toUpperCase();
  }

  if (removeSpecialChars) {
    sanitized = sanitized.replace(/[^\w\s]/gi, '');
  }

  return sanitized;
};

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  URL: /^https?:\/\/.+/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  LETTERS_ONLY: /^[a-zA-Z\s]+$/,
  NUMBERS_ONLY: /^[0-9]+$/
} as const;

/**
 * Common enum values for vendor risks
 */
export const VENDOR_RISK_ENUMS = {
  IMPACT: ['Negligible', 'Minor', 'Moderate', 'Major', 'Critical'] as const,
  LIKELIHOOD: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'] as const,
  RISK_SEVERITY: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'] as const
} as const;