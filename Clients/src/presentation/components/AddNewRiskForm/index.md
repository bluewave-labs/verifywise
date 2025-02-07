# AddNewRiskForm Component

The AddNewRiskForm component is designed to facilitate the addition of new risks and mitigations through a user-friendly tabbed interface. It is a crucial tool for risk management and mitigation planning.

## Features

- Tabbed interface for easy navigation between risks and mitigation sections
- Lazy loading of sections to improve performance
- Customizable styling for tabs and sections
- Support for closing the popup and managing its status

## Props

- `closePopup`: A function to close the popup.
- `popupStatus`: A string indicating the status of the popup.

## Usage

To use the AddNewRiskForm component, simply import it and pass the required props:

```jsx
import AddNewRiskForm from "./AddNewRiskForm";

const closePopupFunction = () => {
  // Function to close the popup
};

return <AddNewRiskForm closePopup={closePopupFunction} popupStatus="true" />;
```

## Customization

The component's styling can be customized by modifying the `styles.css` file or by using MUI's styling options.

## Dependencies

- `@mui/lab/TabContext`
- `@mui/lab/TabList`
- `@mui/lab/TabPanel`
- `@mui/material/Box`
- `@mui/material/Stack`
- `@mui/material/Tab`
- `react` for lazy loading and suspense handling

## License

This component is licensed under the MIT License.
