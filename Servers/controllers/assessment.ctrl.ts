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
import { createMockTopic } from "../mocks/tools/topic.mock.db";
import { createMockSubtopic } from "../mocks/tools/subtopic.mock.db";
import { createMockQuestion } from "../mocks/tools/question.mock.db";
import { createNewTopicQuery } from "../utils/topic.utils";
import { createNewSubtopicQuery } from "../utils/subtopic.utils";
import { createNewQuestionQuery } from "../utils/question.utils";

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
  req: Request,
  res: Response
): Promise<any> {
  try {
    const newAssessment: {
      projectId: number;
    } = req.body;

    if (!newAssessment.projectId) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "projectId is required",
        })
      );
    }

    if (MOCKDATA_ON === true) {
      const createdAssessment = createMockAssessment(newAssessment);

      if (createdAssessment) {
        return res.status(201).json(STATUS_CODE[201](createdAssessment));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const createdAssessment = await createNewAssessmentQuery(newAssessment);

      if (createdAssessment) {
        return res.status(201).json(STATUS_CODE[201](createdAssessment));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
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

export async function saveAnswers(req: Request, res: Response): Promise<any> {
  if (MOCKDATA_ON === true) {
    try {
      // first get all assessments
      const assessments = getAllMockAssessments();
      // if the length is bigger than 1 get the first one
      const assessmentId = assessments[0].id;

      // now, create a topic using the assessmentId and the topic
      const topic: any = createMockTopic(assessmentId, req.body.topic);

      // now iterate over the subtopics, create a subtopic using topic id and the subtopic
      const subtopics = req.body.subtopic;
      for (const subtopic of subtopics) {
        const subtopicToSave: any = createMockSubtopic(
          topic.id,
          subtopic.title
        );
        const subtopicId = subtopicToSave.id;
        const questions = subtopic.questions;
        console.log(questions);
        // now iterate over the questions, create a question using subtopic id and the question
        for (const question of questions) {
          createMockQuestion(subtopicId, question);
        }
      }
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
    res.status(200);
  } else {
    // first get all assessments
    const assessments = await getAllAssessmentsQuery();
    // if the length is bigger than 1 get the first one
    const assessmentId = assessments[0].id;

    // now, create a topic using the assessmentId and the topic
    const topic: any = createNewTopicQuery({
      assessmentId,
      title: req.body.topic.title,
    });

    // now iterate over the subtopics, create a subtopic using topic id and the subtopic
    const subtopics = req.body.subtopic;
    for (const subtopic of subtopics) {
      const subtopicToSave: any = createNewSubtopicQuery({
        topicId: topic.id,
        name: subtopic.title,
      });
      const subtopicId = subtopicToSave.id;
      const questions = subtopic.questions;
      // now iterate over the questions, create a question using subtopic id and the question
      for (const question of questions) {
        createNewQuestionQuery(
          {
            subtopicId,
            questionText: question.question,
            answerType: question.answerType,
            evidenceFileRequired: question.evidenceFileRequired,
            hint: question.hint,
            isRequired: question.isRequired,
            priorityLevel: question.priorityLevel,
            answer: question.answer,
          },
          question.evidenceFiles
        );
      }
    }
  }
}
