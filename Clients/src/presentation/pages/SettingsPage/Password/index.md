# PasswordForm Component

This component is designed to handle password changes for users. It includes fields for current password, new password, and confirm new password. The component validates each field to ensure the new password meets the required complexity criteria and matches the confirm password field.

## Features

- Displays fields for current password, new password, and confirm new password
- Validates each field for input errors
- Checks if the new password meets the required complexity criteria (uppercase letter, lowercase letter, number, and symbol)
- Ensures the new password matches the confirm password field
- Handles the saving of the new password

## Functionality

- Fetches the current user's password on component mount
- Handles the validation of the current password, new password, and confirm password fields
- Saves the new password if all validation checks pass

## Styling

- Utilizes Material-UI for styling and layout
- Custom styles for the password fields and validation error messages to enhance visual appeal and user experience
