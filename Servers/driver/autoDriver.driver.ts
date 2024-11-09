import mockProjects from "../mocks/project.mock.data";
import { questions } from "../mocks/question.mock.data";
import { users } from "../mocks/users.data";
import mockVendorRisks from "../mocks/vendorRisk.mock.data";
import { vendors } from "../mocks/vendor.mock.data";

import { Project } from "../models/project.model";
import { Question } from "../models/question.model";
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
  TableEntry<User>,
  TableEntry<Project>,
  TableEntry<Vendor>,
  TableEntry<VendorRisk>,
  TableEntry<Question>
];

const insertQuery: TableList = [
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
  {
    mockData: questions,
    tableName: "questions",
    createString: `CREATE TABLE questions(
      id SERIAL PRIMARY KEY,
      subtopic_id integer,
      question_text text,
      answer_type varchar(50),
      dropdown_options text,
      has_file_upload boolean,
      has_hint boolean,
      is_required boolean,
      priority_options text,
      CONSTRAINT fk_subtopic FOREIGN KEY (subtopic_id)
        REFERENCES subtopics (id)
        ON DELETE SET NULL
    );`,
    insertString:
      "INSERT INTO questions(subtopic_id, question_text, answer_type, dropdown_options, has_file_upload, has_hint, is_required, priority_options) VALUES ",
    generateValuesString: function (question: Question) {
      return `(${question.subtopicId}, '${question.questionText}', '${question.answerType}', '${question.dropdownOptions}', ${question.hasFileUpload}, ${question.hasHint}, ${question.isRequired}, '${question.priorityOptions}')`;
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
