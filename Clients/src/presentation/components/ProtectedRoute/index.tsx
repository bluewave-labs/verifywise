import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ComponentType, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserExists } from "../../../application/authentication/authSlice";

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

  useEffect(() => {
    // Check if user exists in the database
    const checkUserExists = async () => {
      const response = await fetch("/api/check-user-exists"); // Replace with your API endpoint
      const data = await response.json();
      dispatch(setUserExists(data.userExists));
    };

    checkUserExists();
  }, [dispatch]);

  // Redirect to "/admin-reg" if no user exists and the current path is not "/admin-reg"
  if (!authState.userExists && location.pathname !== "/admin-reg") {
    return <Navigate to="/admin-reg" replace />;
  }

  // Redirect to home if user exists and trying to access "/admin-reg"
  if (authState.userExists && location.pathname === "/admin-reg") {
    return <Navigate to="/" replace />;
  }

  return authState.authToken ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
