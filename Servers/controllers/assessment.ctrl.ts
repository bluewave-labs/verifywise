import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  createNewAssessmentQuery,
  deleteAssessmentByIdQuery,
  getAllAssessmentsQuery,
  getAssessmentByIdQuery,
  updateAssessmentByIdQuery,
} from "../utils/assessment.utils";
import {
  createNewTopicQuery,
  updateTopicByIdQuery,
} from "../utils/topic.utils";
import {
  createNewSubtopicQuery,
  updateSubtopicByIdQuery,
} from "../utils/subtopic.utils";
import {
  createNewQuestionQuery,
  RequestWithFile,
  updateQuestionByIdQuery,
  UploadedFile,
} from "../utils/question.utils";

export async function getAllAssessments(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessments = await getAllAssessmentsQuery();

    if (assessments) {
      return res.status(200).json(STATUS_CODE[200](assessments));
    }

    return res.status(204).json(STATUS_CODE[204](assessments));
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
    const assessment = await getAssessmentByIdQuery(assessmentId);

    if (assessment) {
      return res.status(200).json(STATUS_CODE[200](assessment));
    }

    return res.status(404).json(STATUS_CODE[404](assessment));
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
    const createdAssessment = await createNewAssessmentQuery(newAssessment);

    if (createdAssessment) {
      return res.status(201).json(STATUS_CODE[201](createdAssessment));
    }

    return res.status(503).json(STATUS_CODE[503]({}));
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
    const assessment = await updateAssessmentByIdQuery(
      assessmentId,
      updatedAssessment
    );

    if (assessment) {
      return res.status(202).json(STATUS_CODE[202](assessment));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
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
    const deletedAssessment = await deleteAssessmentByIdQuery(assessmentId);

    if (deletedAssessment) {
      return res.status(202).json(STATUS_CODE[202](deletedAssessment));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function saveAnswers(req: RequestWithFile, res: Response): Promise<any> {
  try {
    const assessmentId = parseInt(req.body.assessmentId);
    // now, create a topic using the assessmentId and the topic
    const topic: any = await createNewTopicQuery({
      assessmentId,
      title: req.body.topic,
    });

    // now iterate over the subtopics, create a subtopic using topic id and the subtopic
    const subtopics = JSON.parse(req.body.subtopic);
    const subTopicResp = []
    for (const subtopic of subtopics) {
      const subtopicToSave: any = await createNewSubtopicQuery({
        topicId: topic.id,
        name: subtopic.name,
      });
      const subtopicId = subtopicToSave.id;
      const questions = subtopic.questions;
      // now iterate over the questions, create a question using subtopic id and the question
      const questionResp = []
      for (const question of questions) {
        const questionSaved = await createNewQuestionQuery(
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
          req.files as UploadedFile[]
        );
        questionResp.push(questionSaved)
      }
      subtopicToSave[questions] = questionResp
      subTopicResp.push(subtopicToSave)
    }
    const response = { ...topic, subTopics: subTopicResp }
    res.status(200).json(STATUS_CODE[200]({ message: response }));
  }
  catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAnswers(req: Request, res: Response): Promise<any> {
  const requestBody = req.body as {
    assessmentId: number;
    topic: string;
    topicId: number;
    subtopic: {
      id: number;
      name: string;
      questions: {
        id: number;
        subtopicId: number;
        question: string;
        answerType: string;
        evidenceFileRequired: boolean;
        hint: string;
        isRequired: boolean;
        priorityLevel: string;
        answer: string;
        evidenceFiles: [];
      }[];
    }[];
  };
  const assessmentId = requestBody.assessmentId;

  const topicId = requestBody.topicId;
  // now, update the topic using the assessmentId and the topic
  updateTopicByIdQuery(topicId, {
    assessmentId,
    title: requestBody.topic,
  });

  // now iterate over the subtopics, update the subtopic using topic id and the subtopic
  const subtopics = requestBody.subtopic;
  for (const subtopic of subtopics) {
    const subtopicId = subtopic.id;
    updateSubtopicByIdQuery(subtopicId, {
      topicId,
      name: subtopic.name,
    });
    const questions = subtopic.questions;
    // now iterate over the questions, update the question using subtopic id and the question
    for (const question of questions) {
      const questionId = question.id;
      updateQuestionByIdQuery(
        questionId,
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
