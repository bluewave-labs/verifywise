# AccordionTable Component

The AccordionTable component is designed to render a table with accordion functionality. It displays a table header and body, with each row in the body capable of expanding to reveal additional content.

## Props

- `id`: A unique identifier for the table.
- `cols`: An array of table columns, each represented as an object with `id` and `name` properties.
- `rows`: An array of table rows, each containing data to be displayed in the table.
- `controlCategory`: A string indicating the category of control for the table.

## Functionality

- Displays a table with a header and body.
- Each row in the body can be clicked to expand and reveal additional content.
- Supports dynamic data for the table rows.
- Includes a modal for displaying detailed information about a selected row.

## Styling

The AccordionTable component uses Material-UI's theme to style the table. The styling includes:

- Customizable layout for the table.
- Customizable typography for the table header and body.
- Customizable colors for the table based on the Material-UI theme.

## Customization

The AccordionTable component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The AccordionTable component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the component is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the AccordionTable component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the AccordionTable component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
