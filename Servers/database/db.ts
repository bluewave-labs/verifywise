import dotenv from "dotenv";
import { Sequelize } from "sequelize-typescript";
import { RoleModel } from "../domain.layer/models/role/role.model";
import { AssessmentModel } from "../domain.layer/models/assessment/assessment.model";
import { ControlModel } from "../domain.layer/models/control/control.model";
import { ControlCategoryModel } from "../domain.layer/models/controlCategory/controlCategory.model";
import { FileModel } from "../domain.layer/models/file/file.model";
import { ProjectModel } from "../domain.layer/models/project/project.model";
import { ProjectRiskModel } from "../domain.layer/models/projectRisks/projectRisk.model";
import { ProjectScopeModel } from "../domain.layer/models/projectScope/projectScope.model";
import { ProjectsMembersModel } from "../domain.layer/models/projectsMembers/projectsMembers.model";
import { QuestionModel } from "../domain.layer/models/question/question.model";
import { SubcontrolModel } from "../domain.layer/models/subcontrol/subcontrol.model";
import { SubtopicModel } from "../domain.layer/models/subtopic/subtopic.model";
import { TopicModel } from "../domain.layer/models/topic/topic.model";
import { UserModel } from "../domain.layer/models/user/user.model";
import { VendorModel } from "../domain.layer/models/vendor/vendor.model";
import { VendorRiskModel } from "../domain.layer/models/vendorRisk/vendorRisk.model";
import { VendorsProjectsModel } from "../domain.layer/models/vendorsProjects/vendorsProjects.model";
import dbConfig from "./config/config";
import { Dialect } from "sequelize";
import { FrameworkModel } from "../domain.layer/models/frameworks/frameworks.model";
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
import { OrganizationModel } from "../domain.layer/models/organization/organization.model";
import { TrainingRegistarModel } from "../models/trainingRegistar.model";

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
    TrainingRegistarModel,
    OrganizationModel,
  ],
}) as Sequelize;

export { sequelize };
