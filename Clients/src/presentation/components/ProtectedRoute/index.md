# ProtectedRoute Component

The ProtectedRoute component is designed to protect routes from unauthorized access. It checks the authentication state and redirects the user to the appropriate page based on their authentication status.

## Props

- `Component`: The component to be rendered if the user is authenticated.
- `...rest`: Additional props to be passed to the component.

## Example Usage

```jsx
import ProtectedRoute from "./ProtectedRoute";
import MyComponent from "./MyComponent";

const App = () => {
  return <ProtectedRoute Component={MyComponent} />;
};
```

## Functionality

- Checks if the user exists in the database using the `checkUserExists` function.
- If the user exists, it sets the `userExists` state to `true`.
- If the user does not exist and the current path is not "/admin-reg", it redirects to "/admin-reg".
- If the user exists and is trying to access "/admin-reg", it redirects to "/".
- If the user is not authenticated, it redirects to "/login".

## Styling

The ProtectedRoute component does not have any specific styling as it is a utility component for authentication.

## Customization

The ProtectedRoute component can be customized by modifying the authentication logic or the redirect paths.

## Accessibility

The ProtectedRoute component does not have any specific accessibility features as it is a utility component for authentication.

## Future Development

Future development plans for the ProtectedRoute component include:

- Enhancing the authentication logic to include more advanced checks.
- Improving the component's performance and optimization.

## Contributing

Contributions to the ProtectedRoute component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
