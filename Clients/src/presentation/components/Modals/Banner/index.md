# Banner Component

The Banner component is designed to display a banner with a close icon at the bottom right corner of the screen. It is a versatile component that can be used to convey important messages or notifications within an application.

## Props

- `onClose`: A function to be called when the close icon is clicked.
- `bannerText`: The text to be displayed in the banner.
- `bannerWidth`: The width of the banner.

## Example Usage

```jsx
import Banner from "./Banner";

const App = () => {
  return (
    <Banner
      onClose={() => console.log("Banner closed")}
      bannerText="This is a banner message"
      bannerWidth="300px"
    />
  );
};
```

## Styling

The Banner component uses Material-UI's theme to style the banner and its close icon. The styling includes:

- A fixed position at the bottom right corner of the screen.
- A paper component with a specific width, height, and color.
- A typography component with a specific font size and color.
- A close icon with a cursor pointer and specific margins.

## Customization

The Banner component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The Banner component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the banner and its close icon are accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the Banner component include:

- Adding support for different banner positions.
- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the Banner component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
