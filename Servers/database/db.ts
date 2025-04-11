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
import dbConfig from "./config/config";
import { Dialect } from "sequelize";

dotenv.config();

const conf = dbConfig.development;

const sequelize = new Sequelize(
  conf.database!,
  conf.username!,
  conf.password,
  {
    host: conf.host!,
    port: Number(conf.port!),
    dialect: conf.dialect! as Dialect,
    logging: false,
    models: [
      RoleModel,
      AssessmentModel,
      ControlModel,
      ControlCategoryModel,
      FileModel,
      ProjectModel,
      ProjectRiskModel,
      ProjectScopeModel,
      ProjectsMembersModel,
      QuestionModel,
      SubcontrolModel,
      SubtopicModel,
      TopicModel,
      UserModel,
      VendorModel,
      VendorRiskModel,
      VendorsProjectsModel
    ]
  }
) as Sequelize;

export { sequelize };
