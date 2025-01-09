# AddNewVendorRiskForm Component

The AddNewVendorRiskForm component is designed to facilitate the addition of new vendor risks through a user-friendly interface. It is a crucial tool for vendor risk management and mitigation planning.

## Features

- Comprehensive form for capturing vendor risk details, including vendor name, action owner, risk name, review date, and risk description.
- Validation for each field to ensure all required information is provided and meets specific criteria.
- Support for selecting vendor name and action owner from predefined options.
- Customizable styling options using MUI's styling system.

## Props

- `closePopup`: A function to close the popup containing the AddNewVendorRiskForm component.

## Usage

To use the AddNewVendorRiskForm component, simply import it and pass the required props:

```jsx
import AddNewVendorRiskForm from "./AddNewVendorRiskForm";

const closePopupFunction = () => {
  // Function to close the popup
};

return <AddNewVendorRiskForm closePopup={closePopupFunction} />;
```

## Customization

The component's styling can be customized by modifying the `styles.css` file or by using MUI's styling options.

## Dependencies

- `@mui/material/Stack`
- `@mui/material/SelectChangeEvent`
- `react` for state management and event handling
- `Field` and `Select` components from the Inputs module
- `DatePicker` component for date selection
- `Alert` component for displaying error messages
- `checkStringValidation` and `selectValidation` functions from the application validations module

## License

This component is licensed under the MIT License.
