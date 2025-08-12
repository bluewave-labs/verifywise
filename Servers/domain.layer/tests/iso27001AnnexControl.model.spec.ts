// import { ValidationException } from "../exceptions/custom.exception";

// // Mock sequelize-typescript completely
// jest.mock("sequelize-typescript", () => ({
//   Column: jest.fn(),
//   DataType: {
//     INTEGER: "INTEGER",
//     STRING: "STRING",
//     TEXT: "TEXT",
//     JSONB: "JSONB",
//     DATE: "DATE",
//     ENUM: jest.fn(),
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

// // Mock validation functions
// jest.mock("../validations/number.valid", () => ({
//   numberValidation: jest.fn((value: number, min: number) => value >= min),
// }));

// // Create a simple test class that mimics ISO27001AnnexControlModel behavior
// class TestISO27001AnnexControlModel {
//   id?: number;
//   control_no!: number;
//   title!: string;
//   requirement_summary!: string;
//   key_questions!: string[];
//   evidence_examples!: string[];
//   implementation_description!: string;
//   // status!: ControlStatus;
//   owner?: number;
//   reviewer?: number;
//   approver?: number;
//   due_date?: Date;
//   cross_mappings?: object[];
//   iso27001annex_category_id!: number;

//   constructor(data?: any) {
//     if (data) {
//       Object.assign(this, data);
//     }
//   }

//   // Static method to create new annex control
//   static async createNewAnnexControl(
//     control_no: number,
//     title: string,
//     requirement_summary: string,
//     key_questions: string[],
//     evidence_examples: string[],
//     implementation_description: string,
//     iso27001annex_category_id: number,
//     owner?: number,
//     reviewer?: number,
//     approver?: number,
//     due_date?: Date,
//     cross_mappings?: object[]
//   ): Promise<TestISO27001AnnexControlModel> {
//     // Validate control_no
//     if (control_no < 1) {
//       throw new ValidationException(
//         "Control number must be a positive integer",
//         "control_no",
//         control_no
//       );
//     }

//     // Validate title
//     if (!title || title.trim().length === 0) {
//       throw new ValidationException("Title is required", "title", title);
//     }

//     if (title.trim().length < 3) {
//       throw new ValidationException(
//         "Title must be at least 3 characters long",
//         "title",
//         title
//       );
//     }

//     // Validate requirement_summary
//     if (!requirement_summary || requirement_summary.trim().length === 0) {
//       throw new ValidationException(
//         "Requirement summary is required",
//         "requirement_summary",
//         requirement_summary
//       );
//     }

//     if (requirement_summary.trim().length < 10) {
//       throw new ValidationException(
//         "Requirement summary must be at least 10 characters long",
//         "requirement_summary",
//         requirement_summary
//       );
//     }

//     // Validate key_questions
//     if (
//       !key_questions ||
//       !Array.isArray(key_questions) ||
//       key_questions.length === 0
//     ) {
//       throw new ValidationException(
//         "At least one key question is required",
//         "key_questions",
//         key_questions
//       );
//     }

//     // Validate each key question
//     key_questions.forEach((question, index) => {
//       if (!question || question.trim().length === 0) {
//         throw new ValidationException(
//           `Key question at index ${index} cannot be empty`,
//           "key_questions",
//           question
//         );
//       }
//       if (question.trim().length < 5) {
//         throw new ValidationException(
//           `Key question at index ${index} must be at least 5 characters long`,
//           "key_questions",
//           question
//         );
//       }
//     });

//     // Validate evidence_examples
//     if (!evidence_examples || !Array.isArray(evidence_examples)) {
//       throw new ValidationException(
//         "Evidence examples must be an array",
//         "evidence_examples",
//         evidence_examples
//       );
//     }

//     // Validate implementation_description
//     if (
//       !implementation_description ||
//       implementation_description.trim().length === 0
//     ) {
//       throw new ValidationException(
//         "Implementation description is required",
//         "implementation_description",
//         implementation_description
//       );
//     }

//     if (implementation_description.trim().length < 20) {
//       throw new ValidationException(
//         "Implementation description must be at least 20 characters long",
//         "implementation_description",
//         implementation_description
//       );
//     }

//     // Validate iso27001annex_category_id
//     if (iso27001annex_category_id < 1) {
//       throw new ValidationException(
//         "Valid annex category ID is required",
//         "iso27001annex_category_id",
//         iso27001annex_category_id
//       );
//     }

//     // Create and return the annex control model instance
//     const annexControl = new TestISO27001AnnexControlModel();
//     annexControl.control_no = control_no;
//     annexControl.title = title.trim();
//     annexControl.requirement_summary = requirement_summary.trim();
//     annexControl.key_questions = key_questions.map((q) => q.trim());
//     annexControl.evidence_examples = evidence_examples.map((e) => e.trim());
//     annexControl.implementation_description = implementation_description.trim();
//     annexControl.status = "Waiting";
//     annexControl.owner = owner;
//     annexControl.reviewer = reviewer;
//     annexControl.approver = approver;
//     annexControl.due_date = due_date;
//     annexControl.cross_mappings = cross_mappings || [];
//     annexControl.iso27001annex_category_id = iso27001annex_category_id;

//     return annexControl;
//   }

//   // Instance method to update annex control
//   async updateAnnexControl(updateData: {
//     title?: string;
//     requirement_summary?: string;
//     key_questions?: string[];
//     evidence_examples?: string[];
//     implementation_description?: string;
//     status?: ControlStatus;
//     owner?: number;
//     reviewer?: number;
//     approver?: number;
//     due_date?: Date;
//     cross_mappings?: object[];
//   }): Promise<void> {
//     // Validate title if provided
//     if (updateData.title !== undefined) {
//       if (!updateData.title || updateData.title.trim().length === 0) {
//         throw new ValidationException(
//           "Title is required",
//           "title",
//           updateData.title
//         );
//       }
//       if (updateData.title.trim().length < 3) {
//         throw new ValidationException(
//           "Title must be at least 3 characters long",
//           "title",
//           updateData.title
//         );
//       }
//       this.title = updateData.title.trim();
//     }

//     // Validate status if provided
//     if (updateData.status !== undefined) {
//       const validStatuses: ControlStatus[] = [
//         "Waiting",
//         "In progress",
//         "Done",
//         "Review",
//         "Approved",
//       ];
//       if (!validStatuses.includes(updateData.status)) {
//         throw new ValidationException(
//           "Invalid status value",
//           "status",
//           updateData.status
//         );
//       }
//       this.status = updateData.status;
//     }
//   }

//   // Business logic methods
//   belongsToCategory(categoryId: number): boolean {
//     return this.iso27001annex_category_id === categoryId;
//   }

//   getControlIdentifier(): string {
//     return `A.${this.control_no}`;
//   }

//   getFullControlName(): string {
//     return `${this.getControlIdentifier()} - ${this.title}`;
//   }

//   isOverdue(): boolean {
//     if (!this.due_date) {
//       return false;
//     }
//     return (
//       new Date() > this.due_date &&
//       this.status !== "Done" &&
//       this.status !== "Approved"
//     );
//   }

//   isCompleted(): boolean {
//     return this.status === "Done" || this.status === "Approved";
//   }

//   isInReview(): boolean {
//     return this.status === "Review";
//   }

//   isInProgress(): boolean {
//     return this.status === "In progress";
//   }

//   getProgressPercentage(): number {
//     switch (this.status) {
//       case "Done":
//       case "Approved":
//         return 100;
//       case "Review":
//         return 75;
//       case "In progress":
//         return 50;
//       case "Waiting":
//       default:
//         return 0;
//     }
//   }

//   canBeModifiedBy(userId: number, isAdmin: boolean = false): boolean {
//     if (isAdmin) {
//       return true;
//     }
//     return (
//       this.owner === userId ||
//       this.reviewer === userId ||
//       this.approver === userId
//     );
//   }

//   canBeReviewedBy(userId: number, isAdmin: boolean = false): boolean {
//     if (isAdmin) {
//       return true;
//     }
//     return this.reviewer === userId;
//   }

//   canBeApprovedBy(userId: number, isAdmin: boolean = false): boolean {
//     if (isAdmin) {
//       return true;
//     }
//     return this.approver === userId;
//   }

//   isValidForISO27001(): boolean {
//     return this.control_no >= 1 && this.control_no <= 200;
//   }

//   getPriority(): "high" | "medium" | "low" {
//     if (this.isOverdue()) {
//       return "high";
//     }
//     if (this.status === "In progress" || this.status === "Review") {
//       return "medium";
//     }
//     return "low";
//   }
// }

// describe("ISO27001AnnexControlModel", () => {
//   // Test data
//   const validAnnexControlData = {
//     control_no: 1,
//     title: "Information Security Policy",
//     requirement_summary:
//       "The organization shall define and maintain an information security policy that provides management direction and support for information security.",
//     key_questions: [
//       "Does the organization have a documented information security policy?",
//       "Is the policy approved by management?",
//       "Is the policy communicated to all relevant personnel?",
//     ],
//     evidence_examples: [
//       "Information security policy document",
//       "Policy approval records",
//       "Communication records",
//     ],
//     implementation_description:
//       "The organization shall establish, implement, maintain, and continually improve an information security management system in accordance with the requirements of ISO 27001.",
//     iso27001annex_category_id: 1,
//   };

//   // Clear all mocks before each test
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe("createNewAnnexControl", () => {
//     it("should create a new annex control with valid data", async () => {
//       // Arrange & Act
//       const annexControl =
//         await TestISO27001AnnexControlModel.createNewAnnexControl(
//           validAnnexControlData.control_no,
//           validAnnexControlData.title,
//           validAnnexControlData.requirement_summary,
//           validAnnexControlData.key_questions,
//           validAnnexControlData.evidence_examples,
//           validAnnexControlData.implementation_description,
//           validAnnexControlData.iso27001annex_category_id
//         );

//       // Assert
//       expect(annexControl).toBeInstanceOf(TestISO27001AnnexControlModel);
//       expect(annexControl.control_no).toBe(1);
//       expect(annexControl.title).toBe("Information Security Policy");
//       expect(annexControl.requirement_summary).toBe(
//         validAnnexControlData.requirement_summary
//       );
//       expect(annexControl.key_questions).toHaveLength(3);
//       expect(annexControl.evidence_examples).toHaveLength(3);
//       expect(annexControl.implementation_description).toBe(
//         validAnnexControlData.implementation_description
//       );
//       expect(annexControl.status).toBe("Waiting");
//       expect(annexControl.iso27001annex_category_id).toBe(1);
//     });

//     it("should throw ValidationException for invalid control number", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001AnnexControlModel.createNewAnnexControl(
//           0, // invalid control number
//           validAnnexControlData.title,
//           validAnnexControlData.requirement_summary,
//           validAnnexControlData.key_questions,
//           validAnnexControlData.evidence_examples,
//           validAnnexControlData.implementation_description,
//           validAnnexControlData.iso27001annex_category_id
//         )
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for missing title", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001AnnexControlModel.createNewAnnexControl(
//           validAnnexControlData.control_no,
//           "", // empty title
//           validAnnexControlData.requirement_summary,
//           validAnnexControlData.key_questions,
//           validAnnexControlData.evidence_examples,
//           validAnnexControlData.implementation_description,
//           validAnnexControlData.iso27001annex_category_id
//         )
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for title too short", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001AnnexControlModel.createNewAnnexControl(
//           validAnnexControlData.control_no,
//           "AB", // too short
//           validAnnexControlData.requirement_summary,
//           validAnnexControlData.key_questions,
//           validAnnexControlData.evidence_examples,
//           validAnnexControlData.implementation_description,
//           validAnnexControlData.iso27001annex_category_id
//         )
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for missing key questions", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001AnnexControlModel.createNewAnnexControl(
//           validAnnexControlData.control_no,
//           validAnnexControlData.title,
//           validAnnexControlData.requirement_summary,
//           [], // empty key questions
//           validAnnexControlData.evidence_examples,
//           validAnnexControlData.implementation_description,
//           validAnnexControlData.iso27001annex_category_id
//         )
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for short key question", async () => {
//       // Arrange & Act & Assert
//       await expect(
//         TestISO27001AnnexControlModel.createNewAnnexControl(
//           validAnnexControlData.control_no,
//           validAnnexControlData.title,
//           validAnnexControlData.requirement_summary,
//           ["Hi"], // too short key question (less than 5 characters)
//           validAnnexControlData.evidence_examples,
//           validAnnexControlData.implementation_description,
//           validAnnexControlData.iso27001annex_category_id
//         )
//       ).rejects.toThrow(ValidationException);
//     });
//   });

//   describe("updateAnnexControl", () => {
//     it("should update annex control with valid data", async () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel(
//         validAnnexControlData
//       );
//       const updateData = {
//         title: "Updated Security Policy",
//         status: "In progress" as ControlStatus,
//       };

//       // Act
//       await annexControl.updateAnnexControl(updateData);

//       // Assert
//       expect(annexControl.title).toBe("Updated Security Policy");
//       expect(annexControl.status).toBe("In progress");
//     });

//     it("should throw ValidationException for invalid title in update", async () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel(
//         validAnnexControlData
//       );

//       // Act & Assert
//       await expect(
//         annexControl.updateAnnexControl({ title: "" })
//       ).rejects.toThrow(ValidationException);
//     });

//     it("should throw ValidationException for invalid status in update", async () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel(
//         validAnnexControlData
//       );

//       // Act & Assert
//       await expect(
//         annexControl.updateAnnexControl({ status: "Invalid" as any })
//       ).rejects.toThrow(ValidationException);
//     });
//   });

//   describe("business logic methods", () => {
//     it("should correctly identify category ownership", () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel(
//         validAnnexControlData
//       );

//       // Act & Assert
//       expect(annexControl.belongsToCategory(1)).toBe(true);
//       expect(annexControl.belongsToCategory(2)).toBe(false);
//     });

//     it("should generate correct control identifier", () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel(
//         validAnnexControlData
//       );

//       // Act & Assert
//       expect(annexControl.getControlIdentifier()).toBe("A.1");
//     });

//     it("should generate correct full control name", () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel(
//         validAnnexControlData
//       );

//       // Act & Assert
//       expect(annexControl.getFullControlName()).toBe(
//         "A.1 - Information Security Policy"
//       );
//     });

//     it("should detect overdue controls", () => {
//       // Arrange
//       const overdueControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         due_date: new Date("2020-01-01"),
//         status: "In progress",
//       });
//       const notOverdueControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         due_date: new Date("2030-01-01"),
//         status: "In progress",
//       });

//       // Act & Assert
//       expect(overdueControl.isOverdue()).toBe(true);
//       expect(notOverdueControl.isOverdue()).toBe(false);
//     });

//     it("should detect completed controls", () => {
//       // Arrange
//       const completedControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         status: "Done",
//       });
//       const notCompletedControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         status: "Waiting",
//       });

//       // Act & Assert
//       expect(completedControl.isCompleted()).toBe(true);
//       expect(notCompletedControl.isCompleted()).toBe(false);
//     });

//     it("should calculate correct progress percentage", () => {
//       // Arrange
//       const waitingControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         status: "Waiting",
//       });
//       const inProgressControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         status: "In progress",
//       });
//       const reviewControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         status: "Review",
//       });
//       const completedControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         status: "Done",
//       });

//       // Act & Assert
//       expect(waitingControl.getProgressPercentage()).toBe(0);
//       expect(inProgressControl.getProgressPercentage()).toBe(50);
//       expect(reviewControl.getProgressPercentage()).toBe(75);
//       expect(completedControl.getProgressPercentage()).toBe(100);
//     });

//     it("should validate ISO 27001 compliance", () => {
//       // Arrange
//       const validControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         control_no: 100,
//       });
//       const invalidControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         control_no: 201,
//       });

//       // Act & Assert
//       expect(validControl.isValidForISO27001()).toBe(true);
//       expect(invalidControl.isValidForISO27001()).toBe(false);
//     });

//     it("should return correct priority based on status and due date", () => {
//       // Arrange
//       const overdueControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         due_date: new Date("2020-01-01"),
//         status: "In progress",
//       });
//       const inProgressControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         status: "In progress",
//       });
//       const waitingControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         status: "Waiting",
//       });

//       // Act & Assert
//       expect(overdueControl.getPriority()).toBe("high");
//       expect(inProgressControl.getPriority()).toBe("medium");
//       expect(waitingControl.getPriority()).toBe("low");
//     });
//   });

//   describe("permission methods", () => {
//     it("should allow admin to modify any control", () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         owner: 1,
//         reviewer: 2,
//         approver: 3,
//       });

//       // Act & Assert
//       expect(annexControl.canBeModifiedBy(999, true)).toBe(true);
//       expect(annexControl.canBeReviewedBy(999, true)).toBe(true);
//       expect(annexControl.canBeApprovedBy(999, true)).toBe(true);
//     });

//     it("should allow owner to modify control", () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         owner: 1,
//         reviewer: 2,
//         approver: 3,
//       });

//       // Act & Assert
//       expect(annexControl.canBeModifiedBy(1, false)).toBe(true);
//     });

//     it("should allow reviewer to review control", () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         owner: 1,
//         reviewer: 2,
//         approver: 3,
//       });

//       // Act & Assert
//       expect(annexControl.canBeReviewedBy(2, false)).toBe(true);
//     });

//     it("should allow approver to approve control", () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         owner: 1,
//         reviewer: 2,
//         approver: 3,
//       });

//       // Act & Assert
//       expect(annexControl.canBeApprovedBy(3, false)).toBe(true);
//     });

//     it("should deny unauthorized user access", () => {
//       // Arrange
//       const annexControl = new TestISO27001AnnexControlModel({
//         ...validAnnexControlData,
//         owner: 1,
//         reviewer: 2,
//         approver: 3,
//       });

//       // Act & Assert
//       expect(annexControl.canBeModifiedBy(999, false)).toBe(false);
//       expect(annexControl.canBeReviewedBy(999, false)).toBe(false);
//       expect(annexControl.canBeApprovedBy(999, false)).toBe(false);
//     });
//   });
// });
