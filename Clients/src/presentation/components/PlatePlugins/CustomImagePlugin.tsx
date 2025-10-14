import { useState } from "react";
import { createPlatePlugin } from "platejs/react";
import { useFocused, useSelected } from "platejs/react";

export const ImageElement = (props: any) => {
  const { attributes, children, element } = props;
  const selected = useSelected();
  const focused = useFocused();
  const [error, setError] = useState(false);

  const src = element.url || element.src || "";

  return (
    <div
      {...attributes}
      contentEditable={false}
      style={{ display: "inline-block", position: "relative" }}
    >
      {!error ? (
        <img
          src={src}
          alt={element.alt || ""}
          style={{
            maxWidth: "100%",
            borderRadius: "8px",
            boxShadow: selected && focused ? "0 0 0 2px #3182ce" : "none",
          }}
          onError={() => setError(true)}
        />
      ) : (
        <div
          style={{
            background: "#f56565",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          Image not found
        </div>
      )}
      {children}
    </div>
  );
};

export const imagePlugin = createPlatePlugin({
  key: "image",
  node: {
    isElement: true,
    isVoid: true,
    component: ImageElement,
  },
});

export const insertImage = (editor: any, url: string, alt = "") => {
  editor.tf.insertNodes({
    type: "image",
    url,
    alt,
    children: [{ text: "" }],
  });
};