export interface HelpSection {
  title:string;
  content:string;
}

export interface HelperDrawerProps {
  pageTitle: string;
  overview: string;
  sections: HelpSection[];
  isOpen: boolean;
  onClose: () => void;
}
