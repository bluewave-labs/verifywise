import { Request, Response } from "express";
import { sequelize } from "../database/db";
import {
  getAllTopicsLaw25Query,
  getAllTopicsWithRequirementsLaw25Query,
  getRequirementByIdLaw25Query,
  getRequirementByIdForProjectLaw25Query,
  updateRequirementLaw25Query,
  countRequirementsLaw25ByProjectId,
  countRequirementAssignmentsLaw25ByProjectId,
  getRequirementRisksLaw25Query,
} from "../utils/law25.utils";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { UploadedFile, RequestWithFile } from "../utils/question.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { Transaction } from "sequelize";

/**
 * Get all topics structure
 */
export async function getAllTopics(req: Request, res: Response): Promise<any> {
  try {
    const tenant = req.tenantId!;
    const topics = await getAllTopicsLaw25Query(tenant);
    return res.status(200).json(STATUS_CODE[200](topics));
  } catch (error) {
    console.error("Error fetching Law-25 topics:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get all topics with requirements for a project
 */
export async function getAllTopicsWithRequirements(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const tenant = req.tenantId!;
    const projectFrameworkId = parseInt(req.params.id);
    if (isNaN(projectFrameworkId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project framework ID"));
    }
    const topics = await getAllTopicsWithRequirementsLaw25Query(
      projectFrameworkId,
      tenant
    );
    return res.status(200).json(STATUS_CODE[200](topics));
  } catch (error) {
    console.error("Error fetching Law-25 topics with requirements:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get requirement by ID
 */
export async function getRequirementById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const tenant = req.tenantId!;
    const requirementId = parseInt(req.params.id);
    if (isNaN(requirementId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid requirement ID"));
    }

    const requirement = await getRequirementByIdLaw25Query(requirementId, tenant);
    if (!requirement) {
      return res.status(404).json(STATUS_CODE[404]("Requirement not found"));
    }

    return res.status(200).json(STATUS_CODE[200](requirement));
  } catch (error) {
    console.error("Error fetching Law-25 requirement:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get requirement by struct ID for a project
 */
export async function getRequirementByStructIdForProject(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const tenant = req.tenantId!;
    const requirementStructId = parseInt(req.params.structId);
    const projectFrameworkId = parseInt(req.query.projectFrameworkId as string);

    if (isNaN(requirementStructId) || isNaN(projectFrameworkId)) {
      return res.status(400).json(
        STATUS_CODE[400]("Invalid requirement struct ID or project framework ID")
      );
    }

    const requirement = await getRequirementByIdForProjectLaw25Query(
      requirementStructId,
      projectFrameworkId,
      tenant
    );
    if (!requirement) {
      return res.status(404).json(STATUS_CODE[404]("Requirement not found"));
    }
    return res.status(200).json(STATUS_CODE[200](requirement));
  } catch (error) {
    console.error("Error fetching Law-25 requirement for project:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// helper function to delete files
async function deleteFiles(
  filesToDelete: number[],
  tenant: string,
  transaction: Transaction
): Promise<void> {
  await Promise.all(
    filesToDelete.map(async (fileId) => {
      await deleteFileById(fileId, tenant, transaction);
    })
  );
}

/**
 * Update requirement
 */
export async function updateRequirement(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const tenant = req.tenantId!;
    const userId = req.userId!;
    const requirementId = parseInt(req.params.id);
    if (isNaN(requirementId)) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Invalid requirement ID"));
    }

    // Handle file uploads
    const uploadedFiles: {
      id: string;
      fileName: string;
      project_id: number;
      uploaded_by: number;
      uploaded_time: Date;
    }[] = [];

    const files = req.files as UploadedFile[];
    if (files && files.length > 0) {
      for (const file of files) {
        const fileResult = await uploadFile(
          file,
          userId,
          req.body.project_id ? parseInt(req.body.project_id) : null,
          "Compliance tracker group",
          tenant,
          transaction
        );
        uploadedFiles.push({
          id: (fileResult as any).id.toString(),
          fileName: file.originalname,
          project_id: req.body.project_id ? parseInt(req.body.project_id) : 0,
          uploaded_by: userId,
          uploaded_time: new Date(),
        });
      }
    }

    // Handle deleted files
    const deletedFilesRaw = req.body.deletedFiles;
    const deletedFiles = deletedFilesRaw ? JSON.parse(deletedFilesRaw) : [];
    if (deletedFiles.length > 0) {
      await deleteFiles(
        deletedFiles.map((id: string) => parseInt(id)),
        tenant,
        transaction
      );
    }

    const updatedRequirement = await updateRequirementLaw25Query(
      requirementId,
      req.body,
      uploadedFiles,
      deletedFiles.map((id: string) => parseInt(id)),
      tenant,
      transaction
    );

    await transaction.commit();
    return res.status(200).json(STATUS_CODE[200](updatedRequirement));
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating Law-25 requirement:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get requirement risks
 */
export async function getRequirementRisks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const tenant = req.tenantId!;
    const requirementId = parseInt(req.params.id);
    if (isNaN(requirementId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid requirement ID"));
    }

    const risks = await getRequirementRisksLaw25Query(requirementId, tenant);
    return res.status(200).json(STATUS_CODE[200](risks));
  } catch (error) {
    console.error("Error fetching Law-25 requirement risks:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get Law-25 progress (total and completed requirements)
 */
export async function getLaw25Progress(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const tenant = req.tenantId!;
    const projectFrameworkId = parseInt(req.params.id);
    if (isNaN(projectFrameworkId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project framework ID"));
    }

    const progress = await countRequirementsLaw25ByProjectId(projectFrameworkId, tenant);
    return res.status(200).json(STATUS_CODE[200]({
      total: parseInt(progress.totalRequirements) || 0,
      completed: parseInt(progress.doneRequirements) || 0,
    }));
  } catch (error) {
    console.error("Error fetching Law-25 progress:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get Law-25 assignments (total and assigned requirements)
 */
export async function getLaw25Assignments(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const tenant = req.tenantId!;
    const projectFrameworkId = parseInt(req.params.id);
    if (isNaN(projectFrameworkId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project framework ID"));
    }

    const assignments = await countRequirementAssignmentsLaw25ByProjectId(
      projectFrameworkId,
      tenant
    );
    return res.status(200).json(STATUS_CODE[200]({
      total: parseInt(assignments.totalRequirements) || 0,
      assigned: parseInt(assignments.assignedRequirements) || 0,
    }));
  } catch (error) {
    console.error("Error fetching Law-25 assignments:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get Law-25 overview (all topics with requirements)
 */
export async function getLaw25Overview(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const tenant = req.tenantId!;
    const projectFrameworkId = parseInt(req.params.id);
    if (isNaN(projectFrameworkId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid project framework ID"));
    }

    const topics = await getAllTopicsWithRequirementsLaw25Query(
      projectFrameworkId,
      tenant
    );

    // Calculate progress per topic
    const overview = topics.map((topic: any) => {
      const totalReqs = topic.requirements?.length || 0;
      const completedReqs = topic.requirements?.filter(
        (r: any) => r.status === "Implemented"
      ).length || 0;
      const assignedReqs = topic.requirements?.filter(
        (r: any) => r.owner !== null
      ).length || 0;

      return {
        ...topic,
        progress: {
          total: totalReqs,
          completed: completedReqs,
          assigned: assignedReqs,
        },
      };
    });

    return res.status(200).json(STATUS_CODE[200](overview));
  } catch (error) {
    console.error("Error fetching Law-25 overview:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
