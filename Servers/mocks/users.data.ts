import { User } from "../models/user.model";

export const users: User[] = [
  {
    id: 1,
    name: "Alice Smith",
    email: "alice.smith@example.com",
    password_hash:
      "$2b$10$c7Mtd3kRpMjr6VexlxuAleT8Sy3SwPcT.YLCazH5QWBgnATDo5N6O",
    role: 1, // Admin
    created_at: new Date("2024-01-01"),
    last_login: new Date("2024-10-01"),
  },
  {
    id: 2,
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    password_hash:
      "$2b$10$MBmkOR9yReYBIPfR2pE0QOwT4sGHjYV/Za3B/wfmZW2gQszqVod1G",
    role: 2, // Reviewer
    created_at: new Date("2024-02-15"),
    last_login: new Date("2024-09-25"),
  },
  {
    id: 3,
    name: "Cathy Brown",
    email: "cathy.brown@example.com",
    password_hash:
      "$2b$10$7qXYDROKyGgH3lpWL0dJR.dRN1T0AvG.J7EmZHF9iVqptQWAWHq.a",
    role: 3, // Editor
    created_at: new Date("2024-03-10"),
    last_login: new Date("2024-09-28"),
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david.wilson@example.com",
    password_hash:
      "$2b$10$7yo46.rtqbrn4fxxLENu5eqfvfi8pYXm00sceVM3Ash7PlZuGONOa",
    role: 4, // Auditor
    created_at: new Date("2024-04-05"),
    last_login: new Date("2024-09-30"),
  },
  {
    id: 5,
    name: "Eva Clark",
    email: "eva.clark@example.com",
    password_hash:
      "$2b$10$3T5VhzKdBpUPXqHuiKZXJusPdR7k.SmwRbl3fopf4XEJhMfgyYSOO",
    role: 2, // Reviewer
    created_at: new Date("2024-05-20"),
    last_login: new Date("2024-09-18"),
  },
];
