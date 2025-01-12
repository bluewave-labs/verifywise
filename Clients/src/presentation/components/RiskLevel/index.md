# RiskLevel Component

The RiskLevel component is designed to display a form for selecting the likelihood and severity of a risk, and to calculate and display the corresponding risk level based on the selected inputs.

## Props

- `likelihood`: The likelihood of the risk occurring, represented as a number.
- `riskSeverity`: The severity of the risk, represented as a number.
- `handleOnSelectChange`: A function to handle changes in the select inputs for likelihood and risk severity.

## Functionality

- Displays a form with two select inputs for likelihood and risk severity.
- Calculates the risk level based on the selected likelihood and risk severity.
- Displays the calculated risk level with its corresponding color.

## Styling

The RiskLevel component uses Material-UI's theme to style the form and the risk level display. The styling includes:

- Customizable layout for the form and risk level display.
- Customizable typography for the form labels and risk level text.
- Customizable colors for the risk level display based on the calculated risk level.

## Customization

The RiskLevel component can be customized by modifying the thresholds for risk levels or by passing a custom theme to the Material-UI provider.

## Accessibility

The RiskLevel component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the component is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the RiskLevel component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the RiskLevel component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
