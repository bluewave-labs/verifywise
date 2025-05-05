/**
 * Props for the CloseButton component.
 *
 * @interface CloseIconProps
 * @property {string} text - The color of the close icon.
 */
export interface CloseIconProps {
  text: string;
}

export interface IconButtonProps {
  id: number;
  onDelete: () => void;
  onEdit: () => void;
  warningTitle: string;
  warningMessage: string;
  type: string;
  onMouseEvent: (event: React.SyntheticEvent) => void;
}
