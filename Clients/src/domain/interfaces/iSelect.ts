export interface BasicModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onDelete: (e: React.SyntheticEvent) => void;
  onCancel: (e: React.SyntheticEvent) => void;
  warningTitle: string;
  warningMessage: string;
  type: string;
}
