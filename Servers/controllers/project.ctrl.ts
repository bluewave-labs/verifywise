import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockProject,
  deleteMockProjectById,
  getAllMockProjects,
  getMockProjectById,
  updateMockProjectById,
} from "../mocks/tools/project.mock.db";
import {
  createNewProjectQuery,
  deleteProjectByIdQuery,
  getAllProjectsQuery,
  getProjectByIdQuery,
  updateProjectByIdQuery,
} from "../utils/project.utils";
import { createMockControlCategory } from "../mocks/tools/controlCategory.mock.db";
import { createMockControl } from "../mocks/tools/control.mock.db";
import { createMockSubcontrol } from "../mocks/tools/subcontrol.mock.db";
import { createControlCategoryQuery } from "../utils/controlCategory.util";
import { createNewControlQuery } from "../utils/control.utils";
import { createNewSubcontrolQuery } from "../utils/subControl.utils";
import { createNewAssessmentQuery } from "../utils/assessment.utils";
import { createMockAssessment } from "../mocks/tools/assessment.mock.db";

export async function getAllProjects(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCKDATA_ON === true) {
      const projects = getAllMockProjects();

      if (projects) {
        return res.status(200).json(STATUS_CODE[200](projects));
      }

      return res.status(204).json(STATUS_CODE[204](projects));
    } else {
      const projects = await getAllProjectsQuery();

      if (projects) {
        return res.status(200).json(STATUS_CODE[200](projects));
      }

      return res.status(204).json(STATUS_CODE[204](projects));
    }
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

    if (MOCKDATA_ON === true) {
      const project = getMockProjectById(projectId);

      if (project) {
        return res.status(200).json(STATUS_CODE[200](project));
      }

      return res.status(404).json(STATUS_CODE[404](project));
    } else {
      const project = await getProjectByIdQuery(projectId);

      if (project) {
        return res.status(200).json(STATUS_CODE[200](project));
      }

      return res.status(404).json(STATUS_CODE[404](project));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProject(req: Request, res: Response): Promise<any> {
  try {
    const newProject: {
      project_title: string;
      owner: number;
      users: string;
      start_date: Date;
      ai_risk_classification: string;
      type_of_high_risk_role: string;
      goal: string;
      last_updated?: Date;
      last_updated_by?: number;
    } = req.body;

    if (!newProject.project_title || !newProject.owner) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "project_title and owner are required" })
        );
    }

    if (MOCKDATA_ON === true) {
      const createdProject = createMockProject(newProject) as { id: string };
      const assessment = createMockAssessment({ projectId: createdProject.id }) as { id: string, projectId: string };
      console.log("project id ", createdProject.id, ", assessment id ", assessment.id);

      if (createdProject) {
        return res.status(201).json(STATUS_CODE[201]({assessment: assessment, project: createdProject}));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const createdProject = await createNewProjectQuery(newProject);
      const assessment = await createNewAssessmentQuery({ projectId: createdProject.id });
      console.log("project id ", createdProject.id, ", assessment id ", assessment.id);

      if (createdProject) {
        return res.status(201).json(STATUS_CODE[201]({assessment: assessment, project: createdProject}));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
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
    const updatedProject: {
      project_title: string;
      owner: string;
      users: string;
      start_date: Date;
      ai_risk_classification: string;
      type_of_high_risk_role: string;
      goal: string;
      last_updated: Date;
      last_updated_by: string;
    } = req.body;

    if (!updatedProject.project_title || !updatedProject.owner) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "project_title and owner are required" })
        );
    }

    if (MOCKDATA_ON === true) {
      const project = updateMockProjectById(projectId, updatedProject);

      if (project) {
        return res.status(202).json(STATUS_CODE[202](project));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const project = await updateProjectByIdQuery(projectId, updatedProject);

      if (project) {
        return res.status(202).json(STATUS_CODE[202](project));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
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

    if (MOCKDATA_ON === true) {
      const deletedProject = deleteMockProjectById(projectId);

      if (deletedProject) {
        return res.status(202).json(STATUS_CODE[202](deletedProject));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedProject = await deleteProjectByIdQuery(projectId);

      if (deletedProject) {
        return res.status(202).json(STATUS_CODE[202](deletedProject));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function saveControls(req: Request, res: Response): Promise<any> {
  const projectId = req.body.projectId || 1;

  try {
    if (MOCKDATA_ON === true) {
      // first, the id of the project is needed and will be sent inside the req.body
      const controlCategoryTitle = req.body.controlCategoryTitle;

      // then, we need to create the control category and use the projectId as the foreign key
      const controlCategory: any = createMockControlCategory({
        projectId,
        controlCategoryTitle,
      });

      // now, we need to create the control for the control category, and use the control category id as the foreign key
      const control: any = createMockControl({
        controlCategoryId: controlCategory.id,
        control: {
          contrlTitle: req.body.control.controlTitle,
          controlDescription: req.body.control.controlDescription,
          status: req.body.control.status,
          approver: req.body.control.approver,
          riskReview: req.body.control.riskReview,
          owner: req.body.control.owner,
          reviewer: req.body.control.reviewer,
          description: req.body.control.description,
          date: req.body.control.date,
        },
      });
      const controlId = control.id;

      // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
      const subcontrols = req.body.control.subControls;
      for (const subcontrol of subcontrols) {
        const subcontrolToSave: any = createMockSubcontrol({
          controlId,
          subcontrol: subcontrol,
        });
        console.log("subcontrolToSave : ", subcontrolToSave);
      }
      res.status(200).json(
        STATUS_CODE[200]({
          message: "Controls saved",
        })
      );
    } else {
      // first the id of the project is needed and will be sent inside the req.body
      const controlCategoryTitle = req.body.controlCategoryTitle;

      // then we need to create the control category and use the projectId as the foreign key
      const controlCategory: any = await createControlCategoryQuery({
        projectId,
        name: controlCategoryTitle,
      });

      const controlCategoryId = controlCategory.id;

      // now we need to create the control for the control category, and use the control category id as the foreign key
      const control: any = await createNewControlQuery({
        // controlCategoryId: controlCategory.id,
        projectId: controlCategoryId, // now must be replaced with controlCategoryId
        // title: req.body.control.title,
        status: req.body.control.status,
        approver: req.body.control.approver,
        riskReview: req.body.control.riskReview,
        owner: req.body.control.owner,
        reviewer: req.body.control.reviewer,
        dueDate: req.body.control.date,
        implementationDetails: req.body.control.description,
      });

      const controlId = control.id;

      // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
      const subcontrols = req.body.control.subControls;
      for (const subcontrol of subcontrols) {
        const subcontrolToSave: any = await createNewSubcontrolQuery(
          controlId,
          subcontrol
        );
        console.log("subcontrolToSave : ", subcontrolToSave);
      }

      res.status(200).json(
        STATUS_CODE[200]({
          message: "Controls saved",
        })
      );
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
