# NewControlPane Component

The NewControlPane component is designed to manage and save control pane data within an application. It provides a comprehensive interface for users to input and manage various aspects of a control pane, including its title, description, status, approver, risk review, owner, reviewer, and sub-controls.

## Props

- `id`: A unique identifier for the control pane.
- `numbering`: A string representing the numbering or label for the control pane.
- `isOpen`: A boolean indicating whether the modal is open.
- `handleClose`: A function to close the modal.
- `title`: The title of the control pane.
- `content`: The description or content of the control pane.
- `subControls`: An array of sub-control objects.
- `controlCategory`: The category of the control pane.
- `OnSave`: An optional function to be called when the control pane data is saved.

## State Management

The component manages its state using the `useState` hook from React. The state includes properties such as `controlId`, `controlTitle`, `controlDescription`, `status`, `approver`, `riskReview`, `owner`, `reviewer`, `description`, `date`, and `subControls`.

## Sub-Control State Management

Each sub-control is also managed using the `useState` hook. The sub-control state includes properties such as `controlId`, `subControlId`, `subControlTitle`, `subControlDescription`, `status`, `approver`, `riskReview`, `owner`, `reviewer`, `description`, `date`, `evidence`, and `feedback`.

## Functionality

The component provides the following functionalities:

- **Tab Navigation**: Users can navigate between different sub-controls using tabs.
- **Section Navigation**: Users can switch between different sections of a sub-control, including Overview, Evidence, and Auditor Feedback.
- **Data Input**: Users can input data for the control pane and its sub-controls, including text fields, dropdowns, and rich text editors.
- **Save Functionality**: Users can save the control pane data, which triggers a confirmation modal before proceeding.
- **Modal Management**: The component manages the state of the modal, including opening and closing it.

## Styling

The component uses Material-UI's theme to style its components, including the modal, tabs, buttons, and typography. The styling is designed to be visually appealing and easy to use.

## Customization

The component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the component is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the NewControlPane component include:

- Adding support for different types of inputs and fields.
- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the NewControlPane component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
