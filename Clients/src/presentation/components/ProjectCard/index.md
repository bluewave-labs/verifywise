# ProjectCard Component

The ProjectCard component is designed to display project information in a card format. It includes project title, owner, last updated date, progress bars for controls and requirements, and a view project button.

## Props

- `id`: The unique identifier for the project.
- `project_title`: The title of the project.
- `owner`: The identifier of the project owner.
- `last_updated`: The date the project was last updated.
- `projectAssessments`: An object containing the project's assessment information.
- `projectControls`: An object containing the project's control information.

## Example Usage

```jsx
import ProjectCard from "./ProjectCard";

const App = () => {
  return (
    <ProjectCard
      id={1}
      project_title="Project Example"
      owner="1"
      last_updated="2022-01-01"
      projectAssessments={{
        projectId: 1,
        totalAssessments: 100,
        doneAssessments: 50,
      }}
      projectControls={{
        projectId: 1,
        totalSubControls: 200,
        doneSubControls: 100,
      }}
    />
  );
};
```

## Styling

The ProjectCard component uses Material-UI's theme to style the card. The styling includes:

- Customizable card layout.
- Customizable typography for project title, owner, and last updated date.
- Customizable progress bars for controls and requirements.
- Customizable view project button.

## Customization

The ProjectCard component can be customized by passing a custom theme to the Material-UI provider. This allows for a high degree of flexibility in terms of styling and branding.

## Accessibility

The ProjectCard component is designed to be accessible and follows Material-UI's guidelines for accessibility. It includes attributes such as `aria-label` and `role` to ensure that the component is accessible to screen readers and other assistive technologies.

## Future Development

Future development plans for the ProjectCard component include:

- Enhancing the component's accessibility features.
- Improving the component's performance and optimization.

## Contributing

Contributions to the ProjectCard component are welcome. If you have any suggestions or improvements, please feel free to open an issue or submit a pull request.
