# BasicModal Component

The BasicModal component is designed to display a confirmation dialog for deleting a vendor. It is a versatile component that can be used to convey important messages or notifications within an application.

## Props

- `isOpen`: A boolean indicating whether the modal is open.
- `setIsOpen`: A function to set the modal's open state.
- `onDelete`: A function to be called when the delete button is clicked.

## Example Usage

```jsx
import BasicModal from "./BasicModal";

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onDelete = () => {
    console.log("Vendor deleted");
  };

  return (
    <BasicModal isOpen={isOpen} setIsOpen={setIsOpen} onDelete={onDelete} />
  );
};
```

## Styling

The BasicModal component uses Material-UI's theme to style the modal and its content. The styling includes:

- A modal with a specific width, height, and background color.
- A typography component with a specific font size and color for the title.
- A typography component with a specific font size and color for the description.
- Two buttons with specific styles for the cancel and delete actions.

## Customization

The BasicModal component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The BasicModal component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the modal and its content are accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the BasicModal component include:

- Adding support for different modal positions.
- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the BasicModal component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
