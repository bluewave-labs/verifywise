# ProgressUpload Component

The ProgressUpload component is designed to display a progress bar with optional icon, label, size, and error message. It also includes a close button with a click handler.

## Props

- `icon`: Optional icon to display.
- `label`: Label text to display.
- `size`: Optional size text to display.
- `progress`: Progress value (0-100). Defaults to 0.
- `onClick`: Click handler function.
- `error`: Optional error message to display.

## Example Usage

```jsx
import ProgressUpload from "./ProgressUpload";

const App = () => {
  return (
    <ProgressUpload
      label="Upload Progress"
      size="1.5MB"
      progress={50}
      onClick={() => console.log("Close button clicked")}
    />
  );
};
```

## Styling

The ProgressUpload component uses Material-UI's theme to style the progress bar. The styling includes:

- Custom icon display.
- Customizable label, size, and error message.
- A close button for closing the progress bar.
- Customizable progress bar with a determinate value.

## Customization

The ProgressUpload component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The ProgressUpload component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the component is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the ProgressUpload component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the ProgressUpload component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
