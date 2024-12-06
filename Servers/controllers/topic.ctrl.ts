import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockTopic,
  deleteMockTopicById,
  getAllMockTopics,
  getMockTopicById,
  updateMockTopicById,
} from "../mocks/tools/topic.mock.db";
import {
  createNewTopicQuery,
  deleteTopicByIdQuery,
  getAllTopicsQuery,
  getTopicByIdQuery,
  updateTopicByIdQuery,
} from "../utils/topic.utils";
import { createNewQuestionQuery, RequestWithFile } from "../utils/question.utils";
import { createNewSubtopicQuery } from "../utils/subtopic.utils";

export async function getAllTopics(req: Request, res: Response): Promise<any> {
  try {
    if (MOCKDATA_ON === true) {
      const topics = getAllMockTopics();

      if (topics) {
        return res.status(200).json(STATUS_CODE[200](topics));
      }

      return res.status(204).json(STATUS_CODE[204](topics));
    } else {
      const topics = await getAllTopicsQuery();

      if (topics) {
        return res.status(200).json(STATUS_CODE[200](topics));
      }

      return res.status(204).json(STATUS_CODE[204](topics));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicById(req: Request, res: Response): Promise<any> {
  try {
    const topicId = parseInt(req.params.id);

    if (MOCKDATA_ON === true) {
      const topic = getMockTopicById(topicId);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    } else {
      const topic = await getTopicByIdQuery(topicId);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewTopic(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  console.log("Create topics", req.body);
  try {
    const newTopic: {
      assessmentId: number;
      title: string;
      subTopics: {
        id: number;
        title: string;
        questions: {
          id: number;
          question: string;
          hint: string;
          priorityLevel: string;
          answerType: string;
          inputType: string;
          isRequired: boolean;
          evidenceFileRequired: boolean;
          evidenceFile: string;
        }[];
      }[];
    }[] = req.body;

    if (MOCKDATA_ON === true) {
      // const topic = createMockTopic(newTopic);

      // if (topic) {
      //   return res.status(201).json(STATUS_CODE[201](topic));
      // }

      // return res.status(204).json(STATUS_CODE[204](topic));
    } else {
      let flag = true;
      mainLoop: for (const topicGroup of newTopic) {
        const assessmentId = topicGroup.assessmentId;
        const newTopic = await createNewTopicQuery({
          assessmentId,
          title: topicGroup.title,
        });
        if (!newTopic) {
          flag = false;
          break mainLoop;
        }
        const newTopicId = newTopic.id;
        for (const topic of topicGroup.subTopics) {
          const newSubTopic = await createNewSubtopicQuery({
            topicId: newTopicId,
            name: topic.title,
          });
          if (!newSubTopic) {
            flag = false;
            break mainLoop;
          }
          const newSubTopicId = newSubTopic.topicId;
          for (const question of topic.questions) {
            const newQuestion = await createNewQuestionQuery(
              {
                subtopicId: newSubTopicId,
                questionText: question.question,
                answerType: question.answerType,
                evidenceFileRequired: question.evidenceFileRequired,
                hint: question.hint,
                isRequired: question.isRequired,
                priorityLevel: question.priorityLevel,
              },
              req.files!
            );
            if (!newQuestion) {
              flag = false;
              break mainLoop;
            }
          }
        }
      }

      if (flag) {
        return res.status(201).json(STATUS_CODE[201]({}));
      }

      return res.status(204).json(STATUS_CODE[204]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateTopicById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const topicId = parseInt(req.params.id);
    const updatedTopic: {
      assessmentId: number;
      title: string;
    } = req.body;

    if (MOCKDATA_ON === true) {
      const topic = updateMockTopicById(topicId, updatedTopic);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    } else {
      const topic = await updateTopicByIdQuery(topicId, updatedTopic);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteTopicById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const topicId = parseInt(req.params.id);

    if (MOCKDATA_ON === true) {
      const topic = deleteMockTopicById(topicId);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    } else {
      const topic = await deleteTopicByIdQuery(topicId);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
