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
): Promise<Question> => {
  const result = await pool.query(
    `INSERT INTO questions (
      subtopic_id, question, answer_type, 
      evidence_required, hint, is_required, 
      priority_level, answer
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      question.subtopic_id,
      question.question,
      question.answer_type,
      question.evidence_required,
      question.hint,
      question.is_required,
      question.priority_level,
      question.answer,
    ]
  );
  return result.rows[0];
};

export const addFileToQuestion = async (
  id: number,
  uploadedFiles: { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date }[],
  deletedFiles: number[]
): Promise<Question> => {
  // get the existing evidence files
  const evidenceFilesResult = await pool.query(
    `SELECT evidence_files FROM questions WHERE id = $1`,
    [id]
  )

  // convert to list of objects
  let _ = evidenceFilesResult.rows[0].evidence_files as string[]
  let evidenceFiles = _.map(f => JSON.parse(f) as { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date })

  // remove the deleted file ids
  evidenceFiles = evidenceFiles.filter(f => !deletedFiles.includes(parseInt(f.id)))

  // combine the files lists
  evidenceFiles = evidenceFiles.concat(uploadedFiles)

  // update
  const result = await pool.query(
    `UPDATE questions SET evidence_files = $1 WHERE id = $2 RETURNING *;`,
    [evidenceFiles, id]
  )
  return result.rows[0];
}

export const updateQuestionByIdQuery = async (
  id: number,
  answer: string,
): Promise<Question | null> => {
  const result = await pool.query(
    `UPDATE questions SET answer = $1 WHERE id = $2 RETURNING *`,
    [
      answer,
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

export const getQuestionByTopicIdQuery = async (
  topicId: number
): Promise<Question[]> => {
  const result = await pool.query(
    `SELECT * FROM questions WHERE subtopic_id IN (SELECT id FROM subtopics WHERE topic_id = $1);`,
    [topicId]
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
    answer: string;
  }[],
  enable_ai_data_insertion: boolean
) => {
  let query = `
    INSERT INTO questions(
      subtopic_id, question, answer_type,
      evidence_required, hint, is_required,
      priority_level, answer, order_no, input_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
  let createdQuestions: Question[] = []
  for (let question of questions) {
    const result = await pool.query(
      query, [
      subTopicId,
      question.question,
      question.answer_type,
      question.evidence_required,
      question.hint,
      question.isrequired,
      question.priority_level,
      enable_ai_data_insertion ? question.answer : null,
      question.order_no,
      question.input_type,
    ])
    createdQuestions = createdQuestions.concat(result.rows)
  }
  return createdQuestions;
};
