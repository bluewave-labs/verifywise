import { ValidationException } from "../exceptions/custom.exception";
import { RoleModel } from "../models/role/role.model";

jest.mock("../models/role/role.model", () => {
  const mockConstructor = Object.getPrototypeOf(RoleModel);
  mockConstructor.constructor = jest.fn().mockImplementation(function (this: any, data?: any) {
    if (data) {
      Object.assign(this, data);
    }
  })
  return { RoleModel: mockConstructor }
})

describe("RoleModel", () => {
  const validRoleData = {
    name: "Admin",
    description: "Administrator role with full access",
  }

  it("should create a new role with valid data", async () => {
    const role = await RoleModel.createRole(validRoleData.name, validRoleData.description);
    expect(role).toBeInstanceOf(RoleModel);
    expect(role.name).toBe(validRoleData.name);
    expect(role.description).toBe(validRoleData.description);
    expect(role.created_at).toBeDefined();
  })

  it("should throw an error if name is missing", async () => {
    expect.assertions(2);
    try {
      await RoleModel.createRole("", validRoleData.description)
    } catch (error) {
      console.log((error as ValidationException).message);
      expect(error).toBeInstanceOf(ValidationException);
      expect((error as ValidationException).message).toBe("Role name is required");
    }
  })

  it("should throw an error if description is missing", async () => {
    expect.assertions(2);
    try {
      await RoleModel.createRole(validRoleData.name, "")
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      expect((error as ValidationException).message).toBe("Role description is required");
    }
  })
})
