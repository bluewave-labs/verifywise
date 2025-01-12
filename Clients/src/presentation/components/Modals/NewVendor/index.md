# AddNewVendorModal Component

The AddNewVendorModal component is designed to render a modal dialog for adding a new vendor to the system. It displays a modal when the `isOpen` prop is true, allowing the user to input vendor details and risk assessments. The component dynamically adjusts its styling based on the Material-UI theme.

## Props

- `isOpen`: A boolean indicating whether the modal is open.
- `setIsOpen`: A function to set the modal's open state.
- `value`: The current value of the selected tab.
- `handleChange`: Function to handle tab change events.
- `existingVendor`: The existing vendor details to be edited.
- `onVendorChange`: A function to be called when the vendor details change.

## Example Usage

```jsx
import AddNewVendorModal from "./AddNewVendorModal";

const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleTabChange = (event, newValue) => {
    // Handle tab change logic here
  };
  const handleVendorChange = () => {
    // Handle vendor change logic here
  };

  return (
    <AddNewVendorModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      value="1" // Assuming "1" is the initial tab value
      handleChange={handleTabChange}
      existingVendor={existingVendor} // Assuming existingVendor is defined elsewhere
      onVendorChange={handleVendorChange}
    />
  );
};
```

## Styling

The AddNewVendorModal component uses Material-UI's theme to style the modal. The styling includes:

- A custom positioning and layout for the modal content.
- A close icon for closing the modal.
- Custom typography and spacing for the modal content.

## Customization

The AddNewVendorModal component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The AddNewVendorModal component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the modal is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the AddNewVendorModal component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the AddNewVendorModal component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
