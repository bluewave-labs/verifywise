# IconButton Component

The IconButton component is designed to render a custom-styled Material-UI IconButton with a settings icon. It includes a dropdown menu with options to edit or remove a vendor, and modals for adding or removing vendors.

## Properties

- `vendorId`: The ID of the vendor associated with the IconButton.
- `onVendorChange`: A callback function to be called when the vendor details are changed.
- `onDeleteVendor`: A callback function to be called when a vendor is deleted.

## Usage

To use the IconButton component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import IconButton from "./IconButton";

const App = () => {
  return (
    <IconButton
      vendorId={1}
      onVendorChange={() => console.log("Vendor details changed")}
      onDeleteVendor={(vendorId) => console.log(`Vendor ${vendorId} deleted`)}
    />
  );
};
```

This will render a styled IconButton component with a settings icon, a dropdown menu with "Edit" and "Remove" options, and modals for adding or removing vendors.

## Customization

The IconButton component allows for customization through the `vendorId`, `onVendorChange`, and `onDeleteVendor` properties. You can pass any valid vendor ID, change callback, and delete callback to this component to change its behavior.

## Features

- Renders a custom-styled Material-UI IconButton with a settings icon.
- Includes a dropdown menu with "Edit" and "Remove" options.
- Supports modals for adding or removing vendors.
- Customizable vendor ID, change callback, and delete callback.
