import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import { createAITrustCentreResourceQuery, createAITrustCentreSubprocessorQuery, deleteAITrustCentreResourceQuery, deleteAITrustCentreSubprocessorQuery, deleteCompanyLogoQuery, getAITrustCentreOverviewQuery, getAITrustCentrePublicPageQuery, getAITrustCentreResourcesQuery, getAITrustCentreSubprocessorsQuery, getCompanyLogoQuery, updateAITrustCentreOverviewQuery, updateAITrustCentreResourceQuery, updateAITrustCentreSubprocessorQuery, uploadCompanyLogoQuery } from "../utils/aiTrustCentre.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { IAITrustCentreOverview } from "../domain.layer/interfaces/i.aiTrustCentreOverview";
import { IAITrustCentreResources } from "../domain.layer/interfaces/i.aiTrustCentreResources";
import { IAITrustCentreSubprocessors } from "../domain.layer/interfaces/i.aiTrustCentreSubprocessors";

export async function getCompanyLogo(
  req: Request,
  res: Response
) {
  try {
    const { hash } = req.params;
    const logo = await getCompanyLogoQuery(hash);

    if (!logo) {
      return res.status(404).json(STATUS_CODE[404]({
        message: "Company logo not found"
      }));
    }

    return res.status(200).json(STATUS_CODE[200]({
      message: "Company logo retrieved successfully",
      logo
    }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAITrustCentrePublicPage(
  req: Request,
  res: Response
) {
  try {
    const { hash } = req.params;

    const result = await getAITrustCentrePublicPageQuery(hash);
    return res.status(200).json(STATUS_CODE[200]({
      message: "AI Trust Centre public page retrieved successfully",
      trustCentre: result
    }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAITrustCentreOverview(
  req: Request,
  res: Response
) {
  try {
    const overview = await getAITrustCentreOverviewQuery(req.tenantId!);

    return res.status(200).json(STATUS_CODE[200]({
      message: "AI Trust Centre overview retrieved successfully",
      overview
    }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getAITrustCentreResources = async (
  req: Request,
  res: Response
) => {
  try {
    const resources = await getAITrustCentreResourcesQuery(req.tenantId!);

    return res.status(200).json(STATUS_CODE[200]({
      message: "AI Trust Centre resources retrieved successfully",
      resources
    }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getAITrustCentreSubprocessors = async (
  req: Request,
  res: Response
) => {
  try {
    const subprocessors = await getAITrustCentreSubprocessorsQuery(req.tenantId!);

    return res.status(200).json(STATUS_CODE[200]({
      message: "AI Trust Centre subprocessors retrieved successfully",
      subprocessors
    }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAITrustResource(
  req: RequestWithFile,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body as Partial<{
      name: string;
      description: string;
      visible: string;
    }>;

    const file = await uploadFile(req.file as UploadedFile, req.userId!, null, "AI trust center group", req.tenantId!, transaction);

    if (!file || !file.id) {
      await transaction.rollback();
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
      req.tenantId!, transaction
    )

    if (resource) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201]({
        message: "AI Trust Centre resource created successfully",
        resource
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to create AI Trust Centre resource",
        })
      );
    }

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAITrustSubprocessor(
  req: Request,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body as IAITrustCentreSubprocessors

    const subprocessor = await createAITrustCentreSubprocessorQuery(
      {
        name: body.name,
        purpose: body.purpose,
        location: body.location,
        url: body.url,
      },
      req.tenantId!, transaction
    )

    if (subprocessor) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201]({
        message: "AI Trust Centre subprocessor created successfully",
        subprocessor
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to create AI Trust Centre subprocessor",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function uploadCompanyLogo(
  req: RequestWithFile,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const attachment = (req.file as UploadedFile);

    if (!attachment || attachment.mimetype.includes("image/") === false) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "Invalid file, please upload an image file.",
        })
      );
    }

    const file = await uploadFile(attachment, req.userId!, null, "AI trust center group", req.tenantId!, transaction);
    const fileId = file?.id || undefined;

    if (!fileId) {
      await transaction.rollback();
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
    )

    if (upload) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200]({
        message: "Company logo uploaded successfully",
        ...upload
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to upload company logo",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAITrustOverview(
  req: Request,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body as Partial<IAITrustCentreOverview>

    const overview = await updateAITrustCentreOverviewQuery(body, req.tenantId!, transaction)

    if (overview) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200]({
        message: "AI Trust Centre overview updated successfully",
        overview
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to update AI Trust Centre overview",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAITrustResource(
  req: RequestWithFile,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body as (Partial<{
      name: string;
      description: string;
      file_id: number;
      visible: string;
      delete: string;
    }>)

    if ((body.delete && req.file === undefined) || (req.file !== undefined && !body.delete)) {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "No file provided for update",
        })
      );
    }

    let fileId: number | undefined = undefined;
    if (body.delete && req.file !== undefined) {
      const file = await uploadFile(req.file as UploadedFile, req.userId!, null, "AI trust center group", req.tenantId!, transaction);
      fileId = file?.id || undefined;
    }

    const resource = await updateAITrustCentreResourceQuery(
      parseInt(req.params.id),
      {
        name: body.name,
        description: body.description,
        file_id: fileId,
        visible: body.visible === "true",
      },
      body.delete !== undefined ? parseInt(body.delete) : undefined,
      req.tenantId!,
      transaction
    )

    if (resource) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200]({
        message: "AI Trust Centre resource updated successfully",
        resource
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to update AI Trust Centre resource",
        })
      );
    }
  }
  catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAITrustSubprocessor(
  req: Request,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const body = req.body as Partial<{
      name: string;
      purpose: string;
      location: string;
      url: string;
    }>

    const subprocessor = await updateAITrustCentreSubprocessorQuery(
      parseInt(req.params.id),
      body,
      req.tenantId!,
      transaction
    )

    if (subprocessor) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200]({
        message: "AI Trust Centre subprocessor updated successfully",
        subprocessor
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to update AI Trust Centre subprocessor",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAITrustResource(
  req: Request,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const resourceId = parseInt(req.params.id);

    const isDeleted = await deleteAITrustCentreResourceQuery(resourceId, req.tenantId!)

    if (isDeleted) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200]({
        message: "AI Trust Centre resource deleted successfully"
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to delete AI Trust Centre resource",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAITrustSubprocessor(
  req: Request,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const subprocessorId = parseInt(req.params.id);

    const isDeleted = await deleteAITrustCentreSubprocessorQuery(subprocessorId, req.tenantId!)

    if (isDeleted) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200]({
        message: "AI Trust Centre subprocessor deleted successfully"
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to delete AI Trust Centre subprocessor",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteCompanyLogo(
  req: Request,
  res: Response
) {
  const transaction = await sequelize.transaction();
  try {
    const isDeleted = await deleteCompanyLogoQuery(req.tenantId!, transaction);

    if (isDeleted) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200]({
        message: "Company logo deleted successfully"
      }));
    } else {
      await transaction.rollback();
      return res.status(503).json(
        STATUS_CODE[503]({
          message: "Failed to delete company logo",
        })
      );
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}