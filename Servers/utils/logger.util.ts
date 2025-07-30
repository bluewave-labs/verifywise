import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

export const getEventsQuery = async () => {
  const events = await sequelize.query("SELECT * FROM event_logs", {
    type: QueryTypes.SELECT,
  });
  return events;
};
