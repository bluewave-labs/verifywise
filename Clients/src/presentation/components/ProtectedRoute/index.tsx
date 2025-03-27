import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { ComponentType, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserExists } from "../../../application/authentication/authSlice";
import { getAllEntities } from "../../../application/repository/entity.repository"; // Import the checkUserExists function
import VWToast from "../../vw-v2-components/Toast";

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
        const userExists = response ?? false
     
        dispatch(setUserExists(userExists));     
     
        console.log("No auth token found, redirecting to login");
        console.log("Current location:", location.pathname);
        console.log("Auth state:", authState);
      } catch (error) {
        console.error("Error checking if user exists:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUserExistsInDatabase();
  }, [dispatch]);

  if (loading) {
    return <VWToast title="Loading..." />; // Show a loading indicator while checking user existence
  }

  // Allow access to RegisterAdmin if no users exist in the database and the current route is "/admin-reg"
  if (!authState.userExists && location.pathname === "/admin-reg") {
    return <Component {...rest} />;
  }

  // Redirect to /admin-reg if no users exist in the database and trying to access any other route
  if (!authState.userExists && location.pathname !== "/admin-reg") {
    return <Navigate to="/admin-reg" />;
  }

  // Redirect to login if user exists and trying to access "/admin-reg"
  if (authState.userExists && location.pathname === "/admin-reg") {
    return <Navigate to="/login" />;
  }

  if (authState.authToken && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  // Check authentication for protected routes (including root '/')
  if (
    (!authState.authToken || authState.authToken.trim() === "") &&
    !isPublicRoute
  ) {
    console.log("No auth token found, redirecting to login");
    console.log("Current location:", location.pathname);
    console.log("Auth state:", authState);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Allow access to public routes without authentication
  if (isPublicRoute) {
    return <Component {...rest} />;
  }

  return <Component {...rest} />;
};

export default ProtectedRoute;
