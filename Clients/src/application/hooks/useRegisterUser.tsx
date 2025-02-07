import { createNewUser } from "../repository/entity.repository";
import { logEngine } from "../tools/log.engine";
import { FormValues } from "../validations/formValidation";
import { API_RESPONSES, UNEXPECTED } from "../constants/apiResponses";

interface User {
  id: string;
  email?: string;
  firstname: string;
  lastname: string;
}

const useRegisterUser = () => {

  const handleApiResponse = ({response, user, setIsSubmitting} : {response: Response, user: User, setIsSubmitting: (value: boolean) => void}) => {
    const config = API_RESPONSES[response.status] || UNEXPECTED;


    logEngine({
      type: config.logType,
      message: config.message,
      user
    });

    setIsSubmitting(false);
  };

  const registerUser = async ({
    values,
    user,
    setIsSubmitting,
  }: {
    values: FormValues;
    user: User;
    setIsSubmitting: (value: boolean) => void;
  }) => {
    try {
      const response = await createNewUser({
        routeUrl: "/users/register",
        body: values
      });
      handleApiResponse({response, user, setIsSubmitting});
      return {
        isSuccess: response.status === 201
      };
    } catch (error) {
      logEngine({
        type: "error",
        message: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        user,
      });
      setIsSubmitting(false);
      return {
        isSuccess: false
      };
    }
  };

  return { registerUser };
};

export default useRegisterUser;
