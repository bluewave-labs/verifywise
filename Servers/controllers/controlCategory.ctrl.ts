import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  getAllControlCategoriesQuery,
  getControlCategoryByIdQuery,
  createControlCategoryQuery,
  updateControlCategoryByIdQuery,
  deleteControlCategoryByIdQuery,
  getControlCategoryByProjectIdQuery,
  getControlCategoryByTitleAndProjectIdQuery,
} from "../utils/controlCategory.utils";
import { ControlCategoryModel } from "../domain.layer/models/controlCategory/controlCategory.model";
import { sequelize } from "../database/db";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllControlCategories(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllControlCategories",
    "getAllControlCategories",
    "controlCategory.ctrl.ts"
  );
  logger.debug("🔍 Fetching all control categories");

  try {
    const controlCategories = await getAllControlCategoriesQuery(req.tenantId!);

    if (controlCategories && controlCategories.length > 0) {
      await logEvent(
        "Read",
        `Retrieved ${controlCategories.length} control categories`
      );
      logStructured(
        "successful",
        `retrieved ${controlCategories.length} control categories`,
        "getAllControlCategories",
        "controlCategory.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](controlCategories));
    }

    logStructured(
      "successful",
      "no control categories found",
      "getAllControlCategories",
      "controlCategory.ctrl.ts"
    );
    await logEvent("Read", "No control categories found");
    return res.status(204).json(STATUS_CODE[204](controlCategories));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve control categories",
      "getAllControlCategories",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve control categories: ${(error as Error).message}`
    );
    logger.error("❌ Error in getAllControlCategories:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  const controlCategoryId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching control category by ID: ${controlCategoryId}`,
    "getControlCategoryById",
    "controlCategory.ctrl.ts"
  );
  logger.debug(`🔍 Looking up control category with ID: ${controlCategoryId}`);

  try {
    const controlCategory = await getControlCategoryByIdQuery(
      controlCategoryId, req.tenantId!
    );

    if (controlCategory) {
      logStructured(
        "successful",
        `control category found: ID ${controlCategoryId}`,
        "getControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Read",
        `Control category retrieved by ID: ${controlCategoryId}`
      );
      return res.status(200).json(STATUS_CODE[200](controlCategory));
    }

    logStructured(
      "successful",
      `no control category found: ID ${controlCategoryId}`,
      "getControlCategoryById",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Read",
      `No control category found with ID: ${controlCategoryId}`
    );
    return res.status(404).json(STATUS_CODE[404](controlCategory));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch control category: ID ${controlCategoryId}`,
      "getControlCategoryById",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve control category by ID: ${controlCategoryId}`
    );
    logger.error("❌ Error in getControlCategoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlCategoryByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const projectId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching control categories for project ID: ${projectId}`,
    "getControlCategoryByProjectId",
    "controlCategory.ctrl.ts"
  );
  logger.debug(`🔍 Looking up control categories for project ID: ${projectId}`);

  try {
    const controlCategories = await getControlCategoryByProjectIdQuery(
      projectId, req.tenantId!
    );

    if (controlCategories && controlCategories.length > 0) {
      logStructured(
        "successful",
        `retrieved ${controlCategories.length} control categories for project ID ${projectId}`,
        "getControlCategoryByProjectId",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Read",
        `Retrieved ${controlCategories.length} control categories for project ID: ${projectId}`
      );
      return res.status(200).json(STATUS_CODE[200](controlCategories));
    }

    logStructured(
      "successful",
      `no control categories found for project ID ${projectId}`,
      "getControlCategoryByProjectId",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Read",
      `No control categories found for project ID: ${projectId}`
    );
    return res.status(204).json(STATUS_CODE[204](controlCategories));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch control categories for project ID ${projectId}`,
      "getControlCategoryByProjectId",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve control categories for project ID: ${projectId}`
    );
    logger.error("❌ Error in getControlCategoryByProjectId:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createControlCategory(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const { project_id, title, order_no } = req.body;

  logStructured(
    "processing",
    `starting control category creation for project ID ${project_id}`,
    "createControlCategory",
    "controlCategory.ctrl.ts"
  );
  logger.debug(
    `🛠️ Creating control category: ${title} for project ID: ${project_id}`
  );

  try {
    // Check if control category with same title already exists for this project
    const existingControlCategory =
      await getControlCategoryByTitleAndProjectIdQuery(title, project_id);
    if (existingControlCategory) {
      logStructured(
        "error",
        `control category already exists: ${title} for project ID ${project_id}`,
        "createControlCategory",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Attempted to create duplicate control category: ${title} for project ID: ${project_id}`
      );
      await transaction.rollback();
      return res
        .status(409)
        .json(
          STATUS_CODE[409](
            "Control category with this title already exists for this project"
          )
        );
    }

    // Use the model's createNewControlCategory method for validation and creation
    const controlCategoryModel =
      await ControlCategoryModel.createNewControlCategory(
        project_id,
        title,
        order_no
      );
    await controlCategoryModel.validateControlCategoryData();

    const createdControlCategory = await createControlCategoryQuery(
      controlCategoryModel,
      req.tenantId!,
      transaction
    );

    if (createdControlCategory) {
      await transaction.commit();
      logStructured(
        "successful",
        `control category created: ${title} for project ID ${project_id}`,
        "createControlCategory",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Control category created: ${title} for project ID: ${project_id}`
      );
      return res.status(201).json(STATUS_CODE[201](createdControlCategory));
    }

    logStructured(
      "error",
      `failed to create control category: ${title}`,
      "createControlCategory",
      "controlCategory.ctrl.ts"
    );
    await logEvent("Error", `Control category creation failed: ${title}`);
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to create control category"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createControlCategory",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during control category creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createControlCategory",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during control category creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error: ${title}`,
      "createControlCategory",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during control category creation: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in createControlCategory:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const controlCategoryId = parseInt(req.params.id);
  const { title, order_no } = req.body;

  logStructured(
    "processing",
    `updating control category ID ${controlCategoryId}`,
    "updateControlCategoryById",
    "controlCategory.ctrl.ts"
  );
  logger.debug(
    `✏️ Update requested for control category ID ${controlCategoryId}`
  );

  try {
    const existingControlCategory = await getControlCategoryByIdQuery(
      controlCategoryId, req.tenantId!
    );

    if (!existingControlCategory) {
      logStructured(
        "error",
        `control category not found: ID ${controlCategoryId}`,
        "updateControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — control category not found: ID ${controlCategoryId}`
      );
      await transaction.rollback();
      return res
        .status(404)
        .json(STATUS_CODE[404]("Control category not found"));
    }

    // Check if it's a demo category
    if (existingControlCategory.is_demo) {
      logStructured(
        "error",
        `attempted to update demo control category ID ${controlCategoryId}`,
        "updateControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Blocked update of demo control category ID ${controlCategoryId}`
      );
      await transaction.rollback();
      return res
        .status(403)
        .json(STATUS_CODE[403]("Demo control categories cannot be modified"));
    }

    // If title is being updated, check for duplicates
    if (title && title !== existingControlCategory.title) {
      const duplicateControlCategory =
        await getControlCategoryByTitleAndProjectIdQuery(
          title,
          existingControlCategory.project_id
        );
      if (duplicateControlCategory) {
        logStructured(
          "error",
          `control category title already exists: ${title}`,
          "updateControlCategoryById",
          "controlCategory.ctrl.ts"
        );
        await logEvent(
          "Error",
          `Attempted to update to duplicate title: ${title}`
        );
        await transaction.rollback();
        return res
          .status(409)
          .json(
            STATUS_CODE[409](
              "Control category with this title already exists for this project"
            )
          );
      }
    }

    const updatedControlCategoryData: Partial<ControlCategoryModel> = {
      title: title || existingControlCategory.title,
      order_no:
        order_no !== undefined ? order_no : existingControlCategory.order_no,
    };

    const updatedControlCategory = await updateControlCategoryByIdQuery(
      controlCategoryId,
      updatedControlCategoryData,
      req.tenantId!,
      transaction
    );

    if (updatedControlCategory) {
      await transaction.commit();
      logStructured(
        "successful",
        `control category updated: ID ${controlCategoryId}`,
        "updateControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Control category updated: ID ${controlCategoryId}, title: ${updatedControlCategory.title}`
      );
      return res.status(202).json(STATUS_CODE[202](updatedControlCategory));
    }

    logStructured(
      "error",
      `failed to update control category: ID ${controlCategoryId}`,
      "updateControlCategoryById",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Control category update failed: ID ${controlCategoryId}`
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to update control category"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during control category update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during control category update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for control category ID ${controlCategoryId}`,
      "updateControlCategoryById",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during control category update for ID ${controlCategoryId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in updateControlCategoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const controlCategoryId = parseInt(req.params.id);

  logStructured(
    "processing",
    `attempting to delete control category ID ${controlCategoryId}`,
    "deleteControlCategoryById",
    "controlCategory.ctrl.ts"
  );
  logger.debug(
    `🗑️ Delete request for control category ID ${controlCategoryId}`
  );

  try {
    const existingControlCategory = await getControlCategoryByIdQuery(
      controlCategoryId, req.tenantId!
    );

    if (!existingControlCategory) {
      logStructured(
        "error",
        `control category not found: ID ${controlCategoryId}`,
        "deleteControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Delete failed — control category not found: ID ${controlCategoryId}`
      );
      await transaction.rollback();
      return res
        .status(404)
        .json(STATUS_CODE[404]("Control category not found"));
    }

    // Check if it's a demo category
    if (existingControlCategory.is_demo) {
      logStructured(
        "error",
        `attempted to delete demo control category ID ${controlCategoryId}`,
        "deleteControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Blocked deletion of demo control category ID ${controlCategoryId}`
      );
      await transaction.rollback();
      return res
        .status(403)
        .json(STATUS_CODE[403]("Demo control categories cannot be deleted"));
    }

    const deletedControlCategory = await deleteControlCategoryByIdQuery(
      controlCategoryId,
      req.tenantId!,
      transaction
    );

    if (deletedControlCategory) {
      await transaction.commit();
      logStructured(
        "successful",
        `control category deleted: ID ${controlCategoryId}`,
        "deleteControlCategoryById",
        "controlCategory.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `Control category deleted: ID ${controlCategoryId}, title: ${existingControlCategory.title}`
      );
      return res
        .status(202)
        .json(
          STATUS_CODE[202]({ message: "Control category deleted successfully" })
        );
    }

    logStructured(
      "error",
      `failed to delete control category: ID ${controlCategoryId}`,
      "deleteControlCategoryById",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Control category deletion failed: ID ${controlCategoryId}`
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to delete control category"));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error deleting control category ID ${controlCategoryId}`,
      "deleteControlCategoryById",
      "controlCategory.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during control category deletion for ID ${controlCategoryId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in deleteControlCategoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
