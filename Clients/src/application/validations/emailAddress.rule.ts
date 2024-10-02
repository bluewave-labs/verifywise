/**
 * Checks if the provided email address is valid.
 *
 * This function uses the `validator` library to determine if the given email
 * address conforms to standard email format.
 *
 * @param email - The email address to validate.
 * @returns `true` if the email address is valid, `false` otherwise.
 */

import validator from "validator";

export function isValidEmail(email: string): boolean {
  return validator.isEmail(email);
}
