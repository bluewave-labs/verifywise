# Fallback Component

The Fallback component is designed to display a fallback UI with a title, checks, and an optional link for admin users. It is a customizable component that can be used to visualize fallback scenarios in various parts of an application.

## Properties

- `title`: The title to display in the fallback UI.
- `checks`: An array of check descriptions to display.
- `link`: The link to navigate to when the button is clicked (only for admin users). Defaults to "/".
- `isAdmin`: Flag indicating if the user is an admin.

## Usage

To use the Fallback component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import Fallback from "./Fallback";

const App = () => {
  return (
    <Fallback
      title="Project Creation"
      checks={["Check project requirements", "Verify user permissions"]}
      link="/create-project"
      isAdmin={true}
    />
  );
};
```

This will render a fallback UI with the specified title, checks, and a link for admin users.

## Customization

The Fallback component allows for customization through the `title`, `checks`, `link`, and `isAdmin` properties. You can pass any valid title, checks, link, and isAdmin flag to this component to change its appearance.

## Features

- Displays a fallback UI with a title and checks.
- Supports an optional link for admin users.
- Customizable title, checks, and link.
- Conditional rendering based on the isAdmin flag.
