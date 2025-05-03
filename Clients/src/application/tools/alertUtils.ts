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

interface HandleAlertProps extends AlertProps {
  setAlert: React.Dispatch<React.SetStateAction<AlertProps | null>>;
}

const ALERT_TIMEOUT = 2500;

const handleAlert = ({ variant, body, title, setAlert }: HandleAlertProps) => {
  setAlert({
    variant,
    title,
    body,
  });
  const timeoutId = setTimeout(() => {
    setAlert(null);
  }, ALERT_TIMEOUT);
  return () => clearTimeout(timeoutId);
};

export { handleAlert };
