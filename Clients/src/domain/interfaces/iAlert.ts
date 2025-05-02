export interface alertState {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}
