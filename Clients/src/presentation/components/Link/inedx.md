# Link Component

The Link component is designed to render a styled link based on the provided level. It is a versatile component that can be used to create visually appealing links within an application.

## Props

- `level`: The level of the link, which determines its styling. It can be one of the following: "primary", "secondary", "tertiary", or "error".
- `label`: The text to be displayed for the link.
- `url`: The URL that the link points to.

## Example Usage

```jsx
import Link from "./Link";

const App = () => {
  return (
    <Link level="primary" label="Visit Our Website" url="https://example.com" />
  );
};
```

## Styling

The Link component uses Material-UI's theme to style the link based on the provided level. The styling for each level is as follows:

- `primary`: The primary link style uses the theme's primary text color and has no additional styling.
- `secondary`: The secondary link style uses the theme's secondary text color and has a hover effect that maintains the same color.
- `tertiary`: The tertiary link style uses the theme's tertiary text color, has a dashed underline, and a hover effect that changes the background color to the theme's background fill color.
- `error`: The error link style uses the theme's error main color and has a hover effect that changes the color to the theme's error dark color.

## Customization

The Link component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The Link component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `target="_blank"` and `rel="noreferrer"` to ensure that links open in a new tab and do not pass the referrer information.
