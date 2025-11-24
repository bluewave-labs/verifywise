import { createPlatePlugin } from "platejs/react";

export const LinkElement = (props: any) => {
  const { attributes, children, element } = props;
  const url = element.url || element.href || "";

  return (
    <a
      {...attributes}
      className="slate-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#3182ce",
        textDecoration: "underline",
        cursor: "pointer",
      }}
      onClick={(e) => {
        // Let CMD/CTRL-click open in a new tab, but prevent full reload otherwise
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }}
    >
      {children}
    </a>
  );
};

export const linkPlugin = createPlatePlugin({
  key: "link",
  node: {
    isElement: true,
    component: LinkElement,
  },
});

export const insertLink = (editor: any, url: string, text?: string | null) => {
  if (!url) return;

  editor.tf.insertNodes({
    type: "link",
    url,
    children: text ? [{ text }] : [{ text: url }],
  });
};

