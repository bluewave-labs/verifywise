import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { clearAuthState } from "../redux/auth/authSlice";
import { resetUser } from "../utils/posthog";

/**
 * Custom hook for handling user logout
 *
 * @returns {Function} A function that handles the logout process
 */
const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Handles logging out the user
   * Clears the authentication state and navigates to the login page
   */
  const logout = async () => {
    // Reset PostHog user identification
    resetUser();

    // Clear the authentication token by dispatching the logout action
    dispatch(clearAuthState());

    // Navigate to the login page
    navigate("/login");
  };

  return logout;
};

export default useLogout; 