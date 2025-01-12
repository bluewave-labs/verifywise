# PageTour Component

The PageTour component is designed to guide users through a series of steps on a webpage. It utilizes the react-joyride library to create an interactive tour experience. The component dynamically adjusts its styling based on the Material-UI theme.

## Props

- `steps`: An array of steps to be included in the tour.
- `run`: A boolean indicating whether the tour should run automatically.
- `onFinish`: An optional function to be called when the tour is finished or skipped.

## Example Usage

```jsx
import PageTour from "./PageTour";

const App = () => {
  const steps = [
    {
      target: ".first-step",
      content: "This is the first step of the tour.",
    },
    {
      target: ".second-step",
      content: "This is the second step of the tour.",
    },
  ];

  const handleTourFinish = () => {
    console.log("Tour finished or skipped.");
  };

  return <PageTour steps={steps} run={true} onFinish={handleTourFinish} />;
};
```

## Styling

The PageTour component uses Material-UI's theme to style the tour. The styling includes:

- Custom typography and spacing for the step content.
- A beacon to highlight the target element for each step.
- Customizable button styles for navigation and closing the tour.

## Customization

The PageTour component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The PageTour component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the tour is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the PageTour component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the PageTour component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
