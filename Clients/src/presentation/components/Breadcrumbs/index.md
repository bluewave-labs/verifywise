# Breadcrumbs Component

The Breadcrumbs component is designed to render a breadcrumb navigation using Material-UI components. It allows for easy navigation between pages by displaying a trail of breadcrumbs that represent the user's path.

## Properties

- `list`: An array of breadcrumb items, each item should have a `name` and `path` property.

## Usage

To use the Breadcrumbs component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import Breadcrumbs from "./Breadcrumbs";

const breadcrumbList = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

const App = () => {
  return <Breadcrumbs list={breadcrumbList} />;
};
```

This will render a breadcrumb navigation with the specified items.

## Customization

The Breadcrumbs component allows for customization through Material-UI's styling options. You can pass custom styles to the component to change its appearance.

## Default Values

If no `list` property is provided, the component will not render any breadcrumbs.
