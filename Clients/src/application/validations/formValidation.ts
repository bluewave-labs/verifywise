import { checkStringValidation } from "./stringValidation";

// Constants
const PASSWORD_REGEX = /[!@#$%^&*(),.?":{}|<>]/;
// Validation constants
const VALIDATION_RULES = {
  NAME: { min: 2, max: 50 },
  PASSWORD: { min: 8, max: 16 },
  EMAIL: { min: 0, max: 128 },
} as const;

// Define the shape of form values
export interface FormValues {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: number;  // Optional role property
}

// Define the shape of form errors
export interface FormErrors {
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface ValidationResult {
  isFormValid: boolean;
  errors: FormErrors;
}

interface PasswordValidationResult {
  length: boolean;
  specialChar: boolean;
  uppercase: boolean;
  number: boolean;
}

/**
 * Validates form input values
 * @param values Form values to validate
 * @returns Validation result containing isFormValid flag and any errors
 */
// Function to validate the entire form
export const validateForm = (values: FormValues): ValidationResult => {
  const newErrors: FormErrors = {};

  // Validate name
  const name = checkStringValidation(
    "Name",
    values.name,
    VALIDATION_RULES.NAME.min,
    VALIDATION_RULES.NAME.max
  );
  if (!name.accepted) {
    newErrors.name = name.message;
  }

  // Validate surname
  const surname = checkStringValidation(
    "Surname",
    values.surname,
    VALIDATION_RULES.NAME.min,
    VALIDATION_RULES.NAME.max
  );
  if (!surname.accepted) {
    newErrors.surname = surname.message;
  }

  // Validate email
  const email = checkStringValidation(
    "Email",
    values.email,
    VALIDATION_RULES.EMAIL.min,
    VALIDATION_RULES.EMAIL.max,
    false,
    false,
    false,
    false,
    "email"
  );
  if (!email.accepted) {
    newErrors.email = email.message;
  }
  

  // Validate password
  const password = checkStringValidation(
    "Password",
    values.password,
    VALIDATION_RULES.PASSWORD.min,
    VALIDATION_RULES.PASSWORD.max,
    true,
    true,
    true,
    true,
    "password"
  );
  if (!password.accepted) {
    newErrors.password = password.message;
  }

  // Confirm password validation
  if (values.password !== values.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match";
  }

  return {
    isFormValid: Object.keys(newErrors).length === 0,
    errors: newErrors,
  }; // Return true if no errors exist
};

// Function to check Password based on the password input
export const validatePassword = (
  values: FormValues
): PasswordValidationResult => {
  return {
    length: values.password.length >= VALIDATION_RULES.PASSWORD.min,
    specialChar: PASSWORD_REGEX.test(values.password),
    uppercase: /[A-Z]/.test(values.password),
    number: /[0-9]/.test(values.password),
  };
};
