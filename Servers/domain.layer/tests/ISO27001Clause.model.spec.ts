// import { ValidationException } from "../exceptions/custom.exception";

// // Mock sequelize-typescript completely
// jest.mock("sequelize-typescript", () => ({
//   Column: jest.fn(),
//   DataType: {
//     INTEGER: "INTEGER",
//     STRING: "STRING",
//     TEXT: "TEXT",
//     JSON: "JSON",
//     DATE: "DATE",
//   },
//   ForeignKey: jest.fn(),
//   Table: jest.fn(),
//   Model: class MockModel {
//     constructor(data?: any) {
//       if (data) {
//         Object.assign(this, data);
//       }
//     }
//   },
// }));

// // Create a simple test class that mimics ISO27001ClauseModel behavior
// class TestISO27001ClauseModel {
//   id?: number;
//   arrangement!: number;
//   clause_no!: number;
//   clause_name!: string;
//   requirement_summary!: string;
//   key_questions!: string[];
//   evidence_examples!: string[];
//   implementation_description!: string;
//   status!: string;
//   owner!: number;
//   reviewer!: number;
//   approver!: number;
//   due_date!: Date;
//   cross_mappings!: object[];
//   framework_id!: number;
//   project_id!: number;
//   created_at?: Date;
//   updated_at?: Date;

//   constructor(data?: any) {
//     if (data) {
//       Object.assign(this, data);
//     }
//   }

//   // Static method to create new clause
//   static async createNewClause(
//     clauseAttributes: Partial<IISO27001Clause>
//   ): Promise<TestISO27001ClauseModel> {
//     // Validate required fields
//     if (!clauseAttributes.arrangement || clauseAttributes.arrangement < 1) {
//       throw new ValidationException(
//         "Valid arrangement is required (must be >= 1)",
//         "arrangement",
//         clauseAttributes.arrangement
//       );
//     }

//     if (!clauseAttributes.clause_no || clauseAttributes.clause_no < 1) {
//       throw new ValidationException(
//         "Valid clause_no is required (must be >= 1)",
//         "clause_no",
//         clauseAttributes.clause_no
//       );
//     }

//     if (
//       !clauseAttributes.clause_name ||
//       clauseAttributes.clause_name.trim().length === 0
//     ) {
//       throw new ValidationException(
//         "Clause name is required",
//         "clause_name",
//         clauseAttributes.clause_name
//       );
//     }

//     if (
//       !clauseAttributes.requirement_summary ||
//       clauseAttributes.requirement_summary.trim().length === 0
//     ) {
//       throw new ValidationException(
//         "Requirement summary is required",
//         "requirement_summary",
//         clauseAttributes.requirement_summary
//       );
//     }

//     if (
//       !clauseAttributes.key_questions ||
//       !Array.isArray(clauseAttributes.key_questions) ||
//       clauseAttributes.key_questions.length === 0
//     ) {
//       throw new ValidationException(
//         "Key questions array is required and must not be empty",
//         "key_questions",
//         clauseAttributes.key_questions
//       );
//     }

//     if (
//       !clauseAttributes.evidence_examples ||
//       !Array.isArray(clauseAttributes.evidence_examples) ||
//       clauseAttributes.evidence_examples.length === 0
//     ) {
//       throw new ValidationException(
//         "Evidence examples array is required and must not be empty",
//         "evidence_examples",
//         clauseAttributes.evidence_examples
//       );
//     }

//     if (!clauseAttributes.framework_id || clauseAttributes.framework_id < 1) {
//       throw new ValidationException(
//         "Valid framework_id is required (must be >= 1)",
//         "framework_id",
//         clauseAttributes.framework_id
//       );
//     }

//     if (!clauseAttributes.project_id || clauseAttributes.project_id < 1) {
//       throw new ValidationException(
//         "Valid project_id is required (must be >= 1)",
//         "project_id",
//         clauseAttributes.project_id
//       );
//     }

//     // Validate user references if provided
//     if (clauseAttributes.owner && clauseAttributes.owner < 1) {
//       throw new ValidationException(
//         "Valid owner user_id is required (must be >= 1)",
//         "owner",
//         clauseAttributes.owner
//       );
//     }

//     if (clauseAttributes.reviewer && clauseAttributes.reviewer < 1) {
//       throw new ValidationException(
//         "Valid reviewer user_id is required (must be >= 1)",
//         "reviewer",
//         clauseAttributes.reviewer
//       );
//     }

//     if (clauseAttributes.approver && clauseAttributes.approver < 1) {
//       throw new ValidationException(
//         "Valid approver user_id is required (must be >= 1)",
//         "approver",
//         clauseAttributes.approver
//       );
//     }

//     // Create and return the clause model instance
//     const clause = new TestISO27001ClauseModel();
//     clause.arrangement = clauseAttributes.arrangement!;
//     clause.clause_no = clauseAttributes.clause_no!;
//     clause.clause_name = clauseAttributes.clause_name!;
//     clause.requirement_summary = clauseAttributes.requirement_summary!;
//     clause.key_questions = clauseAttributes.key_questions!;
//     clause.evidence_examples = clauseAttributes.evidence_examples!;
//     clause.framework_id = clauseAttributes.framework_id!;
//     clause.project_id = clauseAttributes.project_id!;
//     clause.owner = clauseAttributes.owner || 0;
//     clause.reviewer = clauseAttributes.reviewer || 0;
//     clause.approver = clauseAttributes.approver || 0;
//     clause.due_date = clauseAttributes.due_date || new Date();
//     clause.cross_mappings = clauseAttributes.cross_mappings || [];
//     clause.implementation_description =
//       clauseAttributes.implementation_description || "";
//     clause.status = clauseAttributes.status || "Not Started";

//     return clause;
//   }

//   // Instance method to update clause
//   async updateClause(updateData: Partial<IISO27001Clause>): Promise<void> {
//     // Validate arrangement if provided
//     if (updateData.arrangement !== undefined) {
//       if (updateData.arrangement < 1) {
//         throw new ValidationException(
//           "Valid arrangement is required (must be >= 1)",
//           "arrangement",
//           updateData.arrangement
//         );
//       }
//       this.arrangement = updateData.arrangement;
//     }

//     // Validate clause_name if provided
//     if (updateData.clause_name !== undefined) {
//       if (
//         !updateData.clause_name ||
//         updateData.clause_name.trim().length === 0
//       ) {
//         throw new ValidationException(
//           "Clause name is required",
//           "clause_name",
//           updateData.clause_name
//         );
//       }
//       this.clause_name = updateData.clause_name.trim();
//     }

//     // Update other fields if provided
//     if (updateData.status !== undefined) {
//       this.status = updateData.status;
//     }

//     if (updateData.implementation_description !== undefined) {
//       this.implementation_description = updateData.implementation_description;
//     }
//   }

//   // Instance method to validate clause data
//   async validateClauseData(): Promise<void> {
//     if (this.arrangement < 1) {
//       throw new ValidationException(
//         "Valid arrangement is required (must be >= 1)",
//         "arrangement",
//         this.arrangement
//       );
//     }

//     if (this.clause_no < 1) {
//       throw new ValidationException(
//         "Valid clause_no is required (must be >= 1)",
//         "clause_no",
//         this.clause_no
//       );
//     }

//     if (!this.clause_name || this.clause_name.trim().length === 0) {
//       throw new ValidationException(
//         "Clause name is required",
//         "clause_name",
//         this.clause_name
//       );
//     }
//   }

//   // Instance method to check if clause is assigned to user
//   isAssignedToUser(userId: number): boolean {
//     return (
//       this.owner === userId ||
//       this.reviewer === userId ||
//       this.approver === userId
//     );
//   }

//   // Instance method to get display name
//   getDisplayName(): string {
//     return `${this.clause_no}. ${this.clause_name}`;
//   }

//   // Instance method to check if clause is active
//   isActive(): boolean {
//     const activeStatuses = ["In Progress", "Under Review"];
//     return activeStatuses.includes(this.status);
//   }

//   // Instance method to get status priority
//   getStatusPriority(): number {
//     const statusPriority = {
//       "Not Started": 1,
//       "In Progress": 2,
//       "Under Review": 3,
//       Approved: 4,
//       Completed: 5,
//     };
//     return statusPriority[this.status as keyof typeof statusPriority] || 0;
//   }

//   // Static method to create from JSON
//   static fromJSON(json: any): TestISO27001ClauseModel {
//     return new TestISO27001ClauseModel(json);
//   }

//   // Instance method to convert to JSON
//   toJSON(): any {
//     return {
//       id: this.id,
//       arrangement: this.arrangement,
//       clause_no: this.clause_no,
//       clause_name: this.clause_name,
//       requirement_summary: this.requirement_summary,
//       key_questions: this.key_questions,
//       evidence_examples: this.evidence_examples,
//       implementation_description: this.implementation_description,
//       status: this.status,
//       owner: this.owner,
//       reviewer: this.reviewer,
//       approver: this.approver,
//       due_date: this.due_date?.toISOString(),
//       cross_mappings: this.cross_mappings,
//       framework_id: this.framework_id,
//       project_id: this.project_id,
//       created_at: this.created_at?.toISOString(),
//       updated_at: this.updated_at?.toISOString(),
//     };
//   }
// }

// describe("ISO27001ClauseModel", () => {
//   const validClauseData = {
//     arrangement: 1,
//     clause_no: 1,
//     clause_name: "Information Security Policy",
//     requirement_summary: "Establish an information security policy",
//     key_questions: ["Do you have an information security policy?"],
//     evidence_examples: ["Policy document", "Policy review records"],
//     framework_id: 1,
//     project_id: 1,
//   };

//   // Clear all mocks before each test
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe("instantiation", () => {
//     it("should instantiate with correct attributes", () => {
//       // Arrange & Act
//       const clause = new TestISO27001ClauseModel(validClauseData);

//       // Assert
//       expect(clause.arrangement).toBe(1);
//       expect(clause.clause_name).toBe("Information Security Policy");
//       expect(clause.clause_no).toBe(1);
//       expect(clause.framework_id).toBe(1);
//       expect(clause.project_id).toBe(1);
//     });
//   });

//   describe("createNewClause", () => {
//     it("should create a new clause with valid data", async () => {
//       // Arrange & Act
//       const clause =
//         await TestISO27001ClauseModel.createNewClause(validClauseData);

//       // Assert
//       expect(clause).toBeInstanceOf(TestISO27001ClauseModel);
//       expect(clause.arrangement).toBe(validClauseData.arrangement);
//       expect(clause.clause_name).toBe(validClauseData.clause_name);
//       expect(clause.status).toBe("Not Started");
//       expect(clause.implementation_description).toBe("");
//       expect(clause.cross_mappings).toEqual([]);
//     });

//     it("should create a new clause with custom status and description", async () => {
//       // Arrange
//       const clauseData = {
//         ...validClauseData,
//         status: "In Progress",
//         implementation_description: "Custom description",
//       };

//       // Act
//       const clause = await TestISO27001ClauseModel.createNewClause(clauseData);

//       // Assert
//       expect(clause.status).toBe("In Progress");
//       expect(clause.implementation_description).toBe("Custom description");
//     });

//     it("should throw ValidationException for invalid arrangement", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001ClauseModel.createNewClause({
//           ...validClauseData,
//           arrangement: 0,
//         })
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for empty clause name", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001ClauseModel.createNewClause({
//           ...validClauseData,
//           clause_name: "",
//         })
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for empty key questions", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001ClauseModel.createNewClause({
//           ...validClauseData,
//           key_questions: [],
//         })
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for empty evidence examples", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001ClauseModel.createNewClause({
//           ...validClauseData,
//           evidence_examples: [],
//         })
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for invalid framework_id", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001ClauseModel.createNewClause({
//           ...validClauseData,
//           framework_id: 0,
//         })
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for invalid project_id", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001ClauseModel.createNewClause({
//           ...validClauseData,
//           project_id: 0,
//         })
//       ).rejects.toThrow(ValidationException);
//     });
//   });

//   describe("updateClause", () => {
//     let clause: TestISO27001ClauseModel;

//     beforeEach(async () => {
//       clause = await TestISO27001ClauseModel.createNewClause(validClauseData);
//     });

//     it("should update clause with valid data", async () => {
//       // Arrange & Act
//       await clause.updateClause({
//         clause_name: "Updated Policy",
//         status: "In Progress",
//       });

//       // Assert
//       expect(clause.clause_name).toBe("Updated Policy");
//       expect(clause.status).toBe("In Progress");
//     });

//     it("should throw ValidationException for invalid clause name update", async () => {
//       // Arrange & Act & Assert
//       await expect(clause.updateClause({ clause_name: "" })).rejects.toThrow(
//         ValidationException
//       );
//     });

//     it("should throw ValidationException for invalid arrangement update", async () => {
//       // Arrange & Act & Assert
//       await expect(clause.updateClause({ arrangement: 0 })).rejects.toThrow(
//         ValidationException
//       );
//     });
//   });

//   describe("validateClauseData", () => {
//     let clause: TestISO27001ClauseModel;

//     beforeEach(async () => {
//       clause = await TestISO27001ClauseModel.createNewClause(validClauseData);
//     });

//     it("should pass validation with valid data", async () => {
//       // Arrange & Act & Assert
//       await expect(clause.validateClauseData()).resolves.not.toThrow();
//     });

//     it("should throw ValidationException for invalid arrangement", async () => {
//       // Arrange
//       clause.arrangement = 0;

//       // Act & Assert
//       await expect(clause.validateClauseData()).rejects.toThrow(
//         ValidationException
//       );
//     });

//     it("should throw ValidationException for invalid clause_no", async () => {
//       // Arrange
//       clause.clause_no = 0;

//       // Act & Assert
//       await expect(clause.validateClauseData()).rejects.toThrow(
//         ValidationException
//       );
//     });

//     it("should throw ValidationException for empty clause name", async () => {
//       // Arrange
//       clause.clause_name = "";

//       // Act & Assert
//       await expect(clause.validateClauseData()).rejects.toThrow(
//         ValidationException
//       );
//     });
//   });

//   describe("utility methods", () => {
//     let clause: TestISO27001ClauseModel;

//     beforeEach(async () => {
//       clause = await TestISO27001ClauseModel.createNewClause({
//         ...validClauseData,
//         owner: 1,
//         reviewer: 2,
//         approver: 3,
//       });
//     });

//     it("should check if clause is assigned to user", () => {
//       // Arrange & Act & Assert
//       expect(clause.isAssignedToUser(1)).toBe(true);
//       expect(clause.isAssignedToUser(2)).toBe(true);
//       expect(clause.isAssignedToUser(3)).toBe(true);
//       expect(clause.isAssignedToUser(4)).toBe(false);
//     });

//     it("should get display name", () => {
//       // Arrange & Act & Assert
//       expect(clause.getDisplayName()).toBe("1. Information Security Policy");
//     });

//     it("should check if clause is active", () => {
//       // Arrange & Act & Assert
//       expect(clause.isActive()).toBe(false); // "Not Started" is not active

//       clause.status = "In Progress";
//       expect(clause.isActive()).toBe(true);

//       clause.status = "Under Review";
//       expect(clause.isActive()).toBe(true);

//       clause.status = "Completed";
//       expect(clause.isActive()).toBe(false);
//     });

//     it("should get status priority", () => {
//       // Arrange & Act & Assert
//       expect(clause.getStatusPriority()).toBe(1); // "Not Started"

//       clause.status = "In Progress";
//       expect(clause.getStatusPriority()).toBe(2);

//       clause.status = "Completed";
//       expect(clause.getStatusPriority()).toBe(5);
//     });
//   });

//   describe("JSON serialization", () => {
//     it("should convert to JSON", async () => {
//       // Arrange
//       const clause =
//         await TestISO27001ClauseModel.createNewClause(validClauseData);

//       // Act
//       const json = clause.toJSON();

//       // Assert
//       expect(json.clause_name).toBe(validClauseData.clause_name);
//       expect(json.status).toBe("Not Started");
//       expect(json).toHaveProperty("created_at");
//       expect(json).toHaveProperty("updated_at");
//     });

//     it("should create from JSON", () => {
//       // Arrange
//       const jsonData = { ...validClauseData, id: 1 };

//       // Act
//       const clause = TestISO27001ClauseModel.fromJSON(jsonData);

//       // Assert
//       expect(clause.clause_name).toBe(jsonData.clause_name);
//       expect(clause.id).toBe(jsonData.id);
//     });
//   });
// });
