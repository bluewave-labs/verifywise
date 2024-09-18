/**
 * ProtectedRoute component is a higher-order component that wraps around
 * another component to provide route protection based on authentication state.
 * It checks if the user is authenticated by inspecting the authToken from the
 * Redux store. If the user is authenticated, it renders the wrapped component.
 * Otherwise, it redirects the user to the login page.
 *
 * @component
 * @param {ComponentType<any>} Component - The component to be rendered if the user is authenticated.
 * @param {object} rest - Additional props to be passed to the wrapped component.
 * @returns {JSX.Element} - The rendered component if authenticated, or a redirect to the login page.
 */

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
