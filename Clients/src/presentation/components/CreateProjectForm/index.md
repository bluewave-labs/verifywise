# CreateProjectForm Component

The CreateProjectForm component is designed to render a form for creating a new project. It includes fields for project title, users, owner, start date, AI risk classification, type of high risk role, and goal. The form validates the input fields and displays error messages if validation fails. On successful submission, it navigates to the project view page.

## Properties

- `closePopup`: A function to close the popup.

## Usage

To use the CreateProjectForm component, simply import it and pass the required `closePopup` property as needed. Here's an example:

```jsx
import CreateProjectForm from "./CreateProjectForm";

const App = () => {
  const closePopupFunction = () => {
    // Function to close the popup
  };

  return <CreateProjectForm closePopup={closePopupFunction} />;
};
```

This will render a form for creating a new project, allowing the user to fill out the required fields and submit the form. If the form validation is successful, it will navigate to the project view page and close the popup.

## Customization

The CreateProjectForm component allows for customization through the `closePopup` property. You can pass any valid function to handle the closing of the popup to this component.

## Features

- Renders a form for creating a new project.
- Validates the input fields and displays error messages if validation fails.
- Navigates to the project view page on successful submission.
- Closes the popup on successful submission.
