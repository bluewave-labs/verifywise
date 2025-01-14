# Register Admin Page

This page allows administrators to register new admin accounts by filling out a form with their name, surname, email, password, and confirming their password. The form submission triggers a registration process, which validates the input data and creates a new admin account if the data is valid.

## Features

- Input fields for name, surname, email, password, and confirm password
- Submit button to initiate the registration process
- Password strength checks for length and special characters
- Alert system for displaying success or error messages

## Functionality

- Handles form submission and initiates the registration process
- Validates user input data and displays errors if any
- Creates a new admin account if the input data is valid
- Displays alerts for successful registration, bad request, account already exists, internal server error, and unexpected responses
- Logs registration attempts and errors to the console for debugging purposes

## Styling

- Utilizes Material-UI for styling and layout
- Custom theme for primary button styling
- Background image for visual appeal
