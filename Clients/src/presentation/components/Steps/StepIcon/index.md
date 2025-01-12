# CustomStepIcon Component

The CustomStepIcon component is designed to render a step icon based on the completion and active status of a step in a stepper.

## Props

- `completed`: Indicates if the step is completed.
- `active`: Indicates if the step is currently active.
- `error`: Indicates if the step has an error.

## Functionality

- Displays a CheckCircle icon if the step is completed.
- Displays a RadioButtonCheckedIcon if the step is not completed.
- The RadioButtonCheckedIcon changes color based on the active status of the step.

## Styling

The CustomStepIcon component uses Material-UI's theme to style the icon. The styling includes:

- Customizable colors for the icon based on the Material-UI theme.

## Customization

The CustomStepIcon component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The CustomStepIcon component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the component is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the CustomStepIcon component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the CustomStepIcon component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
