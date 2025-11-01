/**
 * Handles the display of an alert by setting the alert properties and
 * automatically clearing the alert after a specified timeout.
 *
 * @param {HandleAlertProps} props - The properties for handling the alert.
 * @param {string} props.variant - The variant of the alert (e.g., success, error).
 * @param {string} props.body - The body message of the alert.
 * @param {string} props.title - The title of the alert.
 * @param {React.Dispatch<React.SetStateAction<AlertProps | null>>} props.setAlert - The function to set the alert state.
 * @returns {() => void} A function to clear the timeout for the alert.
 */
import { AlertProps } from "../../domain/interfaces/iAlert";
import { AlertModel } from "../../domain/models/Common/alert/alert.model";

// Legacy interface for backward compatibility
interface HandleAlertProps extends AlertProps {
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | null>>;
}

// New interface for AlertModel
interface HandleAlertModelProps {
  variant: "success" | "info" | "warning" | "error";
  body: string;
  title?: string;
  alertTimeout?: number;
  setAlert: React.Dispatch<React.SetStateAction<AlertModel | null>>;
}

const ALERT_TIMEOUT = 2500;

// Legacy function for backward compatibility
const handleAlert = ({ variant, body, title, setAlert, alertTimeout = ALERT_TIMEOUT }: HandleAlertProps) => {
  setAlert({
    variant,
    title,
    body,
  });
  const timeoutId = setTimeout(() => {
    setAlert(null);
  }, alertTimeout);
  return () => clearTimeout(timeoutId);
};

// New function for AlertModel
const handleAlertModel = ({ variant, body, title, setAlert, alertTimeout = ALERT_TIMEOUT }: HandleAlertModelProps) => {
  const alertInstance = AlertModel.createAlert({
    variant,
    title,
    body,
    isToast: false,
    visible: true
  } as AlertModel);
  
  setAlert(alertInstance);
  const timeoutId = setTimeout(() => {
    setAlert(null);
  }, alertTimeout);
  return () => clearTimeout(timeoutId);
};

export { handleAlert, handleAlertModel };
