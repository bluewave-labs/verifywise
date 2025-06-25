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
import { ProjectFrameworksModel } from "../domain.layer/models/projectFrameworks/projectFrameworks.model";
import { TopicStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/topicStructEU.model";
import { SubtopicStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/subTopicStructEU.model";
import { QuestionStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/questionStructEU.model";
import { AnswerEUModel } from "../domain.layer/frameworks/EU-AI-Act/answerEU.model";
import { ControlCategoryStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/controlCategoryStructEU.model";
import { ControlStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/controlStructEU.model";
import { SubcontrolStructEUModel } from "../domain.layer/frameworks/EU-AI-Act/subControlStructEU.model";
import { ControlEUModel } from "../domain.layer/frameworks/EU-AI-Act/controlEU.model";
import { SubcontrolEUModel } from "../domain.layer/frameworks/EU-AI-Act/subControlEU.model";
import { AssessmentEUModel } from "../domain.layer/frameworks/EU-AI-Act/assessmentEU.model";
import { AnnexCategoryISOModel } from "../domain.layer/frameworks/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryISORisksModel } from "../domain.layer/frameworks/ISO-42001/annexCategoryISORIsks.model";
import { AnnexCategoryStructISOModel } from "../domain.layer/frameworks/ISO-42001/annexCategoryStructISO.model";
import { AnnexStructISOModel } from "../domain.layer/frameworks/ISO-42001/annexStructISO.model";
import { ClauseStructISOModel } from "../domain.layer/frameworks/ISO-42001/clauseStructISO.model";
import { SubClauseISOModel } from "../domain.layer/frameworks/ISO-42001/subClauseISO.model";
import { SubClauseStructISOModel } from "../domain.layer/frameworks/ISO-42001/subClauseStructISO.model";
import { OrganizationModel } from "../domain.layer/models/organization/organization.model";
import { TrainingRegistarModel } from "../domain.layer/models/trainingRegistar/trainingRegistar.model";

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
