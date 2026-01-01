import { logEngine } from "../tools/log.engine";
import { FormValues } from "../validations/formValidation";
import { API_RESPONSES, UNEXPECTED } from "../constants/apiResponses";
import { createNewUser } from "../repository/user.repository";
import { ApiResponse, User } from "../../domain/types/User";

/**
 * User data for registration.
 */
interface RegisterUser {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email?: string;
  /** User's first name */
  firstname: string;
  /** User's last name */
  lastname: string;
  /** Role ID to assign to the user */
  roleId: number;
}

/**
 * Error response structure from API.
 */
interface ApiErrorResponse {
  /** HTTP status code */
  status?: number;
  /** Error data payload */
  data?: unknown;
}

/**
 * Custom hook for handling user registration.
 *
 * @returns {Object} Object containing the registerUser function
 *
 * @example
 * const { registerUser } = useRegisterUser();
 * const result = await registerUser({ values, user, setIsSubmitting }, token);
 */
const useRegisterUser = () => {
  const handleApiResponse = ({
    response,
    setIsSubmitting,
  }: {
    response: ApiResponse<User>;
    user: RegisterUser;
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
    user: RegisterUser;
    setIsSubmitting: (value: boolean) => void;
  }, userToken: string | null) => {
    try {
       const response = await createNewUser({
        userData: { ...values, role_id: user.roleId || 1 },
      }, {
        Authorization: `Bearer ${userToken || ""}`,
      });
      handleApiResponse({ response, user, setIsSubmitting });
      return {
        isSuccess: response.status,
        response: response,
      };
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      logEngine({
        type: "error",
        message: `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
      setIsSubmitting(false);
      return {
        isSuccess: apiError.status || false,
        response: apiError,
      };
    }
  };

  return { registerUser };
};

export default useRegisterUser;
