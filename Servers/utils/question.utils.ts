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
  let uploadedFiles: { id: number, fileName: string }[] = [];
  await Promise.all(
    files.map(async (file) => {
      const uploadedFile = await uploadFile(file);
      uploadedFiles.push({ id: uploadedFile.id.toString(), fileName: uploadedFile.filename });
    })
  );
  const result = await pool.query(
    `UPDATE questions SET 
      subtopic_id = $1, question_text = $2, answer_type = $3, evidence_file_required = $4, hint = $5, is_required = $6, priority_level = $7, evidence_files = $8, answer = $9
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

export const getQuestionBySubTopicIdQuery = async (
  subTopicId: number
): Promise<Question[]> => {
  console.log("getQuestionBySubTopicId", subTopicId);
  const result = await pool.query(
    `SELECT * FROM questions WHERE subtopic_id = $1`,
    [subTopicId]
  );
  return result.rows;
}

const questions = (
  subTopicIds: number[]
): Question[] => {
  return [
    {
      id: 1,
      subtopicId: subTopicIds[0],
      questionText:
        "Will you make substantial modifications to the high-risk AI system already on the EU market, and if so, what additional training or fine-tuning will be performed on the model after these modifications?",
      answerType: "Long text",
      evidenceFileRequired: false,
      hint: "As a deployer, you are responsible for any additional changes made to the high-risk AI system and must fulfill additional requirements based on the data used and the specific use case you are deploying.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 2,
      subtopicId: subTopicIds[0],
      questionText:
        "What business problem does the AI system solve, and what are its capabilities? What other techniques were considered before deciding to use AI to address this problem?",
      answerType: "Long text",
      evidenceFileRequired: false,
      hint: "It''s important to provide transparent information about why you are choosing a high-risk AI system, including a mapping of key stages within the project and an assessment of resources and capabilities within your team or organization.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 3,
      subtopicId: subTopicIds[1],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 4,
      subtopicId: subTopicIds[1],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 5,
      subtopicId: subTopicIds[2],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 6,
      subtopicId: subTopicIds[2],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 7,
      subtopicId: subTopicIds[3],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 8,
      subtopicId: subTopicIds[3],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 9,
      subtopicId: subTopicIds[4],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 10,
      subtopicId: subTopicIds[4],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 11,
      subtopicId: subTopicIds[5],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 12,
      subtopicId: subTopicIds[5],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 13,
      subtopicId: subTopicIds[6],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 14,
      subtopicId: subTopicIds[6],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 15,
      subtopicId: subTopicIds[7],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 16,
      subtopicId: subTopicIds[7],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 17,
      subtopicId: subTopicIds[8],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 18,
      subtopicId: subTopicIds[8],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 19,
      subtopicId: subTopicIds[9],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 20,
      subtopicId: subTopicIds[9],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 21,
      subtopicId: subTopicIds[10],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 22,
      subtopicId: subTopicIds[10],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 23,
      subtopicId: subTopicIds[11],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 24,
      subtopicId: subTopicIds[11],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 25,
      subtopicId: subTopicIds[12],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 26,
      subtopicId: subTopicIds[12],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 27,
      subtopicId: subTopicIds[13],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 28,
      subtopicId: subTopicIds[13],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 29,
      subtopicId: subTopicIds[14],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 30,
      subtopicId: subTopicIds[14],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 31,
      subtopicId: subTopicIds[15],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 32,
      subtopicId: subTopicIds[15],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 33,
      subtopicId: subTopicIds[16],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
    {
      id: 34,
      subtopicId: subTopicIds[16],
      questionText:
        "How has your organization assessed the AI application against its ethical values? What ethical considerations were most pertinent, and how were they addressed?",
      answerType: "Long text",
      evidenceFileRequired: true,
      hint: "Explain what other methods lacked and, based on the use case, what the implications would be for society, the environment, and human rights.",
      isRequired: true,
      priorityLevel: "high priority",
      answer: "",
    },
  ]
}

export const createNewQuestionsQuery = async (
  subTopicIds: number[]
) => {
  let query = "INSERT INTO questions(subtopic_id, question_text, answer_type, evidence_file_required, hint, is_required, priority_level, evidence_files, answer) VALUES "
  const data = questions(subTopicIds).map((d) => {
    return `(
      ${d.subtopicId},
      '${d.questionText}',
      '${d.answerType}',
      ${d.evidenceFileRequired},
      '${d.hint}',
      ${d.isRequired},
      '${d.priorityLevel}',
      ARRAY[]::TEXT[],
      '${d.answer}'
    )`;
  })
  query += data.join(",") + "RETURNING *;"
  const result = await pool.query(query)
  return result.rows
}
