import { extractUserToken } from "./extractToken";
import { store } from "../redux/store";
import { useContext } from "react";
import { VerifyWiseContext } from "../contexts/VerifyWise.context";

interface LogProps {
  type: "info" | "error" | "event";
  message: string;
  timestamp?: Date;
}

export function logEngine(props: LogProps) {
  const { type, message, timestamp = new Date() } = props;

  // Get auth token from Redux store
  const state = store.getState();
  const authToken = state.auth.authToken;

  // Extract user info from token
  const tokenUser = authToken ? extractUserToken(authToken) : null;

  // Get users from VerifyWiseContext
  const { dashboardValues } = useContext(VerifyWiseContext);
  const users = dashboardValues?.users || [];

  // Find user in users list
  const contextUser = tokenUser?.id
    ? users.find((u: any) => u.id === tokenUser.id)
    : null;

  // Use context user or token user
  const user = contextUser || tokenUser || {};

  const logMessage = `LOG TYPE [${type.toUpperCase()}] | FOR THE USER WITH THE FOLLOWING DETAILS OF [ID: ${
    user?.id ?? "N/A"
  }, EMAIL: ${user?.email ?? "N/A"}, NAME: ${user?.name ?? "N/A"}, SURNAME: ${
    user?.surname ?? "N/A"
  }] | MESSAGE: [${message}] | OCCURRED AT [${timestamp.toISOString()}]`;

  if (type === "info") {
    console.info(logMessage);
  } else if (type === "error") {
    console.error(logMessage);
  } else if (type === "event") {
    console.log(logMessage);
  }
}
