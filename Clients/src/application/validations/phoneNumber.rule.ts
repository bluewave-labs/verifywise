/**
 * Validates a phone number using the libphonenumber-js library.
 *
 * @param phoneNumber - The phone number to validate.
 * @param country - The country code to use for validation. Defaults to "US".
 * @returns A boolean indicating whether the phone number is valid.
 *
 * @example
 * ```typescript
 * const isValid = validatePhoneNumber("+14155552671", "US");
 * console.log(isValid); // true or false
 * ```
 */

import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

export function validatePhoneNumber(
  phoneNumber: string,
  country: CountryCode = "US"
): boolean {
  const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, country);
  return phoneNumberObj ? phoneNumberObj.isValid() : false;
}
