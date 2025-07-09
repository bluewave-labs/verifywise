import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ComponentType, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserExists } from "../../../application/authentication/authSlice";
import { getAllEntities } from "../../../application/repository/entity.repository"; // Import the checkUserExists function
import CustomizableToast from "../../vw-v2-components/Toast";
import { ENV_VARs } from "../../../../env.vars";

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

  const isMultiTenant = ENV_VARs.IS_MULTI_TENANT ?? false;

  // Debug logging
  console.log("ProtectedRoute Debug:");
  console.log("- isMultiTenant:", isMultiTenant);
  console.log("- ENV_VARs.IS_MULTI_TENANT:", ENV_VARs.IS_MULTI_TENANT);
  console.log(
    "- import.meta.env.VITE_IS_MULTI_TENANT:",
    import.meta.env.VITE_IS_MULTI_TENANT
  );
  console.log("- userExists:", authState.userExists);
  console.log("- current path:", location.pathname);

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

  // Multi-tenant flow: Always show login by default, with register option
  if (isMultiTenant) {
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

    // For root route and any other route, redirect to login if no users exist
    if (!authState.userExists) {
      console.log("No users exist, redirecting to login");
      return <Navigate to="/login" />;
    }

    // If users exist and we have an auth token, allow access to protected routes
    if (authState.authToken && authState.authToken.trim() !== "") {
      return <Component {...rest} />;
    }

    // If users exist but no auth token, redirect to login
    return <Navigate to="/login" replace state={{ from: location }} />;
  } else {
    console.log(
      "Single-tenant mode active - processing route:",
      location.pathname
    );

    // Single-tenant flow: Show admin registration if no users exist
    // Allow access to RegisterAdmin if no users exist in the database and the current route is "/admin-reg"
    if (!authState.userExists && location.pathname === "/admin-reg") {
      console.log("Allowing access to admin-reg (no users exist)");
      return <Component {...rest} />;
    }

    // Redirect to /admin-reg if no users exist in the database and trying to access any other route
    if (!authState.userExists && location.pathname !== "/admin-reg") {
      console.log("No users exist, redirecting to admin-reg");
      return <Navigate to="/admin-reg" />;
    }

    // Redirect to login if user exists and trying to access "/admin-reg"
    if (authState.userExists && location.pathname === "/admin-reg") {
      console.log("Users exist, redirecting admin-reg to login");
      return <Navigate to="/login" />;
    }
  }

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
