# RoleButtonGroup Component

The RoleButtonGroup component is designed to display a group of buttons for selecting roles. It is a styled button group that customizes the appearance of the buttons based on their selection state.

## Properties

- `selectedRole`: The currently selected role.
- `handleRoleChange`: A function to handle the change of the selected role.

## Usage

To use the RoleButtonGroup component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import RoleButtonGroup from "./RoleButtonGroup";

const App = () => {
  const [selectedRole, setSelectedRole] = useState < string > "All";

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  return (
    <RoleButtonGroup
      selectedRole={selectedRole}
      handleRoleChange={handleRoleChange}
    />
  );
};
```

This will render a button group with the specified roles, allowing the user to select a role and updating the `selectedRole` state accordingly.

## Customization

The RoleButtonGroup component allows for customization through the `selectedRole` and `handleRoleChange` properties. You can pass any valid role and a function to handle the role change to this component.
