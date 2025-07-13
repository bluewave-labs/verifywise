import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewQuestionQuery,
  deleteQuestionByIdQuery,
  getAllQuestionsQuery,
  getQuestionByIdQuery,
  updateQuestionByIdQuery,
  getQuestionBySubTopicIdQuery,
  getQuestionByTopicIdQuery,
} from "../utils/question.utils";
import { updateProjectUpdatedByIdQuery } from "../utils/project.utils";
import { sequelize } from "../database/db";
import { QuestionModel } from "../domain.layer/models/question/question.model";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllQuestions(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllQuestions",
    "getAllQuestions",
    "question.ctrl.ts"
  );
  logger.debug("🔍 Fetching all questions");

  try {
    const questions = await getAllQuestionsQuery();

    if (questions && questions.length > 0) {
      logStructured(
        "successful",
        `retrieved ${questions.length} questions`,
        "getAllQuestions",
        "question.ctrl.ts"
      );
      await logEvent("Read", `Retrieved ${questions.length} questions`);
      return res.status(200).json(STATUS_CODE[200](questions));
    }

    logStructured(
      "successful",
      "no questions found",
      "getAllQuestions",
      "question.ctrl.ts"
    );
    await logEvent("Read", "No questions found");
    return res.status(204).json(STATUS_CODE[204](questions));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve questions",
      "getAllQuestions",
      "question.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve questions: ${(error as Error).message}`
    );
    logger.error("❌ Error in getAllQuestions:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getQuestionById(
  req: Request,
  res: Response
): Promise<any> {
  const questionId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching question by ID: ${questionId}`,
    "getQuestionById",
    "question.ctrl.ts"
  );
  logger.debug(`🔍 Looking up question with ID: ${questionId}`);

  try {
    const question = await getQuestionByIdQuery(questionId);

    if (question) {
      logStructured(
        "successful",
        `question found: ID ${questionId}`,
        "getQuestionById",
        "question.ctrl.ts"
      );
      await logEvent("Read", `Question retrieved by ID: ${questionId}`);
      return res.status(200).json(STATUS_CODE[200](question));
    }

    logStructured(
      "successful",
      `no question found: ID ${questionId}`,
      "getQuestionById",
      "question.ctrl.ts"
    );
    await logEvent("Read", `No question found with ID: ${questionId}`);
    return res.status(404).json(STATUS_CODE[404](question));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch question: ID ${questionId}`,
      "getQuestionById",
      "question.ctrl.ts"
    );
    await logEvent("Error", `Failed to retrieve question by ID: ${questionId}`);
    logger.error("❌ Error in getQuestionById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createQuestion(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const {
    question,
    hint,
    priority_level,
    answer_type,
    input_type,
    evidence_required,
    is_required,
    subtopic_id,
    order_no,
    dropdown_options,
    evidence_files,
    is_demo = false,
  } = req.body;

  logStructured(
    "processing",
    `starting question creation for subtopic ID: ${subtopic_id}`,
    "createQuestion",
    "question.ctrl.ts"
  );
  logger.debug(`🛠️ Creating question for subtopic ID: ${subtopic_id}`);

  try {
    // Use the QuestionModel's createNewQuestion method with validation
    const questionModel = await QuestionModel.createNewQuestion(
      question,
      hint,
      priority_level,
      answer_type,
      input_type,
      evidence_required,
      is_required,
      subtopic_id,
      order_no,
      dropdown_options,
      evidence_files,
      is_demo
    );

    // Validate the question data before saving
    await questionModel.validateQuestionData();

    // Check if the question can be modified (demo restrictions)
    questionModel.canBeModified();

    const createdQuestion = await createNewQuestionQuery(
      questionModel,
      transaction
    );

    if (createdQuestion) {
      await transaction.commit();
      logStructured(
        "successful",
        `question created: ID ${createdQuestion.id}`,
        "createQuestion",
        "question.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Question created: ID ${createdQuestion.id}, subtopic ID: ${subtopic_id}`
      );
      return res.status(201).json(STATUS_CODE[201](createdQuestion));
    }

    logStructured(
      "error",
      `failed to create question for subtopic ID: ${subtopic_id}`,
      "createQuestion",
      "question.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Question creation failed for subtopic ID: ${subtopic_id}`
    );
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to create question"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createQuestion",
        "question.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during question creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createQuestion",
        "question.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during question creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for subtopic ID: ${subtopic_id}`,
      "createQuestion",
      "question.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during question creation for subtopic ID ${subtopic_id}: ${(error as Error).message}`
    );
    logger.error("❌ Error in createQuestion:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateQuestionById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const questionId = parseInt(req.params.id);
  const updateData = req.body;

  logStructured(
    "processing",
    `updating question ID: ${questionId}`,
    "updateQuestionById",
    "question.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for question ID ${questionId}`);

  try {
    // First, get the existing question to validate it can be modified
    const existingQuestion = await getQuestionByIdQuery(questionId);

    if (!existingQuestion) {
      logStructured(
        "error",
        `question not found: ID ${questionId}`,
        "updateQuestionById",
        "question.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — question not found: ID ${questionId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Question not found"));
    }

    // Create a QuestionModel instance from the existing data
    const questionModel = QuestionModel.fromJSON(existingQuestion);

    // Check if the question can be modified (demo restrictions)
    questionModel.canBeModified();

    // Update the question using the model's updateQuestion method
    await questionModel.updateQuestion(updateData);

    // Validate the updated question data
    await questionModel.validateQuestionData();

    const updatedQuestion = await updateQuestionByIdQuery(
      questionId,
      questionModel,
      transaction
    );

    if (updatedQuestion) {
      // Update the project's last updated date
      await updateProjectUpdatedByIdQuery(questionId, "answers", transaction);
      await transaction.commit();
      logStructured(
        "successful",
        `question updated: ID ${questionId}`,
        "updateQuestionById",
        "question.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Question updated: ID ${questionId}, subtopic ID: ${updatedQuestion.subtopic_id}`
      );
      return res.status(202).json(STATUS_CODE[202](updatedQuestion));
    }

    logStructured(
      "error",
      `failed to update question: ID ${questionId}`,
      "updateQuestionById",
      "question.ctrl.ts"
    );
    await logEvent("Error", `Question update failed: ID ${questionId}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to update question"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateQuestionById",
        "question.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during question update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateQuestionById",
        "question.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during question update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for question ID ${questionId}`,
      "updateQuestionById",
      "question.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during question update for ID ${questionId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateQuestionById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteQuestionById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const questionId = parseInt(req.params.id);

  logStructured(
    "processing",
    `attempting to delete question ID ${questionId}`,
    "deleteQuestionById",
    "question.ctrl.ts"
  );
  logger.debug(`🗑️ Delete request for question ID ${questionId}`);

  try {
    // First, get the existing question to validate it can be deleted
    const existingQuestion = await getQuestionByIdQuery(questionId);

    if (!existingQuestion) {
      logStructured(
        "error",
        `question not found: ID ${questionId}`,
        "deleteQuestionById",
        "question.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Delete failed — question not found: ID ${questionId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Question not found"));
    }

    // Create a QuestionModel instance from the existing data
    const questionModel = QuestionModel.fromJSON(existingQuestion);

    // Check if the question can be modified (demo restrictions)
    questionModel.canBeModified();

    const deletedQuestion = await deleteQuestionByIdQuery(
      questionId,
      transaction
    );

    if (deletedQuestion) {
      await transaction.commit();
      logStructured(
        "successful",
        `question deleted: ID ${questionId}`,
        "deleteQuestionById",
        "question.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `Question deleted: ID ${questionId}, subtopic ID: ${existingQuestion.subtopic_id}`
      );
      return res.status(202).json(STATUS_CODE[202](deletedQuestion));
    }

    logStructured(
      "error",
      `failed to delete question: ID ${questionId}`,
      "deleteQuestionById",
      "question.ctrl.ts"
    );
    await logEvent("Error", `Question deletion failed: ID ${questionId}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to delete question"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "deleteQuestionById",
        "question.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during question deletion: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "deleteQuestionById",
        "question.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during question deletion: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error deleting question ID ${questionId}`,
      "deleteQuestionById",
      "question.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during question deletion for ID ${questionId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteQuestionById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getQuestionsBySubtopicId(req: Request, res: Response) {
  const subtopicId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching questions for subtopic ID: ${subtopicId}`,
    "getQuestionsBySubtopicId",
    "question.ctrl.ts"
  );
  logger.debug(`🔍 Looking up questions for subtopic ID: ${subtopicId}`);

  try {
    if (isNaN(subtopicId)) {
      logStructured(
        "error",
        `invalid subtopic ID: ${req.params.id}`,
        "getQuestionsBySubtopicId",
        "question.ctrl.ts"
      );
      await logEvent("Error", `Invalid subtopic ID provided: ${req.params.id}`);
      return res
        .status(400)
        .json(STATUS_CODE[400]({ message: "Invalid subtopic ID" }));
    }

    const questions = await getQuestionBySubTopicIdQuery(subtopicId);
    if (questions && questions.length !== 0) {
      logStructured(
        "successful",
        `retrieved ${questions.length} questions for subtopic ID: ${subtopicId}`,
        "getQuestionsBySubtopicId",
        "question.ctrl.ts"
      );
      await logEvent(
        "Read",
        `Retrieved ${questions.length} questions for subtopic ID: ${subtopicId}`
      );
      return res.status(200).json(STATUS_CODE[200](questions));
    }

    logStructured(
      "successful",
      `no questions found for subtopic ID: ${subtopicId}`,
      "getQuestionsBySubtopicId",
      "question.ctrl.ts"
    );
    await logEvent("Read", `No questions found for subtopic ID: ${subtopicId}`);
    return res.status(404).json(
      STATUS_CODE[404]({
        message: "No questions found for the given subtopic ID",
      })
    );
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch questions for subtopic ID: ${subtopicId}`,
      "getQuestionsBySubtopicId",
      "question.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve questions for subtopic ID: ${subtopicId}`
    );
    logger.error("❌ Error in getQuestionsBySubtopicId:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getQuestionsByTopicId(req: Request, res: Response) {
  const topicId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching questions for topic ID: ${topicId}`,
    "getQuestionsByTopicId",
    "question.ctrl.ts"
  );
  logger.debug(`🔍 Looking up questions for topic ID: ${topicId}`);

  try {
    if (isNaN(topicId)) {
      logStructured(
        "error",
        `invalid topic ID: ${req.params.id}`,
        "getQuestionsByTopicId",
        "question.ctrl.ts"
      );
      await logEvent("Error", `Invalid topic ID provided: ${req.params.id}`);
      return res
        .status(400)
        .json(STATUS_CODE[400]({ message: "Invalid topic ID" }));
    }

    const questions = await getQuestionByTopicIdQuery(topicId);
    if (questions && questions.length !== 0) {
      logStructured(
        "successful",
        `retrieved ${questions.length} questions for topic ID: ${topicId}`,
        "getQuestionsByTopicId",
        "question.ctrl.ts"
      );
      await logEvent(
        "Read",
        `Retrieved ${questions.length} questions for topic ID: ${topicId}`
      );
      return res.status(200).json(STATUS_CODE[200](questions));
    }

    logStructured(
      "successful",
      `no questions found for topic ID: ${topicId}`,
      "getQuestionsByTopicId",
      "question.ctrl.ts"
    );
    await logEvent("Read", `No questions found for topic ID: ${topicId}`);
    return res.status(404).json(
      STATUS_CODE[404]({
        message: "No questions found for the given topic id",
      })
    );
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch questions for topic ID: ${topicId}`,
      "getQuestionsByTopicId",
      "question.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve questions for topic ID: ${topicId}`
    );
    logger.error("❌ Error in getQuestionsByTopicId:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
