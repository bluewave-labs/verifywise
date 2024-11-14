/**
 * Validates whether the given string is a valid email address.
 *
 * This function uses a regular expression to check if the input string
 * follows the standard email format: `local-part@domain`.
 *
 * @param email - The email address to validate.
 * @returns `true` if the email address is valid, `false` otherwise.
 */

export function emailValidation(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
