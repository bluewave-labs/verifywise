import "./index.css";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import { ComponentType } from "react";

interface ProtectedRouteProps {
  Component: ComponentType<any>;
  [key: string]: any;
}

const ProtectedRoute = ({ Component, ...rest }: ProtectedRouteProps) => {
  const authState = useSelector(
    (state: { auth: { authToken: string } }) => state.auth
  );

  return authState.authToken ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
