# Datepicker Component

The Datepicker component is designed to provide a customizable date input field with a calendar icon. It utilizes Material-UI's DatePicker component to ensure a consistent look and feel across the application.

## Properties

- `label`: The label displayed next to the date input field.
- `isRequired`: Indicates if the date input is required.
- `isOptional`: Indicates if the date input is optional.
- `optionalLabel`: The label displayed next to the date input field indicating it's optional.
- `sx`: The style properties for the date input field.
- `date`: The current date value of the date input field.
- `error`: The error message to display if the date input is invalid.
- `handleDateChange`: The function to call when the date value changes.

## Usage

To use the Datepicker component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import Datepicker from "./Datepicker";

const App = () => {
  const [date, setDate] = useState(null);

  return (
    <Datepicker
      label="Select a Date"
      isRequired
      sx={{ width: 300 }}
      date={date}
      handleDateChange={(newDate) => setDate(newDate)}
      error={date ? "Invalid date format" : undefined}
    />
  );
};
```

This will render a Datepicker component with the specified properties, allowing users to select a date and handling the date change accordingly.

## Customization

The Datepicker component allows for customization through the `label`, `isRequired`, `isOptional`, `optionalLabel`, `sx`, `date`, `error`, and `handleDateChange` properties. You can pass any valid values to these properties to change the behavior and appearance of the component.

## Features

- Provides a customizable date input field with a calendar icon.
- Supports custom styling through the `sx` property.
- Allows for custom error handling through the `error` property.
- Supports custom date handling through the `handleDateChange` property.
- Can be marked as required or optional through the `isRequired` and `isOptional` properties.
