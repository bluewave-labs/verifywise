import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  calculateProjectRisks,
  calculateVendirRisks,
  countAnswersByProjectId,
  countSubControlsByProjectId,
  createNewProjectQuery,
  deleteProjectByIdQuery,
  getAllProjectsQuery,
  getProjectByIdQuery,
  updateProjectByIdQuery,
} from "../utils/project.utils";
import { getUserByIdQuery } from "../utils/user.utils";
import { getControlCategoryByProjectIdQuery } from "../utils/controlCategory.utils";
import { ProjectModel } from "../domain.layer/models/project/project.model";
import { getAllControlsByControlGroupQuery } from "../utils/control.utils";
import { getAllSubcontrolsByControlIdQuery } from "../utils/subControl.utils";
import { createEUFrameworkQuery } from "../utils/eu.utils";
import { sequelize } from "../database/db";
import { createISOFrameworkQuery } from "../utils/iso42001.utils";
import { IProjectAttributes } from "../domain.layer/interfaces/i.project";
import { IControl } from "../domain.layer/interfaces/i.control";
import { IControlCategory } from "../domain.layer/interfaces/i.controlCategory";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";
import { createISO27001FrameworkQuery } from "../utils/iso27001.utils";

export async function getAllProjects(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllProjects",
    functionName: "getAllProjects",
    fileName: "project.ctrl.ts",
  });

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = (await getAllProjectsQuery({ userId, role }, req.tenantId!)) as IProjectAttributes[];

    await logSuccess({
      eventType: "Read",
      description: "Retrieved all projects",
      functionName: "getAllProjects",
      fileName: "project.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](projects));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve all projects",
      functionName: "getAllProjects",
      fileName: "project.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectById(req: Request, res: Response): Promise<any> {
  const projectId = parseInt(req.params.id);

  logProcessing({
    description: `starting getProjectById for ID ${projectId}`,
    functionName: "getProjectById",
    fileName: "project.ctrl.ts",
  });

  try {
    const project = await getProjectByIdQuery(projectId, req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Retrieved project ID ${projectId}`,
      functionName: "getProjectById",
      fileName: "project.ctrl.ts",
    });

    if (project) {
      return res.status(200).json(STATUS_CODE[200](project));
    }

    await logSuccess({
      eventType: "Read",
      description: `Project not found: ID ${projectId}`,
      functionName: "getProjectById",
      fileName: "project.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404](project));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve project by ID",
      functionName: "getProjectById",
      fileName: "project.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProject(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();

  logProcessing({
    description: "starting createProject",
    functionName: "createProject",
    fileName: "project.ctrl.ts",
  });

  try {
    const newProject: Partial<ProjectModel> & {
      members: number[] | undefined;
      framework: number[];
      enable_ai_data_insertion: boolean;
    } = {
      ...req.body,
      framework: req.body.framework ?? [1],
    };

    if (!newProject.project_title || !newProject.owner) {
      return res.status(400).json(
        STATUS_CODE[400]({ message: "project_title and owner are required" })
      );
    }

    const createdProject = await createNewProjectQuery(
      newProject,
      newProject.members ?? [],
      newProject.framework,
      req.tenantId!,
      transaction
    );
    const frameworks: { [key: string]: Object } = {};
    for (const framework of newProject.framework) {
      if (framework === 1) {
        const eu = await createEUFrameworkQuery(
          createdProject.id!,
          newProject.enable_ai_data_insertion,
          req.tenantId!,
          transaction
        );
        frameworks["eu"] = eu;
      } else if (framework === 2) {
        const iso42001 = await createISOFrameworkQuery(
          createdProject.id!,
          newProject.enable_ai_data_insertion,
          req.tenantId!,
          transaction
        );
        frameworks["iso42001"] = iso42001;
      } else if (framework === 3) {
        const iso27001 = await createISO27001FrameworkQuery(
          createdProject.id!,
          newProject.enable_ai_data_insertion,
          req.tenantId!,
          transaction
        );
        frameworks["iso27001"] = iso27001;
      }
    }

    if (createdProject) {
      await transaction.commit();

      await logSuccess({
        eventType: "Create",
        description: "Created new project",
        functionName: "createProject",
        fileName: "project.ctrl.ts",
      });

      return res.status(201).json(
        STATUS_CODE[201]({
          project: createdProject,
          frameworks,
        })
      );
    }

    await logSuccess({
      eventType: "Create",
      description: "Project creation returned null",
      functionName: "createProject",
      fileName: "project.ctrl.ts",
    });

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Create",
      description: "Failed to create project",
      functionName: "createProject",
      fileName: "project.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectById(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectId = parseInt(req.params.id);

  logProcessing({
    description: `starting updateProjectById for ID ${projectId}`,
    functionName: "updateProjectById",
    fileName: "project.ctrl.ts",
  });

  try {
    const updatedProject: Partial<ProjectModel> & { members?: number[] } =
      req.body;
    const members = updatedProject.members || [];

    delete updatedProject.members;
    delete updatedProject.id;

    if (!updatedProject.project_title || !updatedProject.owner) {
      return res.status(400).json(
        STATUS_CODE[400]({ message: "project_title and owner are required" })
      );
    }

    const project = await updateProjectByIdQuery(
      projectId,
      updatedProject,
      members,
      req.tenantId!,
      transaction
    );

    if (project) {
      await transaction.commit();

      await logSuccess({
        eventType: "Update",
        description: `Updated project ID ${projectId}`,
        functionName: "updateProjectById",
        fileName: "project.ctrl.ts",
      });

      return res.status(202).json(STATUS_CODE[202](project));
    }

    await logSuccess({
      eventType: "Update",
      description: `Project not found for update: ID ${projectId}`,
      functionName: "updateProjectById",
      fileName: "project.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Update",
      description: "Failed to update project",
      functionName: "updateProjectById",
      fileName: "project.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectById(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteProjectById for ID ${projectId}`,
    functionName: "deleteProjectById",
    fileName: "project.ctrl.ts",
  });

  try {
    const deletedProject = await deleteProjectByIdQuery(projectId, req.tenantId!, transaction);

    if (deletedProject) {
      await transaction.commit();

      await logSuccess({
        eventType: "Delete",
        description: `Deleted project ID ${projectId}`,
        functionName: "deleteProjectById",
        fileName: "project.ctrl.ts",
      });

      return res.status(202).json(STATUS_CODE[202](deletedProject));
    }

    await logSuccess({
      eventType: "Delete",
      description: `Project not found for deletion: ID ${projectId}`,
      functionName: "deleteProjectById",
      fileName: "project.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Delete",
      description: "Failed to delete project",
      functionName: "deleteProjectById",
      fileName: "project.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectStatsById(req: Request, res: Response): Promise<any> {
  const projectId = parseInt(req.params.id);
  logProcessing({
    description: `starting getProjectStatsById for project ID ${projectId}`,
    functionName: "getProjectStatsById",
    fileName: "projec.ctrl.ts",
  });

  try {
    const project: any = await getProjectByIdQuery(projectId, req.tenantId!);
    const project_owner = project.owner;
    const ownerUser: any = getUserByIdQuery(project_owner);
    const project_last_updated = project.last_updated;
    const project_last_updated_by = project.last_updated_by;
    const userWhoUpdated: any = getUserByIdQuery(project_last_updated_by);

    const overviewDetails = {
      user: {
        name: ownerUser.name,
        surname: ownerUser.surname,
        email: ownerUser.email,
        project_last_updated,
        userWhoUpdated,
      },
    };

    await logSuccess({
      eventType: "Read",
      description: `Retrieved project stats for project ID ${projectId}`,
      functionName: "getProjectStatsById",
      fileName: "projec.ctrl.ts",
    });

    return res.status(202).json(STATUS_CODE[202](overviewDetails));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve project stats",
      functionName: "getProjectStatsById",
      fileName: "projec.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectRisksCalculations(req: Request, res: Response): Promise<any> {
  const projectId = parseInt(req.params.id);
  logProcessing({
    description: `starting getProjectRisksCalculations for project ID ${projectId}`,
    functionName: "getProjectRisksCalculations",
    fileName: "projec.ctrl.ts",
  });

  try {
    const projectRisksCalculations = await calculateProjectRisks(projectId, req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Calculated risks for project ID ${projectId}`,
      functionName: "getProjectRisksCalculations",
      fileName: "projec.ctrl.ts",
    });

    return res.status(projectRisksCalculations ? 200 : 204).json(
      STATUS_CODE[projectRisksCalculations ? 200 : 204](projectRisksCalculations)
    );
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to calculate project risks",
      functionName: "getProjectRisksCalculations",
      fileName: "projec.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorRisksCalculations(req: Request, res: Response): Promise<any> {
  const projectId = parseInt(req.params.id);
  logProcessing({
    description: `starting getVendorRisksCalculations for project ID ${projectId}`,
    functionName: "getVendorRisksCalculations",
    fileName: "projec.ctrl.ts",
  });

  try {
    const vendorRisksCalculations = await calculateVendirRisks(projectId, req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Calculated vendor risks for project ID ${projectId}`,
      functionName: "getVendorRisksCalculations",
      fileName: "projec.ctrl.ts",
    });

    return res.status(vendorRisksCalculations ? 200 : 204).json(
      STATUS_CODE[vendorRisksCalculations ? 200 : 204](vendorRisksCalculations)
    );
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to calculate vendor risks",
      functionName: "getVendorRisksCalculations",
      fileName: "projec.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getCompliances(req: Request, res: Response) {
  const projectId = parseInt(req.params.projid);
  logProcessing({
    description: `starting getCompliances for project ID ${projectId}`,
    functionName: "getCompliances",
    fileName: "projec.ctrl.ts",
  });

  try {
    const project = await getProjectByIdQuery(projectId, req.tenantId!);
    if (project) {
      const controlCategories = (await getControlCategoryByProjectIdQuery(
        project.id!, req.tenantId!
      )) as IControlCategory[];
      for (const category of controlCategories) {
        if (category) {
          const controls = (await getAllControlsByControlGroupQuery(
            category.id, req.tenantId!
          )) as IControl[];
          for (const control of controls) {
            if (control && control.id) {
              const subControls = await getAllSubcontrolsByControlIdQuery(control.id, req.tenantId!);
              control.numberOfSubcontrols = subControls.length;
              control.numberOfDoneSubcontrols = subControls.filter(sub => sub.status === "Done").length;
              control.subControls = subControls;
            }
          }
          category.controls = controls;
        }
      }

      await logSuccess({
        eventType: "Read",
        description: `Retrieved compliance data for project ID ${projectId}`,
        functionName: "getCompliances",
        fileName: "projec.ctrl.ts",
      });

      return res.status(200).json(STATUS_CODE[200](controlCategories));
    }

    await logSuccess({
      eventType: "Read",
      description: `Project not found for compliance lookup: ID ${projectId}`,
      functionName: "getCompliances",
      fileName: "projec.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404](project));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to fetch compliance data",
      functionName: "getCompliances",
      fileName: "projec.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function projectComplianceProgress(req: Request, res: Response) {
  const projectId = parseInt(req.params.id);
  logProcessing({
    description: `starting projectComplianceProgress for ID ${projectId}`,
    functionName: "projectComplianceProgress",
    fileName: "projec.ctrl.ts",
  });

  try {
    const project = await getProjectByIdQuery(projectId, req.tenantId!);
    if (project) {
      const { totalSubcontrols, doneSubcontrols } =
        await countSubControlsByProjectId(project.id!, req.tenantId!);

      await logSuccess({
        eventType: "Read",
        description: `Compliance progress calculated for project ID ${projectId}`,
        functionName: "projectComplianceProgress",
        fileName: "projec.ctrl.ts",
      });

      return res.status(200).json(
        STATUS_CODE[200]({
          allsubControls: totalSubcontrols,
          allDonesubControls: doneSubcontrols,
        })
      );
    }

    await logSuccess({
      eventType: "Read",
      description: `Project not found: ID ${projectId}`,
      functionName: "projectComplianceProgress",
      fileName: "projec.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404](project));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get compliance progress",
      functionName: "projectComplianceProgress",
      fileName: "projec.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function projectAssessmentProgress(req: Request, res: Response) {
  const projectId = parseInt(req.params.id);
  logProcessing({
    description: `starting projectAssessmentProgress for ID ${projectId}`,
    functionName: "projectAssessmentProgress",
    fileName: "projec.ctrl.ts",
  });

  try {
    const project = await getProjectByIdQuery(projectId, req.tenantId!);
    if (project) {
      const { totalAssessments, answeredAssessments } =
        await countAnswersByProjectId(project.id!, req.tenantId!);

      await logSuccess({
        eventType: "Read",
        description: `Assessment progress calculated for project ID ${projectId}`,
        functionName: "projectAssessmentProgress",
        fileName: "projec.ctrl.ts",
      });

      return res.status(200).json(
        STATUS_CODE[200]({
          totalQuestions: totalAssessments,
          answeredQuestions: answeredAssessments,
        })
      );
    }

    await logSuccess({
      eventType: "Read",
      description: `Project not found: ID ${projectId}`,
      functionName: "projectAssessmentProgress",
      fileName: "projec.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404](project));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get assessment progress",
      functionName: "projectAssessmentProgress",
      fileName: "projec.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function allProjectsComplianceProgress(req: Request, res: Response) {
  let totalNumberOfSubcontrols = 0;
  let totalNumberOfDoneSubcontrols = 0;
  logProcessing({
    description: "starting allProjectsComplianceProgress",
    functionName: "allProjectsComplianceProgress",
    fileName: "projec.ctrl.ts",
  });

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = await getAllProjectsQuery({ userId, role }, req.tenantId!);
    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          const { totalSubcontrols, doneSubcontrols } =
            await countSubControlsByProjectId(project.id!, req.tenantId!);
          totalNumberOfSubcontrols += parseInt(totalSubcontrols);
          totalNumberOfDoneSubcontrols += parseInt(doneSubcontrols);
        })
      );

      await logSuccess({
        eventType: "Read",
        description: "Compliance progress calculated across all projects",
        functionName: "allProjectsComplianceProgress",
        fileName: "projec.ctrl.ts",
      });

      return res.status(200).json(
        STATUS_CODE[200]({
          allsubControls: totalNumberOfSubcontrols,
          allDonesubControls: totalNumberOfDoneSubcontrols,
        })
      );
    }

    await logSuccess({
      eventType: "Read",
      description: "No projects found for compliance progress",
      functionName: "allProjectsComplianceProgress",
      fileName: "projec.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404](projects));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get compliance progress for all projects",
      functionName: "allProjectsComplianceProgress",
      fileName: "projec.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function allProjectsAssessmentProgress(req: Request, res: Response) {
  let totalNumberOfQuestions = 0;
  let totalNumberOfAnsweredQuestions = 0;
  logProcessing({
    description: "starting allProjectsAssessmentProgress",
    functionName: "allProjectsAssessmentProgress",
    fileName: "projec.ctrl.ts",
  });

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = await getAllProjectsQuery({ userId, role }, req.tenantId!);
    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          const { totalAssessments, answeredAssessments } =
            await countAnswersByProjectId(project.id!, req.tenantId!);
          totalNumberOfQuestions += parseInt(totalAssessments);
          totalNumberOfAnsweredQuestions += parseInt(answeredAssessments);
        })
      );

      await logSuccess({
        eventType: "Read",
        description: "Assessment progress calculated across all projects",
        functionName: "allProjectsAssessmentProgress",
        fileName: "projec.ctrl.ts",
      });

      return res.status(200).json(
        STATUS_CODE[200]({
          totalQuestions: totalNumberOfQuestions,
          answeredQuestions: totalNumberOfAnsweredQuestions,
        })
      );
    }

    await logSuccess({
      eventType: "Read",
      description: "No projects found for assessment progress",
      functionName: "allProjectsAssessmentProgress",
      fileName: "projec.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404](projects));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to get assessment progress for all projects",
      functionName: "allProjectsAssessmentProgress",
      fileName: "projec.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
