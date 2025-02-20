import { Question } from "../models/question.model";
import pool from "../database/db";
import { deleteFileById, getFileById, uploadFile } from "./fileUpload.utils";
import { Request } from "express";

export const getAllQuestionsQuery = async (): Promise<Question[]> => {
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
  files?:
    | UploadedFile[]
    | {
        [key: string]: UploadedFile[];
      };
}
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export const createNewQuestionQuery = async (
  question: Question,
  files?: UploadedFile[]
): Promise<Question> => {
  let uploadedFiles: { id: number; fileName: string }[] = [];
  await Promise.all(
    files!.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedFiles.push({
        id: uploadedFile.id.toString(),
        fileName: uploadedFile.filename,
      });
    })
  );
  const result = await pool.query(
    `INSERT INTO questions (
      subtopic_id, question, answer_type, 
      evidence_required, hint, is_required, 
      priority_level, evidence_files, answer
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      question.subtopic_id,
      question.question,
      question.answer_type,
      question.evidence_required,
      question.hint,
      question.is_required,
      question.priority_level,
      uploadedFiles,
      question.answer,
    ]
  );
  return result.rows[0];
};

export const updateQuestionByIdQuery = async (
  id: number,
  question: Question,
  files: UploadedFile[]
): Promise<Question | null> => {
  let uploadedFiles: { id: number; fileName: string }[] = [];
  if (files && files.length > 0) {
    await Promise.all(
      files.map(async (file) => {
        const uploadedFile = await uploadFile(file);
        uploadedFiles.push({
          id: uploadedFile.id.toString(),
          fileName: uploadedFile.filename,
        });
      })
    );
  }

  const result = await pool.query(
    `UPDATE questions SET 
      subtopic_id = $1, question = $2, answer_type = $3, 
      evidence_required = $4, hint = $5, is_required = $6, 
      priority_level = $7, evidence_files = $8, answer = $9, 
      dropdown_options = $10, input_type = $11, order_id = $12
      WHERE id = $13 RETURNING *`,
    [
      question.subtopic_id,
      question.question,
      question.answer_type,
      question.evidence_required,
      question.hint,
      question.is_required,
      question.priority_level,
      uploadedFiles,
      question.answer,
      question.dropdown_options,
      question.input_type,
      question.order_no,
      id,
    ]
  );

  return result.rows.length ? result.rows[0] : null;
};

export const deleteQuestionByIdQuery = async (
  id: number
): Promise<Question | null> => {
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

export const getQuestionBySubTopicIdQuery = async (
  subTopicId: number
): Promise<Question[]> => {
  const result = await pool.query(
    `SELECT * FROM questions WHERE subtopic_id = $1`,
    [subTopicId]
  );
  return result.rows;
};

export const createNewQuestionsQuery = async (
  subTopicId: number,
  questions: {
    order_no: number;
    question: string;
    hint: string;
    priority_level: string;
    answer_type: string;
    input_type: string;
    evidence_required: boolean;
    isrequired: boolean;
    evidence_files: never[];
    dropdown_options: never[];
  }[]
) => {
  let query = `
    INSERT INTO questions(
      subtopic_id, question, answer_type,
      evidence_required, hint, is_required,
      priority_level, answer, order_id, input_type) VALUES `;
  const data = questions.map((d) => {
    return `(
      ${subTopicId},
      '${d.question}',
      '${d.answer_type}',
      ${d.evidence_required},
      '${d.hint}',
      ${d.isrequired},
      '${d.priority_level}',
      '',
      ${d.order_no},
      '${d.input_type}'
    )`;
  });
  query += data.join(",") + " RETURNING *;";
  const result = await pool.query(query);
  return result.rows;
};
