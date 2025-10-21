export interface ITabBarProps {
  tabs: string[];
  value?: number;
  onChange?: (event: React.SyntheticEvent, newValue: number) => void;
  variant?: "standard" | "scrollable" | "fullWidth";
  indicatorColor?: string;
  textColor?: string;
  selectedTextColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  sx?: object;
}
