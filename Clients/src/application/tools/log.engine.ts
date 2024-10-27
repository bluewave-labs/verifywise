interface LogProps {
  type: "info" | "error" | "event";
  message: string;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  };
  timestamp?: Date;
}

export function logEngine(props: LogProps) {
  const { type, message, user, timestamp = new Date() } = props;
  const logMessage = `LOG TYPE [${type.toUpperCase()}] | FOR THE USER WITH THE FOLLOWING DETAILS OF [ID: ${
    user?.id ?? "N/A"
  }, EMAIL: ${user?.email ?? "N/A"}, FIRSTNAME: ${
    user?.firstname ?? "N/A"
  }, LASTNAME: ${
    user?.lastname ?? "N/A"
  }] | MESSAGE: [${message}] | OCCURRED AT [${timestamp.toISOString()}]`;

  if (type === "info") {
    console.info(logMessage);
  } else if (type === "error") {
    console.error(logMessage);
  } else if (type === "event") {
    console.log(logMessage);
  }
}
