import { logEngine } from "../tools/log.engine";
import { API_RESPONSES, UNEXPECTED } from "../constants/apiResponses";
import { signupNewUser } from "../repository/user.repository";
import { ApiResponse, User } from "../../domain/types/User";

interface SignupData {
  name: string;
  surname: string;
  email: string;
  password: string;
}

const useSignupUser = () => {
  const handleApiResponse = ({
    response,
    setIsSubmitting,
  }: {
    response: ApiResponse<User>;
    setIsSubmitting: (value: boolean) => void;
  }) => {
    const config = API_RESPONSES[response.status] || UNEXPECTED;

    logEngine({
      type: config.logType,
      message: config.message,
    });

    setIsSubmitting(false);
  };

  const signup = async ({
    userData,
    setIsSubmitting,
  }: {
    userData: SignupData;
    setIsSubmitting: (value: boolean) => void;
  }) => {
    try {
      const response = await signupNewUser({ userData });
      handleApiResponse({ response, setIsSubmitting });
      return {
        isSuccess: response.status,
        response: response,
      };
    } catch (error: any) {
      setIsSubmitting(false);
      
      logEngine({
        type: "error",
        message: "Signup failed.",
      });

      return {
        isSuccess: error.status || 500,
        response: error,
      };
    }
  };

  return { signup };
};

export default useSignupUser;