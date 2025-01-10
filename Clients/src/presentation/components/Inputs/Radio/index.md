# Radio Component

The Radio component renders a custom radio button with a label and description. It is designed to be highly customizable and easy to use.

## Properties

- `checked`: Indicates whether the radio button is checked.
- `value`: The value of the radio button.
- `id`: The id of the radio button.
- `size`: The size of the radio button, which can be either "small" or "medium".
- `onChange`: The function to call when the radio button state changes.
- `title`: The title to display next to the radio button.
- `desc`: The description to display below the title.

## Usage

To use the Radio component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import Radio from "./Radio";

const App = () => {
  return (
    <Radio
      checked={true}
      value="option1"
      id="option1"
      size="medium"
      onChange={(event) => console.log(event.target.value)}
      title="Option 1"
      desc="Description for Option 1"
    />
  );
};
```

This will render a Radio component with the specified properties, allowing users to interact with the radio button and handling the state change accordingly.

## Customization

The Radio component allows for customization through its various properties. You can pass any valid values to these properties to change the behavior and appearance of the component.

## Features

- Supports custom styling through Material-UI's theme and sx properties.
- Supports custom error handling through the `error` property (not explicitly shown in the example).
- Supports custom size options for the radio button.
- Displays a custom checked icon for a unique look.
