export class AlertModel {
  variant!: "success" | "info" | "warning" | "error";
  title?: string;
  body!: string;
  isToast?: boolean;
  hasIcon?: boolean;
  alertTimeout?: number;
  visible?: boolean;

  constructor(data: AlertModel) {
    this.variant = data.variant;
    this.title = data.title;
    this.body = data.body;
    this.isToast = data.isToast;
    this.hasIcon = data.hasIcon;
    this.alertTimeout = data.alertTimeout;
    this.visible = data.visible;
  }

  static createAlert(data: AlertModel): AlertModel {
    return new AlertModel(data);
  }

  static createSuccessAlert(title: string, body: string, isToast: boolean = false): AlertModel {
    return new AlertModel({
      variant: "success",
      title,
      body,
      isToast,
      hasIcon: true,
      visible: true
    } as AlertModel);
  }

  static createErrorAlert(title: string, body: string, isToast: boolean = false): AlertModel {
    return new AlertModel({
      variant: "error",
      title,
      body,
      isToast,
      hasIcon: true,
      visible: true
    } as AlertModel);
  }

  static createWarningAlert(title: string, body: string, isToast: boolean = false): AlertModel {
    return new AlertModel({
      variant: "warning",
      title,
      body,
      isToast,
      hasIcon: true,
      visible: true
    } as AlertModel);
  }

  static createInfoAlert(title: string, body: string, isToast: boolean = false): AlertModel {
    return new AlertModel({
      variant: "info",
      title,
      body,
      isToast,
      hasIcon: true,
      visible: true
    } as AlertModel);
  }

  hide(): AlertModel {
    return new AlertModel({
      ...this,
      visible: false
    } as AlertModel);
  }

  show(): AlertModel {
    return new AlertModel({
      ...this,
      visible: true
    } as AlertModel);
  }
}