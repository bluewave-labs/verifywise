import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import * as fs from "fs";
import * as path from "path";

export const getEventsQuery = async () => {
  const events = await sequelize.query("SELECT * FROM event_logs", {
    type: QueryTypes.SELECT,
  });
  return events;
};

export const getLogsQuery = async () => {
  try {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split("T")[0];
    const logFileName = `app-${currentDate}.log`;
    const logFilePath = path.join(__dirname, "..", "..", "logs", logFileName);

    console.log("logFilePath ==>", logFilePath);
    // Check if the current day's log file exists
    if (!fs.existsSync(logFilePath)) {
      return {
        success: false,
        message: `Log file for today (${currentDate}) not found`,
        data: null,
      };
    }

    // Read the entire file
    const fileContent = fs.readFileSync(logFilePath, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

    // Get the last 500 lines (or all lines if less than 500)
    const lastLines = lines.slice(-500);

    return {
      success: true,
      message: `Successfully read last ${lastLines.length} lines from ${logFileName}`,
      data: lastLines,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error reading log file: ${error instanceof Error ? error.message : "Unknown error"}`,
      data: null,
    };
  }
};
