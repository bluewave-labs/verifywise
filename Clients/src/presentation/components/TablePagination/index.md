# TablePaginationActions Component

The TablePaginationActions component is designed to render pagination actions (first, previous, next, last) for a table. It provides a simple way to navigate through pages of data.

## Props

- `count`: The total number of items.
- `page`: The current page number.
- `rowsPerPage`: The number of rows per page.
- `onPageChange`: A callback function to handle page change events.

## Functionality

- Displays buttons for first, previous, next, and last page navigation.
- Handles page change events and calls the `onPageChange` callback with the new page number.
- Disables navigation buttons when they would move beyond the first or last page.

## Styling

The TablePaginationActions component uses Material-UI's theme to style the pagination buttons. The styling includes:

- Customizable layout for the pagination actions.
- Customizable typography for the pagination buttons.
- Customizable colors for the pagination buttons based on the Material-UI theme.

## Customization

The TablePaginationActions component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The TablePaginationActions component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` to ensure that the component is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the TablePaginationActions component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the TablePaginationActions component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
