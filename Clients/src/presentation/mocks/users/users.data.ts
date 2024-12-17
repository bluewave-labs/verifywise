import { roles } from "../roles/roles.data";

// User table mock data with matching role_id
const users = [
  {
    id: 1,
    name: "Alice Smith",
    email: "alice.smith@example.com",
    password_hash: "hashedpassword123",
    role_id: 1, // Admin
    created_at: new Date("2024-01-01"),
    last_login: new Date("2024-10-01"),
  },
  {
    id: 2,
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    password_hash: "hashedpassword456",
    role_id: 2, // Reviewer
    created_at: new Date("2024-02-15"),
    last_login: new Date("2024-09-25"),
  },
  {
    id: 3,
    name: "Cathy Brown",
    email: "cathy.brown@example.com",
    password_hash: "hashedpassword789",
    role_id: 3, // Editor
    created_at: new Date("2024-03-10"),
    last_login: new Date("2024-09-28"),
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david.wilson@example.com",
    password_hash: "hashedpassword012",
    role_id: 4, // Auditor
    created_at: new Date("2024-04-05"),
    last_login: new Date("2024-09-30"),
  },
  {
    id: 5,
    name: "Eva Clark",
    email: "eva.clark@example.com",
    password_hash: "hashedpassword345",
    role_id: 2, // Reviewer
    created_at: new Date("2024-05-20"),
    last_login: new Date("2024-09-18"),
  },
];

export { users, roles };
