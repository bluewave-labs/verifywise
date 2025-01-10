# Checkbox Component

The Checkbox component is designed to provide a customizable checkbox input field with a label. It utilizes Material-UI's Checkbox and FormControlLabel components to ensure a consistent look and feel across the application.

## Properties

- `id`: The unique identifier for the checkbox input.
- `label`: The label displayed next to the checkbox.
- `size`: The size of the checkbox. Options are "small", "medium", and "large". Defaults to "medium".
- `isChecked`: The checked state of the checkbox.
- `value`: The value of the checkbox input.
- `onChange`: The function to call when the checkbox state changes.
- `isDisabled`: Whether the checkbox is disabled.

## Usage

To use the Checkbox component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import Checkbox from "./Checkbox";

const App = () => {
  return (
    <Checkbox
      id="example-checkbox"
      label="Example Checkbox"
      size="medium"
      isChecked={true}
      value="example-value"
      onChange={(event) => console.log(event.target.checked)}
      isDisabled={false}
    />
  );
};
```

This will render a Checkbox component with the specified properties, allowing users to interact with the checkbox and handling the state change accordingly.

## Customization

The Checkbox component allows for customization through the `size`, `isChecked`, `value`, `onChange`, and `isDisabled` properties. You can pass any valid values to these properties to change the behavior and appearance of the component.

## Features

- Provides a customizable checkbox input field with a label.
- Supports three sizes: small, medium, and large.
- Supports custom checked state and value.
- Supports custom change handling through the `onChange` property.
- Can be disabled through the `isDisabled` property.
