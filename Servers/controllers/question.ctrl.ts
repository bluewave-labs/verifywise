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
  try {
    const questions = await getAllQuestionsQuery();

    if (questions) {
      return res.status(200).json(STATUS_CODE[200](questions));
    }

    return res.status(204).json(STATUS_CODE[204](questions));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getQuestionById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const questionId = parseInt(req.params.id);

    const question = await getQuestionByIdQuery(questionId);

    if (question) {
      return res.status(200).json(STATUS_CODE[200](question));
    }

    return res.status(404).json(STATUS_CODE[404](question));
  } catch (error) {
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
  try {
    const questionId = parseInt(req.params.id);

    const deletedQuestion = await deleteQuestionByIdQuery(
      questionId,
      transaction
    );

    if (deletedQuestion) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](deletedQuestion));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getQuestionsBySubtopicId(req: Request, res: Response) {
  try {
    const subtopicId = parseInt(req.params.id);
    if (isNaN(subtopicId)) {
      return res
        .status(400)
        .json(STATUS_CODE[400]({ message: "Invalid subtopic ID" }));
    }

    const questions = await getQuestionBySubTopicIdQuery(subtopicId);
    if (questions && questions.length !== 0) {
      return res.status(200).json(STATUS_CODE[200](questions));
    }

    return res.status(404).json(
      STATUS_CODE[404]({
        message: "No questions found for the given subtopic ID",
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getQuestionsByTopicId(req: Request, res: Response) {
  try {
    const topicId = parseInt(req.params.id);
    if (isNaN(topicId)) {
      return res
        .status(400)
        .json(STATUS_CODE[400]({ message: "Invalid topic ID" }));
    }

    const questions = await getQuestionByTopicIdQuery(topicId);
    if (questions && questions.length !== 0) {
      return res.status(200).json(STATUS_CODE[200](questions));
    }

    return res.status(404).json(
      STATUS_CODE[404]({
        message: "No questions found for the given topic id",
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
