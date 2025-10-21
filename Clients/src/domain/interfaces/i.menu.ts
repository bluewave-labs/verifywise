export interface IMenuItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  highlightPaths?: string[];
  taskCount?: number;
}

export interface IMenuGroup {
  name: string;
  items: IMenuItem[];
}
