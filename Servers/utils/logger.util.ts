import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import * as fs from "fs";
import * as path from "path";

export const getEventsQuery = async (tenantId: string) => {
  const events = await sequelize.query(
    `SELECT * FROM "${tenantId}".event_logs ORDER BY timestamp DESC`,
    {
      type: QueryTypes.SELECT,
    }
  );
  return events;
};

export const getLogsQuery = async (tenantId: string) => {
  try {
    // Get current date in YYYY-MM-DD format (UTC to match the logger)
    const currentDate = new Date().toISOString().split("T")[0];
    const logFileName = `app-${currentDate}.log`;
    const logFilePath = path.join(__dirname, "..", "..", "logs", tenantId, logFileName);

    // Check if the log file exists
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
      message: `Successfully read last ${lastLines.length} lines`,
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
