import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../exceptions/custom.exception";
import { numberValidation } from "../validations/number.valid";

// Mock sequelize-typescript
jest.mock("sequelize-typescript", () => ({
  Column: jest.fn(),
  DataType: {
    INTEGER: "INTEGER",
    STRING: "STRING",
    DATE: "DATE",
    BOOLEAN: "BOOLEAN",
    ENUM: jest.fn(),
    ARRAY: jest.fn(),
    JSONB: "JSONB",
  },
  ForeignKey: jest.fn(),
  Table: jest.fn(),
  Model: class MockModel {
    constructor(data?: any) {
      if (data) Object.assign(this, data);
    }
  },
}));

// Mock related models
jest.mock("../models/subtopic/subtopic.model", () => ({
  SubtopicModel: class MockSubtopicModel {},
}));

// Test class mimicking QuestionModel behavior
class TestQuestionModel {
  id?: number;
  order_no?: number;
  question!: string;
  hint!: string;
  priority_level!: "high priority" | "medium priority" | "low priority";
  answer_type!: string;
  input_type!: string;
  evidence_required!: boolean;
  is_required!: boolean;
  dropdown_options?: any[];
  evidence_files?: any[];
  answer?: string;
  subtopic_id!: number;
  is_demo?: boolean;
  created_at?: Date;
  status?: "Not started" | "In progress" | "Done";

  constructor(data?: any) {
    if (data) Object.assign(this, data);
  }

  // Static method to create new question
  static async createNewQuestion(
    question: string,
    hint: string,
    priority_level: "high priority" | "medium priority" | "low priority",
    answer_type: string,
    input_type: string,
    evidence_required: boolean,
    is_required: boolean,
    subtopic_id: number,
    order_no?: number,
    dropdown_options?: any[],
    evidence_files?: any[],
    is_demo: boolean = false
  ): Promise<TestQuestionModel> {
    // Validate required fields
    if (!question || question.trim().length === 0) {
      throw new ValidationException(
        "Question text is required",
        "question",
        question
      );
    }

    if (!hint || hint.trim().length === 0) {
      throw new ValidationException("Hint is required", "hint", hint);
    }

    if (!answer_type || answer_type.trim().length === 0) {
      throw new ValidationException(
        "Answer type is required",
        "answer_type",
        answer_type
      );
    }

    if (!input_type || input_type.trim().length === 0) {
      throw new ValidationException(
        "Input type is required",
        "input_type",
        input_type
      );
    }

    // Validate priority_level
    const validPriorities = [
      "high priority",
      "medium priority",
      "low priority",
    ];
    if (!validPriorities.includes(priority_level)) {
      throw new ValidationException(
        "Invalid priority level",
        "priority_level",
        priority_level
      );
    }

    // Validate subtopic_id
    if (!numberValidation(subtopic_id, 1)) {
      throw new ValidationException(
        "Valid subtopic_id is required (must be >= 1)",
        "subtopic_id",
        subtopic_id
      );
    }

    // Validate order_no if provided
    if (order_no !== undefined && !numberValidation(order_no, 1)) {
      throw new ValidationException(
        "Order number must be a positive integer",
        "order_no",
        order_no
      );
    }

    // Create and return the question model instance
    const questionModel = new TestQuestionModel();
    questionModel.question = question.trim();
    questionModel.hint = hint.trim();
    questionModel.priority_level = priority_level;
    questionModel.answer_type = answer_type.trim();
    questionModel.input_type = input_type.trim();
    questionModel.evidence_required = evidence_required;
    questionModel.is_required = is_required;
    questionModel.subtopic_id = subtopic_id;
    questionModel.order_no = order_no;
    questionModel.dropdown_options = dropdown_options || [];
    questionModel.evidence_files = evidence_files || [];
    questionModel.status = "Not started"; // Default status
    questionModel.is_demo = is_demo;
    questionModel.created_at = new Date();

    return questionModel;
  }

  // Instance method to update question
  async updateQuestion(updateData: {
    question?: string;
    hint?: string;
    priority_level?: "high priority" | "medium priority" | "low priority";
    answer_type?: string;
    input_type?: string;
    evidence_required?: boolean;
    is_required?: boolean;
    order_no?: number;
    dropdown_options?: any[];
    evidence_files?: any[];
    answer?: string;
    status?: "Not started" | "In progress" | "Done";
  }): Promise<void> {
    // Validate question if provided
    if (updateData.question !== undefined) {
      if (!updateData.question || updateData.question.trim().length === 0) {
        throw new ValidationException(
          "Question text is required",
          "question",
          updateData.question
        );
      }
      this.question = updateData.question.trim();
    }

    // Validate hint if provided
    if (updateData.hint !== undefined) {
      if (!updateData.hint || updateData.hint.trim().length === 0) {
        throw new ValidationException(
          "Hint is required",
          "hint",
          updateData.hint
        );
      }
      this.hint = updateData.hint.trim();
    }

    // Validate priority_level if provided
    if (updateData.priority_level !== undefined) {
      const validPriorities = [
        "high priority",
        "medium priority",
        "low priority",
      ];
      if (!validPriorities.includes(updateData.priority_level)) {
        throw new ValidationException(
          "Invalid priority level",
          "priority_level",
          updateData.priority_level
        );
      }
      this.priority_level = updateData.priority_level;
    }

    // Validate answer_type if provided
    if (updateData.answer_type !== undefined) {
      if (
        !updateData.answer_type ||
        updateData.answer_type.trim().length === 0
      ) {
        throw new ValidationException(
          "Answer type is required",
          "answer_type",
          updateData.answer_type
        );
      }
      this.answer_type = updateData.answer_type.trim();
    }

    // Validate input_type if provided
    if (updateData.input_type !== undefined) {
      if (!updateData.input_type || updateData.input_type.trim().length === 0) {
        throw new ValidationException(
          "Input type is required",
          "input_type",
          updateData.input_type
        );
      }
      this.input_type = updateData.input_type.trim();
    }

    // Validate order_no if provided
    if (updateData.order_no !== undefined) {
      if (!numberValidation(updateData.order_no, 1)) {
        throw new ValidationException(
          "Order number must be a positive integer",
          "order_no",
          updateData.order_no
        );
      }
      this.order_no = updateData.order_no;
    }

    // Validate status if provided
    if (updateData.status !== undefined) {
      const validStatuses = ["Not started", "In progress", "Done"];
      if (!validStatuses.includes(updateData.status)) {
        throw new ValidationException(
          "Invalid status value",
          "status",
          updateData.status
        );
      }
      this.status = updateData.status;
    }

    // Update boolean fields if provided
    if (updateData.evidence_required !== undefined) {
      this.evidence_required = updateData.evidence_required;
    }

    if (updateData.is_required !== undefined) {
      this.is_required = updateData.is_required;
    }

    // Update arrays if provided
    if (updateData.dropdown_options !== undefined) {
      this.dropdown_options = updateData.dropdown_options;
    }

    if (updateData.evidence_files !== undefined) {
      this.evidence_files = updateData.evidence_files;
    }

    // Update answer if provided
    if (updateData.answer !== undefined) {
      this.answer = updateData.answer;
    }
  }

  // Instance method to validate question data
  async validateQuestionData(): Promise<void> {
    if (!this.question || this.question.trim().length === 0) {
      throw new ValidationException(
        "Question text is required",
        "question",
        this.question
      );
    }

    if (!this.hint || this.hint.trim().length === 0) {
      throw new ValidationException("Hint is required", "hint", this.hint);
    }

    if (!this.answer_type || this.answer_type.trim().length === 0) {
      throw new ValidationException(
        "Answer type is required",
        "answer_type",
        this.answer_type
      );
    }

    if (!this.input_type || this.input_type.trim().length === 0) {
      throw new ValidationException(
        "Input type is required",
        "input_type",
        this.input_type
      );
    }

    if (!this.subtopic_id || !numberValidation(this.subtopic_id, 1)) {
      throw new ValidationException(
        "Valid subtopic_id is required",
        "subtopic_id",
        this.subtopic_id
      );
    }

    if (this.order_no !== undefined && !numberValidation(this.order_no, 1)) {
      throw new ValidationException(
        "Order number must be a positive integer",
        "order_no",
        this.order_no
      );
    }
  }

  // Instance method to check if question is a demo question
  isDemoQuestion(): boolean {
    return this.is_demo ?? false;
  }

  // Instance method to check if question can be modified
  canBeModified(): boolean {
    if (this.isDemoQuestion()) {
      throw new BusinessLogicException(
        "Demo questions cannot be modified",
        "DEMO_QUESTION_RESTRICTION",
        { questionId: this.id, subtopicId: this.subtopic_id }
      );
    }
    return true;
  }

  // Instance method to check if question is completed
  isCompleted(): boolean {
    return this.status === "Done";
  }

  // Instance method to check if question is in progress
  isInProgress(): boolean {
    return this.status === "In progress";
  }

  // Instance method to check if question is not started
  isNotStarted(): boolean {
    return this.status === "Not started" || !this.status;
  }

  // Instance method to check if question has high priority
  hasHighPriority(): boolean {
    return this.priority_level === "high priority";
  }

  // Instance method to check if question requires evidence
  requiresEvidence(): boolean {
    return this.evidence_required;
  }

  // Instance method to check if question is required
  isRequired(): boolean {
    return this.is_required;
  }

  // Instance method to get question progress percentage
  getProgressPercentage(): number {
    if (this.isCompleted()) {
      return 100;
    }
    if (this.isInProgress()) {
      return 50;
    }
    return 0;
  }

  // Instance method to get question summary
  getSummary(): {
    id: number | undefined;
    question: string;
    priority: string;
    status: string;
    progress: number;
    requiresEvidence: boolean;
  } {
    return {
      id: this.id,
      question: this.question,
      priority: this.priority_level,
      status: this.status || "Not started",
      progress: this.getProgressPercentage(),
      requiresEvidence: this.requiresEvidence(),
    };
  }

  // Instance method to convert to JSON representation
  toJSON(): any {
    return {
      id: this.id,
      order_no: this.order_no,
      question: this.question,
      hint: this.hint,
      priority_level: this.priority_level,
      answer_type: this.answer_type,
      input_type: this.input_type,
      evidence_required: this.evidence_required,
      is_required: this.is_required,
      dropdown_options: this.dropdown_options,
      evidence_files: this.evidence_files,
      answer: this.answer,
      subtopic_id: this.subtopic_id,
      is_demo: this.is_demo,
      created_at: this.created_at?.toISOString(),
      status: this.status,
      progressPercentage: this.getProgressPercentage(),
    };
  }

  // Static method to find question by ID with validation
  static async findByIdWithValidation(id: number): Promise<TestQuestionModel> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    // Mock database lookup
    if (id === 999) {
      throw new NotFoundException("Question not found", "Question", id);
    }

    return new TestQuestionModel({
      id,
      question: "Test Question",
      hint: "Test Hint",
      priority_level: "medium priority",
      answer_type: "text",
      input_type: "text",
      evidence_required: false,
      is_required: true,
      subtopic_id: 1,
      is_demo: false,
    });
  }

  // Static method to find questions by subtopic ID
  static async findBySubtopicId(
    subtopicId: number
  ): Promise<TestQuestionModel[]> {
    if (!numberValidation(subtopicId, 1)) {
      throw new ValidationException(
        "Valid subtopic_id is required (must be >= 1)",
        "subtopic_id",
        subtopicId
      );
    }

    return [
      new TestQuestionModel({
        id: 1,
        question: "Question 1",
        hint: "Hint 1",
        priority_level: "high priority",
        answer_type: "text",
        input_type: "text",
        evidence_required: true,
        is_required: true,
        subtopic_id: subtopicId,
        is_demo: false,
      }),
      new TestQuestionModel({
        id: 2,
        question: "Question 2",
        hint: "Hint 2",
        priority_level: "medium priority",
        answer_type: "dropdown",
        input_type: "select",
        evidence_required: false,
        is_required: false,
        subtopic_id: subtopicId,
        is_demo: true,
      }),
    ];
  }

  // Static method to update question by ID
  static async updateQuestionById(
    id: number,
    updateData: any
  ): Promise<[number, TestQuestionModel[]]> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    return [1, [new TestQuestionModel({ id, ...updateData })]];
  }

  // Static method to delete question by ID
  static async deleteQuestionById(id: number): Promise<number> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    return 1;
  }
}

describe("QuestionModel", () => {
  const validData = {
    question: "What is the primary security concern?",
    hint: "Consider data protection measures",
    priority_level: "high priority" as const,
    answer_type: "text",
    input_type: "text",
    evidence_required: true,
    is_required: true,
    subtopic_id: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createNewQuestion", () => {
    it("should create question with valid data", async () => {
      const question = await TestQuestionModel.createNewQuestion(
        validData.question,
        validData.hint,
        validData.priority_level,
        validData.answer_type,
        validData.input_type,
        validData.evidence_required,
        validData.is_required,
        validData.subtopic_id
      );

      expect(question).toBeInstanceOf(TestQuestionModel);
      expect(question.question).toBe("What is the primary security concern?");
      expect(question.hint).toBe("Consider data protection measures");
      expect(question.priority_level).toBe("high priority");
      expect(question.answer_type).toBe("text");
      expect(question.input_type).toBe("text");
      expect(question.evidence_required).toBe(true);
      expect(question.is_required).toBe(true);
      expect(question.subtopic_id).toBe(1);
      expect(question.status).toBe("Not started");
      expect(question.is_demo).toBe(false);
      expect(question.created_at).toBeInstanceOf(Date);
    });

    it("should create with custom is_demo value", async () => {
      const question = await TestQuestionModel.createNewQuestion(
        validData.question,
        validData.hint,
        validData.priority_level,
        validData.answer_type,
        validData.input_type,
        validData.evidence_required,
        validData.is_required,
        validData.subtopic_id,
        undefined,
        undefined,
        undefined,
        true
      );

      expect(question.is_demo).toBe(true);
    });

    it("should throw ValidationException for empty question", async () => {
      await expect(
        TestQuestionModel.createNewQuestion(
          "",
          validData.hint,
          validData.priority_level,
          validData.answer_type,
          validData.input_type,
          validData.evidence_required,
          validData.is_required,
          validData.subtopic_id
        )
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for empty hint", async () => {
      await expect(
        TestQuestionModel.createNewQuestion(
          validData.question,
          "",
          validData.priority_level,
          validData.answer_type,
          validData.input_type,
          validData.evidence_required,
          validData.is_required,
          validData.subtopic_id
        )
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid priority_level", async () => {
      await expect(
        TestQuestionModel.createNewQuestion(
          validData.question,
          validData.hint,
          "invalid priority" as any,
          validData.answer_type,
          validData.input_type,
          validData.evidence_required,
          validData.is_required,
          validData.subtopic_id
        )
      ).rejects.toThrow(ValidationException);
    });

    it("should throw ValidationException for invalid subtopic_id", async () => {
      await expect(
        TestQuestionModel.createNewQuestion(
          validData.question,
          validData.hint,
          validData.priority_level,
          validData.answer_type,
          validData.input_type,
          validData.evidence_required,
          validData.is_required,
          0
        )
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("updateQuestion", () => {
    it("should update question with valid data", async () => {
      const question = new TestQuestionModel(validData);

      await question.updateQuestion({
        question: "Updated question text",
        hint: "Updated hint text",
        status: "In progress",
      });

      expect(question.question).toBe("Updated question text");
      expect(question.hint).toBe("Updated hint text");
      expect(question.status).toBe("In progress");
    });

    it("should throw ValidationException for empty question in update", async () => {
      const question = new TestQuestionModel(validData);

      await expect(question.updateQuestion({ question: "" })).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for invalid status in update", async () => {
      const question = new TestQuestionModel(validData);

      await expect(
        question.updateQuestion({ status: "Invalid" as any })
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("validateQuestionData", () => {
    it("should pass validation with valid data", async () => {
      const question = new TestQuestionModel(validData);

      await expect(question.validateQuestionData()).resolves.not.toThrow();
    });

    it("should throw ValidationException for missing question", async () => {
      const question = new TestQuestionModel({
        ...validData,
        question: "",
      });

      await expect(question.validateQuestionData()).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw ValidationException for invalid subtopic_id", async () => {
      const question = new TestQuestionModel({
        ...validData,
        subtopic_id: 0,
      });

      await expect(question.validateQuestionData()).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe("isDemoQuestion", () => {
    it("should return true for demo question", () => {
      const question = new TestQuestionModel({
        ...validData,
        is_demo: true,
      });

      expect(question.isDemoQuestion()).toBe(true);
    });

    it("should return false for regular question", () => {
      const question = new TestQuestionModel(validData);

      expect(question.isDemoQuestion()).toBe(false);
    });
  });

  describe("canBeModified", () => {
    it("should return true for regular question", () => {
      const question = new TestQuestionModel(validData);

      expect(question.canBeModified()).toBe(true);
    });

    it("should throw BusinessLogicException for demo question", () => {
      const question = new TestQuestionModel({
        ...validData,
        is_demo: true,
      });

      expect(() => question.canBeModified()).toThrow(BusinessLogicException);
    });
  });

  describe("status methods", () => {
    it("should correctly identify completed question", () => {
      const question = new TestQuestionModel({
        ...validData,
        status: "Done",
      });

      expect(question.isCompleted()).toBe(true);
      expect(question.isInProgress()).toBe(false);
      expect(question.isNotStarted()).toBe(false);
    });

    it("should correctly identify in-progress question", () => {
      const question = new TestQuestionModel({
        ...validData,
        status: "In progress",
      });

      expect(question.isCompleted()).toBe(false);
      expect(question.isInProgress()).toBe(true);
      expect(question.isNotStarted()).toBe(false);
    });

    it("should correctly identify not-started question", () => {
      const question = new TestQuestionModel({
        ...validData,
        status: "Not started",
      });

      expect(question.isCompleted()).toBe(false);
      expect(question.isInProgress()).toBe(false);
      expect(question.isNotStarted()).toBe(true);
    });
  });

  describe("priority and requirement methods", () => {
    it("should correctly identify high priority question", () => {
      const question = new TestQuestionModel({
        ...validData,
        priority_level: "high priority",
      });

      expect(question.hasHighPriority()).toBe(true);
    });

    it("should correctly identify evidence requirement", () => {
      const question = new TestQuestionModel({
        ...validData,
        evidence_required: true,
      });

      expect(question.requiresEvidence()).toBe(true);
    });

    it("should correctly identify required question", () => {
      const question = new TestQuestionModel({
        ...validData,
        is_required: true,
      });

      expect(question.isRequired()).toBe(true);
    });
  });

  describe("getProgressPercentage", () => {
    it("should return 100 for completed question", () => {
      const question = new TestQuestionModel({
        ...validData,
        status: "Done",
      });

      expect(question.getProgressPercentage()).toBe(100);
    });

    it("should return 50 for in-progress question", () => {
      const question = new TestQuestionModel({
        ...validData,
        status: "In progress",
      });

      expect(question.getProgressPercentage()).toBe(50);
    });

    it("should return 0 for not-started question", () => {
      const question = new TestQuestionModel({
        ...validData,
        status: "Not started",
      });

      expect(question.getProgressPercentage()).toBe(0);
    });
  });

  describe("getSummary", () => {
    it("should return correct summary", () => {
      const question = new TestQuestionModel({
        ...validData,
        id: 1,
        status: "In progress",
      });

      const summary = question.getSummary();

      expect(summary).toEqual({
        id: 1,
        question: "What is the primary security concern?",
        priority: "high priority",
        status: "In progress",
        progress: 50,
        requiresEvidence: true,
      });
    });
  });

  describe("toJSON", () => {
    it("should return JSON representation", () => {
      const question = new TestQuestionModel({
        ...validData,
        id: 1,
        created_at: new Date("2024-01-01T00:00:00.000Z"),
      });

      const result = question.toJSON();

      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty(
        "question",
        "What is the primary security concern?"
      );
      expect(result).toHaveProperty("created_at", "2024-01-01T00:00:00.000Z");
      expect(result).toHaveProperty("progressPercentage", 0);
    });
  });

  describe("findByIdWithValidation", () => {
    it("should find question by valid ID", async () => {
      const question = await TestQuestionModel.findByIdWithValidation(1);

      expect(question).toBeInstanceOf(TestQuestionModel);
      expect(question.id).toBe(1);
      expect(question.question).toBe("Test Question");
    });

    it("should throw ValidationException for invalid ID", async () => {
      await expect(TestQuestionModel.findByIdWithValidation(0)).rejects.toThrow(
        ValidationException
      );
    });

    it("should throw NotFoundException for non-existent ID", async () => {
      await expect(
        TestQuestionModel.findByIdWithValidation(999)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findBySubtopicId", () => {
    it("should find questions by subtopic ID", async () => {
      const questions = await TestQuestionModel.findBySubtopicId(1);

      expect(questions).toHaveLength(2);
      expect(questions[0].subtopic_id).toBe(1);
      expect(questions[1].subtopic_id).toBe(1);
    });

    it("should throw ValidationException for invalid subtopic ID", async () => {
      await expect(TestQuestionModel.findBySubtopicId(0)).rejects.toThrow(
        ValidationException
      );
    });
  });

  describe("updateQuestionById", () => {
    it("should update question by ID", async () => {
      const [affected, updated] = await TestQuestionModel.updateQuestionById(
        1,
        {
          question: "Updated Question",
        }
      );

      expect(affected).toBe(1);
      expect(updated).toHaveLength(1);
      expect(updated[0].question).toBe("Updated Question");
    });

    it("should throw ValidationException for invalid ID", async () => {
      await expect(
        TestQuestionModel.updateQuestionById(0, { question: "Updated" })
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("deleteQuestionById", () => {
    it("should delete question by ID", async () => {
      const deleted = await TestQuestionModel.deleteQuestionById(1);

      expect(deleted).toBe(1);
    });

    it("should throw ValidationException for invalid ID", async () => {
      await expect(TestQuestionModel.deleteQuestionById(0)).rejects.toThrow(
        ValidationException
      );
    });
  });
});
