import pool from "../database/db";
import { complianceTrackers } from "../mocks/complianceTrackers/complianceTrackers.data";
import { projects } from "../mocks/projects/projects.data";
import { roles } from "../mocks/roles/roles.data";
import { users } from "../mocks/users/users.data";
import { vendors } from "../mocks/vendors/vendors.data";
import { ComplianceTracker } from "../models/ComplianceTracker";
import { Project } from "../models/Project";
import { Role } from "../models/Role";
import { User } from "../models/User";
import { Vendor } from "../models/Vendor";
import { checkDataExists, checkTableExists, createTable, insertData } from "../utils/autoDriver.util";

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
  TableEntry<ComplianceTracker>
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
      project_id integer NOT NULL,
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
      project_id integer NOT NULL,
      compliance_status integer NOT NULL,
      pending_audits integer DEFAULT 0,
      completed_assessments integer DEFAULT 0,
      implemented_controls integer DEFAULT 0,
      CONSTRAINT compliancetracker_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
    );`,
    insertString: "INSERT INTO compliancetrackers(id, project_id, compliance_status, pending_audits, completed_assessments, implemented_controls) VALUES ",
    generateValuesString: function (complianceTracker: ComplianceTracker) { return `(${complianceTracker.id}, ${complianceTracker.project_id}, ${complianceTracker.compliance_status}, ${complianceTracker.pending_audits}, ${complianceTracker.completed_assessments}, ${complianceTracker.implemented_controls})` },
  }
]

export async function insertMockData() {
  for (let entry of insertQuery) {
    let { mockData, tableName, createString, insertString, generateValuesString } = entry
    if (!(await checkTableExists(tableName as string))) {
      await createTable(createString as string);
    }
    if (!(await checkDataExists(tableName as string))) {
      const values = mockData.map(d => generateValuesString(d as any))
      insertString += values.join(",") + ";"
      await insertData(insertString as string)
    }
  }
}
