# VWAvatar Component

The VWAvatar component is designed to display a user's avatar with customizable size and styles. It can be used to represent a user in various parts of an application, such as profiles, comments, or chat interfaces.

## Properties

- `user`: An object containing the user's information, including `firstname`, `lastname`, and `pathToImage`.
- `size`: The size of the avatar, which can be "small", "medium", or "large".
- `sx`: Additional styles to apply to the avatar.

## Usage

To use the VWAvatar component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import Avatar from "./Avatar";

const user = {
  firstname: "John",
  lastname: "Doe",
  pathToImage: "path/to/image.jpg",
};

const App = () => {
  return <Avatar user={user} size="medium" sx={{ margin: "10px" }} />;
};
```

This will render a medium-sized avatar with the user's image and additional margin styles.

## Customization

The VWAvatar component allows for customization through the `sx` property. You can pass any valid CSS styles to this property to change the appearance of the avatar. For example, you can change the background color, border radius, or font size.

## Size Options

The component supports three size options: "small", "medium", and "large". Each size has a predefined set of dimensions and font sizes to ensure consistency across the application.

- "small": width=32, height=32, fontSize=13
- "medium": width=64, height=64, fontSize=22
- "large": width=128, height=128, fontSize=44

## Default Values

If no `user` or `size` properties are provided, the component will use default values. The default user has a firstname "F", lastname "L", and no path to an image. The default size is "small".
