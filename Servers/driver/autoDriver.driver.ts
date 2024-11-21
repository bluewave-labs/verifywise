// Purpose: Driver to insert mock data into the database.

import { Assessments } from "../mocks/assessment.mock.data";
import { mockControls } from "../mocks/control.mock.data";
import mockProjects from "../mocks/project.mock.data";
import mockProjectRisks from "../mocks/projectRisks.mock.data";
import { projectScopes } from "../mocks/projectScope.mock.data";
import { questions } from "../mocks/question.mock.data";
import { subcontrols } from "../mocks/subcontrol.mock.data";
import { subtopics } from "../mocks/subtopic.mock.data";
import { topics } from "../mocks/topic.mock.data";
import { users } from "../mocks/users.data";
import { vendors } from "../mocks/vendor.mock.data";
import mockVendorRisks from "../mocks/vendorRisk.mock.data";

import { Assessment } from "../models/assessment.model";
import { Control } from "../models/control.model";
import { Project } from "../models/project.model";
import { ProjectRisk } from "../models/projectRisk.model";
import { ProjectScope } from "../models/projectScope.model";
import { Question } from "../models/question.model";
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
} from "../utils/autoDriver.util";

interface TableEntry<T> {
  mockData: T[];
  tableName: string;
  createString: string;
  insertString: string;
  generateValuesString: (item: T) => string;
}

type TableList = [
  TableEntry<Assessment>,
  TableEntry<Control>,
  TableEntry<Project>,
  TableEntry<ProjectRisk>,
  TableEntry<ProjectScope>,
  TableEntry<Question>,
  TableEntry<Subcontrol>,
  TableEntry<Subtopic>,
  TableEntry<Topic>,
  TableEntry<User>,
  TableEntry<Vendor>,
  TableEntry<VendorRisk>
];

const insertQuery: TableList = [
  {
    mockData: Assessments,
    tableName: "assessments",
    createString: `CREATE TABLE assessments(
      id SERIAL PRIMARY KEY,
      project_id integer,
      CONSTRAINT assessments_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO assessments(project_id) VALUES ",
    generateValuesString: function (assessment: Assessment) {
      return `(${assessment.projectId})`;
    },
  },
  {
    mockData: mockControls,
    tableName: "controls",
    createString: `CREATE TABLE controls(
      id SERIAL PRIMARY KEY,
      project_id integer,
      status varchar(50),
      approver varchar(100),
      risk_review text,
      owner varchar(100),
      reviewer varchar(100),
      due_date DATE,
      implementation_details text,
      CONSTRAINT controls_project_id_fkey FOREIGN KEY (project_id)
      REFERENCES projects(id)
      ON DELETE SET NULL
    );`,
    insertString:
      "INSERT INTO controls(project_id, status, approver, risk_review, owner, reviewer, due_date, implementation_details) VALUES ",
    generateValuesString: function (control: Control) {
      return `(${control.projectId}, '${control.status}', '${
        control.approver
      }', '${control.riskReview}', '${control.owner}', '${
        control.reviewer
      }', '${control.dueDate.toISOString().split("T")[0]}', '${
        control.implementationDetails
      }')`;
    },
  },
  {
    mockData: mockProjects,
    tableName: "projects",
    createString: `CREATE TABLE projects(
      id SERIAL PRIMARY KEY,
      project_title varchar(255) NOT NULL,
      owner varchar(255) NOT NULL,
      users integer[] NOT NULL,
      start_date DATE NOT NULL,
      ai_risk_classification varchar(50) NOT NULL,
      type_of_high_risk_role varchar(50) NOT NULL,
      goal text,
      last_updated TIMESTAMP NOT NULL,
      last_updated_by varchar(255) NOT NULL
    )`,
    insertString:
      "INSERT INTO projects(project_title, owner, users, start_date, ai_risk_classification, type_of_high_risk_role, goal, last_updated, last_updated_by) VALUES ",
    generateValuesString: function (project: Project) {
      const usersArray = `{${project.users.join(",")}}`;
      return `('${project.project_title}', '${
        project.owner
      }', '${usersArray}', '${
        project.start_date.toISOString().split("T")[0]
      }', '${project.ai_risk_classification}', '${
        project.type_of_high_risk_role
      }', '${project.goal}', '${project.last_updated.toISOString()}', '${
        project.last_updated_by
      }')`;
    },
  },
  {
    mockData: mockProjectRisks,
    tableName: "projectrisks",
    createString: `CREATE TABLE projectrisks(
      id SERIAL PRIMARY KEY,
      project_id integer,
      risk_name varchar(255),
      risk_owner varchar(255),
      ai_lifecycle_phase varchar(255),
      risk_description text,
      risk_category varchar(255),
      impact varchar(255),
      assessment_mapping text,
      controls_mapping text,
      likelihood varchar(255),
      severity varchar(255),
      risk_level_autocalculated varchar(50) CHECK (risk_level_autocalculated IN ('No risk', 'Low risk', 'Medium risk', 'High risk', 'Very high risk')),
      review_notes text,
      mitigation_status varchar(255),
      current_risk_level varchar(255),
      deadline DATE,
      mitigation_plan text,
      implementation_strategy text,
      mitigation_evidence_document text,
      likelihood_mitigation varchar(255),
      risk_severity varchar(255),
      final_risk_level varchar(255),
      risk_approval varchar(255),
      approval_status varchar(255),
      date_of_assessment DATE,
      CONSTRAINT projectrisks_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    );`,
    insertString:
      "INSERT INTO projectrisks(project_id, risk_name, risk_owner, ai_lifecycle_phase, risk_description, risk_category, impact, assessment_mapping, controls_mapping, likelihood, severity, risk_level_autocalculated, review_notes, mitigation_status, current_risk_level, deadline, mitigation_plan, implementation_strategy, mitigation_evidence_document, likelihood_mitigation, risk_severity, final_risk_level, risk_approval, approval_status, date_of_assessment) VALUES ",
    generateValuesString: function (projectRisk: ProjectRisk) {
      return `(${projectRisk.project_id}, '${projectRisk.risk_name}', '${
        projectRisk.risk_owner
      }', '${projectRisk.ai_lifecycle_phase}', '${
        projectRisk.risk_description
      }', '${projectRisk.risk_category}', '${projectRisk.impact}', '${
        projectRisk.assessment_mapping
      }', '${projectRisk.controls_mapping}', '${projectRisk.likelihood}', '${
        projectRisk.severity
      }', '${projectRisk.risk_level_autocalculated}', '${
        projectRisk.review_notes
      }', '${projectRisk.mitigation_status}', '${
        projectRisk.current_risk_level
      }', '${projectRisk.deadline.toISOString().split("T")[0]}', '${
        projectRisk.mitigation_plan
      }', '${projectRisk.implementation_strategy}', '${
        projectRisk.mitigation_evidence_document
      }', '${projectRisk.likelihood_mitigation}', '${
        projectRisk.risk_severity
      }', '${projectRisk.final_risk_level}', '${projectRisk.risk_approval}', '${
        projectRisk.approval_status
      }', '${projectRisk.date_of_assessment.toISOString().split("T")[0]}')`;
    },
  },
  {
    mockData: projectScopes,
    tableName: "projectscopes",
    createString: `CREATE TABLE projectscopes(
      id SERIAL PRIMARY KEY,
      assessment_id integer,
      describe_ai_environment text,
      is_new_ai_technology boolean,
      uses_personal_data boolean,
      project_scope_documents text,
      technology_type varchar(255),
      has_ongoing_monitoring boolean,
      unintended_outcomes text,
      technology_documentation text,
      CONSTRAINT projectscopes_assessment_id_fkey FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE SET NULL
    );`,
    insertString:
      "INSERT INTO projectscopes(assessment_id, describe_ai_environment, is_new_ai_technology, uses_personal_data, project_scope_documents, technology_type, has_ongoing_monitoring, unintended_outcomes, technology_documentation) VALUES ",
    generateValuesString: function (projectScope: ProjectScope) {
      return `(${projectScope.assessmentId}, '${projectScope.describeAiEnvironment}', ${projectScope.isNewAiTechnology}, ${projectScope.usesPersonalData}, '${projectScope.projectScopeDocuments}', '${projectScope.technologyType}', ${projectScope.hasOngoingMonitoring}, '${projectScope.unintendedOutcomes}', '${projectScope.technologyDocumentation}')`;
    },
  },
  {
    mockData: questions,
    tableName: "questions",
    createString: `CREATE TABLE questions(
      id SERIAL PRIMARY KEY,
      subtopic_id integer,
      question_text text,
      answer_type varchar(50),
      evidence_file_required boolean,
      hint text,
      is_required boolean,
      priority_level varchar(50),
      evidence_files text[],
      CONSTRAINT fk_subtopic FOREIGN KEY (subtopic_id)
        REFERENCES subtopics (id)
        ON DELETE SET NULL
    );`,
    insertString:
      "INSERT INTO questions(subtopic_id, question_text, answer_type, evidence_file_required, hint, is_required, priority_level, evidence_files) VALUES ",
    generateValuesString: function (question: Question) {
      const evidenceFilesArray = question.evidenceFiles
        ? `{${question.evidenceFiles.join(",")}}`
        : "{}";
      return `(${question.subtopicId}, '${question.questionText}', '${question.answerType}', ${question.evidenceFileRequired}, '${question.hint}', ${question.isRequired}, '${question.priorityLevel}', '${evidenceFilesArray}')`;
    },
  },
  {
    mockData: subcontrols,
    tableName: "subcontrols",
    createString: `CREATE TABLE subcontrols(
      id SERIAL PRIMARY KEY,
      control_id integer,
      status varchar(50) CHECK (status IN ('Waiting', 'In progress', 'Done')),
      approver varchar(100),
      risk_review varchar(50) CHECK (risk_review IN ('Acceptable risk', 'Residual risk', 'Unacceptable risk')),
      owner varchar(100),
      reviewer varchar(100),
      due_date DATE,
      implementation_details text,
      evidence text,
      attachment text,
      feedback text,
      CONSTRAINT subcontrols_control_id_fkey FOREIGN KEY (control_id)
        REFERENCES controls(id)
        ON DELETE SET NULL
    );`,
    insertString:
      "INSERT INTO subcontrols(control_id, status, approver, risk_review, owner, reviewer, due_date, implementation_details, evidence, attachment, feedback) VALUES ",
    generateValuesString: function (subcontrol: Subcontrol) {
      return `(${subcontrol.controlId}, '${subcontrol.status}', '${
        subcontrol.approver
      }', '${subcontrol.riskReview}', '${subcontrol.owner}', '${
        subcontrol.reviewer
      }', '${subcontrol.dueDate.toISOString().split("T")[0]}', '${
        subcontrol.implementationDetails
      }', '${subcontrol.evidence}', '${subcontrol.attachment}', '${
        subcontrol.feedback
      }')`;
    },
  },
  {
    mockData: subtopics,
    tableName: "subtopics",
    createString: `CREATE TABLE subtopics(
      id SERIAL PRIMARY KEY,
      topic_id integer,
      name varchar(255),
      CONSTRAINT fk_topic FOREIGN KEY (topic_id)
        REFERENCES topics (id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO subtopics(topic_id, name) VALUES ",
    generateValuesString: function (subtopic: Subtopic) {
      return `(${subtopic.topicId}, '${subtopic.name}')`;
    },
  },
  {
    mockData: topics,
    tableName: "topics",
    createString: `CREATE TABLE topics(
      id SERIAL PRIMARY KEY,
      assessment_id integer,
      name varchar(255),
      CONSTRAINT fk_assessment FOREIGN KEY (assessment_id)
        REFERENCES assessments (id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO topics(assessment_id, name) VALUES ",
    generateValuesString: function (topic: Topic) {
      return `(${topic.assessmentId}, '${topic.title}')`;
    },
  },
  {
    mockData: users,
    tableName: "users",
    createString: `CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      name varchar(100),
      email varchar(255) UNIQUE,
      password_hash varchar(255),
      role integer,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      CONSTRAINT users_role_fkey FOREIGN KEY (role)
        REFERENCES roles(id)
        ON DELETE SET NULL
    )`,
    insertString:
      "INSERT INTO users(name, email, password_hash, role, created_at, last_login) VALUES ",
    generateValuesString: function (user: User) {
      return `('${user.name}', '${user.email}', '${user.password_hash}', ${
        user.role
      }, '${user.created_at.toISOString()}', '${user.last_login.toISOString()}')`;
    },
  },
  {
    mockData: vendors,
    tableName: "vendors",
    createString: `CREATE TABLE vendors(
      id SERIAL PRIMARY KEY,
      project_id integer,
      vendor_name varchar(255) NOT NULL,
      assignee varchar(100),
      vendor_provides text,
      website varchar(255),
      vendor_contact_person varchar(100),
      review_result varchar(50),
      review_status varchar(50),
      reviewer varchar(50),
      review_date TIMESTAMP,
      risk_status varchar(50),
      risk_description text,
      impact_description text,
      impact integer,
      probability integer,
      action_owner varchar(100),
      action_plan text,
      risk_severity integer,
      risk_level varchar(50),
      likelihood integer
    );`,
    insertString:
      "INSERT INTO vendors(project_id, vendor_name, assignee, vendor_provides, website, vendor_contact_person, review_result, review_status, reviewer, review_date, risk_status, risk_description, impact_description, impact, probability, action_owner, action_plan, risk_severity, risk_level, likelihood) VALUES ",
    generateValuesString: function (vendor: Vendor) {
      return `(${vendor.projectId}, '${vendor.vendorName}', '${
        vendor.assignee
      }', '${vendor.vendorProvides}', '${vendor.website}', '${
        vendor.vendorContactPerson
      }', '${vendor.reviewResult}', '${vendor.reviewStatus}', '${
        vendor.reviewer
      }', '${vendor.reviewDate.toISOString()}', '${vendor.riskStatus}', '${
        vendor.riskDescription
      }', '${vendor.impactDescription}', ${vendor.impact}, ${
        vendor.probability
      }, '${vendor.actionOwner}', '${vendor.actionPlan}', ${
        vendor.riskSeverity
      }, '${vendor.riskLevel}', ${vendor.likelihood})`;
    },
  },
  {
    mockData: mockVendorRisks,
    tableName: "vendorrisks",
    createString: `CREATE TABLE vendorrisks(
      id SERIAL PRIMARY KEY,
      project_id integer,
      vendor_name varchar(255) NOT NULL,
      risk_name varchar(255) NOT NULL,
      owner varchar(255) NOT NULL,
      risk_level varchar(50) CHECK (risk_level IN ('No risk', 'Low risk', 'Medium risk', 'High risk', 'Very high risk')),
      review_date TIMESTAMP NOT NULL,
      CONSTRAINT vendorrisks_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    );`,
    insertString:
      "INSERT INTO vendorrisks(project_id, vendor_name, risk_name, owner, risk_level, review_date) VALUES ",
    generateValuesString: function (vendorRisk: VendorRisk) {
      return `(${vendorRisk.project_id}, '${vendorRisk.vendor_name}', '${
        vendorRisk.risk_name
      }', '${vendorRisk.owner}', '${
        vendorRisk.risk_level
      }', '${vendorRisk.review_date.toISOString()}')`;
    },
  },
];

export async function insertMockData() {
  for (let entry of insertQuery) {
    let {
      mockData,
      tableName,
      createString,
      insertString,
      generateValuesString,
    } = entry;
    if (!(await checkTableExists(tableName as string))) {
      await createTable(createString as string);
    }
    await deleteExistingData(tableName as string);
    const values = mockData.map((d) => generateValuesString(d as any));
    insertString += values.join(",") + ";";
    await insertData(insertString as string);
  }
}
