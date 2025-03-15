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
  addFileToQuestion,
  addFileToQuestionTest,
} from "../utils/question.utils";
import { Question } from "../models/question.model";
import { uploadFile } from "../utils/fileUpload.utils";
import { deleteFileById } from "../utils/fileUpload.utils";

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

    const createdQuestion = await createNewQuestionQuery(newQuestion);

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
    console.log("1");
    const questionId = parseInt(req.params.id);
    const body = req.body as {
      answer: string;
      evidence_files: any[];
      project_id: number;
      uploaded_by: number;
    };
    console.log("2");

    // Validate required fields
    if (!body.answer) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "No values provided for answer for the Question",
        })
      );
    }
    console.log("3");
    // Handle file deletions if any
    const filesToDelete = Array.isArray(body.evidence_files)
      ? body.evidence_files
          .filter((file) => file && file.id)
          .map((file) => parseInt(file.id))
      : [];
    console.log("3.5");
    for (let fileToDelete of filesToDelete) {
      if (!isNaN(fileToDelete)) {
        await deleteFileById(fileToDelete);
      }
    }
    console.log("4");
    // Handle new file uploads if any
    let uploadedFiles: {
      id: string;
      fileName: string;
      project_id: number;
      uploaded_by: number;
      uploaded_time: Date;
    }[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (let file of req.files as UploadedFile[]) {
        const uploadedFile = await uploadFile(
          file,
          body.uploaded_by,
          body.project_id
        );
        if (uploadedFile) {
          // Add null check
          uploadedFiles.push({
            id: uploadedFile.id.toString(),
            fileName: uploadedFile.filename,
            project_id: uploadedFile.project_id,
            uploaded_by: uploadedFile.uploaded_by,
            uploaded_time: uploadedFile.uploaded_time,
          });
        }
      }
    }
    console.log("5");
    // Update question with new answer and handle files
    const question = await updateQuestionByIdQuery(questionId, body.answer);
    if (!question) {
      return res.status(404).json(STATUS_CODE[404]({}));
    }
    console.log("6");
    // Add files to question - ensure arrays are valid
    const updatedQuestion = await addFileToQuestionTest(
      questionId,
      uploadedFiles || [],
      filesToDelete || []
    );
    console.log("7");
    return res.status(202).json(STATUS_CODE[202](updatedQuestion || question)); // Fallback to question if updatedQuestion is null
  } catch (error) {
    console.error("Error updating question:", error);
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
        .json(STATUS_CODE[400]({ message: "Invalid subtopic ID" }));
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
