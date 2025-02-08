import { Topic } from "../models/topic.model";
import pool from "../database/db";
import { createNewSubTopicsQuery } from "./subtopic.utils";

export const getAllTopicsQuery = async (): Promise<Topic[]> => {
  console.log("getAllTopics");
  const topics = await pool.query("SELECT * FROM topics");
  return topics.rows;
};

export const getTopicByIdQuery = async (id: number): Promise<Topic | null> => {
  console.log("getTopicById", id);
  const result = await pool.query("SELECT * FROM topics WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewTopicQuery = async (topic: {
  assessmentId: number;
  title: string;
}): Promise<Topic> => {
  console.log("createNewTopic", topic);
  const result = await pool.query(
    `INSERT INTO topics (assessment_id, title) VALUES ($1, $2) RETURNING *`,
    [topic.assessmentId, topic.title]
  );
  return result.rows[0];
};

export const updateTopicByIdQuery = async (
  id: number,
  topic: Partial<{
    assessmentId: number;
    title: string;
  }>
): Promise<Topic | null> => {
  console.log("updateTopicById", id, topic);
  const fields = [];
  const values = [];
  let query = "UPDATE topics SET ";

  if (topic.assessmentId !== undefined) {
    fields.push(`assessment_id = $${fields.length + 1}`);
    values.push(topic.assessmentId);
  }
  if (topic.title !== undefined) {
    fields.push(`title = $${fields.length + 1}`);
    values.push(topic.title);
  }

  query += fields.join(", ") + ` WHERE id = $${values.length + 1} RETURNING *`;

  const result = await pool.query(query, [...values, id]);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteTopicByIdQuery = async (
  id: number
): Promise<Topic | null> => {
  console.log("deleteTopicById", id);
  const result = await pool.query(
    `DELETE FROM topics WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const getTopicByAssessmentIdQuery = async (
  assessmentId: number
): Promise<Topic[]> => {
  console.log("getTopicByAssessmentId", assessmentId);
  const result = await pool.query(
    `SELECT * FROM topics WHERE assessment_id = $1`,
    [assessmentId]
  );
  return result.rows;
}

const topicsMock = (assessmentId: number): Topic[] => {
  return [
    {
      id: 1,
      assessmentId: assessmentId,
      title: "Project Scope",
    },
    {
      id: 2,
      assessmentId: assessmentId,
      title: "Risk management system",
    },
    {
      id: 3,
      assessmentId: assessmentId,
      title: "Data governance",
    },
    {
      id: 4,
      assessmentId: assessmentId,
      title: "Technical documentation",
    },
    {
      id: 5,
      assessmentId: assessmentId,
      title: "Record keeping",
    },
    {
      id: 6,
      assessmentId: assessmentId,
      title: "Transparency & user information",
    },
    {
      id: 7,
      assessmentId: assessmentId,
      title: "Human oversight",
    },
    {
      id: 8,
      assessmentId: assessmentId,
      title: "Accuracy, robustness, cyber security",
    },
    {
      id: 9,
      assessmentId: assessmentId,
      title: "Conformity assessment",
    },
    {
      id: 10,
      assessmentId: assessmentId,
      title: "Post-market monitoring",
    },
    {
      id: 11,
      assessmentId: assessmentId,
      title: "Bias monitoring and mitigation",
    },
    {
      id: 12,
      assessmentId: assessmentId,
      title: "Accountability and governance",
    },
    {
      id: 13,
      assessmentId: assessmentId,
      title: "Explainability",
    },
    {
      id: 14,
      assessmentId: assessmentId,
      title: "Environmental impact",
    }
  ]
}

export const createNewTopicsQuery = async (
  assessmentId: number
) => {
  let query = "INSERT INTO topics(assessment_id, title) VALUES "
  const data = topicsMock(assessmentId).map((d) => {
    return `(${d.assessmentId}, '${d.title}')`;
  })
  query += data.join(",") + "RETURNING *;"
  const result = await pool.query(query)
  const subTopics = await createNewSubTopicsQuery(
    result.rows.map(r => Number(r.id))
  );
  const topics = result.rows

  let stPtr = 0, tPtr = 0;
  while (stPtr < subTopics.length) {
    (topics[tPtr] as any).subtopics = []
    while (topics[tPtr].id === (subTopics[stPtr] as any)["topic_id"]) {
      (topics[tPtr] as any).subtopics.push(subTopics[stPtr])
      stPtr += 1
      if (stPtr === subTopics.length) break;
    }
    tPtr += 1
  }
  return topics
}
