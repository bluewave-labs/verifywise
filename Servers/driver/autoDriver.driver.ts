// Purpose: Driver to insert mock data into the database.

import { Assessments } from "../mocks/assessment.mock.data";
import { mockControls } from "../mocks/control.mock.data";
import { ControlCategories } from "../mocks/controlCategory.mock.data";
import Projects from "../mocks/project.mock.data";
import mockProjectRisks from "../mocks/projectRisks.mock.data";
import { projectScopes } from "../mocks/projectScope.mock.data";
import { questions } from "../mocks/question.mock.data";
import { roles } from "../mocks/role.mock.data";
import { subcontrols } from "../mocks/subcontrol.mock.data";
import { subtopics } from "../mocks/subtopic.mock.data";
import { topics } from "../mocks/topic.mock.data";
import { users } from "../mocks/users.data";
import { vendors } from "../mocks/vendor.mock.data";
import mockVendorRisks from "../mocks/vendorRisk.mock.data";

import { Assessment } from "../models/assessment.model";
import { Control } from "../models/control.model";
import { ControlCategory } from "../models/controlCategory.model";
import { File } from "../models/file.model";
import { Project } from "../models/project.model";
import { ProjectRisk } from "../models/projectRisk.model";
import { ProjectScope } from "../models/projectScope.model";
import { Question } from "../models/question.model";
import { Role } from "../models/role.model";
import { Subcontrol } from "../models/subcontrol.model";
import { Subtopic } from "../models/subtopic.model";
import { Topic } from "../models/topic.model";
import { User } from "../models/user.model";
import { Vendor } from "../models/vendor.model";
import { VendorRisk } from "../models/vendorRisk.model";

import {
  deleteExistingData,
  checkTableExists,
  createTable,
  insertData,
  dropTable,
  checkDataExists,
} from "../utils/autoDriver.util";

interface TableEntry<T> {
  mockData: T[];
  tableName: string;
  createString: string;
  insertString: string;
  generateValuesString: (item: T) => string;
}

type TableList = [
  TableEntry<Role>,
  TableEntry<User>,
  TableEntry<Project>,
  TableEntry<Vendor>,
  TableEntry<Assessment>,
  TableEntry<ControlCategory>,
  TableEntry<Control>,
  TableEntry<Subcontrol>,
  TableEntry<ProjectRisk>,
  TableEntry<VendorRisk>,
  TableEntry<ProjectScope>,
  TableEntry<Topic>,
  TableEntry<Subtopic>,
  TableEntry<Question>,
  TableEntry<File>
];

const insertQuery: TableList = [
  {
    mockData: roles,
    tableName: "roles",
    createString: `CREATE TABLE roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      description TEXT
        );`,
    insertString: "INSERT INTO roles(name, description) VALUES ",
    generateValuesString: function (role: Role) {
      return `(
        '${role.name}',
        '${role.description}'
      )`;
    },
  },
  {
    mockData: users,
    tableName: "users",
    createString: `CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      surname VARCHAR(255),
      email VARCHAR(255),
      password_hash VARCHAR(255),
      role INT REFERENCES roles(id),
      created_at DATE,
      last_login DATE
    );`,
    insertString:
      "INSERT INTO users(name, surname, email, password_hash, role, created_at, last_login) VALUES ",
    generateValuesString: function (user: User) {
      return `(
        '${user.name}',
        '${user.surname}',
        '${user.email}',
        '${user.password_hash}',
        ${user.role},
        '${user.created_at.toISOString().split("T")[0]}',
        '${user.last_login.toISOString().split("T")[0]}'
      )`;
    },
  },
  {
    mockData: Projects,
    tableName: "projects",
    createString: `CREATE TABLE projects (
      id SERIAL PRIMARY KEY,
      project_title VARCHAR(255),
      owner INTEGER REFERENCES users(id),
      users TEXT,
      start_date DATE,
      ai_risk_classification VARCHAR(255),
      type_of_high_risk_role VARCHAR(255),
      goal VARCHAR(255),
      last_updated DATE,
      last_updated_by INTEGER REFERENCES users(id)
    );`,
    insertString:
      "INSERT INTO projects(project_title, owner, users, start_date, ai_risk_classification, type_of_high_risk_role, goal, last_updated, last_updated_by) VALUES ",
    generateValuesString: function (project: Project) {
      return `(
        '${project.project_title}',
        '${project.owner}',
        '${project.users}',
        '${project.start_date.toISOString().split("T")[0]}',
        '${project.ai_risk_classification}',
        '${project.type_of_high_risk_role}',
        '${project.goal}',
        '${project.last_updated.toISOString().split("T")[0]}',
        '${project.last_updated_by}'
      )`;
    },
  },
  {
    mockData: vendors,
    tableName: "vendors",
    createString: `CREATE TABLE vendors (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(id),
      vendor_name VARCHAR(255),
      assignee VARCHAR(255),
      vendor_provides TEXT,
      website VARCHAR(255),
      vendor_contact_person VARCHAR(255),
      review_result VARCHAR(255),
      review_status VARCHAR(255),
      reviewer VARCHAR(255),
      risk_status VARCHAR(255),
      review_date DATE,
      risk_description TEXT,
      impact_description TEXT,
      impact INT,
      probability FLOAT,
      action_owner VARCHAR(255),
      action_plan TEXT,
      risk_severity INT,
      risk_level VARCHAR(255),
      likelihood FLOAT
    );`,
    insertString:
      "INSERT INTO vendors(project_id, vendor_name, assignee, vendor_provides, website, vendor_contact_person, review_result, review_status, reviewer, risk_status, review_date, risk_description, impact_description, impact, probability, action_owner, action_plan, risk_severity, risk_level, likelihood) VALUES ",
    generateValuesString: function (vendor: Vendor) {
      return `(
        ${vendor.projectId},
        '${vendor.vendorName}',
        '${vendor.assignee}',
        '${vendor.vendorProvides}',
        '${vendor.website}',
        '${vendor.vendorContactPerson}',
        '${vendor.reviewResult}',
        '${vendor.reviewStatus}',
        '${vendor.reviewer}',
        '${vendor.riskStatus}',
        '${vendor.reviewDate.toISOString().split("T")[0]}',
        '${vendor.riskDescription}',
        '${vendor.impactDescription}',
        ${vendor.impact},
        '${vendor.probability}',
        '${vendor.actionOwner}',
        '${vendor.actionPlan}',
        ${vendor.riskSeverity},
        '${vendor.riskLevel}',
        '${vendor.likelihood}'
      )`;
    },
  },
  {
    mockData: Assessments,
    tableName: "assessments",
    createString: `CREATE TABLE assessments (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(id)
    );`,
    insertString: "INSERT INTO assessments(project_id) VALUES ",
    generateValuesString: function (assessment: Assessment) {
      return `(
        '${assessment.projectId}'
      )`;
    },
  },
  {
    mockData: ControlCategories,
    tableName: "controlcategories",
    createString: `CREATE TABLE controlcategories (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(id),
      name VARCHAR(255)
    );`,
    insertString: "INSERT INTO controlcategories(project_id, name) VALUES ",
    generateValuesString: function (controlCategory: ControlCategory) {
      return `(
        '${controlCategory.projectId}',
        '${controlCategory.name}'
      )`;
    },
  },
  {
    mockData: mockControls,
    tableName: "controls",
    createString: `CREATE TABLE controls (
      id SERIAL PRIMARY KEY,
      status VARCHAR(255),
      approver VARCHAR(255),
      risk_review TEXT,
      owner VARCHAR(255),
      reviewer VARCHAR(255),
      due_date DATE,
      implementation_details TEXT,
      control_group INT REFERENCES controlcategories(id)
    );`,
    insertString:
      "INSERT INTO controls(status, approver, risk_review, owner, reviewer, due_date, implementation_details, control_group) VALUES ",
    generateValuesString: function (control: Control) {
      return `(
        '${control.status}',
        '${control.approver}',
        '${control.riskReview}',
        '${control.owner}',
        '${control.reviewer}',
        '${control.dueDate.toISOString().split("T")[0]}',
        '${control.implementationDetails}',
        '${control.controlGroup}'
      )`;
    },
  },
  {
    mockData: subcontrols,
    tableName: "subcontrols",
    createString: `CREATE TABLE subcontrols (
      id SERIAL PRIMARY KEY,
      control_id INT REFERENCES controls(id),
      status VARCHAR(255),
      approver VARCHAR(255),
      risk_review TEXT,
      owner VARCHAR(255),
      reviewer VARCHAR(255),
      due_date DATE,
      implementation_details TEXT,
      evidence VARCHAR(255),
      feedback TEXT,
      evidenceFiles TEXT[],
      feedbackFiles TEXT[]
    );`,
    insertString:
      "INSERT INTO subcontrols(control_id, status, approver, risk_review, owner, reviewer, due_date, implementation_details, evidence, feedback, evidenceFiles, feedbackFiles) VALUES ",
    generateValuesString: function (subControl: Subcontrol) {
      return `(
        '${subControl.controlId}',
        '${subControl.status}',
        '${subControl.approver}',
        '${subControl.riskReview}',
        '${subControl.owner}',
        '${subControl.reviewer}',
        '${subControl.dueDate.toISOString().split("T")[0]}',
        '${subControl.implementationDetails}',
        '${subControl.evidence}',
        '${subControl.feedback}',
        ARRAY[]::TEXT[],
        ARRAY[]::TEXT[]
      )`;
    },
  },
  {
    mockData: mockProjectRisks,
    tableName: "projectrisks",
    createString: `CREATE TABLE projectrisks (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(id),
      risk_name VARCHAR(255),
      risk_owner VARCHAR(255),
      ai_lifecycle_phase VARCHAR(255),
      risk_description TEXT,
      risk_category VARCHAR(255),
      impact VARCHAR(255),
      assessment_mapping TEXT,
      controls_mapping TEXT,
      likelihood VARCHAR(255),
      severity VARCHAR(255),
      risk_level_autocalculated VARCHAR(255),
      review_notes TEXT,
      mitigation_status VARCHAR(255),
      current_risk_level VARCHAR(255),
      deadline DATE,
      mitigation_plan TEXT,
      implementation_strategy TEXT,
      mitigation_evidence_document VARCHAR(255),
      likelihood_mitigation VARCHAR(255),
      risk_severity VARCHAR(255),
      final_risk_level VARCHAR(255),
      risk_approval VARCHAR(255),
      approval_status VARCHAR(255),
      date_of_assessment DATE
    );`,
    insertString:
      "INSERT INTO projectrisks(project_id, risk_name, risk_owner, ai_lifecycle_phase, risk_description, risk_category, impact, assessment_mapping, controls_mapping, likelihood, severity, risk_level_autocalculated, review_notes, mitigation_status, current_risk_level, deadline, mitigation_plan, implementation_strategy, mitigation_evidence_document, likelihood_mitigation, risk_severity, final_risk_level, risk_approval, approval_status, date_of_assessment) VALUES ",
    generateValuesString: function (projectRisk: ProjectRisk) {
      return `(
        '${projectRisk.project_id}',
        '${projectRisk.risk_name}',
        '${projectRisk.risk_owner}',
        '${projectRisk.ai_lifecycle_phase}',
        '${projectRisk.risk_description}',
        '${projectRisk.risk_category}',
        '${projectRisk.impact}',
        '${projectRisk.assessment_mapping}',
        '${projectRisk.controls_mapping}',
        '${projectRisk.likelihood}',
        '${projectRisk.severity}',
        '${projectRisk.risk_level_autocalculated}',
        '${projectRisk.review_notes}',
        '${projectRisk.mitigation_status}',
        '${projectRisk.current_risk_level}',
        '${projectRisk.deadline.toISOString().split("T")[0]}',
        '${projectRisk.mitigation_plan}',
        '${projectRisk.implementation_strategy}',
        '${projectRisk.mitigation_evidence_document}',
        '${projectRisk.likelihood_mitigation}',
        '${projectRisk.risk_severity}',
        '${projectRisk.final_risk_level}',
        '${projectRisk.risk_approval}',
        '${projectRisk.approval_status}',
        '${projectRisk.date_of_assessment.toISOString().split("T")[0]}'
      )`;
    },
  },
  {
    mockData: mockVendorRisks,
    tableName: "vendorrisks",
    createString: `CREATE TABLE vendorrisks (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(id),
      vendor_name VARCHAR(255),
      risk_name VARCHAR(255),
      owner VARCHAR(255),
      risk_level VARCHAR(255),
      review_date DATE
    );`,
    insertString:
      "INSERT INTO vendorrisks(project_id, vendor_name, risk_name, owner, risk_level, review_date) VALUES ",
    generateValuesString: function (vendorRisk: VendorRisk) {
      return `(
        '${vendorRisk.project_id}',
        '${vendorRisk.vendor_name}',
        '${vendorRisk.risk_name}',
        '${vendorRisk.owner}',
        '${vendorRisk.risk_level}',
        '${vendorRisk.review_date.toISOString().split("T")[0]}'
      )`;
    },
  },
  {
    mockData: projectScopes,
    tableName: "projectscopes",
    createString: `CREATE TABLE projectscopes (
      id SERIAL PRIMARY KEY,
      assessment_id INT REFERENCES assessments(id),
      describe_ai_environment TEXT,
      is_new_ai_technology BOOLEAN,
      uses_personal_data BOOLEAN,
      project_scope_documents VARCHAR(255),
      technology_type VARCHAR(255),
      has_ongoing_monitoring BOOLEAN,
      unintended_outcomes TEXT,
      technology_documentation VARCHAR(255)
    );`,
    insertString:
      "INSERT INTO projectscopes(assessment_id, describe_ai_environment, is_new_ai_technology, uses_personal_data, project_scope_documents, technology_type, has_ongoing_monitoring, unintended_outcomes, technology_documentation) VALUES ",
    generateValuesString: function (projectScope: ProjectScope) {
      return `(
        '${projectScope.assessmentId}',
        '${projectScope.describeAiEnvironment}',
        '${projectScope.isNewAiTechnology}',
        '${projectScope.usesPersonalData}',
        '${projectScope.projectScopeDocuments}',
        '${projectScope.technologyType}',
        '${projectScope.hasOngoingMonitoring}',
        '${projectScope.unintendedOutcomes}',
        '${projectScope.technologyDocumentation}'
      )`;
    },
  },
  {
    mockData: topics,
    tableName: "topics",
    createString: `CREATE TABLE topics (
      id SERIAL PRIMARY KEY,
      assessment_id INT REFERENCES assessments(id),
      title VARCHAR(255)
        );`,
    insertString: "INSERT INTO topics(assessment_id, title) VALUES ",
    generateValuesString: function (topic: Topic) {
      return `(${topic.assessmentId}, '${topic.title}')`;
    },
  },
  {
    mockData: subtopics,
    tableName: "subtopics",
    createString: `CREATE TABLE subtopics (
      id SERIAL PRIMARY KEY,
      topic_id INT REFERENCES topics(id),
      name VARCHAR(255)
        );`,
    insertString: "INSERT INTO subtopics(topic_id, name) VALUES ",
    generateValuesString: function (subTopic: Subtopic) {
      return `(
        ${subTopic.topicId},
        '${subTopic.name}'
      )`;
    },
  },
  {
    mockData: questions,
    tableName: "questions",
    createString: `CREATE TABLE questions (
      id SERIAL PRIMARY KEY,
      subtopic_id INT REFERENCES subtopics(id),
      question_text TEXT,
      answer_type VARCHAR(255),
      evidence_file_required BOOLEAN,
      hint TEXT,
      is_required BOOLEAN,
      priority_level VARCHAR(255),
      evidence_files TEXT[],
      answer TEXT
    );`,
    insertString:
      "INSERT INTO questions(subtopic_id, question_text, answer_type, evidence_file_required, hint, is_required, priority_level, evidence_files, answer) VALUES ",
    generateValuesString: function (question: Question) {
      return `(
        ${question.subtopicId},
        '${question.questionText}',
        '${question.answerType}',
        ${question.evidenceFileRequired},
        '${question.hint}',
        ${question.isRequired},
        '${question.priorityLevel}',
        ARRAY[]::TEXT[],
        '${question.answer}'
      )`;
    },
  },
  {
    mockData: [] as File[],
    tableName: "files",
    createString: `CREATE TABLE files (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      content BYTEA NOT NULL
    );`,
    insertString: "INSERT INTO files(filename, content) VALUES ",
    generateValuesString: (file: File) => {
      return `(
        '${file.filename}',
        '${file.content}'
      )`;
    },
  },
];

const deleteQueryExecutionOrder = [
  "questions", "subtopics", "topics", "projectscopes", "projectrisks", "vendorrisks",
  "subcontrols", "controls", "controlcategories", "assessments", "vendors", "projects"
]

export async function insertMockData() {
  for (let entry of insertQuery) {
    let {
      mockData,
      tableName,
      createString,
      insertString,
      generateValuesString,
    } = entry;
    await createTable(createString as string)
    if (tableName === "users" || tableName === "roles") {
      const values = mockData.map((d) => generateValuesString(d as any));
      insertString += values.join(",") + ";";
      await insertData(insertString as string);
    }
    // if (!(await checkTableExists(tableName as string))) {
    //   await createTable(createString as string);
    // }
    // if (await checkDataExists(tableName) === 1) {
    //   continue
    // }
    // const values = mockData.map((d) => generateValuesString(d as any));
    // insertString += values.join(",") + ";";
    // await insertData(insertString as string);
  }
}

export async function deleteMockData() {
  for (let tableName of deleteQueryExecutionOrder) {
    await deleteExistingData(tableName)
    await dropTable(tableName)
  }
}
