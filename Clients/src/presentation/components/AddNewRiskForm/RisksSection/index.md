# RisksSection Component

The RisksSection component is a crucial part of the AddNewRiskForm component, designed to facilitate the addition and management of risks within a project. It provides a user-friendly interface for inputting and managing risk-related information, ensuring that all necessary details are captured and validated.

## Features

- Comprehensive form for capturing risk details, including risk name, description, potential impact, review notes, and more.
- Validation for each field to ensure all required information is provided and meets specific criteria.
- Support for selecting action owners, AI lifecycle phases, and risk categories from predefined options.
- Integration with the RiskLevel component for calculating and displaying the risk level based on likelihood and severity scores.
- Customizable styling options using MUI's styling system.

## Props

- `closePopup`: A function to close the popup containing the RisksSection component.
- `status`: A string indicating the status of the form, either "new" or "update".

## Usage

To use the RisksSection component, simply import it and pass the required props:

```jsx
import RisksSection from "./RisksSection";

const closePopupFunction = () => {
  // Function to close the popup
};

return <RisksSection closePopup={closePopupFunction} status="new" />;
```

## Customization

The component's styling can be customized by modifying the `styles.css` file or by using MUI's styling options.

## Dependencies

- `@mui/material/Stack`
- `@mui/material/Divider`
- `@mui/material/Typography`
- `@mui/material/Button`
- `@mui/material/SelectChangeEvent`
- `react` for state management and event handling
- `react` for lazy loading and suspense handling
- `Field` and `Select` components from the Inputs module
- `RiskLevel` component for risk level calculation and display
- `Alert` component for displaying error messages
- `checkStringValidation` and `selectValidation` functions from the application validations module

## License

This component is licensed under the MIT License.
