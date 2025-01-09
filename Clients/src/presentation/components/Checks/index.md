# Check Component

The Check component is designed to display a check icon with a text label. It is a customizable component that can be used to visualize check data in various parts of an application.

## Properties

- `text`: The text to display next to the check icon.
- `variant`: The variant of the check icon, which determines its color. It can be one of the following: "success", "error", "info", or "warning". Defaults to "info".
- `outlined`: If true, displays an outlined check icon; otherwise, displays a filled check icon. Defaults to false.

## Usage

To use the Check component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import Check from "./Check";

const App = () => {
  return <Check text="This is a check" variant="success" outlined={true} />;
};
```

This will render a check icon with the specified text, variant, and outline style.

## Customization

The Check component allows for customization through the `text`, `variant`, and `outlined` properties. You can pass any valid text, variant, and outline style to this component to change its appearance.

## Features

- Displays a check icon with a text label.
- Supports different variants for the check icon, including "success", "error", "info", and "warning".
- Allows for an outlined or filled check icon style.
- Customizable text and icon color based on the variant.
