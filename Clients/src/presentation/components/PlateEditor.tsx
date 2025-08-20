// src/components/PlateEditor.tsx
'use client';

import React from 'react';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
} from '@platejs/basic-nodes/react';

export interface PlateEditorProps {
  /** Editor input: HTML string */
  htmlValue?: string;
  /** Called on change with Slate value */
  onSlateChange?: (value: any[]) => void;
}

const PlateEditor: React.FC<PlateEditorProps> = ({
  htmlValue = '',
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
      type: 'p',
      children: [{ text: '' }],
    },
  ],
});


  // Deserializing HTML -> Slate
React.useEffect(() => {
  if (!editor || htmlValue == null) return;

  try {
    const element = document.createElement('div');
    element.innerHTML = htmlValue;

    const nodes = editor.api.html.deserialize({ element });

    if (Array.isArray(nodes) && nodes.length > 0) {
      const isValid = nodes.every((node) => 'type' in node && 'children' in node);
      if (isValid) {
        editor.tf.setValue(nodes as any); // force set the new value
      } else {
        console.warn('Invalid nodes received from deserialization:', nodes);
      }
    } else {
      console.warn('Deserialization returned empty or invalid value');
    }
  } catch (err) {
    console.error('Error during HTML deserialization:', err);
  }
}, [htmlValue, editor]);


console.log('htmlValue', htmlValue);

  return (
    <Plate editor={editor} onChange={({ value }) => onSlateChange?.(value)}>
      <PlateContent
        placeholder="Type your policy..."
        style={{
          minHeight: '200px',
          padding: '16px',
          border: '1px solid #ddd',
        }}
      />
    </Plate>
  );
};

export default PlateEditor;
