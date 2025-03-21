import { Question, QuestionModel } from "../models/question.model";
import { sequelize } from "../database/db";
import { deleteFileById, getFileById } from "./fileUpload.utils";
import { Request } from "express";
import { QueryTypes } from "sequelize";

export const getAllQuestionsQuery = async (): Promise<(Question & { evidence_files: Object[] })[]> => {
  const questions = await sequelize.query(
    "SELECT * FROM questions",
    {
      mapToModel: true,
      model: QuestionModel
    }
  );
  const questionsUpdated = await Promise.all(
    questions.map(async (question) => {
      let evidenceFiles: Object[] = [];
      await Promise.all(
        (question.evidence_files || []).map(async (fileId: string) => {
          const file = await getFileById(parseInt(fileId));
          evidenceFiles.push({ id: file.id, filename: file.filename });
        })
      );
      return { ...question, evidence_files: evidenceFiles };
    })
  ) as (QuestionModel & { evidence_files: string[] })[];
  return questionsUpdated;
};

export const getQuestionByIdQuery = async (
  id: number
): Promise<Question & { evidence_files: Object[] }> => {
  const result = await sequelize.query(
    "SELECT * FROM questions WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: QuestionModel
    }
  );
  let evidenceFiles: Object[] = [];
  await Promise.all(
    (result[0].evidence_files || []).map(async (fileId: string) => {
      const file = await getFileById(parseInt(fileId));
      evidenceFiles.push({ id: file.id, filename: file.filename });
    })
  );
  return { ...result[0], evidence_files: evidenceFiles } as (QuestionModel & { evidence_files: string[] });
};

export interface RequestWithFile extends Request {
  files?:
  | UploadedFile[]
  | {
    [key: string]: UploadedFile[];
  };
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export const createNewQuestionQuery = async (
  question: Question,
): Promise<Question> => {
  const result = await sequelize.query(
    `INSERT INTO questions (
      subtopic_id, question, answer_type, evidence_required,
      hint, is_required, priority_level, answer
    ) VALUES (
      :subtopic_id, :question, :answer_type, :evidence_required,
      :hint, :is_required, :priority_level, :answer
    ) RETURNING *`,
    {
      replacements: {
        subtopic_id: question.subtopic_id,
        question: question.question,
        answer_type: question.answer_type,
        evidence_required: question.evidence_required,
        hint: question.hint,
        is_required: question.is_required,
        priority_level: question.priority_level,
        answer: question.answer,
      },
      mapToModel: true,
      model: QuestionModel,
      type: QueryTypes.INSERT
    }
  );
  return result[0];
};

export const addFileToQuestion = async (
  id: number,
  uploadedFiles: { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date }[],
  deletedFiles: number[]
): Promise<Question> => {
  // get the existing evidence files
  const evidenceFilesResult = await sequelize.query(
    `SELECT evidence_files FROM questions WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: QuestionModel
    }
  )

  // convert to list of objects
  let _ = evidenceFilesResult[0].evidence_files as string[]
  let evidenceFiles = _.map(f => JSON.parse(f) as { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date })

  // remove the deleted file ids
  evidenceFiles = evidenceFiles.filter(f => !deletedFiles.includes(parseInt(f.id)))

  // combine the files lists
  evidenceFiles = evidenceFiles.concat(uploadedFiles)

  // update
  const result = await sequelize.query(
    `UPDATE questions SET evidence_files = :evidence_files WHERE id = :id RETURNING *;`,
    {
      replacements: {
        evidence_files: evidenceFiles, id
      },
      mapToModel: true,
      model: QuestionModel,
      type: QueryTypes.UPDATE
    }
  )
  return result[0];
}

export const updateQuestionByIdQuery = async (
  id: number,
  answer: string,
): Promise<Question | null> => {
  const updateQuestion: Partial<Record<keyof Question, any>> = {};
  const setClause = [
    "answer",
  ].filter(f => {
    updateQuestion[f as keyof Question] = f
    return true
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE questions SET ${setClause} WHERE id = :id RETURNING *;`;

  updateQuestion.id = id;

  const result = await sequelize.query(query, {
    replacements: updateQuestion,
    mapToModel: true,
    model: QuestionModel,
    type: QueryTypes.UPDATE,
  });

  return result[0];
};

export const deleteQuestionByIdQuery = async (
  id: number
): Promise<Boolean> => {
  const result = await sequelize.query(
    "DELETE FROM questions WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: QuestionModel,
      type: QueryTypes.DELETE,
    }
  );
  if (result.length) {
    Promise.all(
      (result[0].evidence_files || []).map(async (fileId: string) => {
        await deleteFileById(parseInt(fileId));
      })
    );
  }
  return result.length > 0;
};

export const getQuestionBySubTopicIdQuery = async (
  subTopicId: number
): Promise<Question[]> => {
  const result = await sequelize.query(
    `SELECT * FROM questions WHERE subtopic_id = :subtopic_id`,
    {
      replacements: { subtopic_id: subTopicId },
      mapToModel: true,
      model: QuestionModel,
    }
  );
  return result;
};

export const getQuestionByTopicIdQuery = async (
  topicId: number
): Promise<Question[]> => {
  const result = await sequelize.query(
    `SELECT * FROM questions WHERE subtopic_id IN (SELECT id FROM subtopics WHERE topic_id = :topic_id);`,
    {
      replacements: { topic_id: topicId },
      mapToModel: true,
      model: QuestionModel,
    }
  );
  return result;
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
      subtopic_id, question, answer_type, evidence_required,
      hint, is_required, priority_level, answer, order_no, input_type
    ) VALUES (
      :subtopic_id, :question, :answer_type, :evidence_required,
      :hint, :is_required, :priority_level, :answer, :order_no, :input_type
    ) RETURNING *`;
  let createdQuestions: Question[] = []
  for (let question of questions) {
    const result = await sequelize.query(query, {
      replacements: {
        subtopic_id: subTopicId,
        question: question.question,
        answer_type: question.answer_type,
        evidence_required: question.evidence_required,
        hint: question.hint,
        is_required: question.isrequired,
        priority_level: question.priority_level,
        answer: enable_ai_data_insertion ? question.answer : null,
        order_no: question.order_no,
        input_type: question.input_type,
      },
      mapToModel: true,
      model: QuestionModel,
      type: QueryTypes.INSERT
    })
    createdQuestions = createdQuestions.concat(result)
  }
  return createdQuestions;
};
