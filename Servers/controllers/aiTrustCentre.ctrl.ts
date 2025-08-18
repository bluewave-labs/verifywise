import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import {
  createAITrustCentreResourceQuery,
  createAITrustCentreSubprocessorQuery,
  deleteAITrustCentreResourceQuery,
  deleteAITrustCentreSubprocessorQuery,
  deleteCompanyLogoQuery,
  getAITrustCentreOverviewQuery,
  getAITrustCentrePublicPageQuery,
  getAITrustCentrePublicResourceByIdQuery,
  getAITrustCentreResourcesQuery,
  getAITrustCentreSubprocessorsQuery,
  getCompanyLogoQuery,
  updateAITrustCentreOverviewQuery,
  updateAITrustCentreResourceQuery,
  updateAITrustCentreSubprocessorQuery,
  uploadCompanyLogoQuery,
} from "../utils/aiTrustCentre.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { IAITrustCentreOverview } from "../domain.layer/interfaces/i.aiTrustCentreOverview";
import { IAITrustCentreResources } from "../domain.layer/interfaces/i.aiTrustCentreResources";
import { IAITrustCentreSubprocessors } from "../domain.layer/interfaces/i.aiTrustCentreSubprocessors";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";

export async function getCompanyLogo(req: Request, res: Response) {
  const { hash } = req.params;
  logStructured(
    "processing",
    `fetching company logo for hash: ${hash}`,
    "getCompanyLogo",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(`🖼️ Fetching company logo for hash: ${hash}`);

  try {
    const logo = await getCompanyLogoQuery(hash);

    if (!logo) {
      logStructured(
        "successful",
        `company logo not found for hash: ${hash}`,
        "getCompanyLogo",
        "aiTrustCentre.ctrl.ts"
      );
      return res.status(404).json(
        STATUS_CODE[404]({
          message: "Company logo not found",
        })
      );
    }

    logStructured(
      "successful",
      `company logo retrieved for hash: ${hash}`,
      "getCompanyLogo",
      "aiTrustCentre.ctrl.ts"
    );
    return res.status(200).json(
      STATUS_CODE[200]({
        message: "Company logo retrieved successfully",
        logo,
      })
    );
  } catch (error) {
    logStructured(
      "error",
      `failed to retrieve company logo for hash: ${hash}`,
      "getCompanyLogo",
      "aiTrustCentre.ctrl.ts"
    );
    logger.error("❌ Error in getCompanyLogo:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAITrustCentrePublicPage(req: Request, res: Response) {
  const { hash } = req.params;
  logStructured(
    "processing",
    `fetching AI Trust Centre public page for hash: ${hash}`,
    "getAITrustCentrePublicPage",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(`🌐 Fetching AI Trust Centre public page for hash: ${hash}`);

  try {
    const result = await getAITrustCentrePublicPageQuery(hash);

    logStructured(
      "successful",
      `AI Trust Centre public page retrieved for hash: ${hash}`,
      "getAITrustCentrePublicPage",
      "aiTrustCentre.ctrl.ts"
    );
    return res.status(200).json(
      STATUS_CODE[200]({
        message: "AI Trust Centre public page retrieved successfully",
        trustCentre: result,
      })
    );
  } catch (error) {
    logStructured(
      "error",
      `failed to retrieve AI Trust Centre public page for hash: ${hash}`,
      "getAITrustCentrePublicPage",
      "aiTrustCentre.ctrl.ts"
    );
    logger.error("❌ Error in getAITrustCentrePublicPage:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAITrustCentrePublicResource(
  req: Request,
  res: Response
) {
  const { hash, id } = req.params;
  logStructured(
    "processing",
    `fetching AI Trust Centre public resource for hash: ${hash}, id: ${id}`,
    "getAITrustCentrePublicResource",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(
    `📄 Fetching AI Trust Centre public resource for hash: ${hash}, id: ${id}`
  );

  try {
    const resource = await getAITrustCentrePublicResourceByIdQuery(
      hash,
      parseInt(id)
    );
    if (!resource) {
      logStructured(
        "successful",
        `resource not found for hash: ${hash}, id: ${id}`,
        "getAITrustCentrePublicResource",
        "aiTrustCentre.ctrl.ts"
      );
      return res.status(404).json(
        STATUS_CODE[404]({
          message: "Resource not found",
        })
      );
    }

    logStructured(
      "successful",
      `AI Trust Centre public resource retrieved for hash: ${hash}, id: ${id}`,
      "getAITrustCentrePublicResource",
      "aiTrustCentre.ctrl.ts"
    );
    res.setHeader("Content-Type", resource.type);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${resource.filename}"`
    );
    return res.status(200).end(resource.content);
  } catch (error) {
    logStructured(
      "error",
      `failed to retrieve AI Trust Centre public resource for hash: ${hash}, id: ${id}`,
      "getAITrustCentrePublicResource",
      "aiTrustCentre.ctrl.ts"
    );
    logger.error("❌ Error in getAITrustCentrePublicResource:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAITrustCentreOverview(req: Request, res: Response) {
  logStructured(
    "processing",
    "fetching AI Trust Centre overview",
    "getAITrustCentreOverview",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug("📊 Fetching AI Trust Centre overview");

  try {
    const overview = await getAITrustCentreOverviewQuery(req.tenantId!);

    logStructured(
      "successful",
      "AI Trust Centre overview retrieved successfully",
      "getAITrustCentreOverview",
      "aiTrustCentre.ctrl.ts"
    );
    return res.status(200).json(
      STATUS_CODE[200]({
        message: "AI Trust Centre overview retrieved successfully",
        overview,
      })
    );
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve AI Trust Centre overview",
      "getAITrustCentreOverview",
      "aiTrustCentre.ctrl.ts"
    );
    logger.error("❌ Error in getAITrustCentreOverview:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getAITrustCentreResources = async (
  req: Request,
  res: Response
) => {
  logStructured(
    "processing",
    "fetching AI Trust Centre resources",
    "getAITrustCentreResources",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug("📚 Fetching AI Trust Centre resources");

  try {
    const resources = await getAITrustCentreResourcesQuery(req.tenantId!);

    logStructured(
      "successful",
      `AI Trust Centre resources retrieved successfully (${resources?.length || 0} resources)`,
      "getAITrustCentreResources",
      "aiTrustCentre.ctrl.ts"
    );
    return res.status(200).json(
      STATUS_CODE[200]({
        message: "AI Trust Centre resources retrieved successfully",
        resources,
      })
    );
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve AI Trust Centre resources",
      "getAITrustCentreResources",
      "aiTrustCentre.ctrl.ts"
    );
    logger.error("❌ Error in getAITrustCentreResources:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export const getAITrustCentreSubprocessors = async (
  req: Request,
  res: Response
) => {
  logStructured(
    "processing",
    "fetching AI Trust Centre subprocessors",
    "getAITrustCentreSubprocessors",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug("🏢 Fetching AI Trust Centre subprocessors");

  try {
    const subprocessors = await getAITrustCentreSubprocessorsQuery(
      req.tenantId!
    );

    logStructured(
      "successful",
      `AI Trust Centre subprocessors retrieved successfully (${subprocessors?.length || 0} subprocessors)`,
      "getAITrustCentreSubprocessors",
      "aiTrustCentre.ctrl.ts"
    );
    return res.status(200).json(
      STATUS_CODE[200]({
        message: "AI Trust Centre subprocessors retrieved successfully",
        subprocessors,
      })
    );
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve AI Trust Centre subprocessors",
      "getAITrustCentreSubprocessors",
      "aiTrustCentre.ctrl.ts"
    );
    logger.error("❌ Error in getAITrustCentreSubprocessors:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export async function createAITrustResource(
  req: RequestWithFile,
  res: Response
) {
  const transaction = await sequelize.transaction();
  const body = req.body as Partial<{
    name: string;
    description: string;
    visible: string;
  }>;

  logStructured(
    "processing",
    `creating AI Trust Centre resource: ${body.name}`,
    "createAITrustResource",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(`🛠️ Creating AI Trust Centre resource: ${body.name}`);

  try {
    const file = await uploadFile(
      req.file as UploadedFile,
      req.userId!,
      null,
      "AI trust center group",
      req.tenantId!,
      transaction
    );

    if (!file || !file.id) {
      await transaction.rollback();
      logStructured(
        "error",
        `file upload failed for resource: ${body.name}`,
        "createAITrustResource",
        "aiTrustCentre.ctrl.ts"
      );
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "File upload failed",
        })
      );
    }

    const resource = await createAITrustCentreResourceQuery(
      {
        name: body.name,
        description: body.description,
        file_id: file.id,
        visible: body.visible === "true",
      },
      req.tenantId!,
      transaction
    );

    if (resource) {
      await transaction.commit();
      logStructured(
        "successful",
        `AI Trust Centre resource created: ${body.name}`,
        "createAITrustResource",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Create",
        `AI Trust Centre resource created: ${body.name}`,
        resource.id
      );
      return res.status(201).json(
        STATUS_CODE[201]({
          message: "AI Trust Centre resource created successfully",
          resource,
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        `failed to create AI Trust Centre resource: ${body.name}`,
        "createAITrustResource",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Failed to create AI Trust Centre resource: ${body.name}`
      );
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to create AI Trust Centre resource",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error creating AI Trust Centre resource: ${body.name}`,
      "createAITrustResource",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error creating AI Trust Centre resource: ${(error as Error).message}`
    );
    logger.error("❌ Error in createAITrustResource:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAITrustSubprocessor(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  const body = req.body as IAITrustCentreSubprocessors;

  logStructured(
    "processing",
    `creating AI Trust Centre subprocessor: ${body.name}`,
    "createAITrustSubprocessor",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(`🏢 Creating AI Trust Centre subprocessor: ${body.name}`);

  try {
    const subprocessor = await createAITrustCentreSubprocessorQuery(
      {
        name: body.name,
        purpose: body.purpose,
        location: body.location,
        url: body.url,
      },
      req.tenantId!,
      transaction
    );

    if (subprocessor) {
      await transaction.commit();
      logStructured(
        "successful",
        `AI Trust Centre subprocessor created: ${body.name}`,
        "createAITrustSubprocessor",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Create",
        `AI Trust Centre subprocessor created: ${body.name}`,
        subprocessor.id
      );
      return res.status(201).json(
        STATUS_CODE[201]({
          message: "AI Trust Centre subprocessor created successfully",
          subprocessor,
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        `failed to create AI Trust Centre subprocessor: ${body.name}`,
        "createAITrustSubprocessor",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Failed to create AI Trust Centre subprocessor: ${body.name}`
      );
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to create AI Trust Centre subprocessor",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error creating AI Trust Centre subprocessor: ${body.name}`,
      "createAITrustSubprocessor",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error creating AI Trust Centre subprocessor: ${(error as Error).message}`
    );
    logger.error("❌ Error in createAITrustSubprocessor:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function uploadCompanyLogo(req: RequestWithFile, res: Response) {
  const transaction = await sequelize.transaction();
  const attachment = req.file as UploadedFile;

  logStructured(
    "processing",
    "uploading company logo",
    "uploadCompanyLogo",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug("🖼️ Uploading company logo");

  try {
    if (!attachment || attachment.mimetype.includes("image/") === false) {
      logStructured(
        "error",
        "invalid file type for company logo upload",
        "uploadCompanyLogo",
        "aiTrustCentre.ctrl.ts"
      );
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "Invalid file, please upload an image file.",
        })
      );
    }

    const file = await uploadFile(
      attachment,
      req.userId!,
      null,
      "AI trust center group",
      req.tenantId!,
      transaction
    );
    const fileId = file?.id || undefined;

    if (!fileId) {
      await transaction.rollback();
      logStructured(
        "error",
        "file upload failed for company logo",
        "uploadCompanyLogo",
        "aiTrustCentre.ctrl.ts"
      );
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "File upload failed",
        })
      );
    }

    const upload = await uploadCompanyLogoQuery(
      fileId,
      req.tenantId!,
      transaction
    );

    if (upload) {
      await transaction.commit();
      logStructured(
        "successful",
        "company logo uploaded successfully",
        "uploadCompanyLogo",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent("Create", "Company logo uploaded successfully");
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "Company logo uploaded successfully",
          ...upload,
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        "failed to upload company logo",
        "uploadCompanyLogo",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent("Error", "Failed to upload company logo");
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to upload company logo",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      "unexpected error uploading company logo",
      "uploadCompanyLogo",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error uploading company logo: ${(error as Error).message}`
    );
    logger.error("❌ Error in uploadCompanyLogo:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAITrustOverview(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  const body = req.body as Partial<IAITrustCentreOverview>;

  logStructured(
    "processing",
    "updating AI Trust Centre overview",
    "updateAITrustOverview",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug("✏️ Updating AI Trust Centre overview");

  try {
    const overview = await updateAITrustCentreOverviewQuery(
      body,
      req.tenantId!,
      transaction
    );

    if (overview) {
      await transaction.commit();
      logStructured(
        "successful",
        "AI Trust Centre overview updated successfully",
        "updateAITrustOverview",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent("Update", "AI Trust Centre overview updated successfully");
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "AI Trust Centre overview updated successfully",
          overview,
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        "failed to update AI Trust Centre overview",
        "updateAITrustOverview",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent("Error", "Failed to update AI Trust Centre overview");
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to update AI Trust Centre overview",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      "unexpected error updating AI Trust Centre overview",
      "updateAITrustOverview",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error updating AI Trust Centre overview: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateAITrustOverview:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAITrustResource(
  req: RequestWithFile,
  res: Response
) {
  const transaction = await sequelize.transaction();
  const body = req.body as Partial<{
    name: string;
    description: string;
    file_id: number;
    visible: string;
    delete: string;
  }>;
  const resourceId = parseInt(req.params.id);

  logStructured(
    "processing",
    `updating AI Trust Centre resource ID: ${resourceId}`,
    "updateAITrustResource",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(`✏️ Updating AI Trust Centre resource ID: ${resourceId}`);

  try {
    if (
      (body.delete && req.file === undefined) ||
      (req.file !== undefined && !body.delete)
    ) {
      await transaction.rollback();
      logStructured(
        "error",
        `no file provided for resource update ID: ${resourceId}`,
        "updateAITrustResource",
        "aiTrustCentre.ctrl.ts"
      );
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "No file provided for update",
        })
      );
    }

    let fileId: number | undefined = undefined;
    if (body.delete && req.file !== undefined) {
      const file = await uploadFile(
        req.file as UploadedFile,
        req.userId!,
        null,
        "AI trust center group",
        req.tenantId!,
        transaction
      );
      fileId = file?.id || undefined;
    }

    const resource = await updateAITrustCentreResourceQuery(
      resourceId,
      {
        name: body.name,
        description: body.description,
        file_id: fileId,
        visible: body.visible === "true",
      },
      body.delete !== undefined ? parseInt(body.delete) : undefined,
      req.tenantId!,
      transaction
    );

    if (resource) {
      await transaction.commit();
      logStructured(
        "successful",
        `AI Trust Centre resource updated ID: ${resourceId}`,
        "updateAITrustResource",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Update",
        `AI Trust Centre resource updated ID: ${resourceId}`
      );
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "AI Trust Centre resource updated successfully",
          resource,
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        `failed to update AI Trust Centre resource ID: ${resourceId}`,
        "updateAITrustResource",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Failed to update AI Trust Centre resource ID: ${resourceId}`
      );
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to update AI Trust Centre resource",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error updating AI Trust Centre resource ID: ${resourceId}`,
      "updateAITrustResource",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error updating AI Trust Centre resource ID ${resourceId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateAITrustResource:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAITrustSubprocessor(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  const body = req.body as Partial<{
    name: string;
    purpose: string;
    location: string;
    url: string;
  }>;
  const subprocessorId = parseInt(req.params.id);

  logStructured(
    "processing",
    `updating AI Trust Centre subprocessor ID: ${subprocessorId}`,
    "updateAITrustSubprocessor",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(
    `✏️ Updating AI Trust Centre subprocessor ID: ${subprocessorId}`
  );

  try {
    const subprocessor = await updateAITrustCentreSubprocessorQuery(
      subprocessorId,
      body,
      req.tenantId!,
      transaction
    );

    if (subprocessor) {
      await transaction.commit();
      logStructured(
        "successful",
        `AI Trust Centre subprocessor updated ID: ${subprocessorId}`,
        "updateAITrustSubprocessor",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Update",
        `AI Trust Centre subprocessor updated ID: ${subprocessorId}`
      );
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "AI Trust Centre subprocessor updated successfully",
          subprocessor,
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        `failed to update AI Trust Centre subprocessor ID: ${subprocessorId}`,
        "updateAITrustSubprocessor",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Failed to update AI Trust Centre subprocessor ID: ${subprocessorId}`
      );
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to update AI Trust Centre subprocessor",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error updating AI Trust Centre subprocessor ID: ${subprocessorId}`,
      "updateAITrustSubprocessor",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error updating AI Trust Centre subprocessor ID ${subprocessorId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateAITrustSubprocessor:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAITrustResource(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  const resourceId = parseInt(req.params.id);

  logStructured(
    "processing",
    `deleting AI Trust Centre resource ID: ${resourceId}`,
    "deleteAITrustResource",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(`🗑️ Deleting AI Trust Centre resource ID: ${resourceId}`);

  try {
    const isDeleted = await deleteAITrustCentreResourceQuery(
      resourceId,
      req.tenantId!
    );

    if (isDeleted) {
      await transaction.commit();
      logStructured(
        "successful",
        `AI Trust Centre resource deleted ID: ${resourceId}`,
        "deleteAITrustResource",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `AI Trust Centre resource deleted ID: ${resourceId}`
      );
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "AI Trust Centre resource deleted successfully",
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        `failed to delete AI Trust Centre resource ID: ${resourceId}`,
        "deleteAITrustResource",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Failed to delete AI Trust Centre resource ID: ${resourceId}`
      );
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to delete AI Trust Centre resource",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error deleting AI Trust Centre resource ID: ${resourceId}`,
      "deleteAITrustResource",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error deleting AI Trust Centre resource ID ${resourceId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteAITrustResource:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAITrustSubprocessor(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  const subprocessorId = parseInt(req.params.id);

  logStructured(
    "processing",
    `deleting AI Trust Centre subprocessor ID: ${subprocessorId}`,
    "deleteAITrustSubprocessor",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug(
    `🗑️ Deleting AI Trust Centre subprocessor ID: ${subprocessorId}`
  );

  try {
    const isDeleted = await deleteAITrustCentreSubprocessorQuery(
      subprocessorId,
      req.tenantId!
    );

    if (isDeleted) {
      await transaction.commit();
      logStructured(
        "successful",
        `AI Trust Centre subprocessor deleted ID: ${subprocessorId}`,
        "deleteAITrustSubprocessor",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `AI Trust Centre subprocessor deleted ID: ${subprocessorId}`
      );
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "AI Trust Centre subprocessor deleted successfully",
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        `failed to delete AI Trust Centre subprocessor ID: ${subprocessorId}`,
        "deleteAITrustSubprocessor",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Failed to delete AI Trust Centre subprocessor ID: ${subprocessorId}`
      );
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to delete AI Trust Centre subprocessor",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error deleting AI Trust Centre subprocessor ID: ${subprocessorId}`,
      "deleteAITrustSubprocessor",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error deleting AI Trust Centre subprocessor ID ${subprocessorId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteAITrustSubprocessor:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteCompanyLogo(req: Request, res: Response) {
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    "deleting company logo",
    "deleteCompanyLogo",
    "aiTrustCentre.ctrl.ts"
  );
  logger.debug("🗑️ Deleting company logo");

  try {
    const isDeleted = await deleteCompanyLogoQuery(req.tenantId!, transaction);

    if (isDeleted) {
      await transaction.commit();
      logStructured(
        "successful",
        "company logo deleted successfully",
        "deleteCompanyLogo",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent("Delete", "Company logo deleted successfully");
      return res.status(200).json(
        STATUS_CODE[200]({
          message: "Company logo deleted successfully",
        })
      );
    } else {
      await transaction.rollback();
      logStructured(
        "error",
        "failed to delete company logo",
        "deleteCompanyLogo",
        "aiTrustCentre.ctrl.ts"
      );
      await logEvent("Error", "Failed to delete company logo");
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to delete company logo",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      "unexpected error deleting company logo",
      "deleteCompanyLogo",
      "aiTrustCentre.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error deleting company logo: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteCompanyLogo:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
