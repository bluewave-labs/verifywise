CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  surname VARCHAR(255),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  role INT REFERENCES roles(id),
  created_at DATE,
  last_login DATE
);

CREATE TABLE projects (
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
);

CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
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
);

CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id)
);

CREATE TABLE controlcategories (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id),
  name VARCHAR(255)
);

CREATE TABLE controls (
  id SERIAL PRIMARY KEY,
  status VARCHAR(255),
  approver VARCHAR(255),
  risk_review TEXT,
  owner VARCHAR(255),
  reviewer VARCHAR(255),
  due_date DATE,
  implementation_details TEXT,
  control_group INT REFERENCES controlcategories(id)
);

CREATE TABLE subcontrols (
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
);

CREATE TABLE projectrisks (
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
);

CREATE TABLE vendorrisks (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id),
  vendor_name VARCHAR(255),
  risk_name VARCHAR(255),
  owner VARCHAR(255),
  risk_level VARCHAR(255),
  review_date DATE
);

CREATE TABLE vendors_projects (
  vendor_id INT REFERENCES vendors(id),
  project_id INT REFERENCES projects(id),
  PRIMARY KEY (vendor_id, project_id)
);

CREATE TABLE projectscopes (
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
);

CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  assessment_id INT REFERENCES assessments(id),
  title VARCHAR(255)
);

CREATE TABLE subtopics (
  id SERIAL PRIMARY KEY,
  topic_id INT REFERENCES topics(id),
  name VARCHAR(255)
);

CREATE TABLE questions (
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
);

CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  content BYTEA NOT NULL
);

INSERT INTO
  roles(name, description)
  VALUES ('Admin', 'Administrator with full access to the system.'),
  ('Reviewer', 'Reviewer with access to review compliance and reports.'),
  ('Editor', 'Editor with permission to modify and update project details.'),
  ('Auditor', 'Auditor with access to compliance and security audits.');

-- INSERT INTO
--   users(name, surname, email, password_hash, role, created_at, last_login)
--   VALUES
--   ('admin', 'admin', 'admin@gmail.com', '$2b$10$JFP9Z4RIbC1NItNB5daWZ.GxoCD6Ka.d./w9VXsOXit7mzj176TbG', 1, CURRENT_DATE, CURRENT_DATE);
