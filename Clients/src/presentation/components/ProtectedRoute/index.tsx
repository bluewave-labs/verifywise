import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ComponentType, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { clearAuthState, setUserExists } from "../../../application/authentication/authSlice";
import { getAllEntities } from "../../../application/repository/entity.repository"; // Import the checkUserExists function
import CustomizableToast from "../../vw-v2-components/Toast";

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

  // List of public routes that don't need authentication
  const publicRoutes = [
    "/login",
    "/admin-reg",
    "/user-reg",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/set-new-password",
    "/reset-password-continue",
  ];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    // Check if user exists in the database
    const checkUserExistsInDatabase = async () => {
      try {
        const response = await getAllEntities({
          routeUrl: "/users/check/exists",
        });
        const userExists = response ?? false;
        // if (!userExists) {
        //   dispatch(clearAuthState())
        // }

        dispatch(setUserExists(userExists));
      } catch (error) {
        console.error("Error checking if user exists:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUserExistsInDatabase();
  }, [dispatch]);

  if (loading) {
    return <CustomizableToast title="Loading..." />; // Show a loading indicator while checking user existence
  }

  console.log(
    "Multi-tenant mode active - processing route:",
    location.pathname
  );

  // Always allow access to login and register routes in multi-tenant mode
  if (location.pathname === "/login" || location.pathname === "/register") {
    console.log("Allowing access to login/register route");
    return <Component {...rest} />;
  }

  // Redirect to login if trying to access "/admin-reg" (legacy route)
  if (location.pathname === "/admin-reg") {
    console.log("Redirecting admin-reg to login");
    return <Navigate to="/login" />;
  }

  // // For root route and any other route, redirect to login if no users exist
  // if (!authState.userExists) {
  //   console.log("No users exist, redirecting to login");
  //   return <Navigate to="/login" />;
  // }

  // If users exist and we have an auth token, allow access to protected routes
  if (authState.authToken && authState.authToken.trim() !== "") {
    return <Component {...rest} />;
  }

  // If users exist but no auth token, redirect to login
  // return <Navigate to="/login" replace state={{ from: location }} />;

  // Single-tenant authentication logic (only reached if not multi-tenant)
  if (authState.authToken && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  // Check authentication for protected routes (including root '/')
  if (
    (!authState.authToken || authState.authToken.trim() === "") &&
    !isPublicRoute
  ) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Allow access to public routes without authentication
  if (isPublicRoute) {
    return <Component {...rest} />;
  }

  return <Component {...rest} />;
};

export default ProtectedRoute;
