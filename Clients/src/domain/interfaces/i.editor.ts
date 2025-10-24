import { FileData } from "../types/File";

export interface IRichTextEditorProps {
  onContentChange?: (content: string) => void;
  headerSx?: object;
  bodySx?: object;
  initialContent?: string;
  isEditable?: boolean;
}

export interface AuditorFeedbackProps {
  activeSection?: string;
  feedback: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  files: FileData[];
  onFilesChange?: (files: FileData[]) => void;
  deletedFilesIds: number[];
  onDeletedFilesChange: (ids: number[]) => void;
  uploadFiles: FileData[];
  onUploadFilesChange: (files: FileData[]) => void;
  readOnly?: boolean;
}
