export interface IMenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  highlightPaths?: string[];
  taskCount?: number;
  action?: () => void;
}

export interface IMenuGroup {
  name: string;
  items: IMenuItem[];
}
