import { sequelize } from "../database/db";
import { IDashboard } from "../domain.layer/interfaces/i.Dashboard";
import { getAllProjectsQuery } from "./project.utils";

export const getDashboardDataQuery = async (
  tenant: string,
  userId: number,
  role: string
): Promise<IDashboard | null> => {
  const dashboard = {
    projects: 0,
    trainings: 0,
    models: 0,
    reports: 0,
    task_radar: {
      overdue: 0,
      due: 0,
      upcoming: 0,
    },
    projects_list: [],
  } as IDashboard;
  const projects = await getAllProjectsQuery({ userId, role }, tenant);
  dashboard.projects_list = projects;
  dashboard.projects = projects.length;

  const trainings = await sequelize.query(
    `SELECT COUNT(*) FROM "${tenant}".trainingregistar`
  ) as [{ count: string }[], number];
  dashboard.trainings = parseInt(trainings[0][0].count);

  const models = await sequelize.query(
    `SELECT COUNT(*) FROM "${tenant}".model_files`
  ) as [{ count: string }[], number];
  dashboard.models = parseInt(models[0][0].count);

  const reports = await sequelize.query(
    `SELECT COUNT(*) FROM "${tenant}".files AS f WHERE f.source::TEXT ILIKE '%report%'`
  ) as [{ count: string }[], number];
  dashboard.reports = parseInt(reports[0][0].count);

  return dashboard;
}