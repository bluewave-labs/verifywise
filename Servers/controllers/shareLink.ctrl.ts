import { Request, Response } from "express";
import { sequelize } from "../database/db";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import { logEvent } from "../utils/logger/dbLogger";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { ShareLinkModel } from "../domain.layer/models/shareLink/shareLink.model";
import { IShareLinkCreate, IShareLinkUpdate } from "../domain.layer/interfaces/i.shareLink";

/**
 * Create a new share link
 * POST /api/shares
 */
export const createShareLink = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  const { resource_type, resource_id, settings, expires_at }: IShareLinkCreate = req.body;

  logStructured('processing', `starting share link creation for ${resource_type} ${resource_id}`, 'createShareLink', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Creating share link for ${resource_type} ${resource_id}`);

  try {
    // Validate required fields
    if (!resource_type || !resource_id) {
      throw new ValidationException("resource_type and resource_id are required");
    }

    // Create the share link
    const shareLink = await ShareLinkModel.create(
      {
        resource_type,
        resource_id,
        created_by: req.userId!,
        settings: settings || {
          shareAllFields: false,
          allowDataExport: true,
          allowViewersToOpenRecords: false,
          displayToolbar: true,
        },
        is_enabled: true,
        expires_at: expires_at ? new Date(expires_at) : undefined,
      },
      { transaction }
    );

    logStructured('successful', `created share link ${shareLink.id}`, 'createShareLink', 'shareLink.ctrl.ts');
    logger.debug(`✅ Created share link: ${shareLink.id}`);

    await transaction.commit();

    const response = {
      ...shareLink.toSafeJSON(),
      shareable_url: shareLink.getShareableUrl(),
    };

    return res.status(201).json(STATUS_CODE[201](response));
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationException) {
      logStructured('error', `validation failed: ${error.message}`, 'createShareLink', 'shareLink.ctrl.ts');
      await logEvent('Error', `Validation error during share link creation: ${error.message}`);
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured('error', `unexpected error creating share link`, 'createShareLink', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error during share link creation: ${(error as Error).message}`);
    logger.error('❌ Error in createShareLink:', error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

/**
 * Get all share links for a specific resource
 * GET /api/:resourceType/:resourceId/shares
 */
export const getShareLinksForResource = async (req: Request, res: Response) => {
  const { resourceType, resourceId } = req.params;

  logStructured('processing', `fetching share links for ${resourceType} ${resourceId}`, 'getShareLinksForResource', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Fetching share links for ${resourceType} ${resourceId}`);

  try {
    const shareLinks = await ShareLinkModel.findAll({
      where: {
        resource_type: resourceType,
        resource_id: parseInt(resourceId),
      },
      order: [['created_at', 'DESC']],
    });

    logStructured('successful', `fetched ${shareLinks.length} share links`, 'getShareLinksForResource', 'shareLink.ctrl.ts');
    logger.debug(`✅ Fetched ${shareLinks.length} share links`);

    const response = shareLinks.map(link => ({
      ...link.toSafeJSON(),
      shareable_url: link.getShareableUrl(),
      is_valid: link.isValid(),
    }));

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    logStructured('error', `unexpected error fetching share links`, 'getShareLinksForResource', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error fetching share links: ${(error as Error).message}`);
    logger.error('❌ Error in getShareLinksForResource:', error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

/**
 * Get a share link by token (public endpoint - no auth required)
 * GET /api/shares/:token
 */
export const getShareLinkByToken = async (req: Request, res: Response) => {
  const { token } = req.params;

  logStructured('processing', `fetching share link by token`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Fetching share link by token`);

  try {
    const shareLink = await ShareLinkModel.findOne({
      where: {
        share_token: token,
      },
    });

    if (!shareLink) {
      logStructured('error', `share link not found`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
      return res.status(404).json(STATUS_CODE[404]({ message: "Share link not found" }));
    }

    if (!shareLink.isValid()) {
      logStructured('error', `share link is disabled or expired`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
      return res.status(403).json(STATUS_CODE[403]({ message: "Share link is disabled or expired" }));
    }

    logStructured('successful', `fetched share link ${shareLink.id}`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
    logger.debug(`✅ Fetched share link: ${shareLink.id}`);

    const response = {
      ...shareLink.toSafeJSON(),
      is_valid: true,
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    logStructured('error', `unexpected error fetching share link`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error fetching share link: ${(error as Error).message}`);
    logger.error('❌ Error in getShareLinkByToken:', error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

/**
 * Update a share link
 * PATCH /api/shares/:id
 */
export const updateShareLink = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  const { id } = req.params;
  const { settings, is_enabled, expires_at }: IShareLinkUpdate = req.body;

  logStructured('processing', `updating share link ${id}`, 'updateShareLink', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Updating share link: ${id}`);

  try {
    const shareLink = await ShareLinkModel.findByPk(parseInt(id), { transaction });

    if (!shareLink) {
      await transaction.rollback();
      logStructured('error', `share link not found: ${id}`, 'updateShareLink', 'shareLink.ctrl.ts');
      return res.status(404).json(STATUS_CODE[404]({ message: "Share link not found" }));
    }

    // Check if user owns this share link
    if (shareLink.created_by !== req.userId) {
      await transaction.rollback();
      logStructured('error', `unauthorized access to share link ${id}`, 'updateShareLink', 'shareLink.ctrl.ts');
      return res.status(403).json(STATUS_CODE[403]({ message: "Unauthorized" }));
    }

    // Update fields
    if (settings) shareLink.settings = settings;
    if (typeof is_enabled === 'boolean') shareLink.is_enabled = is_enabled;
    if (expires_at) shareLink.expires_at = new Date(expires_at);

    await shareLink.save({ transaction });

    logStructured('successful', `updated share link ${id}`, 'updateShareLink', 'shareLink.ctrl.ts');
    logger.debug(`✅ Updated share link: ${id}`);

    await transaction.commit();

    const response = {
      ...shareLink.toSafeJSON(),
      shareable_url: shareLink.getShareableUrl(),
      is_valid: shareLink.isValid(),
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    await transaction.rollback();
    logStructured('error', `unexpected error updating share link ${id}`, 'updateShareLink', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error updating share link: ${(error as Error).message}`);
    logger.error('❌ Error in updateShareLink:', error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

/**
 * Delete a share link
 * DELETE /api/shares/:id
 */
export const deleteShareLink = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  const { id } = req.params;

  logStructured('processing', `deleting share link ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Deleting share link: ${id}`);

  try {
    const shareLink = await ShareLinkModel.findByPk(parseInt(id), { transaction });

    if (!shareLink) {
      await transaction.rollback();
      logStructured('error', `share link not found: ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
      return res.status(404).json(STATUS_CODE[404]({ message: "Share link not found" }));
    }

    // Check if user owns this share link
    if (shareLink.created_by !== req.userId) {
      await transaction.rollback();
      logStructured('error', `unauthorized access to share link ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
      return res.status(403).json(STATUS_CODE[403]({ message: "Unauthorized" }));
    }

    await shareLink.destroy({ transaction });

    logStructured('successful', `deleted share link ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
    logger.debug(`✅ Deleted share link: ${id}`);

    await transaction.commit();
    return res.status(200).json(STATUS_CODE[200]({ message: "Share link deleted successfully" }));
  } catch (error) {
    await transaction.rollback();
    logStructured('error', `unexpected error deleting share link ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error deleting share link: ${(error as Error).message}`);
    logger.error('❌ Error in deleteShareLink:', error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};
