import dotenv from "dotenv";
import { Sequelize } from "sequelize-typescript";
import { RoleModel } from "../models/role.model";
import { AssessmentModel } from "../models/assessment.model";
import { ControlModel } from "../models/control.model";
import { ControlCategoryModel } from "../models/controlCategory.model";
import { FileModel } from "../models/file.model";
import { ProjectModel } from "../models/project.model";
import { ProjectRiskModel } from "../models/projectRisk.model";
import { ProjectScopeModel } from "../models/projectScope.model";
import { ProjectsMembersModel } from "../models/projectsMembers.model";
import { QuestionModel } from "../models/question.model";
import { SubcontrolModel } from "../models/subcontrol.model";
import { SubtopicModel } from "../models/subtopic.model";
import { TopicModel } from "../models/topic.model";
import { UserModel } from "../models/user.model";
import { VendorModel } from "../models/vendor.model";
import { VendorRiskModel } from "../models/vendorRisk.model";
import { VendorsProjectsModel } from "../models/vendorsProjects.model";

dotenv.config();

const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "1377",
  database: process.env.DB_NAME || "verifywise",
  models: [
    AssessmentModel, ControlModel, ControlCategoryModel, FileModel, ProjectModel,
    ProjectRiskModel, ProjectScopeModel, ProjectsMembersModel, QuestionModel, RoleModel,
    SubcontrolModel, SubtopicModel, TopicModel, UserModel, VendorModel, VendorRiskModel,
    VendorsProjectsModel
  ],
});

export { sequelize };
