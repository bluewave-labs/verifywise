/**
 * Integration Tests for Post-Market Monitoring Feature
 *
 * These tests run against the real test database to verify:
 * - PMM configuration CRUD operations
 * - PMM question management
 * - PMM cycle creation and completion
 * - PMM response saving (partial save / draft)
 * - Multi-tenant schema isolation
 *
 * Prerequisites:
 * - verifywise_refactor_tests database must exist
 * - test_tenant schema with PMM tables must exist
 * - Run: npm run test:integration
 *
 * @module tests/integration/postMarketMonitoring.integration
 */

import {
  getTestDb,
  closeTestDb,
  createTestProject,
  TEST_TENANT,
} from "./testDb";
import { QueryTypes } from "sequelize";

// ============================================================================
// Test Utilities
// ============================================================================

function escapePgIdentifier(ident: string): string {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(ident)) {
    throw new Error("Invalid tenant identifier");
  }
  return '"' + ident.replace(/"/g, '""') + '"';
}

async function cleanupPMMData(): Promise<void> {
  const db = await getTestDb();
  const schema = escapePgIdentifier(TEST_TENANT);

  // Clean up in reverse order due to foreign key constraints
  await db.query(`TRUNCATE TABLE ${schema}.post_market_monitoring_reports RESTART IDENTITY CASCADE`, {
    type: QueryTypes.RAW,
  });
  await db.query(`TRUNCATE TABLE ${schema}.post_market_monitoring_responses RESTART IDENTITY CASCADE`, {
    type: QueryTypes.RAW,
  });
  await db.query(`TRUNCATE TABLE ${schema}.post_market_monitoring_cycles RESTART IDENTITY CASCADE`, {
    type: QueryTypes.RAW,
  });
  await db.query(`TRUNCATE TABLE ${schema}.post_market_monitoring_questions RESTART IDENTITY CASCADE`, {
    type: QueryTypes.RAW,
  });
  await db.query(`TRUNCATE TABLE ${schema}.post_market_monitoring_configs RESTART IDENTITY CASCADE`, {
    type: QueryTypes.RAW,
  });
}

async function createPMMConfig(
  projectId: number,
  options: {
    isActive?: boolean;
    frequencyValue?: number;
    frequencyUnit?: "days" | "weeks" | "months";
  } = {}
): Promise<number> {
  const db = await getTestDb();
  const schema = escapePgIdentifier(TEST_TENANT);
  const {
    isActive = true,
    frequencyValue = 30,
    frequencyUnit = "days",
  } = options;

  const result = await db.query(
    `INSERT INTO ${schema}.post_market_monitoring_configs
     (project_id, is_active, frequency_value, frequency_unit, start_date)
     VALUES (:project_id, :is_active, :frequency_value, :frequency_unit, NOW())
     RETURNING id`,
    {
      replacements: {
        project_id: projectId,
        is_active: isActive,
        frequency_value: frequencyValue,
        frequency_unit: frequencyUnit,
      },
      type: QueryTypes.INSERT,
    }
  );
  return (result[0] as any)[0].id;
}

async function createPMMQuestion(
  configId: number,
  questionText: string,
  questionType: "yes_no" | "multi_select" | "multi_line_text" = "yes_no",
  options: {
    isRequired?: boolean;
    displayOrder?: number;
    euAiActArticle?: string;
  } = {}
): Promise<number> {
  const db = await getTestDb();
  const schema = escapePgIdentifier(TEST_TENANT);
  const { isRequired = true, displayOrder = 0, euAiActArticle = null } = options;

  const result = await db.query(
    `INSERT INTO ${schema}.post_market_monitoring_questions
     (config_id, question_text, question_type, is_required, display_order, eu_ai_act_article)
     VALUES (:config_id, :question_text, :question_type, :is_required, :display_order, :eu_ai_act_article)
     RETURNING id`,
    {
      replacements: {
        config_id: configId,
        question_text: questionText,
        question_type: questionType,
        is_required: isRequired,
        display_order: displayOrder,
        eu_ai_act_article: euAiActArticle,
      },
      type: QueryTypes.INSERT,
    }
  );
  return (result[0] as any)[0].id;
}

async function createPMMCycle(
  configId: number,
  cycleNumber: number = 1,
  options: {
    status?: "pending" | "in_progress" | "completed" | "escalated";
    dueAt?: Date;
  } = {}
): Promise<number> {
  const db = await getTestDb();
  const schema = escapePgIdentifier(TEST_TENANT);
  const {
    status = "pending",
    dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  } = options;

  const result = await db.query(
    `INSERT INTO ${schema}.post_market_monitoring_cycles
     (config_id, cycle_number, status, due_at)
     VALUES (:config_id, :cycle_number, :status, :due_at)
     RETURNING id`,
    {
      replacements: {
        config_id: configId,
        cycle_number: cycleNumber,
        status,
        due_at: dueAt,
      },
      type: QueryTypes.INSERT,
    }
  );
  return (result[0] as any)[0].id;
}

// ============================================================================
// Tests
// ============================================================================

describe("Post-Market Monitoring Integration Tests", () => {
  let testProjectId: number;

  beforeAll(async () => {
    await getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await cleanupPMMData();
    testProjectId = await createTestProject("PMM Test Project");
  });

  describe("PMM Configuration", () => {
    it("should create a PMM configuration for a project", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      const configId = await createPMMConfig(testProjectId);
      expect(configId).toBeGreaterThan(0);

      const configs = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_configs WHERE id = :id`,
        { replacements: { id: configId }, type: QueryTypes.SELECT }
      );

      expect(configs).toHaveLength(1);
      expect((configs[0] as any).project_id).toBe(testProjectId);
      expect((configs[0] as any).is_active).toBe(true);
      expect((configs[0] as any).frequency_value).toBe(30);
      expect((configs[0] as any).frequency_unit).toBe("days");
    });

    it("should enforce unique project_id constraint", async () => {
      await createPMMConfig(testProjectId);

      await expect(createPMMConfig(testProjectId)).rejects.toThrow();
    });

    it("should update configuration settings", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);
      const configId = await createPMMConfig(testProjectId);

      await db.query(
        `UPDATE ${schema}.post_market_monitoring_configs
         SET frequency_value = :frequency_value, frequency_unit = :frequency_unit
         WHERE id = :id`,
        {
          replacements: {
            id: configId,
            frequency_value: 2,
            frequency_unit: "weeks",
          },
          type: QueryTypes.UPDATE,
        }
      );

      const configs = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_configs WHERE id = :id`,
        { replacements: { id: configId }, type: QueryTypes.SELECT }
      );

      expect((configs[0] as any).frequency_value).toBe(2);
      expect((configs[0] as any).frequency_unit).toBe("weeks");
    });
  });

  describe("PMM Questions", () => {
    let configId: number;

    beforeEach(async () => {
      configId = await createPMMConfig(testProjectId);
    });

    it("should create questions for a config", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      const questionId = await createPMMQuestion(
        configId,
        "Have you reviewed risk mitigations?",
        "yes_no",
        { isRequired: true, displayOrder: 1, euAiActArticle: "Article 9" }
      );

      expect(questionId).toBeGreaterThan(0);

      const questions = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_questions WHERE id = :id`,
        { replacements: { id: questionId }, type: QueryTypes.SELECT }
      );

      expect(questions).toHaveLength(1);
      expect((questions[0] as any).question_text).toBe("Have you reviewed risk mitigations?");
      expect((questions[0] as any).question_type).toBe("yes_no");
      expect((questions[0] as any).eu_ai_act_article).toBe("Article 9");
    });

    it("should create multi-select questions with options", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      const result = await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_questions
         (config_id, question_text, question_type, options, is_required)
         VALUES (:config_id, :question_text, :question_type, :options::jsonb, :is_required)
         RETURNING id`,
        {
          replacements: {
            config_id: configId,
            question_text: "Select applicable compliance areas",
            question_type: "multi_select",
            options: JSON.stringify(["Risk Management", "Data Quality", "Transparency"]),
            is_required: true,
          },
          type: QueryTypes.INSERT,
        }
      );

      const questionId = (result[0] as any)[0].id;
      const questions = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_questions WHERE id = :id`,
        { replacements: { id: questionId }, type: QueryTypes.SELECT }
      );

      expect((questions[0] as any).options).toEqual(
        ["Risk Management", "Data Quality", "Transparency"]
      );
    });

    it("should cascade delete questions when config is deleted", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      await createPMMQuestion(configId, "Question 1");
      await createPMMQuestion(configId, "Question 2");

      const questionsBefore = await db.query(
        `SELECT COUNT(*) as count FROM ${schema}.post_market_monitoring_questions WHERE config_id = :config_id`,
        { replacements: { config_id: configId }, type: QueryTypes.SELECT }
      );
      expect(parseInt((questionsBefore[0] as any).count, 10)).toBe(2);

      await db.query(
        `DELETE FROM ${schema}.post_market_monitoring_configs WHERE id = :id`,
        { replacements: { id: configId }, type: QueryTypes.DELETE }
      );

      const questionsAfter = await db.query(
        `SELECT COUNT(*) as count FROM ${schema}.post_market_monitoring_questions WHERE config_id = :config_id`,
        { replacements: { config_id: configId }, type: QueryTypes.SELECT }
      );
      expect(parseInt((questionsAfter[0] as any).count, 10)).toBe(0);
    });
  });

  describe("PMM Cycles", () => {
    let configId: number;

    beforeEach(async () => {
      configId = await createPMMConfig(testProjectId);
    });

    it("should create a monitoring cycle", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      const cycleId = await createPMMCycle(configId, 1);
      expect(cycleId).toBeGreaterThan(0);

      const cycles = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_cycles WHERE id = :id`,
        { replacements: { id: cycleId }, type: QueryTypes.SELECT }
      );

      expect(cycles).toHaveLength(1);
      expect((cycles[0] as any).cycle_number).toBe(1);
      expect((cycles[0] as any).status).toBe("pending");
    });

    it("should update cycle status to completed", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      const cycleId = await createPMMCycle(configId, 1);

      await db.query(
        `UPDATE ${schema}.post_market_monitoring_cycles
         SET status = 'completed', completed_at = NOW()
         WHERE id = :id`,
        { replacements: { id: cycleId }, type: QueryTypes.UPDATE }
      );

      const cycles = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_cycles WHERE id = :id`,
        { replacements: { id: cycleId }, type: QueryTypes.SELECT }
      );

      expect((cycles[0] as any).status).toBe("completed");
      expect((cycles[0] as any).completed_at).not.toBeNull();
    });

    it("should track escalation status", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      const cycleId = await createPMMCycle(configId, 1);

      await db.query(
        `UPDATE ${schema}.post_market_monitoring_cycles
         SET status = 'escalated', escalation_sent_at = NOW()
         WHERE id = :id`,
        { replacements: { id: cycleId }, type: QueryTypes.UPDATE }
      );

      const cycles = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_cycles WHERE id = :id`,
        { replacements: { id: cycleId }, type: QueryTypes.SELECT }
      );

      expect((cycles[0] as any).status).toBe("escalated");
      expect((cycles[0] as any).escalation_sent_at).not.toBeNull();
    });
  });

  describe("PMM Responses (Partial Save)", () => {
    let configId: number;
    let questionId: number;
    let cycleId: number;

    beforeEach(async () => {
      configId = await createPMMConfig(testProjectId);
      questionId = await createPMMQuestion(configId, "Test question", "yes_no");
      cycleId = await createPMMCycle(configId, 1);
    });

    it("should save a response (partial save)", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_responses
         (cycle_id, question_id, response_value, is_flagged)
         VALUES (:cycle_id, :question_id, :response_value::jsonb, :is_flagged)`,
        {
          replacements: {
            cycle_id: cycleId,
            question_id: questionId,
            response_value: JSON.stringify(true),
            is_flagged: false,
          },
          type: QueryTypes.INSERT,
        }
      );

      const responses = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_responses
         WHERE cycle_id = :cycle_id AND question_id = :question_id`,
        {
          replacements: { cycle_id: cycleId, question_id: questionId },
          type: QueryTypes.SELECT,
        }
      );

      expect(responses).toHaveLength(1);
      expect((responses[0] as any).response_value).toBe(true);
      expect((responses[0] as any).is_flagged).toBe(false);
    });

    it("should upsert response on duplicate (cycle_id, question_id)", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      // Initial save
      await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_responses
         (cycle_id, question_id, response_value, is_flagged)
         VALUES (:cycle_id, :question_id, :response_value::jsonb, :is_flagged)`,
        {
          replacements: {
            cycle_id: cycleId,
            question_id: questionId,
            response_value: JSON.stringify(true),
            is_flagged: false,
          },
          type: QueryTypes.INSERT,
        }
      );

      // Update via upsert
      await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_responses
         (cycle_id, question_id, response_value, is_flagged)
         VALUES (:cycle_id, :question_id, :response_value::jsonb, :is_flagged)
         ON CONFLICT (cycle_id, question_id)
         DO UPDATE SET response_value = EXCLUDED.response_value, is_flagged = EXCLUDED.is_flagged, updated_at = NOW()`,
        {
          replacements: {
            cycle_id: cycleId,
            question_id: questionId,
            response_value: JSON.stringify(false),
            is_flagged: true,
          },
          type: QueryTypes.INSERT,
        }
      );

      const responses = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_responses
         WHERE cycle_id = :cycle_id AND question_id = :question_id`,
        {
          replacements: { cycle_id: cycleId, question_id: questionId },
          type: QueryTypes.SELECT,
        }
      );

      expect(responses).toHaveLength(1);
      expect((responses[0] as any).response_value).toBe(false);
      expect((responses[0] as any).is_flagged).toBe(true);
    });

    it("should save multi-select response as JSON array", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      // Create multi-select question
      const multiSelectQuestionId = await createPMMQuestion(
        configId,
        "Select areas",
        "multi_select"
      );

      const selectedOptions = ["Option A", "Option C"];

      await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_responses
         (cycle_id, question_id, response_value, is_flagged)
         VALUES (:cycle_id, :question_id, :response_value::jsonb, :is_flagged)`,
        {
          replacements: {
            cycle_id: cycleId,
            question_id: multiSelectQuestionId,
            response_value: JSON.stringify(selectedOptions),
            is_flagged: false,
          },
          type: QueryTypes.INSERT,
        }
      );

      const responses = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_responses
         WHERE cycle_id = :cycle_id AND question_id = :question_id`,
        {
          replacements: { cycle_id: cycleId, question_id: multiSelectQuestionId },
          type: QueryTypes.SELECT,
        }
      );

      expect((responses[0] as any).response_value).toEqual(selectedOptions);
    });

    it("should save text response", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      // Create text question
      const textQuestionId = await createPMMQuestion(
        configId,
        "Additional comments",
        "multi_line_text",
        { isRequired: false }
      );

      const textResponse = "This is a detailed comment about the monitoring process.";

      await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_responses
         (cycle_id, question_id, response_value, is_flagged)
         VALUES (:cycle_id, :question_id, :response_value::jsonb, :is_flagged)`,
        {
          replacements: {
            cycle_id: cycleId,
            question_id: textQuestionId,
            response_value: JSON.stringify(textResponse),
            is_flagged: false,
          },
          type: QueryTypes.INSERT,
        }
      );

      const responses = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_responses
         WHERE cycle_id = :cycle_id AND question_id = :question_id`,
        {
          replacements: { cycle_id: cycleId, question_id: textQuestionId },
          type: QueryTypes.SELECT,
        }
      );

      expect((responses[0] as any).response_value).toBe(textResponse);
    });
  });

  describe("PMM Reports", () => {
    let configId: number;
    let cycleId: number;

    beforeEach(async () => {
      configId = await createPMMConfig(testProjectId);
      cycleId = await createPMMCycle(configId, 1);
    });

    it("should create a report with context snapshot", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      const contextSnapshot = {
        use_case_title: "Test Use Case",
        use_case_status: "active",
        risks_count: 5,
        high_risk_count: 1,
        medium_risk_count: 2,
        low_risk_count: 2,
        models_count: 3,
        model_risks_count: 2,
        vendors_count: 2,
        vendor_risks_count: 1,
        captured_at: new Date().toISOString(),
      };

      const result = await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_reports
         (cycle_id, context_snapshot)
         VALUES (:cycle_id, :context_snapshot::jsonb)
         RETURNING id`,
        {
          replacements: {
            cycle_id: cycleId,
            context_snapshot: JSON.stringify(contextSnapshot),
          },
          type: QueryTypes.INSERT,
        }
      );

      const reportId = (result[0] as any)[0].id;

      const reports = await db.query(
        `SELECT * FROM ${schema}.post_market_monitoring_reports WHERE id = :id`,
        { replacements: { id: reportId }, type: QueryTypes.SELECT }
      );

      expect(reports).toHaveLength(1);
      expect((reports[0] as any).context_snapshot.use_case_title).toBe("Test Use Case");
      expect((reports[0] as any).context_snapshot.risks_count).toBe(5);
    });

    it("should enforce unique cycle_id constraint for reports", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      const contextSnapshot = { use_case_title: "Test" };

      await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_reports
         (cycle_id, context_snapshot)
         VALUES (:cycle_id, :context_snapshot::jsonb)`,
        {
          replacements: {
            cycle_id: cycleId,
            context_snapshot: JSON.stringify(contextSnapshot),
          },
          type: QueryTypes.INSERT,
        }
      );

      // Second insert should fail due to unique constraint
      await expect(
        db.query(
          `INSERT INTO ${schema}.post_market_monitoring_reports
           (cycle_id, context_snapshot)
           VALUES (:cycle_id, :context_snapshot::jsonb)`,
          {
            replacements: {
              cycle_id: cycleId,
              context_snapshot: JSON.stringify(contextSnapshot),
            },
            type: QueryTypes.INSERT,
          }
        )
      ).rejects.toThrow();
    });
  });

  describe("Cascade Deletes", () => {
    it("should cascade delete all related data when project is deleted", async () => {
      const db = await getTestDb();
      const schema = escapePgIdentifier(TEST_TENANT);

      // Create full PMM setup
      const configId = await createPMMConfig(testProjectId);
      const questionId = await createPMMQuestion(configId, "Test question");
      const cycleId = await createPMMCycle(configId, 1);

      // Add response
      await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_responses
         (cycle_id, question_id, response_value)
         VALUES (:cycle_id, :question_id, 'true'::jsonb)`,
        { replacements: { cycle_id: cycleId, question_id: questionId }, type: QueryTypes.INSERT }
      );

      // Add report
      await db.query(
        `INSERT INTO ${schema}.post_market_monitoring_reports
         (cycle_id, context_snapshot)
         VALUES (:cycle_id, '{}'::jsonb)`,
        { replacements: { cycle_id: cycleId }, type: QueryTypes.INSERT }
      );

      // Delete the config (should cascade to questions, cycles, responses, reports)
      await db.query(
        `DELETE FROM ${schema}.post_market_monitoring_configs WHERE id = :id`,
        { replacements: { id: configId }, type: QueryTypes.DELETE }
      );

      // Verify all related data is deleted
      const questionsCount = await db.query(
        `SELECT COUNT(*) as count FROM ${schema}.post_market_monitoring_questions WHERE config_id = :config_id`,
        { replacements: { config_id: configId }, type: QueryTypes.SELECT }
      );
      expect(parseInt((questionsCount[0] as any).count, 10)).toBe(0);

      const cyclesCount = await db.query(
        `SELECT COUNT(*) as count FROM ${schema}.post_market_monitoring_cycles WHERE config_id = :config_id`,
        { replacements: { config_id: configId }, type: QueryTypes.SELECT }
      );
      expect(parseInt((cyclesCount[0] as any).count, 10)).toBe(0);

      const responsesCount = await db.query(
        `SELECT COUNT(*) as count FROM ${schema}.post_market_monitoring_responses WHERE cycle_id = :cycle_id`,
        { replacements: { cycle_id: cycleId }, type: QueryTypes.SELECT }
      );
      expect(parseInt((responsesCount[0] as any).count, 10)).toBe(0);

      const reportsCount = await db.query(
        `SELECT COUNT(*) as count FROM ${schema}.post_market_monitoring_reports WHERE cycle_id = :cycle_id`,
        { replacements: { cycle_id: cycleId }, type: QueryTypes.SELECT }
      );
      expect(parseInt((reportsCount[0] as any).count, 10)).toBe(0);
    });
  });
});
