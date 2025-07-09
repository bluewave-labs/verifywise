import { Request, Response } from "express";
import { ControlEU } from "../domain.layer/frameworks/EU-AI-Act/controlEU.model";
import { FileType } from "../domain.layer/models/file/file.model";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import {
  getAllProjectsQuery,
  updateProjectUpdatedByIdQuery,
} from "../utils/project.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { QuestionStructEU } from "../domain.layer/frameworks/EU-AI-Act/questionStructEU.model";
import {
  countAnswersEUByProjectId,
  countSubControlsEUByProjectId,
  deleteAssessmentEUByProjectIdQuery,
  deleteComplianeEUByProjectIdQuery,
  getAllControlCategoriesQuery,
  getAllTopicsQuery,
  getAssessmentsEUByProjectIdQuery,
  getComplianceEUByProjectIdQuery,
  getControlByIdForProjectQuery,
  getControlStructByControlCategoryIdForAProjectQuery,
  getTopicByIdForProjectQuery,
  updateControlEUByIdQuery,
  updateQuestionEUByIdQuery,
  updateSubcontrolEUByIdQuery,
} from "../utils/eu.utils";
import { AnswerEU } from "../domain.layer/frameworks/EU-AI-Act/answerEU.model";
import { sequelize } from "../database/db";
import { IProjectAttributes } from "../domain.layer/interfaces/i.project";

export async function getAssessmentsByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectFrameworkId = parseInt(req.params.id);
    const assessments = await getAssessmentsEUByProjectIdQuery(
      projectFrameworkId
    );
    // send calculated progress
    return res.status(200).json(STATUS_CODE[200](assessments));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getCompliancesByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectFrameworkId = parseInt(req.params.id);
    const complainces = await getComplianceEUByProjectIdQuery(
      projectFrameworkId
    );
    // send calculated progress
    return res.status(200).json(STATUS_CODE[200](complainces));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicById(req: Request, res: Response): Promise<any> {
  try {
    const topicId = parseInt(req.query.topicId as string);
    const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);
    if (isNaN(topicId) || isNaN(projectFrameworkId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid query parameters"));
    }
    const topic = await getTopicByIdForProjectQuery(
      topicId,
      projectFrameworkId
    );
    if (topic) {
      return res.status(200).json(STATUS_CODE[200](topic));
    }
    return res.status(404).json(STATUS_CODE[404](topic));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlId = parseInt(req.query.controlId as string);
    const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);
    if (isNaN(controlId) || isNaN(projectFrameworkId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid query parameters"));
    }
    const topic = await getControlByIdForProjectQuery(
      controlId,
      projectFrameworkId
    );
    if (topic) {
      return res.status(200).json(STATUS_CODE[200](topic));
    }
    return res.status(404).json(STATUS_CODE[404](topic));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function saveControls(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const controlId = parseInt(req.params.id);
    const Control = req.body as ControlEU & {
      subControls: string;
      user_id: number;
      project_id: number;
      delete: string;
    };

    // now we need to create the control for the control category, and use the control category id as the foreign key
    const control: any = await updateControlEUByIdQuery(
      controlId,
      {
        status: Control.status,
        approver: Control.approver,
        risk_review: Control.risk_review,
        owner: Control.owner,
        reviewer: Control.reviewer,
        due_date: Control.due_date,
        implementation_details: Control.implementation_details,
      },
      transaction
    );

    const filesToDelete = JSON.parse(Control.delete || "[]") as number[];
    for (let f of filesToDelete) {
      await deleteFileById(f, transaction);
    }

    // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
    const subControlResp = [];
    if (Control.subControls) {
      for (const subcontrol of JSON.parse(Control.subControls)) {
        const evidenceFiles = ((req.files as UploadedFile[]) || []).filter(
          (f) => f.fieldname === `evidence_files_${parseInt(subcontrol.id)}`
        );
        const feedbackFiles = ((req.files as UploadedFile[]) || []).filter(
          (f) => f.fieldname === `feedback_files_${parseInt(subcontrol.id)}`
        );

        let evidenceUploadedFiles: FileType[] = [];
        for (let f of evidenceFiles) {
          const evidenceUploadedFile = await uploadFile(
            f,
            Control.user_id,
            Control.project_id,
            "Compliance tracker group",
            transaction
          );
          evidenceUploadedFiles.push({
            id: evidenceUploadedFile.id!.toString(),
            fileName: evidenceUploadedFile.filename,
            project_id: evidenceUploadedFile.project_id,
            uploaded_by: evidenceUploadedFile.uploaded_by,
            uploaded_time: evidenceUploadedFile.uploaded_time,
            type: evidenceUploadedFile.type,
            source: evidenceUploadedFile.source,
          });
        }

        let feedbackUploadedFiles: FileType[] = [];
        for (let f of feedbackFiles) {
          const feedbackUploadedFile = await uploadFile(
            f,
            Control.user_id,
            Control.project_id,
            "Compliance tracker group",
            transaction
          );
          feedbackUploadedFiles.push({
            id: feedbackUploadedFile.id!.toString(),
            fileName: feedbackUploadedFile.filename,
            project_id: feedbackUploadedFile.project_id,
            uploaded_by: feedbackUploadedFile.uploaded_by,
            uploaded_time: feedbackUploadedFile.uploaded_time,
            type: feedbackUploadedFile.type,
            source: feedbackUploadedFile.source,
          });
        }

        const subcontrolToSave: any = await updateSubcontrolEUByIdQuery(
          subcontrol.id!,
          {
            status: subcontrol.status as
              | "Waiting"
              | "In progress"
              | "Done"
              | undefined,
            approver: subcontrol.approver,
            risk_review: subcontrol.risk_review as
              | "Acceptable risk"
              | "Residual risk"
              | "Unacceptable risk"
              | undefined,
            owner: subcontrol.owner,
            reviewer: subcontrol.reviewer,
            due_date: subcontrol.due_date,
            implementation_details: subcontrol.implementation_details,
            evidence_description: subcontrol.evidence_description,
            feedback_description: subcontrol.feedback_description,
          },
          evidenceUploadedFiles,
          feedbackUploadedFiles,
          filesToDelete,
          transaction
        );
        if (subcontrolToSave) {
          subControlResp.push(subcontrolToSave);
        }
      }
    }
    const response = {
      ...{ control, subControls: subControlResp },
    };
    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(controlId, "controls", transaction);
    await transaction.commit();

    return res.status(200).json(STATUS_CODE[200]({ response }));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateQuestionById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const questionId = parseInt(req.params.id);
    const body: Partial<AnswerEU> = req.body;

    const question = (await updateQuestionEUByIdQuery(
      questionId,
      body,
      transaction
    )) as AnswerEU;

    if (!question) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]({}));
    }

    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(questionId, "answers", transaction);
    await transaction.commit();

    return res.status(202).json(STATUS_CODE[202](question));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAssessmentsByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectFrameworkId = parseInt(req.params.id);
    const result = await deleteAssessmentEUByProjectIdQuery(
      projectFrameworkId,
      transaction
    );

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteCompliancesByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectFrameworkId = parseInt(req.params.id);
    const result = await deleteComplianeEUByProjectIdQuery(
      projectFrameworkId,
      transaction
    );

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectAssessmentProgress(
  req: Request,
  res: Response
) {
  const projectFrameworkId = parseInt(req.params.id);
  try {
    // const project = await getProjectByIdQuery(projectId);
    // if (project) {

    // } else {
    //   return res.status(404).json(STATUS_CODE[404](project));
    // }
    const { totalAssessments, answeredAssessments } =
      await countAnswersEUByProjectId(projectFrameworkId);
    return res.status(200).json(
      STATUS_CODE[200]({
        totalQuestions: parseInt(totalAssessments),
        answeredQuestions: parseInt(answeredAssessments),
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectComplianceProgress(
  req: Request,
  res: Response
) {
  const projectFrameworkId = parseInt(req.params.id);
  try {
    // const project = await getProjectByIdQuery(projectId);
    // if (project) {

    // } else {
    //   return res.status(404).json(STATUS_CODE[404](project));
    // }
    const { totalSubcontrols, doneSubcontrols } =
      await countSubControlsEUByProjectId(projectFrameworkId);
    return res.status(200).json(
      STATUS_CODE[200]({
        allsubControls: parseInt(totalSubcontrols),
        allDonesubControls: parseInt(doneSubcontrols),
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllProjectsAssessmentProgress(
  req: Request,
  res: Response
) {
  let totalNumberOfQuestions = 0;
  let totalNumberOfAnsweredQuestions = 0;
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const projects = await getAllProjectsQuery({ userId, role });
    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          // calculating assessments
          const projectFrameworkId = (
            project as unknown as { dataValues: IProjectAttributes }
          ).dataValues.framework
            ?.filter((f) => f.framework_id === 1)
            .map((f) => f.project_framework_id)[0];
          if (!projectFrameworkId) {
            return;
          }
          const { totalAssessments, answeredAssessments } =
            await countAnswersEUByProjectId(projectFrameworkId);
          totalNumberOfQuestions += parseInt(totalAssessments);
          totalNumberOfAnsweredQuestions += parseInt(answeredAssessments);
        })
      );
      return res.status(200).json(
        STATUS_CODE[200]({
          totalQuestions: totalNumberOfQuestions,
          answeredQuestions: totalNumberOfAnsweredQuestions,
        })
      );
    } else {
      return res.status(200).json(STATUS_CODE[200](projects));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllProjectsComplianceProgress(
  req: Request,
  res: Response
) {
  let totalNumberOfSubcontrols = 0;
  let totalNumberOfDoneSubcontrols = 0;
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const projects = await getAllProjectsQuery({ userId, role });
    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          // [0] assuming that the project has only one EU framework (if it has))
          const projectFrameworkId = (
            project as unknown as { dataValues: IProjectAttributes }
          ).dataValues.framework
            ?.filter((f) => f.framework_id === 1)
            .map((f) => f.project_framework_id)[0];
          if (!projectFrameworkId) {
            return;
          }
          const { totalSubcontrols, doneSubcontrols } =
            await countSubControlsEUByProjectId(projectFrameworkId);
          totalNumberOfSubcontrols += parseInt(totalSubcontrols);
          totalNumberOfDoneSubcontrols += parseInt(doneSubcontrols);
        })
      );
      return res.status(200).json(
        STATUS_CODE[200]({
          allsubControls: totalNumberOfSubcontrols,
          allDonesubControls: totalNumberOfDoneSubcontrols,
        })
      );
    } else {
      return res.status(200).json(STATUS_CODE[200](projects));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllControlCategories(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlCategories = await getAllControlCategoriesQuery();
    return res.status(200).json(controlCategories);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlsByControlCategoryId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlCategoryId = parseInt(req.params.id);
    const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);
    const controls = await getControlStructByControlCategoryIdForAProjectQuery(
      controlCategoryId,
      projectFrameworkId
    );
    return res.status(200).json(controls);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllTopics(req: Request, res: Response): Promise<any> {
  try {
    const topics = await getAllTopicsQuery();
    return res.status(200).json(topics);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
