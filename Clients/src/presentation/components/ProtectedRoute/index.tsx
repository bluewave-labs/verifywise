import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ComponentType, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserExists } from "../../../application/authentication/authSlice";
import { checkUserExists } from "../../../application/repository/entity.repository"; // Import the checkUserExists function

interface ProtectedRouteProps {
  Component: ComponentType<any>;
  [key: string]: any;
}

const ProtectedRoute = ({ Component, ...rest }: ProtectedRouteProps) => {
  const authState = useSelector(
    (state: { auth: { authToken: string; userExists: boolean } }) => state.auth
  );
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in the database
    const checkUserExistsInDatabase = async () => {
      try {
        const data = await checkUserExists({
          routeUrl: "/users/check/exists",
        });
        console.log("Data ==> ", data);
        if (data) {
          dispatch(setUserExists(true));
          console.log("authState.userExists ==> ", authState.userExists);
        } else {
          dispatch(setUserExists(false));
        }
      } catch (error) {
        console.error("Error checking if user exists:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserExistsInDatabase();
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking user existence
  }

  // Redirect to login if user exists and trying to access "/admin-reg"
  if (authState.userExists && location.pathname === "/admin-reg") {
    return <Navigate to="/login" replace />;
  }

  // Allow access to RegisterAdmin if no users exist in the database
  if (!authState.userExists) {
    return <Navigate to="/admin-reg" replace />;
  }

  return authState.authToken ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
