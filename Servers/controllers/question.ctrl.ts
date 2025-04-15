import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewQuestionQuery,
  deleteQuestionByIdQuery,
  getAllQuestionsQuery,
  getQuestionByIdQuery,
  updateQuestionByIdQuery,
  RequestWithFile,
  UploadedFile,
  getQuestionBySubTopicIdQuery,
  getQuestionByTopicIdQuery,
} from "../utils/question.utils";
import { Question } from "../models/question.model";
import { updateProjectUpdatedByIdQuery } from "../utils/project.utils";

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
  try {
    const newQuestion: Question = req.body;

    if (
      !newQuestion.subtopic_id ||
      !newQuestion.question ||
      !newQuestion.answer_type ||
      newQuestion.is_required === undefined
    ) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message:
            "subtopicId, questionText, answerType and isRequired are required",
        })
      );
    }

    const createdQuestion = await createNewQuestionQuery(
      newQuestion
    );

    if (createdQuestion) {
      return res.status(201).json(STATUS_CODE[201](createdQuestion));
    }

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateQuestionById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const questionId = parseInt(req.params.id);
    const body: { answer: string } = req.body;

    const question = (await updateQuestionByIdQuery(
      questionId,
      body.answer || "",
    )) as Question;

    if (!question) {
      return res.status(404).json(STATUS_CODE[404]({}));
    }

    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(questionId, "questions");

    return res.status(202).json(STATUS_CODE[202](question));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteQuestionById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const questionId = parseInt(req.params.id);

    const deletedQuestion = await deleteQuestionByIdQuery(questionId);

    if (deletedQuestion) {
      return res.status(202).json(STATUS_CODE[202](deletedQuestion));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
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
