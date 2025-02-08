import { Subtopic } from "../models/subtopic.model";
import pool from "../database/db";
import { createNewQuestionsQuery } from "./question.utils";
import { Question } from "../models/question.model";

export const getAllSubtopicsQuery = async (): Promise<Subtopic[]> => {
  console.log("getAllSubtopics");
  const subtopics = await pool.query("SELECT * FROM subtopics");
  return subtopics.rows;
};

export const getSubtopicByIdQuery = async (
  id: number
): Promise<Subtopic | null> => {
  console.log("getSubtopicById", id);
  const result = await pool.query("SELECT * FROM subtopics WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubtopicQuery = async (subtopic: {
  topicId: number;
  name: string;
}): Promise<{
  topicId: number;
  name: string;
}> => {
  console.log("createNewSubtopic", subtopic);
  const result = await pool.query(
    `INSERT INTO subtopics (topic_id, name) VALUES ($1, $2) RETURNING *`,
    [subtopic.topicId, subtopic.name]
  );
  return result.rows[0];
};

export const updateSubtopicByIdQuery = async (
  id: number,
  subtopic: Partial<{
    topicId: number;
    name: string;
  }>
): Promise<Subtopic | null> => {
  console.log("updateSubtopicById", id, subtopic);
  const result = await pool.query(
    `UPDATE subtopics SET topic_id = $1, name = $2 WHERE id = $3 RETURNING *`,
    [subtopic.topicId, subtopic.name, id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSubtopicByIdQuery = async (
  id: number
): Promise<Subtopic | null> => {
  console.log("deleteSubtopicById", id);
  const result = await pool.query(
    "DELETE FROM subtopics WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const getSubTopicByTopicIdQuery = async (
  topicId: number
): Promise<Subtopic[]> => {
  console.log("getSubTopicByTopicId", topicId);
  const result = await pool.query(
    `SELECT * FROM subtopics WHERE topic_id = $1`,
    [topicId]
  );
  return result.rows;
}

const subTopicsMock = (
  topicIds: number[]
): Subtopic[] => {
  return [
    {
      id: 1,
      topicId: topicIds[0],
      name: "General",
    },
    {
      id: 2,
      topicId: topicIds[0],
      name: "Technology details",
    },
    {
      id: 3,
      topicId: topicIds[1],
      name: "Transparency and provision of information to deployers",
    },
    {
      id: 4,
      topicId: topicIds[1],
      name: "Responsibilities along the AI value chain",
    },
    {
      id: 5,
      topicId: topicIds[2],
      name: "Responsibilities along the AI value chain",
    },
    {
      id: 6,
      topicId: topicIds[2],
      name: "Fundamental rights impact assessments for high-risk AI systems",
    },
    {
      id: 7,
      topicId: topicIds[3],
      name: "AI model capability assessment",
    },
    {
      id: 8,
      topicId: topicIds[4],
      name: "AI model capability assessment",
    },
    {
      id: 9,
      topicId: topicIds[5],
      name: "User notification of AI system use",
    },
    {
      id: 10,
      topicId: topicIds[6],
      name: "Oversight documentation",
    },
    {
      id: 11,
      topicId: topicIds[6],
      name: "Human intervention mechanisms",
    },
    {
      id: 12,
      topicId: topicIds[7],
      name: "System validation and reliability documentation",
    },
    {
      id: 13,
      topicId: topicIds[7],
      name: "AI system change documentation",
    },
    {
      id: 14,
      topicId: topicIds[8],
      name: "EU database registration",
    },
    {
      id: 15,
      topicId: topicIds[9],
      name: "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
    },
    {
      id: 16,
      topicId: topicIds[10],
      name: "Bias and fairness evaluation",
    },
    {
      id: 17,
      topicId: topicIds[11],
      name: "System information documentation",
    },
    {
      id: 18,
      topicId: topicIds[12],
      name: "Transparency obligations for providers and users of certain AI systems",
    },
    {
      id: 19,
      topicId: topicIds[13],
      name: "Environmental impact",
    },
  ]
}

export const createNewSubTopicsQuery = async (
  topicIds: number[]
) => {
  let query = "INSERT INTO subtopics(topic_id, name) VALUES "
  const data = subTopicsMock(topicIds).map((d) => {
    return `(${d.topicId}, '${d.name}')`;
  })
  query += data.join(",") + "RETURNING *;"
  const result = await pool.query(query)
  const questions: Question[] = await createNewQuestionsQuery(result.rows.map(r => Number(r.id)))
  const subTopics = result.rows as Subtopic[]

  let stPtr = 0, qPtr = 0;
  while (qPtr < questions.length) {
    (subTopics[stPtr] as any).questions = []
    while (subTopics[stPtr].id === (questions[qPtr] as any)["subtopic_id"]) {
      (subTopics[stPtr] as any).questions.push(questions[qPtr])
      qPtr += 1
      if (qPtr === questions.length) break;
    }
    stPtr += 1
  }

  return subTopics
}

