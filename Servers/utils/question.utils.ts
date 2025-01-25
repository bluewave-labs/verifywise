import { Question } from "../models/question.model";
import pool from "../database/db";
import { deleteFileById, getFileById, uploadFile } from "./fileUpload.utils";
import { Request } from "express";

export const getAllQuestionsQuery = async (): Promise<Question[]> => {
  console.log("getAllQuestions");
  const questions = await pool.query("SELECT * FROM questions");
  const questionsUpdated = await Promise.all(
    questions.rows.map(async (question) => {
      let evidenceFiles: object[] = [];
      await Promise.all(
        question.evidence_files.map(async (fileId: string) => {
          const file = await getFileById(parseInt(fileId));
          evidenceFiles.push({ id: file.id, filename: file.filename });
        })
      );
      return { ...question, evidence_files: evidenceFiles };
    })
  );
  return questionsUpdated;
};

export const getQuestionByIdQuery = async (
  id: number
): Promise<Question | null> => {
  console.log("getQuestionById", id);
  const result = await pool.query("SELECT * FROM questions WHERE id = $1", [
    id,
  ]);
  let evidenceFiles: object[] = [];
  if (result.rows.length) {
    await Promise.all(
      result.rows[0].evidence_files.map(async (fileId: string) => {
        const file = await getFileById(parseInt(fileId));
        evidenceFiles.push({ id: file.id, filename: file.filename });
      })
    );
  }
  return result.rows.length
    ? { ...result.rows[0], evidence_files: evidenceFiles }
    : null;
  // return result.rows.length ? result.rows[0] : null;
};

export interface RequestWithFile extends Request {
  files?: UploadedFile[] | {
    [key: string]: UploadedFile[]
  };
}
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export const createNewQuestionQuery = async (
  question: {
    subtopicId: number;
    questionText: string;
    answerType: string;
    evidenceFileRequired: boolean;
    hint: string;
    isRequired: boolean;
    priorityLevel: string;
    answer: string;
  },
  files?: UploadedFile[]
): Promise<Question> => {
  console.log("createNewQuestion", question);
  let uploadedFiles: { id: number, fileName: string }[] = [];
  await Promise.all(
    files!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedFiles.push({ id: uploadedFile.id.toString(), fileName: uploadedFile.filename });
    })
  );
  const result = await pool.query(
    `INSERT INTO questions (
      subtopic_id, question_text, answer_type, evidence_file_required, hint, is_required, priority_level, evidence_files, answer
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      question.subtopicId,
      question.questionText,
      question.answerType,
      question.evidenceFileRequired,
      question.hint,
      question.isRequired,
      question.priorityLevel,
      uploadedFiles,
      question.answer,
    ]
  );
  return result.rows[0];
};

export const updateQuestionByIdQuery = async (
  id: number,
  question: Partial<{
    subtopicId: number;
    questionText: string;
    answerType: string;
    evidenceFileRequired: boolean;
    hint: string;
    isRequired: boolean;
    priorityLevel: string;
    answer: string;
  }>,
  files: UploadedFile[]
): Promise<Question | null> => {
  console.log("updateQuestionById", id, question);
  let uploadedFiles: string[] = [];
  await Promise.all(
    files.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedFiles.push(uploadedFile.id.toString());
    })
  );
  const result = await pool.query(
    `UPDATE questions SET 
      subtopic_id = $1, question_text = $2, answer_type = $3, evidence_file_required = $4, hint = $5, is_required = $7, priority_level = $7, evidence_files = $8, answer = $9
      WHERE id = $10 RETURNING *`,
    [
      question.subtopicId,
      question.questionText,
      question.answerType,
      question.evidenceFileRequired,
      question.hint,
      question.isRequired,
      question.priorityLevel,
      uploadedFiles,
      question.answer,
      id,
    ]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteQuestionByIdQuery = async (
  id: number
): Promise<Question | null> => {
  console.log("deleteQuestionById", id);
  const result = await pool.query(
    "DELETE FROM questions WHERE id = $1 RETURNING *",
    [id]
  );
  if (result.rows.length) {
    Promise.all(
      result.rows[0].evidence_files.map(async (fileId: string) => {
        await deleteFileById(parseInt(fileId));
      })
    );
  }
  return result.rows.length ? result.rows[0] : null;
};
