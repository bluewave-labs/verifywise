/**
 * Validates a password based on specific criteria.
 *
 * @param password - The password string to validate.
 * @returns An object containing the validation results:
 * - `isValid`: Indicates if the password meets the required criteria (at least one lowercase letter, one uppercase letter, one digit, and a minimum length of 8 characters).
 * - `hasSpecialChar`: Indicates if the password contains any special characters.
 * - `isMinLength`: Indicates if the password meets the minimum length requirement.
 * - `isMaxLength`: Indicates if the password meets the maximum length requirement.
 */

export function passwordValidation(password: string): {
  isValid: boolean;
  hasSpecialChar: boolean;
  isMinLength: boolean;
  isMaxLength: boolean;
} {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  const specialCharRegex = /[^a-zA-Z\d]/;
  const minLength = 8;
  const maxLength = 20;

  const isValid = passwordRegex.test(password);
  const hasSpecialChar = specialCharRegex.test(password);
  const isMinLength = password.length >= minLength;
  const isMaxLength = password.length <= maxLength;

  return { isValid, hasSpecialChar, isMinLength, isMaxLength };
}
