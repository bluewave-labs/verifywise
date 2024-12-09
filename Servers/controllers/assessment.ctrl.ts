import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockAssessment,
  deleteMockAssessmentById,
  getAllMockAssessments,
  getMockAssessmentById,
  updateMockAssessmentById,
} from "../mocks/tools/assessment.mock.db";
import {
  createNewAssessmentQuery,
  deleteAssessmentByIdQuery,
  getAllAssessmentsQuery,
  getAssessmentByIdQuery,
  updateAssessmentByIdQuery,
} from "../utils/assessment.utils";
import { createNewQuestionQuery, RequestWithFile } from "../utils/question.utils";
import { createNewTopicQuery } from "../utils/topic.utils";
import { createNewSubtopicQuery } from "../utils/subtopic.utils";

export async function getAllAssessments(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCKDATA_ON === true) {
      const assessments = getAllMockAssessments();

      if (assessments) {
        return res.status(200).json(STATUS_CODE[200](assessments));
      }

      return res.status(204).json(STATUS_CODE[204](assessments));
    } else {
      const assessments = await getAllAssessmentsQuery();

      if (assessments) {
        return res.status(200).json(STATUS_CODE[200](assessments));
      }

      return res.status(204).json(STATUS_CODE[204](assessments));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAssessmentById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);

    if (MOCKDATA_ON === true) {
      const assessment = getMockAssessmentById(assessmentId);

      if (assessment) {
        return res.status(200).json(STATUS_CODE[200](assessment));
      }

      return res.status(404).json(STATUS_CODE[404](assessment));
    } else {
      const assessment = await getAssessmentByIdQuery(assessmentId);

      if (assessment) {
        return res.status(200).json(STATUS_CODE[200](assessment));
      }

      return res.status(404).json(STATUS_CODE[404](assessment));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAssessment(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  try {
    const newAssessment: {
      projectId: number;
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
      const createdAssessment = createMockAssessment(newAssessment);

      if (createdAssessment) {
        return res.status(201).json(STATUS_CODE[201](createdAssessment));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      let flag = true;
      mainLoop: for (const topicGroup of newAssessment) {
        if (!topicGroup.projectId) {
          flag = false;
          break mainLoop;
        }
        const assessment = await createNewAssessmentQuery({
          projectId: topicGroup.projectId,
        });
        const assessmentId = assessment.id;
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

export async function updateAssessmentById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);
    const updatedAssessment: {
      projectId: number;
    } = req.body;

    if (!updatedAssessment.projectId) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "projectId is required",
        })
      );
    }

    if (MOCKDATA_ON === true) {
      const assessment = updateMockAssessmentById(
        assessmentId,
        updatedAssessment
      );

      if (assessment) {
        return res.status(202).json(STATUS_CODE[202](assessment));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const assessment = await updateAssessmentByIdQuery(
        assessmentId,
        updatedAssessment
      );

      if (assessment) {
        return res.status(202).json(STATUS_CODE[202](assessment));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAssessmentById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);

    if (MOCKDATA_ON === true) {
      const deletedAssessment = deleteMockAssessmentById(assessmentId);

      if (deletedAssessment) {
        return res.status(202).json(STATUS_CODE[202](deletedAssessment));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedAssessment = await deleteAssessmentByIdQuery(assessmentId);

      if (deletedAssessment) {
        return res.status(202).json(STATUS_CODE[202](deletedAssessment));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
