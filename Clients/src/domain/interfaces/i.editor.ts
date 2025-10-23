export interface IRichTextEditorProps {
  onContentChange?: (content: string) => void;
  headerSx?: object;
  bodySx?: object;
  initialContent?: string;
  isEditable?: boolean;
}
