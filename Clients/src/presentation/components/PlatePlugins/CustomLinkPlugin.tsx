import { LinkPlugin } from "@platejs/link/react";
import { insertLink as plateInsertLink, wrapLink, unwrapLink } from "@platejs/link";
import { Range } from "slate";

/**
 * Custom LinkElement component for rendering links in the editor
 */
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

/**
 * Configured LinkPlugin with custom element rendering
 */
export const linkPlugin = LinkPlugin.configure({
  render: {
    node: LinkElement,
  },
});

/**
 * Insert or wrap a link in the editor
 * - If text is selected and no custom text provided: wraps the selection
 * - Otherwise: inserts a new link node
 */
export const insertLink = (editor: any, url: string, text?: string | null) => {
  if (!url) return;

  const { selection } = editor;

  // If there's a selection and no custom text provided, wrap the selection with link
  if (selection && !Range.isCollapsed(selection) && !text) {
    wrapLink(editor, { url, target: "_blank" });
  } else {
    // Insert new link with provided text or URL as display text
    plateInsertLink(editor, { url, text: text || url, target: "_blank" });
  }
};

/**
 * Remove link from the current selection
 */
export const removeLink = (editor: any) => {
  unwrapLink(editor);
};

/**
 * Check if the current selection is inside a link
 */
export const isLinkActive = (editor: any): boolean => {
  try {
    const [link] = editor.nodes({
      match: (n: any) => n.type === "a",
    });
    return !!link;
  } catch {
    return false;
  }
};

