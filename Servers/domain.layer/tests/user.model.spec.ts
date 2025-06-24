/// <reference types="jest" />

import { UserModel } from "../models/user/user.model";
import {
  ValidationException,
  BusinessLogicException,
} from "../exceptions/custom.exception";
import bcrypt from "bcrypt";
import { Sequelize } from "sequelize-typescript";

// Mock bcrypt
jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock Sequelize
jest.mock("sequelize-typescript", () => {
  const originalModule = jest.requireActual("sequelize-typescript");
  return {
    ...originalModule,
    Sequelize: jest.fn().mockImplementation(() => ({
      addModels: jest.fn(),
      sync: jest.fn(),
      authenticate: jest.fn(),
    })),
  };
});

describe("UserModel", () => {
  let userModel: UserModel;

  beforeAll(() => {
    // Initialize Sequelize with in-memory database for testing
    const sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
    });

    // Add the UserModel to Sequelize
    sequelize.addModels([UserModel]);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a fresh user model instance for each test
    userModel = new UserModel();
    userModel.id = 1;
    userModel.name = "John";
    userModel.surname = "Doe";
    userModel.email = "john.doe@example.com";
    userModel.password_hash = "hashedPassword123";
    userModel.role_id = 1;
    userModel.created_at = new Date("2023-01-01");
    userModel.last_login = new Date("2023-01-01");
    userModel.is_demo = false;
  });

  describe("createNewUser", () => {
    const validUserData = {
      name: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      password: "MyJH4rTm!@.45L0wm",
      role_id: 1,
    };

    beforeEach(() => {
      mockedBcrypt.hash.mockResolvedValue("hashedPassword123" as never);
    });

    it("should create a new user with valid data", async () => {
      const user = await UserModel.createNewUser(
        validUserData.name,
        validUserData.surname,
        validUserData.email,
        validUserData.password,
        validUserData.role_id
      );

      expect(user).toBeInstanceOf(UserModel);
      expect(user.name).toBe(validUserData.name);
      expect(user.surname).toBe(validUserData.surname);
      expect(user.email).toBe(validUserData.email);
      expect(user.role_id).toBe(validUserData.role_id);
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.last_login).toBeInstanceOf(Date);
      expect(user.is_demo).toBe(false);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        validUserData.password,
        10
      );
    });

    it("should throw ValidationException for invalid email", async () => {
      const invalidEmail = "invalid-email";

      await expect(
        UserModel.createNewUser(
          validUserData.name,
          validUserData.surname,
          invalidEmail,
          validUserData.password,
          validUserData.role_id
        )
      ).rejects.toThrow(ValidationException);

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });

    it("should throw ValidationException for invalid password", async () => {
      const invalidPassword = "weak";

      await expect(
        UserModel.createNewUser(
          validUserData.name,
          validUserData.surname,
          validUserData.email,
          invalidPassword,
          validUserData.role_id
        )
      ).rejects.toThrow(ValidationException);

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });

    it("should throw ValidationException for invalid role_id", async () => {
      const invalidRoleId = 0;

      await expect(
        UserModel.createNewUser(
          validUserData.name,
          validUserData.surname,
          validUserData.email,
          validUserData.password,
          invalidRoleId
        )
      ).rejects.toThrow(ValidationException);

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });

    it("should handle bcrypt hash errors", async () => {
      mockedBcrypt.hash.mockRejectedValue(new Error("Hash error") as never);

      await expect(
        UserModel.createNewUser(
          validUserData.name,
          validUserData.surname,
          validUserData.email,
          validUserData.password,
          validUserData.role_id
        )
      ).rejects.toThrow("Hash error");
    });
  });

  describe("validateUserData", () => {
    it("should pass validation with valid data", async () => {
      await expect(userModel.validateUserData()).resolves.not.toThrow();
    });

    it("should throw ValidationException for empty name", async () => {
      userModel.name = "";

      await expect(userModel.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for whitespace-only name", async () => {
      userModel.name = "   ";

      await expect(userModel.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for empty surname", async () => {
      userModel.surname = "";

      await expect(userModel.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for whitespace-only surname", async () => {
      userModel.surname = "   ";

      await expect(userModel.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for invalid email", async () => {
      userModel.email = "invalid-email";

      await expect(userModel.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for empty email", async () => {
      userModel.email = "";

      await expect(userModel.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for invalid role_id", async () => {
      userModel.role_id = 0;

      await expect(userModel.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for undefined role_id", async () => {
      userModel.role_id = undefined as any;

      await expect(userModel.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });
  });

  // Additional test suites will be added here
});
