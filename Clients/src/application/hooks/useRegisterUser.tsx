import { createNewUser } from "../repository/entity.repository";
import { logEngine } from "../tools/log.engine";
import { FormValues } from "../validations/formValidation";
import { ALERT_TIMEOUT, API_RESPONSES, UNEXPECTED } from "../constants/apiResponses";
import { AlertType } from "../../presentation/pages/Authentication/RegisterUser";

interface User {
  id: string;
  email?: string;
  firstname: string;
  lastname: string;
}

const useRegisterUser = () => {

  const handleApiResponse = ({response, user, setAlert}: {response: Response, user: User, setAlert: (alert: AlertType | null) => void}) => {
    const config = API_RESPONSES[response.status] || UNEXPECTED;

    setAlert({
      variant: config.variant,
      body: config.message
    });

    logEngine({
      type: config.logType,
      message: config.message,
      user
    });

    setTimeout(() => setAlert(null), ALERT_TIMEOUT);
  };

  const registerUser = async ({
    values,
    user,
    setAlert
  }: {
    values: FormValues;
    user: User;
    setAlert: (alert: AlertType | null) => void;
  }) => {
    try {
      const response = await createNewUser({
        routeUrl: "/users/register",
        body: values
      });
      handleApiResponse({response, user, setAlert});
      return {
        isSuccess: response.status === 201
      };
    } catch (error) {
      setAlert({
        variant: "error",
        body: "An error occurred. Please try again.",
      });
      logEngine({
        type: "error",
        message: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        user,
      });
      setTimeout(() => setAlert(null), ALERT_TIMEOUT);
      return {
        isSuccess: false
      };
    }
  };

  return { registerUser };
};

export default useRegisterUser;
