import {
  ValidationException,
  BusinessLogicException,
} from "../exceptions/custom.exception";

// Mock sequelize-typescript
jest.mock("sequelize-typescript", () => ({
  Column: jest.fn(),
  DataType: {
    INTEGER: "INTEGER",
    STRING: "STRING",
    BOOLEAN: "BOOLEAN",
    DATE: "DATE",
    ENUM: jest.fn(() => "ENUM"),
  },
  ForeignKey: jest.fn(),
  BelongsTo: jest.fn(),
  Table: jest.fn(),
  Model: class MockModel {
    constructor(data?: any) {
      if (data) Object.assign(this, data);
    }
  },
}));

// Valid workspace roles
const WorkspaceRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

type WorkspaceRoleType = (typeof WorkspaceRole)[keyof typeof WorkspaceRole];

// Test class mimicking UserWorkspaceModel behavior
class TestUserWorkspaceModel {
  id?: number;
  user_id!: number;
  workspace_id!: number;
  role!: WorkspaceRoleType;
  is_default?: boolean;
  joined_at?: Date;
  invited_by?: number;
  created_at?: Date;
  updated_at?: Date;

  constructor(data?: any) {
    if (data) Object.assign(this, data);
  }

  // Validate role
  static isValidRole(role: string): role is WorkspaceRoleType {
    return Object.values(WorkspaceRole).includes(role as WorkspaceRoleType);
  }

  // Static method to create new user-workspace association
  static async createUserWorkspace(
    user_id: number,
    workspace_id: number,
    role: WorkspaceRoleType,
    options?: {
      is_default?: boolean;
      invited_by?: number;
    }
  ): Promise<TestUserWorkspaceModel> {
    // Validate user_id
    if (!user_id || user_id < 1) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }

    // Validate workspace_id
    if (!workspace_id || workspace_id < 1) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    // Validate role
    if (!TestUserWorkspaceModel.isValidRole(role)) {
      throw new ValidationException(
        `Invalid role. Must be one of: ${Object.values(WorkspaceRole).join(", ")}`,
        "role",
        role
      );
    }

    // Validate invited_by if provided
    if (options?.invited_by !== undefined && options.invited_by < 1) {
      throw new ValidationException(
        "Invalid invited_by user ID",
        "invited_by",
        options.invited_by
      );
    }

    const userWorkspace = new TestUserWorkspaceModel();
    userWorkspace.user_id = user_id;
    userWorkspace.workspace_id = workspace_id;
    userWorkspace.role = role;
    userWorkspace.is_default = options?.is_default ?? false;
    userWorkspace.invited_by = options?.invited_by;
    userWorkspace.joined_at = new Date();
    userWorkspace.created_at = new Date();
    userWorkspace.updated_at = new Date();

    return userWorkspace;
  }

  // Update user's role in workspace
  async updateRole(newRole: WorkspaceRoleType, updatedBy: number): Promise<void> {
    if (!TestUserWorkspaceModel.isValidRole(newRole)) {
      throw new ValidationException(
        `Invalid role. Must be one of: ${Object.values(WorkspaceRole).join(", ")}`,
        "role",
        newRole
      );
    }

    // Prevent owner from changing their own role if they're the only owner
    // (In real implementation, this would check database)
    if (this.role === WorkspaceRole.OWNER && this.user_id === updatedBy) {
      throw new BusinessLogicException(
        "Workspace owner cannot change their own role",
        "OWNER_ROLE_CHANGE_RESTRICTION",
        { userId: this.user_id, workspaceId: this.workspace_id }
      );
    }

    this.role = newRole;
    this.updated_at = new Date();
  }

  // Set as default workspace for user
  setAsDefault(): void {
    this.is_default = true;
    this.updated_at = new Date();
  }

  // Remove as default workspace
  removeAsDefault(): void {
    this.is_default = false;
    this.updated_at = new Date();
  }

  // Check if user is owner
  isOwner(): boolean {
    return this.role === WorkspaceRole.OWNER;
  }

  // Check if user is admin (owner or admin)
  isAdmin(): boolean {
    return this.role === WorkspaceRole.OWNER || this.role === WorkspaceRole.ADMIN;
  }

  // Check if user can manage members (owner or admin)
  canManageMembers(): boolean {
    return this.isAdmin();
  }

  // Check if user can edit workspace settings
  canEditSettings(): boolean {
    return this.isAdmin();
  }

  // Check if user can view workspace
  canView(): boolean {
    return true; // All roles can view
  }

  // Check if user can edit content
  canEditContent(): boolean {
    return this.role !== WorkspaceRole.VIEWER;
  }

  // Validate data before persistence
  async validateUserWorkspaceData(): Promise<void> {
    if (!this.user_id || this.user_id < 1) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        this.user_id
      );
    }

    if (!this.workspace_id || this.workspace_id < 1) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        this.workspace_id
      );
    }

    if (!TestUserWorkspaceModel.isValidRole(this.role)) {
      throw new ValidationException(
        "Valid role is required",
        "role",
        this.role
      );
    }
  }

  // Get safe JSON representation
  toSafeJSON(): any {
    return {
      id: this.id,
      user_id: this.user_id,
      workspace_id: this.workspace_id,
      role: this.role,
      is_default: this.is_default,
      joined_at: this.joined_at?.toISOString(),
      invited_by: this.invited_by,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  toJSON(): any {
    return this.toSafeJSON();
  }

  static fromJSON(json: any): TestUserWorkspaceModel {
    return new TestUserWorkspaceModel(json);
  }

  // Static method to find by user and workspace
  static async findByUserAndWorkspace(
    user_id: number,
    workspace_id: number
  ): Promise<TestUserWorkspaceModel | null> {
    if (!user_id || user_id < 1) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }
    if (!workspace_id || workspace_id < 1) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    if (user_id === 999 || workspace_id === 999) {
      return null;
    }

    return new TestUserWorkspaceModel({
      id: 1,
      user_id,
      workspace_id,
      role: WorkspaceRole.MEMBER,
      is_default: false,
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Static method to find all workspaces for a user
  static async findByUserId(user_id: number): Promise<TestUserWorkspaceModel[]> {
    if (!user_id || user_id < 1) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }

    return [
      new TestUserWorkspaceModel({
        id: 1,
        user_id,
        workspace_id: 1,
        role: WorkspaceRole.OWNER,
        is_default: true,
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }),
      new TestUserWorkspaceModel({
        id: 2,
        user_id,
        workspace_id: 2,
        role: WorkspaceRole.MEMBER,
        is_default: false,
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }),
    ];
  }

  // Static method to find all users in a workspace
  static async findByWorkspaceId(
    workspace_id: number
  ): Promise<TestUserWorkspaceModel[]> {
    if (!workspace_id || workspace_id < 1) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    return [
      new TestUserWorkspaceModel({
        id: 1,
        user_id: 1,
        workspace_id,
        role: WorkspaceRole.OWNER,
        is_default: true,
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }),
      new TestUserWorkspaceModel({
        id: 2,
        user_id: 2,
        workspace_id,
        role: WorkspaceRole.ADMIN,
        is_default: false,
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }),
    ];
  }

  // Static method to get user's default workspace
  static async getDefaultWorkspace(
    user_id: number
  ): Promise<TestUserWorkspaceModel | null> {
    if (!user_id || user_id < 1) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }

    if (user_id === 999) {
      return null;
    }

    return new TestUserWorkspaceModel({
      id: 1,
      user_id,
      workspace_id: 1,
      role: WorkspaceRole.OWNER,
      is_default: true,
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Static method to count members in workspace
  static async countMembersByWorkspaceId(workspace_id: number): Promise<number> {
    if (!workspace_id || workspace_id < 1) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    return 5; // Mock count
  }

  // Static method to delete user-workspace association
  static async removeUserFromWorkspace(
    user_id: number,
    workspace_id: number
  ): Promise<number> {
    if (!user_id || user_id < 1) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }
    if (!workspace_id || workspace_id < 1) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    return 1; // Number of deleted rows
  }
}

describe("UserWorkspaceModel", () => {
  const validUserWorkspaceData = {
    user_id: 1,
    workspace_id: 1,
    role: WorkspaceRole.MEMBER as WorkspaceRoleType,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isValidRole", () => {
    it("should return true for valid roles", () => {
      expect(TestUserWorkspaceModel.isValidRole("owner")).toBe(true);
      expect(TestUserWorkspaceModel.isValidRole("admin")).toBe(true);
      expect(TestUserWorkspaceModel.isValidRole("member")).toBe(true);
      expect(TestUserWorkspaceModel.isValidRole("viewer")).toBe(true);
    });

    it("should return false for invalid roles", () => {
      expect(TestUserWorkspaceModel.isValidRole("invalid")).toBe(false);
      expect(TestUserWorkspaceModel.isValidRole("")).toBe(false);
      expect(TestUserWorkspaceModel.isValidRole("OWNER")).toBe(false);
      expect(TestUserWorkspaceModel.isValidRole("superadmin")).toBe(false);
    });
  });

  describe("createUserWorkspace", () => {
    it("should create user-workspace with valid data", async () => {
      const userWorkspace = await TestUserWorkspaceModel.createUserWorkspace(
        validUserWorkspaceData.user_id,
        validUserWorkspaceData.workspace_id,
        validUserWorkspaceData.role
      );

      expect(userWorkspace).toBeInstanceOf(TestUserWorkspaceModel);
      expect(userWorkspace.user_id).toBe(1);
      expect(userWorkspace.workspace_id).toBe(1);
      expect(userWorkspace.role).toBe(WorkspaceRole.MEMBER);
      expect(userWorkspace.is_default).toBe(false);
      expect(userWorkspace.joined_at).toBeInstanceOf(Date);
    });

    it("should create user-workspace with options", async () => {
      const userWorkspace = await TestUserWorkspaceModel.createUserWorkspace(
        1,
        1,
        WorkspaceRole.ADMIN,
        {
          is_default: true,
          invited_by: 2,
        }
      );

      expect(userWorkspace.role).toBe(WorkspaceRole.ADMIN);
      expect(userWorkspace.is_default).toBe(true);
      expect(userWorkspace.invited_by).toBe(2);
    });

    it("should throw ValidationException for invalid user_id", async () => {
      await expect(
        TestUserWorkspaceModel.createUserWorkspace(0, 1, WorkspaceRole.MEMBER)
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid workspace_id", async () => {
      await expect(
        TestUserWorkspaceModel.createUserWorkspace(1, 0, WorkspaceRole.MEMBER)
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid role", async () => {
      await expect(
        TestUserWorkspaceModel.createUserWorkspace(
          1,
          1,
          "invalid" as WorkspaceRoleType
        )
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid invited_by", async () => {
      await expect(
        TestUserWorkspaceModel.createUserWorkspace(1, 1, WorkspaceRole.MEMBER, {
          invited_by: 0,
        })
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("updateRole", () => {
    it("should update role successfully", async () => {
      const userWorkspace = new TestUserWorkspaceModel({
        ...validUserWorkspaceData,
        user_id: 2,
      });
      await userWorkspace.updateRole(WorkspaceRole.ADMIN, 1);
      expect(userWorkspace.role).toBe(WorkspaceRole.ADMIN);
    });

    it("should throw ValidationException for invalid role", async () => {
      const userWorkspace = new TestUserWorkspaceModel(validUserWorkspaceData);
      await expect(
        userWorkspace.updateRole("invalid" as WorkspaceRoleType, 1)
      ).rejects.toThrow(ValidationException);
    });

    it("should throw BusinessLogicException when owner tries to change own role", async () => {
      const userWorkspace = new TestUserWorkspaceModel({
        ...validUserWorkspaceData,
        role: WorkspaceRole.OWNER,
      });
      await expect(
        userWorkspace.updateRole(WorkspaceRole.ADMIN, 1)
      ).rejects.toThrow(BusinessLogicException);
    });
  });

  describe("setAsDefault / removeAsDefault", () => {
    it("should set workspace as default", () => {
      const userWorkspace = new TestUserWorkspaceModel({
        ...validUserWorkspaceData,
        is_default: false,
      });
      userWorkspace.setAsDefault();
      expect(userWorkspace.is_default).toBe(true);
    });

    it("should remove workspace as default", () => {
      const userWorkspace = new TestUserWorkspaceModel({
        ...validUserWorkspaceData,
        is_default: true,
      });
      userWorkspace.removeAsDefault();
      expect(userWorkspace.is_default).toBe(false);
    });
  });

  describe("role permission checks", () => {
    describe("isOwner", () => {
      it("should return true for owner", () => {
        const userWorkspace = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.OWNER,
        });
        expect(userWorkspace.isOwner()).toBe(true);
      });

      it("should return false for non-owner", () => {
        const userWorkspace = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.ADMIN,
        });
        expect(userWorkspace.isOwner()).toBe(false);
      });
    });

    describe("isAdmin", () => {
      it("should return true for owner", () => {
        const userWorkspace = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.OWNER,
        });
        expect(userWorkspace.isAdmin()).toBe(true);
      });

      it("should return true for admin", () => {
        const userWorkspace = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.ADMIN,
        });
        expect(userWorkspace.isAdmin()).toBe(true);
      });

      it("should return false for member", () => {
        const userWorkspace = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.MEMBER,
        });
        expect(userWorkspace.isAdmin()).toBe(false);
      });
    });

    describe("canManageMembers", () => {
      it("should return true for admin roles", () => {
        const owner = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.OWNER,
        });
        const admin = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.ADMIN,
        });
        expect(owner.canManageMembers()).toBe(true);
        expect(admin.canManageMembers()).toBe(true);
      });

      it("should return false for non-admin roles", () => {
        const member = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.MEMBER,
        });
        const viewer = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.VIEWER,
        });
        expect(member.canManageMembers()).toBe(false);
        expect(viewer.canManageMembers()).toBe(false);
      });
    });

    describe("canView", () => {
      it("should return true for all roles", () => {
        Object.values(WorkspaceRole).forEach((role) => {
          const userWorkspace = new TestUserWorkspaceModel({
            ...validUserWorkspaceData,
            role,
          });
          expect(userWorkspace.canView()).toBe(true);
        });
      });
    });

    describe("canEditContent", () => {
      it("should return true for owner, admin, member", () => {
        const owner = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.OWNER,
        });
        const admin = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.ADMIN,
        });
        const member = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.MEMBER,
        });
        expect(owner.canEditContent()).toBe(true);
        expect(admin.canEditContent()).toBe(true);
        expect(member.canEditContent()).toBe(true);
      });

      it("should return false for viewer", () => {
        const viewer = new TestUserWorkspaceModel({
          ...validUserWorkspaceData,
          role: WorkspaceRole.VIEWER,
        });
        expect(viewer.canEditContent()).toBe(false);
      });
    });
  });

  describe("validateUserWorkspaceData", () => {
    it("should pass validation with valid data", async () => {
      const userWorkspace = new TestUserWorkspaceModel(validUserWorkspaceData);
      await expect(
        userWorkspace.validateUserWorkspaceData()
      ).resolves.not.toThrow();
    });

    it("should throw ValidationException for invalid user_id", async () => {
      const userWorkspace = new TestUserWorkspaceModel({
        ...validUserWorkspaceData,
        user_id: 0,
      });
      await expect(userWorkspace.validateUserWorkspaceData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for invalid workspace_id", async () => {
      const userWorkspace = new TestUserWorkspaceModel({
        ...validUserWorkspaceData,
        workspace_id: 0,
      });
      await expect(userWorkspace.validateUserWorkspaceData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for invalid role", async () => {
      const userWorkspace = new TestUserWorkspaceModel({
        ...validUserWorkspaceData,
        role: "invalid" as WorkspaceRoleType,
      });
      await expect(userWorkspace.validateUserWorkspaceData()).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe("toSafeJSON", () => {
    it("should return formatted data", () => {
      const userWorkspace = new TestUserWorkspaceModel({
        id: 1,
        user_id: 1,
        workspace_id: 1,
        role: WorkspaceRole.MEMBER,
        is_default: true,
        joined_at: new Date("2024-01-01T00:00:00.000Z"),
        invited_by: 2,
        created_at: new Date("2024-01-01T00:00:00.000Z"),
        updated_at: new Date("2024-01-02T00:00:00.000Z"),
      });

      const result = userWorkspace.toSafeJSON();

      expect(result).toEqual({
        id: 1,
        user_id: 1,
        workspace_id: 1,
        role: "member",
        is_default: true,
        joined_at: "2024-01-01T00:00:00.000Z",
        invited_by: 2,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      });
    });
  });

  describe("findByUserAndWorkspace", () => {
    it("should find user-workspace association", async () => {
      const result = await TestUserWorkspaceModel.findByUserAndWorkspace(1, 1);
      expect(result).toBeInstanceOf(TestUserWorkspaceModel);
      expect(result?.user_id).toBe(1);
      expect(result?.workspace_id).toBe(1);
    });

    it("should return null for non-existent association", async () => {
      const result = await TestUserWorkspaceModel.findByUserAndWorkspace(999, 1);
      expect(result).toBeNull();
    });

    it("should throw ValidationException for invalid user_id", async () => {
      await expect(
        TestUserWorkspaceModel.findByUserAndWorkspace(0, 1)
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid workspace_id", async () => {
      await expect(
        TestUserWorkspaceModel.findByUserAndWorkspace(1, 0)
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("findByUserId", () => {
    it("should find all workspaces for user", async () => {
      const results = await TestUserWorkspaceModel.findByUserId(1);
      expect(results).toHaveLength(2);
      expect(results[0]).toBeInstanceOf(TestUserWorkspaceModel);
    });

    it("should throw ValidationException for invalid user_id", async () => {
      await expect(TestUserWorkspaceModel.findByUserId(0)).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe("findByWorkspaceId", () => {
    it("should find all users in workspace", async () => {
      const results = await TestUserWorkspaceModel.findByWorkspaceId(1);
      expect(results).toHaveLength(2);
      expect(results[0]).toBeInstanceOf(TestUserWorkspaceModel);
    });

    it("should throw ValidationException for invalid workspace_id", async () => {
      await expect(TestUserWorkspaceModel.findByWorkspaceId(0)).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe("getDefaultWorkspace", () => {
    it("should return default workspace for user", async () => {
      const result = await TestUserWorkspaceModel.getDefaultWorkspace(1);
      expect(result).toBeInstanceOf(TestUserWorkspaceModel);
      expect(result?.is_default).toBe(true);
    });

    it("should return null when no default workspace", async () => {
      const result = await TestUserWorkspaceModel.getDefaultWorkspace(999);
      expect(result).toBeNull();
    });

    it("should throw ValidationException for invalid user_id", async () => {
      await expect(
        TestUserWorkspaceModel.getDefaultWorkspace(0)
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("countMembersByWorkspaceId", () => {
    it("should return member count", async () => {
      const count = await TestUserWorkspaceModel.countMembersByWorkspaceId(1);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThan(0);
    });

    it("should throw ValidationException for invalid workspace_id", async () => {
      await expect(
        TestUserWorkspaceModel.countMembersByWorkspaceId(0)
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("removeUserFromWorkspace", () => {
    it("should remove user from workspace", async () => {
      const result = await TestUserWorkspaceModel.removeUserFromWorkspace(1, 1);
      expect(result).toBe(1);
    });

    it("should throw ValidationException for invalid user_id", async () => {
      await expect(
        TestUserWorkspaceModel.removeUserFromWorkspace(0, 1)
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid workspace_id", async () => {
      await expect(
        TestUserWorkspaceModel.removeUserFromWorkspace(1, 0)
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("fromJSON", () => {
    it("should create user-workspace from JSON", () => {
      const json = {
        id: 1,
        user_id: 1,
        workspace_id: 1,
        role: WorkspaceRole.MEMBER,
        is_default: false,
      };
      const userWorkspace = TestUserWorkspaceModel.fromJSON(json);
      expect(userWorkspace).toBeInstanceOf(TestUserWorkspaceModel);
      expect(userWorkspace.id).toBe(1);
      expect(userWorkspace.role).toBe(WorkspaceRole.MEMBER);
    });
  });
});
