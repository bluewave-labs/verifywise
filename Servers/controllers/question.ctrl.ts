import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewQuestionQuery,
  deleteQuestionByIdQuery,
  getAllQuestionsQuery,
  getQuestionByIdQuery,
  updateQuestionByIdQuery,
  RequestWithFile,
  UploadedFile,
} from "../utils/question.utils";

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
  req: RequestWithFile,
  res: Response
): Promise<any> {
  try {
    const newQuestion: {
      subtopicId: number;
      questionText: string;
      answerType: string;
      evidenceFileRequired: boolean;
      hint: string;
      isRequired: boolean;
      priorityLevel: string;
      answer: string;
    } = req.body;

    if (
      !newQuestion.subtopicId ||
      !newQuestion.questionText ||
      !newQuestion.answerType ||
      newQuestion.isRequired === undefined
    ) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message:
            "subtopicId, questionText, answerType and isRequired are required",
        })
      );
    }

    const createdQuestion = await createNewQuestionQuery(
      newQuestion,
      req.files as UploadedFile[]
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
  req: RequestWithFile,
  res: Response
): Promise<any> {
  try {
    const questionId = parseInt(req.params.id);
    const updatedQuestion: {
      subtopicId: number;
      questionText: string;
      answerType: string;
      evidenceFileRequired: boolean;
      hint: string;
      isRequired: boolean;
      priorityLevel: string;
    } = req.body;

    if (
      !updatedQuestion.subtopicId ||
      !updatedQuestion.questionText ||
      !updatedQuestion.answerType ||
      updatedQuestion.isRequired === undefined
    ) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message:
            "subtopicId, questionText, answerType and isRequired are required",
        })
      );
    }

    const question = await updateQuestionByIdQuery(
      questionId,
      updatedQuestion,
      req.files as UploadedFile[]
    );

    if (question) {
      return res.status(202).json(STATUS_CODE[202](question));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
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
