# ImageField Component

The ImageField component allows users to upload an image by either clicking to select a file or by dragging and dropping the file into the designated area. It displays a preview of the uploaded image if the image is valid and not loading.

## Properties

- `id`: The id for the file input field.
- `src`: The source URL of the image to be displayed.
- `loading`: A flag indicating whether the image is currently loading.
- `onChange`: The function to handle the change event when a file is selected.

## Usage

To use the ImageField component, simply import it and pass the required properties as needed. Here's an example:

```jsx
import ImageField from "./ImageField";

const App = () => {
  const [src, setSrc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files![0];
    // Handle file upload logic here
    // For example, you might want to upload the file to a server and then set the src state to the uploaded image URL
    // setLoading(true);
    // // Assuming uploadImage is a function that uploads the file and returns a promise with the uploaded image URL
    // uploadImage(file).then((url) => {
    //   setSrc(url);
    //   setLoading(false);
    // });
  };

  return (
    <ImageField
      id="image-input"
      src={src}
      loading={loading}
      onChange={handleImageChange}
    />
  );
};
```

This will render an ImageField component with the specified properties, allowing users to upload an image and handling the image change event accordingly.

## Customization

The ImageField component allows for customization through its various properties. You can pass any valid values to these properties to change the behavior and appearance of the component.

## Features

- Allows users to upload an image by clicking or dragging and dropping.
- Displays a preview of the uploaded image if it is valid and not loading.
- Supports custom styling through Material-UI's theme and sx properties.
- Supports custom error handling through the `error` property (not explicitly shown in the example).
- Supports custom loading state handling through the `loading` property.
