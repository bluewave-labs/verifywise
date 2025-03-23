-- DO $$
-- BEGIN

-- IF NOT EXISTS (SELECT * FROM pg_database WHERE datname = 'verifywise') THEN
-- 	CREATE DATABASE verifywise;
-- ELSE
-- 	RAISE NOTICE 'Database exists';
-- END IF;

-- END
-- $$;

-- Drop all existing tables
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS subtopics CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS projectscopes CASCADE;
DROP TABLE IF EXISTS projects_members CASCADE;
DROP TABLE IF EXISTS vendors_projects CASCADE;
DROP TABLE IF EXISTS vendorrisks CASCADE;
DROP TABLE IF EXISTS projectrisks CASCADE;
DROP TABLE IF EXISTS subcontrols CASCADE;
DROP TABLE IF EXISTS controls CASCADE;
DROP TABLE IF EXISTS controlcategories CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  is_demo BOOLEAN
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  surname VARCHAR(255),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  role INT REFERENCES roles(id),
  created_at DATE,
  last_login DATE,
  is_demo BOOLEAN
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  project_title VARCHAR(255),
  owner INTEGER REFERENCES users(id),
  start_date DATE,
  ai_risk_classification VARCHAR(255),
  type_of_high_risk_role VARCHAR(255),
  goal VARCHAR(255),
  last_updated DATE,
  last_updated_by INTEGER REFERENCES users(id),
  is_demo BOOLEAN
);

CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  order_no INT,
  vendor_name VARCHAR(255),
  vendor_provides TEXT,
  assignee INTEGER REFERENCES users(id),
  website VARCHAR(255),
  vendor_contact_person VARCHAR(255),
  review_result VARCHAR(255),
  review_status VARCHAR(255),
  reviewer INTEGER REFERENCES users(id),
  risk_status VARCHAR(255),
  review_date DATE,
  is_demo BOOLEAN
);

CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id),
  is_demo BOOLEAN
);

CREATE TABLE controlcategories (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id),
  title TEXT,
  order_no INT,
  is_demo BOOLEAN
);

CREATE TABLE controls (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  status VARCHAR(255),
  approver INTEGER REFERENCES users(id),
  risk_review TEXT,
  owner INTEGER REFERENCES users(id),
  reviewer INTEGER REFERENCES users(id),
  due_date DATE,
  implementation_details TEXT,
  order_no INT,
  control_category_id INT REFERENCES controlcategories(id),
  is_demo BOOLEAN
);

CREATE TABLE subcontrols (
  id SERIAL PRIMARY KEY,
  control_id INT REFERENCES controls(id),
  title TEXT,
  description TEXT,
  order_no INT,
  status VARCHAR(255),
  approver INTEGER REFERENCES users(id),
  risk_review TEXT,
  owner INTEGER REFERENCES users(id),
  reviewer INTEGER REFERENCES users(id),
  due_date DATE,
  implementation_details TEXT,
  evidence_description TEXT,
  feedback_description TEXT,
  evidence_files TEXT[],
  feedback_files TEXT[],
  is_demo BOOLEAN
);

CREATE TABLE projectrisks (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id),
  risk_name VARCHAR(255),
  risk_owner INTEGER REFERENCES users(id),
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
  risk_approval INTEGER REFERENCES users(id),
  approval_status VARCHAR(255),
  date_of_assessment DATE,
  is_demo BOOLEAN
);

CREATE TABLE vendorrisks (
  id SERIAL PRIMARY KEY,
  vendor_id INT REFERENCES vendors(id),
  order_no INT,
  risk_description TEXT,
  impact_description TEXT,
  impact VARCHAR(255),
  likelihood VARCHAR(255),
  risk_severity VARCHAR(255),
  action_plan TEXT,
  action_owner INTEGER REFERENCES users(id),
  risk_level VARCHAR(255),
  is_demo BOOLEAN
);

CREATE TABLE vendors_projects (
  vendor_id INT REFERENCES vendors(id),
  project_id INT REFERENCES projects(id),
  PRIMARY KEY (vendor_id, project_id),
  is_demo BOOLEAN
);

CREATE TABLE projects_members (
  user_id INT REFERENCES users(id),
  project_id INT REFERENCES projects(id),
  PRIMARY KEY (user_id, project_id),
  is_demo BOOLEAN
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
  technology_documentation VARCHAR(255),
  is_demo BOOLEAN
);

CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  assessment_id INT REFERENCES assessments(id),
  title TEXT,
  order_no INT,
  is_demo BOOLEAN
);

CREATE TABLE subtopics (
  id SERIAL PRIMARY KEY,
  topic_id INT REFERENCES topics(id),
  title TEXT,
  order_no INT,
  is_demo BOOLEAN
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  subtopic_id INT REFERENCES subtopics(id),
  question TEXT,
  answer_type VARCHAR(255),
  evidence_required BOOLEAN,
  hint TEXT,
  is_required BOOLEAN,
  priority_level VARCHAR(255),
  evidence_files TEXT[],
  answer TEXT,
  dropdown_options TEXT[],
  order_no INT,
  input_type VARCHAR(255),
  is_demo BOOLEAN
);

CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  content BYTEA NOT NULL,
  project_id INT REFERENCES projects(id),
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_time TIMESTAMP,
  is_demo BOOLEAN
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
