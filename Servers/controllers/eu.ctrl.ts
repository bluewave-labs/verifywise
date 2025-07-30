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
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAssessmentsByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);
  logProcessing({
    description: `starting getAssessmentsByProjectId for project framework ID ${projectFrameworkId}`,
    functionName: "getAssessmentsByProjectId",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `🔍 Fetching assessments for project framework ID ${projectFrameworkId}`
  );

  try {
    const assessments = await getAssessmentsEUByProjectIdQuery(
      projectFrameworkId,
      req.tenantId!
    );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved assessments for project framework ID ${projectFrameworkId}`,
      functionName: "getAssessmentsByProjectId",
      fileName: "eu.ctrl.ts",
    });

    // send calculated progress
    return res.status(200).json(STATUS_CODE[200](assessments));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve assessments for project framework ID ${projectFrameworkId}`,
      functionName: "getAssessmentsByProjectId",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getCompliancesByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const projectFrameworkId = parseInt(req.params.id);
  logProcessing({
    description: `starting getCompliancesByProjectId for project framework ID ${projectFrameworkId}`,
    functionName: "getCompliancesByProjectId",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `🔍 Fetching compliances for project framework ID ${projectFrameworkId}`
  );

  try {
    const complainces = await getComplianceEUByProjectIdQuery(
      projectFrameworkId,
      req.tenantId!
    );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved compliances for project framework ID ${projectFrameworkId}`,
      functionName: "getCompliancesByProjectId",
      fileName: "eu.ctrl.ts",
    });

    // send calculated progress
    return res.status(200).json(STATUS_CODE[200](complainces));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve compliances for project framework ID ${projectFrameworkId}`,
      functionName: "getCompliancesByProjectId",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicById(req: Request, res: Response): Promise<any> {
  const topicId = parseInt(req.query.topicId as string);
  const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);

  logProcessing({
    description: `starting getTopicById for topic ID ${topicId} and project framework ID ${projectFrameworkId}`,
    functionName: "getTopicById",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `🔍 Looking up topic ID ${topicId} for project framework ID ${projectFrameworkId}`
  );

  try {
    if (isNaN(topicId) || isNaN(projectFrameworkId)) {
      await logFailure({
        eventType: "Read",
        description: "Invalid query parameters for getTopicById",
        functionName: "getTopicById",
        fileName: "eu.ctrl.ts",
        error: new Error("Invalid query parameters"),
      });
      return res.status(400).json(STATUS_CODE[400]("Invalid query parameters"));
    }

    const topic = await getTopicByIdForProjectQuery(
      topicId,
      projectFrameworkId,
      req.tenantId!
    );

    if (topic) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved topic ID ${topicId} for project framework ID ${projectFrameworkId}`,
        functionName: "getTopicById",
        fileName: "eu.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    await logSuccess({
      eventType: "Read",
      description: `Topic not found: ID ${topicId} for project framework ID ${projectFrameworkId}`,
      functionName: "getTopicById",
      fileName: "eu.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404](topic));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve topic ID ${topicId} for project framework ID ${projectFrameworkId}`,
      functionName: "getTopicById",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlById(
  req: Request,
  res: Response
): Promise<any> {
  const controlId = parseInt(req.query.controlId as string);
  const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);

  logProcessing({
    description: `starting getControlById for control ID ${controlId} and project framework ID ${projectFrameworkId}`,
    functionName: "getControlById",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `🔍 Looking up control ID ${controlId} for project framework ID ${projectFrameworkId}`
  );

  try {
    if (isNaN(controlId) || isNaN(projectFrameworkId)) {
      await logFailure({
        eventType: "Read",
        description: "Invalid query parameters for getControlById",
        functionName: "getControlById",
        fileName: "eu.ctrl.ts",
        error: new Error("Invalid query parameters"),
      });
      return res.status(400).json(STATUS_CODE[400]("Invalid query parameters"));
    }

    const topic = await getControlByIdForProjectQuery(
      controlId,
      projectFrameworkId,
      req.tenantId!
    );

    if (topic) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved control ID ${controlId} for project framework ID ${projectFrameworkId}`,
        functionName: "getControlById",
        fileName: "eu.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    await logSuccess({
      eventType: "Read",
      description: `Control not found: ID ${controlId} for project framework ID ${projectFrameworkId}`,
      functionName: "getControlById",
      fileName: "eu.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404](topic));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve control ID ${controlId} for project framework ID ${projectFrameworkId}`,
      functionName: "getControlById",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function saveControls(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const controlId = parseInt(req.params.id);

  logProcessing({
    description: `starting saveControls for control ID ${controlId}`,
    functionName: "saveControls",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(`💾 Saving controls for control ID ${controlId}`);

  try {
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
      req.tenantId!,
      transaction
    );

    const filesToDelete = JSON.parse(Control.delete || "[]") as number[];
    for (let f of filesToDelete) {
      await deleteFileById(f, req.tenantId!, transaction);
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
            req.tenantId!,
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
            req.tenantId!,
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
          req.tenantId!,
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
    await updateProjectUpdatedByIdQuery(
      controlId,
      "controls",
      req.tenantId!,
      transaction
    );
    await transaction.commit();

    await logSuccess({
      eventType: "Update",
      description: `Successfully saved controls for control ID ${controlId}`,
      functionName: "saveControls",
      fileName: "eu.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200]({ response }));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Update",
      description: `Failed to save controls for control ID ${controlId}`,
      functionName: "saveControls",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateQuestionById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const questionId = parseInt(req.params.id);

  logProcessing({
    description: `starting updateQuestionById for question ID ${questionId}`,
    functionName: "updateQuestionById",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(`✏️ Updating question ID ${questionId}`);

  try {
    const body: Partial<AnswerEU> = req.body;

    const question = (await updateQuestionEUByIdQuery(
      questionId,
      body,
      req.tenantId!,
      transaction
    )) as AnswerEU;

    if (!question) {
      await transaction.rollback();
      await logFailure({
        eventType: "Update",
        description: `Question not found: ID ${questionId}`,
        functionName: "updateQuestionById",
        fileName: "eu.ctrl.ts",
        error: new Error("Question not found"),
      });
      return res.status(404).json(STATUS_CODE[404]({}));
    }

    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(
      questionId,
      "answers",
      req.tenantId!,
      transaction
    );
    await transaction.commit();

    await logSuccess({
      eventType: "Update",
      description: `Successfully updated question ID ${questionId}`,
      functionName: "updateQuestionById",
      fileName: "eu.ctrl.ts",
    });

    return res.status(202).json(STATUS_CODE[202](question));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Update",
      description: `Failed to update question ID ${questionId}`,
      functionName: "updateQuestionById",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAssessmentsByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteAssessmentsByProjectId for project framework ID ${projectFrameworkId}`,
    functionName: "deleteAssessmentsByProjectId",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `🗑️ Deleting assessments for project framework ID ${projectFrameworkId}`
  );

  try {
    const result = await deleteAssessmentEUByProjectIdQuery(
      projectFrameworkId,
      req.tenantId!,
      transaction
    );

    if (result) {
      await transaction.commit();
      await logSuccess({
        eventType: "Delete",
        description: `Successfully deleted assessments for project framework ID ${projectFrameworkId}`,
        functionName: "deleteAssessmentsByProjectId",
        fileName: "eu.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete assessments for project framework ID ${projectFrameworkId}`,
      functionName: "deleteAssessmentsByProjectId",
      fileName: "eu.ctrl.ts",
      error: new Error("Delete operation failed"),
    });
    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete assessments for project framework ID ${projectFrameworkId}`,
      functionName: "deleteAssessmentsByProjectId",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteCompliancesByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteCompliancesByProjectId for project framework ID ${projectFrameworkId}`,
    functionName: "deleteCompliancesByProjectId",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `🗑️ Deleting compliances for project framework ID ${projectFrameworkId}`
  );

  try {
    const result = await deleteComplianeEUByProjectIdQuery(
      projectFrameworkId,
      req.tenantId!,
      transaction
    );

    if (result) {
      await transaction.commit();
      await logSuccess({
        eventType: "Delete",
        description: `Successfully deleted compliances for project framework ID ${projectFrameworkId}`,
        functionName: "deleteCompliancesByProjectId",
        fileName: "eu.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete compliances for project framework ID ${projectFrameworkId}`,
      functionName: "deleteCompliancesByProjectId",
      fileName: "eu.ctrl.ts",
      error: new Error("Delete operation failed"),
    });
    return res.status(400).json(STATUS_CODE[400](result));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete compliances for project framework ID ${projectFrameworkId}`,
      functionName: "deleteCompliancesByProjectId",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectAssessmentProgress(
  req: Request,
  res: Response
) {
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting getProjectAssessmentProgress for project framework ID ${projectFrameworkId}`,
    functionName: "getProjectAssessmentProgress",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `📊 Calculating assessment progress for project framework ID ${projectFrameworkId}`
  );

  try {
    // const project = await getProjectByIdQuery(projectId);
    // if (project) {

    // } else {
    //   return res.status(404).json(STATUS_CODE[404](project));
    // }
    const { totalAssessments, answeredAssessments } =
      await countAnswersEUByProjectId(projectFrameworkId, req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Retrieved assessment progress for project framework ID ${projectFrameworkId}`,
      functionName: "getProjectAssessmentProgress",
      fileName: "eu.ctrl.ts",
    });

    return res.status(200).json(
      STATUS_CODE[200]({
        totalQuestions: parseInt(totalAssessments),
        answeredQuestions: parseInt(answeredAssessments),
      })
    );
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to get assessment progress for project framework ID ${projectFrameworkId}`,
      functionName: "getProjectAssessmentProgress",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectComplianceProgress(
  req: Request,
  res: Response
) {
  const projectFrameworkId = parseInt(req.params.id);

  logProcessing({
    description: `starting getProjectComplianceProgress for project framework ID ${projectFrameworkId}`,
    functionName: "getProjectComplianceProgress",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `📊 Calculating compliance progress for project framework ID ${projectFrameworkId}`
  );

  try {
    // const project = await getProjectByIdQuery(projectId);
    // if (project) {

    // } else {
    //   return res.status(404).json(STATUS_CODE[404](project));
    // }
    const { totalSubcontrols, doneSubcontrols } =
      await countSubControlsEUByProjectId(projectFrameworkId, req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Retrieved compliance progress for project framework ID ${projectFrameworkId}`,
      functionName: "getProjectComplianceProgress",
      fileName: "eu.ctrl.ts",
    });

    return res.status(200).json(
      STATUS_CODE[200]({
        allsubControls: parseInt(totalSubcontrols),
        allDonesubControls: parseInt(doneSubcontrols),
      })
    );
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to get compliance progress for project framework ID ${projectFrameworkId}`,
      functionName: "getProjectComplianceProgress",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllProjectsAssessmentProgress(
  req: Request,
  res: Response
) {
  let totalNumberOfQuestions = 0;
  let totalNumberOfAnsweredQuestions = 0;

  logProcessing({
    description: "starting getAllProjectsAssessmentProgress",
    functionName: "getAllProjectsAssessmentProgress",
    fileName: "eu.ctrl.ts",
  });
  logger.debug("📊 Calculating assessment progress across all projects");

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      await logFailure({
        eventType: "Read",
        description:
          "Unauthorized access attempt for getAllProjectsAssessmentProgress",
        functionName: "getAllProjectsAssessmentProgress",
        fileName: "eu.ctrl.ts",
        error: new Error("Unauthorized"),
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = await getAllProjectsQuery({ userId, role }, req.tenantId!);
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
            await countAnswersEUByProjectId(projectFrameworkId, req.tenantId!);
          totalNumberOfQuestions += parseInt(totalAssessments);
          totalNumberOfAnsweredQuestions += parseInt(answeredAssessments);
        })
      );

      await logSuccess({
        eventType: "Read",
        description: `Retrieved assessment progress across ${projects.length} projects`,
        functionName: "getAllProjectsAssessmentProgress",
        fileName: "eu.ctrl.ts",
      });

      return res.status(200).json(
        STATUS_CODE[200]({
          totalQuestions: totalNumberOfQuestions,
          answeredQuestions: totalNumberOfAnsweredQuestions,
        })
      );
    } else {
      await logSuccess({
        eventType: "Read",
        description: "No projects found for assessment progress calculation",
        functionName: "getAllProjectsAssessmentProgress",
        fileName: "eu.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](projects));
    }
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get assessment progress across all projects",
      functionName: "getAllProjectsAssessmentProgress",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllProjectsComplianceProgress(
  req: Request,
  res: Response
) {
  let totalNumberOfSubcontrols = 0;
  let totalNumberOfDoneSubcontrols = 0;

  logProcessing({
    description: "starting getAllProjectsComplianceProgress",
    functionName: "getAllProjectsComplianceProgress",
    fileName: "eu.ctrl.ts",
  });
  logger.debug("📊 Calculating compliance progress across all projects");

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      await logFailure({
        eventType: "Read",
        description:
          "Unauthorized access attempt for getAllProjectsComplianceProgress",
        functionName: "getAllProjectsComplianceProgress",
        fileName: "eu.ctrl.ts",
        error: new Error("Unauthorized"),
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = await getAllProjectsQuery({ userId, role }, req.tenantId!);
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
            await countSubControlsEUByProjectId(
              projectFrameworkId,
              req.tenantId!
            );
          totalNumberOfSubcontrols += parseInt(totalSubcontrols);
          totalNumberOfDoneSubcontrols += parseInt(doneSubcontrols);
        })
      );

      await logSuccess({
        eventType: "Read",
        description: `Retrieved compliance progress across ${projects.length} projects`,
        functionName: "getAllProjectsComplianceProgress",
        fileName: "eu.ctrl.ts",
      });

      return res.status(200).json(
        STATUS_CODE[200]({
          allsubControls: totalNumberOfSubcontrols,
          allDonesubControls: totalNumberOfDoneSubcontrols,
        })
      );
    } else {
      await logSuccess({
        eventType: "Read",
        description: "No projects found for compliance progress calculation",
        functionName: "getAllProjectsComplianceProgress",
        fileName: "eu.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](projects));
    }
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get compliance progress across all projects",
      functionName: "getAllProjectsComplianceProgress",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllControlCategories(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getAllControlCategories",
    functionName: "getAllControlCategories",
    fileName: "eu.ctrl.ts",
  });
  logger.debug("🔍 Fetching all control categories");

  try {
    const controlCategories = await getAllControlCategoriesQuery(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved all control categories",
      functionName: "getAllControlCategories",
      fileName: "eu.ctrl.ts",
    });

    return res.status(200).json(controlCategories);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve control categories",
      functionName: "getAllControlCategories",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlsByControlCategoryId(
  req: Request,
  res: Response
): Promise<any> {
  const controlCategoryId = parseInt(req.params.id);
  const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);

  logProcessing({
    description: `starting getControlsByControlCategoryId for control category ID ${controlCategoryId} and project framework ID ${projectFrameworkId}`,
    functionName: "getControlsByControlCategoryId",
    fileName: "eu.ctrl.ts",
  });
  logger.debug(
    `🔍 Fetching controls for control category ID ${controlCategoryId} and project framework ID ${projectFrameworkId}`
  );

  try {
    const controls = await getControlStructByControlCategoryIdForAProjectQuery(
      controlCategoryId,
      projectFrameworkId,
      req.tenantId!
    );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved controls for control category ID ${controlCategoryId} and project framework ID ${projectFrameworkId}`,
      functionName: "getControlsByControlCategoryId",
      fileName: "eu.ctrl.ts",
    });

    return res.status(200).json(controls);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve controls for control category ID ${controlCategoryId} and project framework ID ${projectFrameworkId}`,
      functionName: "getControlsByControlCategoryId",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllTopics(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllTopics",
    functionName: "getAllTopics",
    fileName: "eu.ctrl.ts",
  });
  logger.debug("🔍 Fetching all topics");

  try {
    const topics = await getAllTopicsQuery(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved all topics",
      functionName: "getAllTopics",
      fileName: "eu.ctrl.ts",
    });

    return res.status(200).json(topics);
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve topics",
      functionName: "getAllTopics",
      fileName: "eu.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
