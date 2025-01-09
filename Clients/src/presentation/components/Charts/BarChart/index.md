# BarChart Component

The BarChart component is designed to display a bar chart with tooltips for each check. It is a customizable component that can be used to visualize check data in various parts of an application.

## Properties

- `checks`: An array of check objects to be displayed in the bar chart.

## Usage

To use the BarChart component, simply import it and pass the required `checks` property as needed. Here's an example:

```jsx
import BarChart from "./BarChart";

const checksArray = [
  { createdAt: new Date(), status: true, responseTime: 100 },
  { createdAt: new Date(), status: false, responseTime: 200 },
  // Add more checks as needed
];

const App = () => {
  return <BarChart checks={checksArray} />;
};
```

This will render a bar chart with tooltips for each check, displaying the creation date, status, and response time of the check.

## Customization

The BarChart component allows for customization through the `checks` property. You can pass any valid check objects to this property to change the data displayed in the chart.

## Features

- If there is only one check, it sets its response time to 50.
- If there are fewer than 25 checks, it fills the remaining slots with placeholders.
- Each check is rendered as a bar with a tooltip that shows additional information:
  - The creation date of the check.
  - A status indicator (success or error).
  - The response time of the check.
- The tooltip is styled using the theme properties and includes custom offsets and styles.
