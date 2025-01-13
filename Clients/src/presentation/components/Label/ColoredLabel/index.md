# ColoredLabel Component

The ColoredLabel component is designed to render a label with a specified color. It takes two props: `label` and `color`. The `label` prop is the text to be displayed inside the label, and the `color` prop is the color of the label. The `color` prop should be a valid hex color code.

If the provided `color` is invalid, the component defaults to the theme's border color. The component also applies a lightened version of the specified color to the border and background of the label to create a visually appealing effect.

## Props

- `label`: The text to be displayed inside the label.
- `color`: The color of the label. It should be a valid hex color code.

## Example Usage

```jsx
import ColoredLabel from "./ColoredLabel";

const App = () => {
  return <ColoredLabel label="Hello World" color="#007bff" />;
};
```
