# BasicTable Component

The BasicTable component is designed to render a table with optional pagination, sorting options, row click handling, and custom styling.

## Props

- `data`: An object containing the data to be displayed in the table, including columns and rows.
- `paginated`: A boolean indicating whether pagination should be enabled.
- `reversed`: A boolean indicating whether the rows should be displayed in reverse order.
- `rowsPerPage`: The number of rows to display per page.
- `table`: The ID of the table container.
- `onRowClick`: An optional callback function to handle row click events.
- `label`: An optional label for the table items.
- `setSelectedRow`: A function to set the selected row.
- `setAnchorEl`: A function to set the anchor element for the context menu.

## Functionality

- Displays a table with a header and body.
- Supports dynamic data for the table rows.
- Includes optional pagination for easy navigation through large datasets.
- Supports custom styling through Material-UI's theme.
- Handles row click events and provides an optional callback function.
- Displays a label for the table items if provided.

## Styling

The BasicTable component uses Material-UI's theme to style the table. The styling includes:

- Customizable layout for the table.
- Customizable typography for the table header and body.
- Customizable colors for the table based on the Material-UI theme.

## Customization

The BasicTable component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The BasicTable component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the component is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the BasicTable component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the BasicTable component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
