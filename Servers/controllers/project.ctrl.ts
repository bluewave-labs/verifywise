import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  calculateProjectRisks,
  calculateVendirRisks,
  createNewProjectQuery,
  deleteProjectByIdQuery,
  getAllProjectsQuery,
  getProjectByIdQuery,
  updateProjectByIdQuery,
} from "../utils/project.utils";
import {
  createNewAssessmentQuery,
  getAssessmentByProjectIdQuery,
} from "../utils/assessment.utils";
import { getUserByIdQuery } from "../utils/user.utils";
import {
  createNewControlCategories,
  getControlCategoryByProjectIdQuery,
} from "../utils/controlCategory.util";
import { Project } from "../models/project.model";
import { getAllControlsByControlGroupQuery } from "../utils/control.utils";
import { getAllSubcontrolsByControlIdQuery } from "../utils/subControl.utils";
import { getTopicByAssessmentIdQuery } from "../utils/topic.utils";
import { getSubTopicByTopicIdQuery } from "../utils/subtopic.utils";
import { getQuestionBySubTopicIdQuery } from "../utils/question.utils";

export async function getAllProjects(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projects = await getAllProjectsQuery();

    if (projects) {
      return res.status(200).json(STATUS_CODE[200](projects));
    }

    return res.status(204).json(STATUS_CODE[204](projects));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);

    const project = await getProjectByIdQuery(projectId);

    if (project) {
      return res.status(200).json(STATUS_CODE[200](project));
    }

    return res.status(404).json(STATUS_CODE[404](project));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProject(req: Request, res: Response): Promise<any> {
  try {
    const newProject: Partial<Project> = req.body;

    if (!newProject.project_title || !newProject.owner) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "project_title and owner are required" })
        );
    }

    const createdProject = await createNewProjectQuery(newProject);
    const assessments = await createNewAssessmentQuery({
      project_id: createdProject.id,
    });
    const controls = await createNewControlCategories(createdProject.id);

    if (createdProject) {
      return res.status(201).json(
        STATUS_CODE[201]({
          project: createdProject,
          assessment_tracker: assessments,
          compliance_tracker: controls,
        })
      );
    }

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);
    const updatedProject: Partial<Project> = req.body;

    if (!updatedProject.project_title || !updatedProject.owner) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "project_title and owner are required" })
        );
    }

    const project = await updateProjectByIdQuery(projectId, updatedProject);

    if (project) {
      return res.status(202).json(STATUS_CODE[202](project));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);

    const deletedProject = await deleteProjectByIdQuery(projectId);

    if (deletedProject) {
      return res.status(202).json(STATUS_CODE[202](deletedProject));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectStatsById(
  req: Request,
  res: Response
): Promise<any> {
  const projectId = parseInt(req.params.id);

  // first getting the project by id
  const project: any = await getProjectByIdQuery(projectId);

  const project_owner = project.owner; // (A user's id) Now, we get the user by this
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
  return res.status(202).json(STATUS_CODE[202](overviewDetails));
}

export async function getProjectRisksCalculations(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);

    const projectRisksCalculations = await calculateProjectRisks(projectId);

    if (projectRisksCalculations) {
      return res.status(200).json(STATUS_CODE[200](projectRisksCalculations));
    }

    return res.status(204).json(STATUS_CODE[204](projectRisksCalculations));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorRisksCalculations(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);

    const vendorRisksCalculations = await calculateVendirRisks(projectId);

    if (vendorRisksCalculations) {
      return res.status(200).json(STATUS_CODE[200](vendorRisksCalculations));
    }

    return res.status(204).json(STATUS_CODE[204](vendorRisksCalculations));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getCompliances(req: Request, res: Response) {
  const projectId = parseInt(req.params.projid);
  try {
    const project = await getProjectByIdQuery(projectId);
    if (project) {
      const controlCategories = await getControlCategoryByProjectIdQuery(
        project.id
      );
      for (const category of controlCategories) {
        if (category) {
          const controls = await getAllControlsByControlGroupQuery(category.id);
          for (const control of controls) {
            if (control && control.id) {
              const subControls = await getAllSubcontrolsByControlIdQuery(
                control.id
              );
              control.numberOfSubcontrols = subControls.length;
              control.numberOfDoneSubcontrols = subControls.filter(
                (subControl) => subControl.status === "Done"
              ).length;
              control.subControls = subControls;
            }
          }
          category.controls = controls;
        }
      }
      return res.status(200).json(STATUS_CODE[200](controlCategories));
    } else {
      return res.status(404).json(STATUS_CODE[404](project));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function projectComplianceProgress(req: Request, res: Response) {
  const projectId = parseInt(req.params.id);
  let totalNumberOfSubcontrols = 0;
  let totalNumberOfDoneSubcontrols = 0;
  try {
    const project = await getProjectByIdQuery(projectId);
    if (project) {
      const controlCategories = await getControlCategoryByProjectIdQuery(
        project.id
      );
      for (const category of controlCategories) {
        if (category) {
          const controls = await getAllControlsByControlGroupQuery(category.id);
          for (const control of controls) {
            if (control && control.id) {
              const subControls = await getAllSubcontrolsByControlIdQuery(
                control.id
              );
              control.numberOfSubcontrols = subControls.length;
              control.numberOfDoneSubcontrols = subControls.filter(
                (subControl) => subControl.status === "Done"
              ).length;
              totalNumberOfSubcontrols += subControls.length;
              totalNumberOfDoneSubcontrols += control.numberOfDoneSubcontrols;
            }
          }
        }
      }
      return res.status(200).json(
        STATUS_CODE[200]({
          allsubControls: totalNumberOfSubcontrols,
          allDonesubControls: totalNumberOfDoneSubcontrols,
        })
      );
    } else {
      return res.status(404).json(STATUS_CODE[404](project));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function projectAssessmentProgress(req: Request, res: Response) {
  let totalNumberOfQuestions = 0;
  const projectId = parseInt(req.params.id);
  let totalNumberOfAnsweredQuestions = 0;
  try {
    const project = await getProjectByIdQuery(projectId);
    if (project) {
      const assessments = await getAssessmentByProjectIdQuery(project.id);
      if (assessments.length !== 0) {
        for (const assessment of assessments) {
          if (assessment.id !== undefined) {
            const topics = await getTopicByAssessmentIdQuery(assessment.id);
            if (topics.length !== 0) {
              for (const topic of topics) {
                if (topic.id !== undefined) {
                  const subtopics = await getSubTopicByTopicIdQuery(topic.id);
                  if (subtopics.length !== 0) {
                    for (const subtopic of subtopics) {
                      if (subtopic.id !== undefined) {
                        const questions = await getQuestionBySubTopicIdQuery(
                          subtopic.id
                        );
                        if (questions.length !== 0) {
                          totalNumberOfQuestions =
                            totalNumberOfQuestions + questions.length;
                          for (const question of questions) {
                            if (
                              question.answer &&
                              question.answer.trim() !== ""
                            ) {
                              totalNumberOfAnsweredQuestions++;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return res.status(200).json(
        STATUS_CODE[200]({
          totalQuestions: totalNumberOfQuestions,
          answeredQuestions: totalNumberOfAnsweredQuestions,
        })
      );
    } else {
      return res.status(404).json(STATUS_CODE[404](project));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
