INSERT INTO
  roles(name, description)
  VALUES ('Admin', 'Administrator with full access to the system.');

INSERT INTO
  users(name, surname, email, password_hash, role, created_at, last_login)
  VALUES
  ('admin', 'admin', 'admin@gmail.com', '$2b$10$JFP9Z4RIbC1NItNB5daWZ.GxoCD6Ka.d./w9VXsOXit7mzj176TbG', 1, CURRENT_DATE, CURRENT_DATE);