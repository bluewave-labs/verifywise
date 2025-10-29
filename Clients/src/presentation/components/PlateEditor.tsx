// src/components/PlateEditor.tsx
"use client";

import React from "react";
import DOMPurify from "dompurify";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
} from "@platejs/basic-nodes/react";

export interface PlateEditorProps {
  /** Editor input: HTML string */
  htmlValue?: string;
  /** Called on change with Slate value */
  onSlateChange?: (value: unknown[]) => void;
}

const PlateEditor: React.FC<PlateEditorProps> = ({
  htmlValue = "",
  onSlateChange,
}) => {
  const plugins = [
    BoldPlugin,
    ItalicPlugin,
    UnderlinePlugin,
    H1Plugin,
    H2Plugin,
    H3Plugin,
    BlockquotePlugin,
    // include other plugins like list, link, code, etc.
  ];

  const editor = usePlateEditor({
    plugins,
    value: [
      {
        type: "p",
        children: [{ text: "" }],
      },
    ],
  });

  // Deserializing HTML -> Slate
  React.useEffect(() => {
    if (!editor || htmlValue == null) return;

    try {
      const element = document.createElement("div");

      // Sanitize HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(htmlValue, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "b",
          "em",
          "i",
          "u",
          "underline",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "blockquote",
          "code",
          "pre",
          "ul",
          "ol",
          "li",
          "a",
          "img",
          "span",
          "div",
        ],
        ALLOWED_ATTR: [
          "href",
          "title",
          "alt",
          "src",
          "class",
          "id",
          "style",
          "target",
          "rel",
        ],
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
        ADD_ATTR: ["target"],
        FORBID_TAGS: [
          "script",
          "object",
          "embed",
          "iframe",
          "form",
          "input",
          "button",
        ],
        FORBID_ATTR: [
          "onerror",
          "onload",
          "onclick",
          "onmouseover",
          "onfocus",
          "onblur",
        ],
      });

      element.innerHTML = sanitizedHtml;

      const nodes = editor.api.html.deserialize({ element });

      if (Array.isArray(nodes) && nodes.length > 0) {
        const isValid = nodes.every(
          (node) => "type" in node && "children" in node
        );
        if (isValid) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          editor.tf.setValue(nodes as any); // force set the new value
        } else {
          console.warn("Invalid nodes received from deserialization:", nodes);
        }
      } else {
        console.warn("Deserialization returned empty or invalid value");
      }
    } catch (err) {
      console.error("Error during HTML deserialization:", err);
    }
  }, [htmlValue, editor]);

  return (
    <Plate editor={editor} onChange={({ value }) => onSlateChange?.(value)}>
      <PlateContent
        placeholder="Type your policy..."
        style={{
          minHeight: "200px",
          padding: "16px",
          border: "1px solid #ddd",
        }}
      />
    </Plate>
  );
};

export default PlateEditor;
