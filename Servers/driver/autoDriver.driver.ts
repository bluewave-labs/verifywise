import { assessmentTrackers } from "../mocks/assessmentTrackers/assessmentTrackers.data";
import { complianceLists } from "../mocks/complianceLists/complianceLists.data";
import { complianceTrackers } from "../mocks/complianceTrackers/complianceTrackers.data";
import { projects } from "../mocks/projects/projects.data";
import { questions } from "../mocks/questions/questions.data";
import { requirements } from "../mocks/requirements/requirements.data";
import { risks } from "../mocks/risks/risks.data";
import { roles } from "../mocks/roles/roles.data";
import { sections } from "../mocks/sections/sections.data";
import { subrequirements } from "../mocks/subrequirements/subrequirements.data";
import { users } from "../mocks/users/users.data";
import { vendorRisks } from "../mocks/vendorRisks/vendorRisks.data";
import { vendors } from "../mocks/vendors/vendors.data";
import { AssessmentTracker } from "../models/AssessmentTracker";
import { ComplianceList } from "../models/ComplianceList";
import { ComplianceTracker } from "../models/ComplianceTracker";
import { Project } from "../models/Project";
import { Question } from "../models/Question";
import { Requirement } from "../models/Requirement";
import { Risk } from "../models/Risk";
import { Role } from "../models/Role";
import { Section } from "../models/Section";
import { Subrequirement } from "../models/Subrequirement";
import { User } from "../models/User";
import { Vendor } from "../models/Vendor";
import { VendorRisk } from "../models/VendorRisk";
import { deleteExistingData, checkTableExists, createTable, insertData } from "../utils/autoDriver.util";

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
  TableEntry<ComplianceTracker>,
  TableEntry<AssessmentTracker>,
  TableEntry<Risk>,
  TableEntry<VendorRisk>,
  TableEntry<ComplianceList>,
  TableEntry<Requirement>,
  TableEntry<Subrequirement>,
  TableEntry<Section>,
  TableEntry<Question>
]

const insertQuery: TableList = [
  {
    mockData: roles,
    tableName: "roles",
    createString: `CREATE TABLE roles(
      id SERIAL PRIMARY KEY,
      name varchar(100) NOT NULL,
      description text
    );`,
    insertString: "INSERT INTO roles(id, name, description) VALUES ",
    generateValuesString: function (role: Role) { return `(${role.id}, '${role.name}', '${role.description}')` }
  },
  {
    mockData: users,
    tableName: "users",
    createString: `CREATE TABLE users(
      id integer PRIMARY KEY,
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
    insertString: "INSERT INTO users(id, name, email, password_hash, role, created_at, last_login) VALUES ",
    generateValuesString: function (user: User) { return `(${user.id}, '${user.name}', '${user.email}', '${user.password_hash}', ${user.role}, '${user.created_at.toISOString()}', '${user.last_login.toISOString()}')` },
  },
  {
    mockData: projects,
    tableName: "projects",
    createString: `CREATE TABLE projects(
      id integer PRIMARY KEY,
      name varchar(255) not null,
      description text,
      last_updated date NOT NULL,
      owner_id integer,
      compliance_status varchar(50),
      controls_completed integer DEFAULT 0,
      requirements_completed integer DEFAULT 0,
      CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE SET NULL
    )`,
    insertString: "INSERT INTO projects(id, name, description, last_updated, owner_id, compliance_status, controls_completed, requirements_completed)	VALUES ",
    generateValuesString: function (project: Project) { return `(${project.id}, '${project.name}', '${project.description}', '${project.last_updated.toISOString().split("T")[0]}', ${project.owner_id}, '${project.compliance_status}', ${project.controls_completed}, ${project.requirements_completed})` },
  },
  {
    mockData: vendors,
    tableName: "vendors",
    createString: `CREATE TABLE vendors(
      id integer PRIMARY KEY,
      name varchar(255) NOT NULL,
      project_id integer,
      description text,
      website varchar(255),
      contact_person varchar(100),
      review_result varchar(50),
      review_status varchar(50),
      reviewer_id integer,
      review_date timestamp,
      risk_status varchar(50),
      CONSTRAINT vendors_reviewer_id_fkey FOREIGN KEY (reviewer_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
      CONSTRAINT vendors_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO vendors(id, name, project_id, description, website, contact_person, review_result, review_status, reviewer_id, review_date, risk_status) VALUES ",
    generateValuesString: function (vendor: Vendor) { return `(${vendor.id}, '${vendor.name}', ${vendor.project_id}, '${vendor.description}', '${vendor.website}', '${vendor.contact_person}', '${vendor.review_result}', '${vendor.review_status}', ${vendor.reviewer_id}, '${vendor.review_date.toISOString()}', '${vendor.risk_status}')` },
  },
  {
    mockData: complianceTrackers,
    tableName: "compliancetrackers",
    createString: `CREATE TABLE compliancetrackers(
      id integer PRIMARY KEY,
      project_id integer,
      compliance_status integer NOT NULL,
      pending_audits integer DEFAULT 0,
      completed_assessments integer DEFAULT 0,
      implemented_controls integer DEFAULT 0,
      CONSTRAINT compliancetracker_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO compliancetrackers(id, project_id, compliance_status, pending_audits, completed_assessments, implemented_controls) VALUES ",
    generateValuesString: function (complianceTracker: ComplianceTracker) { return `(${complianceTracker.id}, ${complianceTracker.project_id}, ${complianceTracker.compliance_status}, ${complianceTracker.pending_audits}, ${complianceTracker.completed_assessments}, ${complianceTracker.implemented_controls})` },
  },
  {
    mockData: assessmentTrackers,
    tableName: "assessmenttrackers",
    createString: `CREATE TABLE assessmenttrackers(
      id integer PRIMARY KEY,
      project_id integer,
      name varchar(255),
      status varchar(50),
      CONSTRAINT assessmenttrackers_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO assessmenttrackers(id, project_id, name, status) VALUES ",
    generateValuesString: function (assessmentTracker: AssessmentTracker) { return `(${assessmentTracker.id}, ${assessmentTracker.project_id}, '${assessmentTracker.name}', '${assessmentTracker.status}')` },
  },
  {
    mockData: risks,
    tableName: "risks",
    createString: `CREATE TABLE risks(
      id integer PRIMARY KEY,
      project_id integer,
      risk_description text,
      impact varchar(50),
      probability varchar(50),
      owner_id integer,
      severity varchar(50),
      likelihood varchar(50),
      risk_level varchar(50),
      CONSTRAINT risks_owner_id_fkey FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
      CONSTRAINT risks_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO risks(id, project_id, risk_description, impact, probability, owner_id, severity, likelihood, risk_level) VALUES ",
    generateValuesString: function (risk: Risk) { return `(${risk.id}, ${risk.project_id}, '${risk.risk_description}', '${risk.impact}', '${risk.probability}', ${risk.owner_id}, '${risk.severity}', '${risk.likelihood}', '${risk.risk_level}')` },
  },
  {
    mockData: vendorRisks,
    tableName: "vendorrisks",
    createString: `CREATE TABLE vendorrisks(
      id integer PRIMARY KEY,
      vendor_id integer,
      risk_description text,
      impact_description text,
      project_id integer,
      probability varchar(50),
      impact varchar(50),
      action_plan text,
      action_owner_id integer,
      risk_severity varchar(50),
      likelihood varchar(50),
      risk_level varchar(50),
      CONSTRAINT vendorrisks_action_owner_id_fkey FOREIGN KEY (action_owner_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
      CONSTRAINT vendorrisks_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,
      CONSTRAINT vendorrisks_vendor_id_fkey FOREIGN KEY (vendor_id)
        REFERENCES vendors(id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO vendorrisks(id, vendor_id, risk_description, impact_description, project_id, probability, impact, action_plan, action_owner_id, risk_severity, likelihood, risk_level) VALUES ",
    generateValuesString: function (vendorRisk: VendorRisk) { return `(${vendorRisk.id}, ${vendorRisk.vendor_id}, '${vendorRisk.risk_description}', '${vendorRisk.impact_description}', ${vendorRisk.project_id}, '${vendorRisk.probability}', '${vendorRisk.impact}', '${vendorRisk.action_plan}', ${vendorRisk.action_owner_id}, '${vendorRisk.risk_severity}', '${vendorRisk.likelihood}', '${vendorRisk.risk_level}')` },
  },
  {
    mockData: complianceLists,
    tableName: "compliancelists",
    createString: `CREATE TABLE IF NOT EXISTS compliancelists(
      id integer PRIMARY KEY,
      compliance_tracker_id integer,
      name varchar(255),
      description text,
      CONSTRAINT compliancelists_compliance_tracker_id_fkey FOREIGN KEY (compliance_tracker_id)
        REFERENCES compliancetrackers (id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO compliancelists(id, compliance_tracker_id, name, description) VALUES ",
    generateValuesString: function (complianceList: ComplianceList) { return `(${complianceList.id}, ${complianceList.compliance_tracker_id}, '${complianceList.name}', '${complianceList.description}')`; },
  },
  {
    mockData: requirements,
    tableName: "requirements",
    createString: `CREATE TABLE requirements(
      id integer PRIMARY KEY,
      compliance_list_id integer,
      name varchar(255),
      description text,
      status varchar(50),
      CONSTRAINT requirements_compliance_list_id_fkey FOREIGN KEY (compliance_list_id)
        REFERENCES compliancelists (id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO requirements(id, compliance_list_id, name, description, status) VALUES ",
    generateValuesString: function (requirement: Requirement) { return `(${requirement.id}, ${requirement.compliance_list_id}, '${requirement.name}', '${requirement.description}', '${requirement.status}')`; },
  },
  {
    mockData: subrequirements,
    tableName: "subrequirements",
    createString: `CREATE TABLE subrequirements(
      id integer PRIMARY KEY,
      requirement_id integer,
      name varchar(255),
      description text,
      status varchar(50),
      CONSTRAINT subrequirements_requirement_id_fkey FOREIGN KEY (requirement_id)
        REFERENCES requirements (id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO subrequirements(id, requirement_id, name, description, status) VALUES ",
    generateValuesString: function (subrequirement: Subrequirement) { return `(${subrequirement.id}, ${subrequirement.requirement_id}, '${subrequirement.name}', '${subrequirement.description}', '${subrequirement.status}')`; },
  },
  {
    mockData: sections,
    tableName: "sections",
    createString: `CREATE TABLE sections(
      id integer PRIMARY KEY,
      assessment_tracker_id integer,
      name varchar(255),
      total_questions integer NOT NULL,
      completed_questions integer NOT NULL,
      CONSTRAINT fk_assessment_tracker FOREIGN KEY (assessment_tracker_id)
        REFERENCES assessmenttrackers (id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO sections(id, assessment_tracker_id, name, total_questions, completed_questions) VALUES ",
    generateValuesString: function (section: Section) { return `(${section.id}, ${section.assessment_tracker_id}, '${section.name}', ${section.total_questions}, ${section.completed_questions})`; },
  },
  {
    mockData: questions,
    tableName: "questions",
    createString: `CREATE TABLE questions(
      id integer PRIMARY KEY,
      section_id integer,
      question_text text,
      answer_type varchar(50),
      required boolean NOT NULL,
      CONSTRAINT fk_section FOREIGN KEY (section_id)
        REFERENCES sections (id)
        ON DELETE SET NULL
    );`,
    insertString: "INSERT INTO questions(id, section_id, question_text, answer_type, required) VALUES ",
    generateValuesString: function (question: Question) { return `(${question.id}, ${question.section_id}, '${question.question_text}', '${question.answer_type}', ${question.required})`; },
  }
]

export async function insertMockData() {
  for (let entry of insertQuery) {
    let { mockData, tableName, createString, insertString, generateValuesString } = entry
    if (!(await checkTableExists(tableName as string))) {
      await createTable(createString as string);
    }
    await deleteExistingData(tableName as string);
    const values = mockData.map(d => generateValuesString(d as any))
    insertString += values.join(",") + ";"
    await insertData(insertString as string)
  }
}
