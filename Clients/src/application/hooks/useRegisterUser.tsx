import { logEngine } from "../tools/log.engine";
import { FormValues } from "../validations/formValidation";
import { API_RESPONSES, UNEXPECTED } from "../constants/apiResponses";
import { Create } from "@mui/icons-material";
import { createNewUser } from "../repository/user.repository";


interface User {
  id: string;
  email?: string;
  firstname: string;
  lastname: string;
  roleId: number;
}

const useRegisterUser = () => {
  const handleApiResponse = ({
    response,
    setIsSubmitting,
  }: {
    response: Response;
    user: User;
    setIsSubmitting: (value: boolean) => void;
  }) => {
    const config = API_RESPONSES[response.status] || UNEXPECTED;

    logEngine({
      type: config.logType,
      message: config.message,
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
        userData: { ...values, role_id: user.roleId || 1 },
      });
      handleApiResponse({ response, user, setIsSubmitting });
      return {
        isSuccess: response.status,
      };
    } catch (error) {
      logEngine({
        type: "error",
        message: `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
      setIsSubmitting(false);
      return {
        isSuccess: false,
      };
    }
  };

  return { registerUser };
};

export default useRegisterUser;
function createUser(arg0: { userData: { role_id: number; name: string; surname: string; email: string; password: string; confirmPassword: string; roleId?: number; organizationId?: number; }; }) {
  throw new Error("Function not implemented.");
}

