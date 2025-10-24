export interface IPageTourStep {
  target: string;
  content: {
    header?: string;
    body: string;
    icon?: React.ReactNode;
  };
  placement?:
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "top-start"
    | "bottom-start"
    | "bottom-end"
    | "top-end";
}
