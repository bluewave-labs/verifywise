import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  createNewAssessmentQuery,
  deleteAssessmentByIdQuery,
  getAllAssessmentsQuery,
  getAssessmentByIdQuery,
  getAssessmentByProjectIdQuery,
  updateAssessmentByIdQuery,
} from "../utils/assessment.utils";
import {
  createNewTopicQuery,
  getTopicByAssessmentIdQuery,
  updateTopicByIdQuery,
} from "../utils/topic.utils";
import {
  createNewSubtopicQuery,
  getSubTopicByTopicIdQuery,
  updateSubtopicByIdQuery,
} from "../utils/subtopic.utils";
import {
  createNewQuestionQuery,
  getQuestionBySubTopicIdQuery,
  RequestWithFile,
  updateQuestionByIdQuery,
  UploadedFile,
} from "../utils/question.utils";
import { Assessment, AssessmentModel } from "../models/assessment.model";
import { TopicModel } from "../models/topic.model";
import { SubtopicModel } from "../models/subtopic.model";

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
    const newAssessment: Assessment = req.body;

    if (!newAssessment.project_id) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "projectId is required",
        })
      );
    }
    const createdAssessment = await createNewAssessmentQuery(newAssessment, false);

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
    const updatedAssessment: Assessment = req.body;

    if (!updatedAssessment.project_id) {
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

// export async function saveAnswers(req: RequestWithFile, res: Response): Promise<any> {
//   try {
//     const requestBody = req.body as {
//       assessmentId: number;
//       topic: string;
//       topicId: number;
//       subtopic: string;
//     };
//     const assessmentId = requestBody.assessmentId;
//     // now, create a topic using the assessmentId and the topic
//     const topic: any = await updateTopicByIdQuery(requestBody.topicId, {
//       assessmentId,
//       title: requestBody.topic,
//     });

//     // now iterate over the subtopics, create a subtopic using topic id and the subtopic
//     const subtopics = JSON.parse(requestBody.subtopic) as {
//       id: number;
//       name: string;
//       questions: {
//         id: number;
//         subtopicId: number;
//         questionText: string;
//         answerType: string;
//         evidenceFileRequired: boolean;
//         hint: string;
//         isRequired: boolean;
//         priorityLevel: string;
//         answer: string;
//         evidenceFiles: [];
//       }[];
//     }[];
//     const subTopicResp = []
//     for (const subtopic of subtopics) {
//       const subtopicToUpdate: any = await updateSubtopicByIdQuery(subtopic.id, {
//         topicId: topic.id,
//         name: subtopic.name,
//       });
//       const subtopicId = subtopicToUpdate.id;
//       const questions = subtopic.questions;
//       // now iterate over the questions, create a question using subtopic id and the question
//       const questionResp = []
//       for (const question of questions) {
//         console.log(req.files);
//         const questionSaved = await updateQuestionByIdQuery(
//           question.id,
//           {
//             subtopicId,
//             questionText: question.questionText,
//             answerType: question.answerType,
//             evidenceFileRequired: question.evidenceFileRequired,
//             hint: question.hint,
//             isRequired: question.isRequired,
//             priorityLevel: question.priorityLevel,
//             answer: question.answer,
//           },
//           req.files as UploadedFile[]
//         );
//         questionResp.push(questionSaved)
//       }
//       subtopicToUpdate["questions"] = questionResp
//       subTopicResp.push(subtopicToUpdate)
//     }
//     const response = { ...topic, subTopics: subTopicResp }
//     res.status(200).json(STATUS_CODE[200]({ message: response }));
//   }
//   catch (error) {
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }

export async function getAnswers(req: Request, res: Response): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);
    const assessment = await getAssessmentByIdQuery(assessmentId) as AssessmentModel;
    const topics = await getTopicByAssessmentIdQuery(assessment!.id!) as TopicModel[];
    for (let topic of topics) {
      const subTopics = await getSubTopicByTopicIdQuery(topic.id!) as SubtopicModel[];

      for (let subTopic of subTopics) {
        const questions = await getQuestionBySubTopicIdQuery(subTopic.id!);
        (subTopic.dataValues as any)["questions"] = questions;
      }
      (topic.dataValues as any)["subTopics"] = subTopics;
    }
    (assessment.dataValues as any)["topics"] = topics;

    return res.status(200).json(STATUS_CODE[200]({ message: assessment }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// export async function updateAnswers(req: Request, res: Response): Promise<any> {
//   const requestBody = req.body as {
//     assessmentId: number;
//     topic: string;
//     topicId: number;
//     subtopic: {
//       id: number;
//       name: string;
//       questions: {
//         id: number;
//         subtopicId: number;
//         question: string;
//         answerType: string;
//         evidenceFileRequired: boolean;
//         hint: string;
//         isRequired: boolean;
//         priorityLevel: string;
//         answer: string;
//         evidenceFiles: [];
//       }[];
//     }[];
//   };
//   const assessmentId = requestBody.assessmentId;

//   const topicId = requestBody.topicId;
//   // now, update the topic using the assessmentId and the topic
//   updateTopicByIdQuery(topicId, {
//     assessmentId,
//     title: requestBody.topic,
//   });

//   // now iterate over the subtopics, update the subtopic using topic id and the subtopic
//   const subtopics = requestBody.subtopic;
//   for (const subtopic of subtopics) {
//     const subtopicId = subtopic.id;
//     updateSubtopicByIdQuery(subtopicId, {
//       topicId,
//       name: subtopic.name,
//     });
//     const questions = subtopic.questions;
//     // now iterate over the questions, update the question using subtopic id and the question
//     for (const question of questions) {
//       const questionId = question.id;
//       updateQuestionByIdQuery(
//         questionId,
//         {
//           subtopicId,
//           questionText: question.question,
//           answerType: question.answerType,
//           evidenceFileRequired: question.evidenceFileRequired,
//           hint: question.hint,
//           isRequired: question.isRequired,
//           priorityLevel: question.priorityLevel,
//           answer: question.answer,
//         },
//         question.evidenceFiles
//       );
//     }
//   }
// }

export async function getAssessmentByProjectId(req: Request, res: Response) {
  const projectId = parseInt(req.params.id);
  console.log("projectId : ", projectId);
  try {
    const assessments = await getAssessmentByProjectIdQuery(projectId);
    console.log("assessment: ", assessments);
    if (assessments && assessments.length !== 0) {
      return res.status(200).json(STATUS_CODE[200](assessments));
    } else {
      return res.status(204).json(STATUS_CODE[204]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
