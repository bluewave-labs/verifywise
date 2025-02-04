import { User } from "../models/user.model";

export const users = (role1: number, role2: number, role3: number, role4: number): User[] => {
  return [
    {
      id: 1,
      name: "Alice",
      surname: "Smith",
      email: "alice.smith@example.com",
      password_hash:
        "$2b$10$c7Mtd3kRpMjr6VexlxuAleT8Sy3SwPcT.YLCazH5QWBgnATDo5N6O",
      role: role1, // Admin
      created_at: new Date("2024-01-01"),
      last_login: new Date("2024-10-01"),
    },
    {
      id: 2,
      name: "Bob",
      surname: "Johnson",
      email: "bob.johnson@example.com",
      password_hash:
        "$2b$10$MBmkOR9yReYBIPfR2pE0QOwT4sGHjYV/Za3B/wfmZW2gQszqVod1G",
      role: role2, // Reviewer
      created_at: new Date("2024-02-15"),
      last_login: new Date("2024-09-25"),
    },
    {
      id: 3,
      name: "Cathy",
      surname: "Brown",
      email: "cathy.brown@example.com",
      password_hash:
        "$2b$10$7qXYDROKyGgH3lpWL0dJR.dRN1T0AvG.J7EmZHF9iVqptQWAWHq.a",
      role: role3, // Editor
      created_at: new Date("2024-03-10"),
      last_login: new Date("2024-09-28"),
    },
    {
      id: 4,
      name: "David",
      surname: "Wilson",
      email: "david.wilson@example.com",
      password_hash:
        "$2b$10$7yo46.rtqbrn4fxxLENu5eqfvfi8pYXm00sceVM3Ash7PlZuGONOa",
      role: role4, // Auditor
      created_at: new Date("2024-04-05"),
      last_login: new Date("2024-09-30"),
    },
    {
      id: 5,
      name: "Eva",
      surname: "Clark",
      email: "eva.clark@example.com",
      password_hash:
        "$2b$10$3T5VhzKdBpUPXqHuiKZXJusPdR7k.SmwRbl3fopf4XEJhMfgyYSOO",
      role: role2, // Reviewer
      created_at: new Date("2024-05-20"),
      last_login: new Date("2024-09-18"),
    },
  ]
};
