# Popup Component

The Popup component is designed to display a popup on a webpage. It utilizes the Material-UI library to create a customizable and responsive popup. The component dynamically adjusts its styling based on the Material-UI theme.

## Props

- `popupId`: The unique id of the popup.
- `popupContent`: The content to be displayed in the popup.
- `openPopupButtonName`: The name of the button that opens the popup.
- `popupTitle`: The title of the popup.
- `popupSubtitle`: An optional subtitle for the popup.
- `handleOpenOrClose`: An optional function to be called when the popup is opened or closed.
- `anchor`: The anchor element to which the popup is attached.

## Example Usage

```jsx
import Popup from "./Popup";

const App = () => {
  return (
    <Popup
      popupId="popup-1"
      popupContent={<div>Popup Content</div>}
      openPopupButtonName="Open Popup"
      popupTitle="Popup Title"
      handleOpenOrClose={() => console.log("Popup opened or closed")}
      anchor={document.getElementById("popup-anchor")}
    />
  );
};
```

## Styling

The Popup component uses Material-UI's theme to style the popup. The styling includes:

- Custom button styles for opening the popup.
- A close button for the popup.
- Customizable popup content.

## Customization

The Popup component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The Popup component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the popup is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the Popup component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the Popup component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
