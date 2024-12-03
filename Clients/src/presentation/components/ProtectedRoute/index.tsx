import "./index.css";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ComponentType } from "react";

interface ProtectedRouteProps {
  Component: ComponentType<any>;
  [key: string]: any;
}

const ProtectedRoute = ({ Component, ...rest }: ProtectedRouteProps) => {
  const authState = useSelector(
    (state: { auth: { authToken: string; userExists: boolean } }) => state.auth
  );
  const location = useLocation();

  // Check if the user is trying to access the "admin-reg" route
  if (location.pathname === "/admin-reg" && authState.userExists) {
    return <Navigate to="/" replace />;
  }

  return authState.authToken ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
