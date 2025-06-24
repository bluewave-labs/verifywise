import { UserModel } from "../models/user/user.model";
import {
  ValidationException,
  BusinessLogicException,
} from "../exceptions/custom.exception";

// Mock bcrypt to avoid actual hashing in tests
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password_123"),
  compare: jest.fn().mockResolvedValue(true),
}));

describe("UserModel", () => {
  // Test data
  const validUserData = {
    name: "John",
    surname: "Doe",
    email: "john.doe@example.com",
    password: "MyJH4rTm!@.45L0wm",
    role_id: 1,
  };

  const invalidUserData = {
    name: "",
    surname: "",
    email: "invalid-email",
    password: "weak",
    role_id: 0,
  };

  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createNewUser", () => {
    it("should create a new user with valid data", async () => {
      // Arrange & Act
      const user = await UserModel.createNewUser(
        validUserData.name,
        validUserData.surname,
        validUserData.email,
        validUserData.password,
        validUserData.role_id
      );

      // Assert
      expect(user).toBeInstanceOf(UserModel);
      expect(user.name).toBe(validUserData.name);
      expect(user.surname).toBe(validUserData.surname);
      expect(user.email).toBe(validUserData.email);
      expect(user.password_hash).toBe("hashed_password_123");
      expect(user.role_id).toBe(validUserData.role_id);
      expect(user.is_demo).toBe(false);
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.last_login).toBeInstanceOf(Date);
    });

    it("should throw ValidationException for invalid email", async () => {
      // Arrange & Act & Assert
      await expect(
        UserModel.createNewUser(
          validUserData.name,
          validUserData.surname,
          "invalid-email",
          validUserData.password,
          validUserData.role_id
        )
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid password", async () => {
      // Arrange & Act & Assert
      await expect(
        UserModel.createNewUser(
          validUserData.name,
          validUserData.surname,
          validUserData.email,
          "weak",
          validUserData.role_id
        )
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid role_id", async () => {
      // Arrange & Act & Assert
      await expect(
        UserModel.createNewUser(
          validUserData.name,
          validUserData.surname,
          validUserData.email,
          validUserData.password,
          0
        )
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("validateUserData", () => {
    it("should pass validation with valid data", async () => {
      // Arrange
      const user = new UserModel();
      user.name = validUserData.name;
      user.surname = validUserData.surname;
      user.email = validUserData.email;
      user.role_id = validUserData.role_id;

      // Act & Assert
      await expect(user.validateUserData()).resolves.not.toThrow();
    });

    it("should throw ValidationException for empty name", async () => {
      // Arrange
      const user = new UserModel();
      user.name = "";
      user.surname = validUserData.surname;
      user.email = validUserData.email;
      user.role_id = validUserData.role_id;

      // Act & Assert
      await expect(user.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for empty surname", async () => {
      // Arrange
      const user = new UserModel();
      user.name = validUserData.name;
      user.surname = "";
      user.email = validUserData.email;
      user.role_id = validUserData.role_id;

      // Act & Assert
      await expect(user.validateUserData()).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe("comparePassword", () => {
    it("should return true for correct password", async () => {
      // Arrange
      const user = new UserModel();
      user.password_hash = "hashed_password_123";

      // Act
      const result = await user.comparePassword("SecurePass123");

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("updatePassword", () => {
    it("should update password with valid new password", async () => {
      // Arrange
      const user = new UserModel();
      user.password_hash = "old_hash";

      // Act
      await user.updatePassword("NewSecurePass123");

      // Assert
      expect(user.password_hash).toBe("hashed_password_123");
    });

    it("should throw ValidationException for invalid new password", async () => {
      // Arrange
      const user = new UserModel();

      // Act & Assert
      await expect(user.updatePassword("weak")).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe("canPerformAdminAction", () => {
    it("should return true for admin user", () => {
      // Arrange
      const user = new UserModel();
      user.id = 1;
      user.role_id = 1; // Admin role
      user.is_demo = false;

      // Act
      const result = user.canPerformAdminAction();

      // Assert
      expect(result).toBe(true);
    });

    it("should throw BusinessLogicException for demo user", () => {
      // Arrange
      const user = new UserModel();
      user.id = 1;
      user.role_id = 1; // Admin role
      user.is_demo = true;

      // Act & Assert
      expect(() => user.canPerformAdminAction()).toThrow(
        BusinessLogicException
      );
    });
  });

  describe("canModifyUser", () => {
    it("should return true when admin modifies any user", () => {
      // Arrange
      const adminUser = new UserModel();
      adminUser.id = 1;
      adminUser.role_id = 1; // Admin role
      adminUser.is_demo = false;

      // Act
      const result = adminUser.canModifyUser(999);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when user modifies themselves", () => {
      // Arrange
      const regularUser = new UserModel();
      regularUser.id = 5;
      regularUser.role_id = 2; // Regular user role
      regularUser.is_demo = false;

      // Act
      const result = regularUser.canModifyUser(5);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when regular user modifies another user", () => {
      // Arrange
      const regularUser = new UserModel();
      regularUser.id = 5;
      regularUser.role_id = 2; // Regular user role
      regularUser.is_demo = false;

      // Act
      const result = regularUser.canModifyUser(999);

      // Assert
      expect(result).toBe(false);
    });

    it("should throw BusinessLogicException for demo user", () => {
      // Arrange
      const demoUser = new UserModel();
      demoUser.id = 1;
      demoUser.is_demo = true;

      // Act & Assert
      expect(() => demoUser.canModifyUser(999)).toThrow(BusinessLogicException);
    });
  });

  describe("isDemoUser", () => {
    it("should return true for demo user", () => {
      // Arrange
      const user = new UserModel();
      user.is_demo = true;

      // Act
      const result = user.isDemoUser();

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for non-demo user", () => {
      // Arrange
      const user = new UserModel();
      user.is_demo = false;

      // Act
      const result = user.isDemoUser();

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when is_demo is undefined", () => {
      // Arrange
      const user = new UserModel();
      user.is_demo = undefined;

      // Act
      const result = user.isDemoUser();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin user", () => {
      // Arrange
      const user = new UserModel();
      user.role_id = 1;

      // Act
      const result = user.isAdmin();

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for non-admin user", () => {
      // Arrange
      const user = new UserModel();
      user.role_id = 2;

      // Act
      const result = user.isAdmin();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("updateLastLogin", () => {
    it("should update last_login to current date", () => {
      // Arrange
      const user = new UserModel();
      const oldDate = new Date("2023-01-01");
      user.last_login = oldDate;

      // Act
      user.updateLastLogin();

      // Assert
      expect(user.last_login).not.toEqual(oldDate);
      expect(user.last_login).toBeInstanceOf(Date);
    });
  });

  describe("toSafeJSON", () => {
    it("should return user data without password_hash", () => {
      // Arrange
      const user = new UserModel();
      user.id = 1;
      user.name = "John";
      user.surname = "Doe";
      user.email = "john@example.com";
      user.password_hash = "secret_hash";
      user.role_id = 1;
      user.created_at = new Date("2023-01-01");
      user.last_login = new Date("2023-01-02");

      // Mock the get method
      jest.spyOn(user, "get").mockReturnValue({
        id: 1,
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        password_hash: "secret_hash",
        role_id: 1,
        created_at: new Date("2023-01-01"),
        last_login: new Date("2023-01-02"),
      });

      // Act
      const result = user.toSafeJSON();

      // Assert
      expect(result).not.toHaveProperty("password_hash");
      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "John");
      expect(result).toHaveProperty("email", "john@example.com");
    });
  });

  describe("toJSON", () => {
    it("should return formatted user data", () => {
      // Arrange
      const user = new UserModel();
      user.id = 1;
      user.name = "John";
      user.surname = "Doe";
      user.email = "john@example.com";
      user.role_id = 1;
      user.created_at = new Date("2023-01-01T00:00:00.000Z");
      user.last_login = new Date("2023-01-02T00:00:00.000Z");

      // Act
      const result = user.toJSON();

      // Assert
      expect(result).toEqual({
        id: 1,
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        role_id: 1,
        created_at: "2023-01-01T00:00:00.000Z",
        last_login: "2023-01-02T00:00:00.000Z",
      });
    });
  });
});
