import * as fs from "fs";
import * as path from "path";

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

/**
 * Logs a message with a specified type, user details, and timestamp.
 * The log message is printed to the console and appended to a log file.
 *
 * @param props - The properties for the log message.
 * @param props.type - The type of the log message (e.g., "info", "error", "event").
 * @param props.message - The message to log.
 * @param props.user - The user details associated with the log message.
 * @param props.user.id - The ID of the user.
 * @param props.user.email - The email of the user.
 * @param props.user.firstname - The first name of the user.
 * @param props.user.lastname - The last name of the user.
 * @param [props.timestamp=new Date()] - The timestamp of when the log message occurred.
 */
export function logEngine(props: LogProps) {
  const { type, message, user, timestamp = new Date() } = props;

  const logMessage = `LOG TYPE [${type.toUpperCase()}] | FOR THE USER WITH THE FOLLOWING DETAILS OF [ID: ${
    user?.id ?? "N/A"
  }, EMAIL: ${user?.email ?? "N/A"}, FIRSTNAME: ${
    user?.firstname ?? "N/A"
  }, LASTNAME: ${
    user?.lastname ?? "N/A"
  }] | MESSAGE: [${message}] | OCCURED AT [${timestamp.toISOString()}]`;

  if (type === "info") {
    console.info(logMessage);
  } else if (type === "error") {
    console.error(logMessage);
  } else if (type === "event") {
    console.log(logMessage);
  }

  const logFilePath = path.join(__dirname, `${type}.log`);

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error(
        `Failed to write the log to the file ${type}.log in the path ${__dirname}`
      );
    }
  });
}
