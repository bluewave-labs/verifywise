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
import { FrameworkModel } from "../models/frameworks.model";
import { ProjectFrameworksModel } from "../models/projectFrameworks.model";
import { TopicStructEUModel } from "../models/EU/topicStructEU.model";
import { SubtopicStructEUModel } from "../models/EU/subTopicStructEU.model";
import { QuestionStructEUModel } from "../models/EU/questionStructEU.model";
import { AnswerEUModel } from "../models/EU/answerEU.model";
import { ControlCategoryStructEUModel } from "../models/EU/controlCategoryStructEU.model";
import { ControlStructEUModel } from "../models/EU/controlStructEU.model";
import { SubcontrolStructEUModel } from "../models/EU/subControlStructEU.model";
import { ControlEUModel } from "../models/EU/controlEU.model";
import { SubcontrolEUModel } from "../models/EU/subControlEU.model";
import { AssessmentEUModel } from "../models/EU/assessmentEU.model";
import { AnnexCategoryISOModel } from "../models/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryISORisksModel } from "../models/ISO-42001/annexCategoryISORIsks.model";
import { AnnexCategoryStructISOModel } from "../models/ISO-42001/annexCategoryStructISO.model";
import { AnnexStructISOModel } from "../models/ISO-42001/annexStructISO.model";
import { ClauseStructISOModel } from "../models/ISO-42001/clauseStructISO.model";
import { SubClauseISOModel } from "../models/ISO-42001/subClauseISO.model";
import { SubClauseStructISOModel } from "../models/ISO-42001/subClauseStructISO.model";
import { OrganizationModel } from "../models/organization.model";

dotenv.config();

const conf = dbConfig.development;

const sequelize = new Sequelize(conf.database!, conf.username!, conf.password, {
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
    VendorsProjectsModel,
    FrameworkModel,
    ProjectFrameworksModel,
    AssessmentEUModel,
    TopicStructEUModel,
    SubtopicStructEUModel,
    QuestionStructEUModel,
    AnswerEUModel,
    ControlCategoryStructEUModel,
    ControlStructEUModel,
    SubcontrolStructEUModel,
    ControlEUModel,
    SubcontrolEUModel,
    AnnexCategoryISOModel,
    AnnexCategoryISORisksModel,
    AnnexCategoryStructISOModel,
    AnnexStructISOModel,
    ClauseStructISOModel,
    SubClauseISOModel,
    SubClauseStructISOModel,
    OrganizationModel,
  ],
}) as Sequelize;

export { sequelize };
