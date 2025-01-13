# StatusLabel Component

The StatusLabel component is designed to display a label with a status indicator. It is a versatile component that can be used to convey the status of various elements within an application.

## Props

- `status`: The status of the label, which determines the color scheme. It can be one of the following: "up", "down", "pending", or "cannot resolve".
- `text`: The text to display inside the label.
- `customStyles`: Optional custom styles to apply to the label.

## Example Usage

```jsx
import StatusLabel from "./StatusLabel";

const App = () => {
  return <StatusLabel status="up" text="Operational" />;
};
```
