/**
 * Converts feedback information into an object containing acceptance status and a message.
 *
 * @param accepted - A boolean indicating whether the feedback is accepted.
 * @param message - A string containing the feedback message.
 * @returns An object with `accepted` and `message` properties.
 */
function feedbackToString(accepted: boolean, message: string) {
  return {
    accepted,
    message,
  };
}

/**
 * Validates a string based on various criteria such as length, presence of uppercase letters,
 * lowercase letters, numbers, special characters, and a custom regular expression.
 *
 * @param value - The string to be validated.
 * @param minLength - The minimum length the string should have.
 * @param maxLength - The maximum length the string can have.
 * @param regex - A regular expression that the string must match.
 * @param hasUpperCase - Whether the string must contain at least one uppercase letter.
 * @param hasLowerCase - Whether the string must contain at least one lowercase letter.
 * @param hasNumber - Whether the string must contain at least one number.
 * @param hasSpecialCharacter - Whether the string must contain at least one special character.
 * @returns An object with `accepted` set to `true` if the string passes all validations,
 *          otherwise an object with `accepted` set to `false` and a `message` indicating the reason.
 */
export function checkStringValidation(
  value: string,
  minLength: number = 0,
  maxLength: number = 128,
  hasUpperCase?: boolean,
  hasLowerCase?: boolean,
  hasNumber?: boolean,
  hasSpecialCharacter?: boolean
) {
  if (value.length < minLength) {
    return feedbackToString(false, "Password is too short.");
  }

  if (value.length > maxLength) {
    return feedbackToString(false, "Password is too long.");
  }

  if (hasUpperCase && !/[A-Z]/.test(value)) {
    return feedbackToString(
      false,
      "Password must contain at least one uppercase letter."
    );
  }

  if (hasLowerCase && !/[a-z]/.test(value)) {
    return feedbackToString(
      false,
      "Password must contain at least one lowercase letter."
    );
  }

  if (hasNumber && !/[0-9]/.test(value)) {
    return feedbackToString(
      false,
      "Password must contain at least one number."
    );
  }

  if (
    hasSpecialCharacter &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value)
  ) {
    return feedbackToString(
      false,
      "Password must contain at least one special character."
    );
  }

  return true;
}
