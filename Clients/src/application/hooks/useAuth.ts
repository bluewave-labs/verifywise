import { useSelector } from "react-redux";
import { extractUserToken } from "../tools/extractToken";

export const useAuth = () => {
  const token = useSelector((state: any) => state.auth?.authToken);
  const userToken = token ? extractUserToken(token) : null;
  
  return {
    token,
    userToken,
    userRoleName: userToken?.roleName || "",
    userId: userToken?.id ? parseInt(userToken.id) : null,
    organizationId: userToken?.organizationId ? parseInt(userToken.organizationId) : null,
    isAuthenticated: !!token,
  };
};
