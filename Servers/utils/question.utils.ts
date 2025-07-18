import { QuestionModel } from "../domain.layer/models/question/question.model";
import { sequelize } from "../database/db";
import { deleteFileById, getFileById } from "./fileUpload.utils";
import { Request } from "express";
import { QueryTypes, Transaction } from "sequelize";
import { IQuestion } from "../domain.layer/interfaces/I.question";

export const getAllQuestionsQuery = async (
  tenant: string
): Promise<(IQuestion & { evidence_files: Object[] })[]> => {
  const questions = await sequelize.query(
    `SELECT * FROM "${tenant}".questions ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: QuestionModel,
    }
  );
  const questionsUpdated = (await Promise.all(
    questions.map(async (question) => {
      let evidenceFiles: Object[] = [];
      await Promise.all(
        (question.evidence_files || []).map(async (f) => {
          // const file = await getFileById(parseInt(f.id));
          evidenceFiles.push({ id: f.id, filename: f.fileName });
        })
      );
      return { ...question.dataValues, evidence_files: evidenceFiles };
    })
  )) as (QuestionModel & { evidence_files: string[] })[];
  return questionsUpdated;
};

export const getQuestionByIdQuery = async (
  id: number,
  tenant: string
): Promise<IQuestion & { evidence_files: Object[] }> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".questions WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: QuestionModel,
    }
  );
  let evidenceFiles: Object[] = [];
  await Promise.all(
    (result[0].evidence_files || []).map(async (f) => {
      // const file = await getFileById(parseInt(f.id));
      evidenceFiles.push({ id: f.id, filename: f.fileName });
    })
  );
  return {
    ...result[0].dataValues,
    evidence_files: evidenceFiles,
  } as QuestionModel & { evidence_files: string[] };
};

export interface RequestWithFile extends Request {
  files?:
  | UploadedFile[]
  | {
    [key: string]: UploadedFile[];
  };
  file?: UploadedFile;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export const createNewQuestionQuery = async (
  question: QuestionModel,
  tenant: string,
  transaction: Transaction
): Promise<QuestionModel> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".questions (
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
      // type: QueryTypes.INSERT
      transaction,
    }
  );
  return result[0];
};

export const addFileToQuestion = async (
  id: number,
  uploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[],
  deletedFiles: number[],
  tenant: string,
  transaction: Transaction
): Promise<QuestionModel> => {
  // get the existing evidence files
  const evidenceFilesResult = await sequelize.query(
    `SELECT evidence_files FROM "${tenant}".questions WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: QuestionModel,
      transaction,
    }
  );

  // convert to list of objects
  let evidenceFiles = (
    evidenceFilesResult[0].evidence_files
      ? evidenceFilesResult[0].evidence_files
      : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];

  // remove the deleted file ids
  evidenceFiles = evidenceFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );

  // combine the files lists
  evidenceFiles = evidenceFiles.concat(uploadedFiles);

  // update
  const result = await sequelize.query(
    `UPDATE "${tenant}".questions SET evidence_files = :evidence_files WHERE id = :id RETURNING *;`,
    {
      replacements: {
        evidence_files: JSON.stringify(evidenceFiles),
        id,
      },
      mapToModel: true,
      model: QuestionModel,
      // type: QueryTypes.UPDATE
      transaction,
    }
  );
  return result[0];
};

export const updateQuestionByIdQuery = async (
  id: number,
  question: Partial<QuestionModel>,
  tenant: string,
  transaction: Transaction
): Promise<QuestionModel | null> => {
  const updateQuestion: Partial<Record<keyof QuestionModel, any>> = {};
  const setClause = ["answer", "status"]
    .filter((f) => {
      if (question[f as keyof QuestionModel] !== undefined) {
        updateQuestion[f as keyof QuestionModel] =
          question[f as keyof QuestionModel];
        if (f === "answer" && !question[f]) {
          updateQuestion[f as keyof QuestionModel] = "";
        }
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".questions SET ${setClause} WHERE id = :id RETURNING *;`;

  updateQuestion.id = id;

  const result = await sequelize.query(query, {
    replacements: updateQuestion,
    mapToModel: true,
    model: QuestionModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const deleteQuestionByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".questions WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: QuestionModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  if (result.length) {
    Promise.all(
      (result[0].evidence_files || []).map(async (f) => {
        await deleteFileById(parseInt(f.id), tenant, transaction);
      })
    );
  }
  return result.length > 0;
};

export const getQuestionBySubTopicIdQuery = async (
  subTopicId: number,
  tenant: string
): Promise<IQuestion[]> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".questions WHERE subtopic_id = :subtopic_id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { subtopic_id: subTopicId },
      mapToModel: true,
      model: QuestionModel,
    }
  );
  return result;
};

export const getQuestionByTopicIdQuery = async (
  topicId: number,
  tenant: string
): Promise<IQuestion[]> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".questions WHERE subtopic_id IN (SELECT id FROM "${tenant}".subtopics WHERE topic_id = :topic_id) ORDER BY created_at DESC, id ASC;`,
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
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction
) => {
  let query = `
    INSERT INTO "${tenant}".questions(
      subtopic_id, question, answer_type, evidence_required,
      hint, is_required, priority_level, answer, order_no, input_type
    ) VALUES (
      :subtopic_id, :question, :answer_type, :evidence_required,
      :hint, :is_required, :priority_level, :answer, :order_no, :input_type
    ) RETURNING *`;
  let createdQuestions: QuestionModel[] = [];
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
        order_no: question.order_no || null,
        input_type: question.input_type,
      },
      mapToModel: true,
      model: QuestionModel,
      // type: QueryTypes.INSERT
      transaction,
    });
    createdQuestions = createdQuestions.concat(result);
  }
  return createdQuestions;
};
