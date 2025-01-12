# CustomStep Component

The CustomStep component is designed to render a custom step in a page tour. It displays a header and a body text, allowing for a flexible and customizable step in the tour. The component dynamically adjusts its styling based on the Material-UI theme.

## Props

- `header`: The header text of the step.
- `body`: The body text of the step.

## Example Usage

```jsx
import CustomStep from "./CustomStep";

const App = () => {
  return <CustomStep header="Step Header" body="Step Body Text" />;
};
```

## Styling

The CustomStep component uses Material-UI's theme to style the step. The styling includes:

- Custom typography and spacing for the header and body text.
- A left-aligned layout for the step content.

## Customization

The CustomStep component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The CustomStep component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the step is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the CustomStep component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the CustomStep component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
