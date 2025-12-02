import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import { logEvent } from "../utils/logger/dbLogger";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { IShareLinkCreate, IShareLinkUpdate } from "../domain.layer/interfaces/i.shareLink";
import crypto from "crypto";
import {
  isValidTenantHash,
  isValidResourceType,
  isValidShareToken,
  sanitizeErrorMessage,
  safeSQLIdentifier,
} from "../utils/security.utils";

/**
 * Create a new share link
 * POST /api/shares
 */
export const createShareLink = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  const { resource_type, resource_id, settings, expires_at }: IShareLinkCreate = req.body;
  const tenantId = req.tenantId!;

  logStructured('processing', `starting share link creation`, 'createShareLink', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Creating share link in tenant ${tenantId}`);

  try {
    // Validate tenant hash format
    if (!isValidTenantHash(tenantId)) {
      throw new ValidationException("Invalid tenant identifier");
    }

    // Validate required fields
    if (!resource_type || resource_id === undefined || resource_id === null) {
      throw new ValidationException("resource_type and resource_id are required");
    }

    // Validate resource type
    if (!isValidResourceType(resource_type)) {
      throw new ValidationException("Invalid resource type");
    }

    // Validate resource_id is a non-negative integer
    // Note: resource_id can be 0 to share entire table/list view
    if (typeof resource_id !== 'number' || resource_id < 0 || !Number.isInteger(resource_id)) {
      throw new ValidationException("Invalid resource ID");
    }

    // Generate unique share token
    const share_token = crypto.randomBytes(32).toString("hex");

    // Default settings
    const defaultSettings = {
      shareAllFields: false,
      allowDataExport: true,
      allowViewersToOpenRecords: false,
    };

    const finalSettings = settings || defaultSettings;

    // Validate and sanitize tenant ID before using in SQL
    const safeTenantId = safeSQLIdentifier(tenantId);

    // Create the share link using raw SQL with tenant schema
    const createQuery = `
      INSERT INTO "${safeTenantId}".share_links
      (share_token, resource_type, resource_id, created_by, settings, is_enabled, expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;
    `;

    const result = await sequelize.query(createQuery, {
      bind: [
        share_token,
        resource_type,
        resource_id,
        req.userId!,
        JSON.stringify(finalSettings),
        true,
        expires_at ? new Date(expires_at) : null,
      ],
      transaction,
      type: QueryTypes.INSERT,
    }) as any;

    const shareLink = result[0][0];

    logStructured('successful', `created share link ${shareLink.id}`, 'createShareLink', 'shareLink.ctrl.ts');
    logger.debug(`✅ Created share link: ${shareLink.id}`);

    await transaction.commit();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareable_url = `${baseUrl}/shared/${resource_type}s/${share_token}`;

    const response = {
      id: shareLink.id,
      share_token: shareLink.share_token,
      resource_type: shareLink.resource_type,
      resource_id: shareLink.resource_id,
      settings: shareLink.settings,
      is_enabled: shareLink.is_enabled,
      expires_at: shareLink.expires_at,
      created_at: shareLink.created_at,
      updated_at: shareLink.updated_at,
      shareable_url,
    };

    return res.status(201).json(STATUS_CODE[201](response));
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationException) {
      logStructured('error', `validation failed: ${error.message}`, 'createShareLink', 'shareLink.ctrl.ts');
      await logEvent('Error', `Validation error during share link creation: ${error.message}`, req.userId!, tenantId);
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured('error', `unexpected error creating share link`, 'createShareLink', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error during share link creation: ${(error as Error).message}`, req.userId!, tenantId);
    logger.error('❌ Error in createShareLink:', error);

    // Sanitize error message before sending to client
    const safeMessage = sanitizeErrorMessage(error as Error, "Failed to create share link");
    return res.status(500).json(STATUS_CODE[500](safeMessage));
  }
};

/**
 * Get all share links for a specific resource
 * GET /api/shares/:resourceType/:resourceId
 */
export const getShareLinksForResource = async (req: Request, res: Response) => {
  const { resourceType, resourceId } = req.params;
  const tenantId = req.tenantId!;

  logStructured('processing', `fetching share links`, 'getShareLinksForResource', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Fetching share links in tenant ${tenantId}`);

  try {
    // Validate tenant hash
    if (!isValidTenantHash(tenantId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid tenant identifier"));
    }

    // Validate resource type
    if (!isValidResourceType(resourceType)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid resource type"));
    }

    // Validate resource ID (can be 0 for table views)
    const resourceIdNum = parseInt(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum < 0) {
      return res.status(400).json(STATUS_CODE[400]("Invalid resource ID"));
    }

    const safeTenantId = safeSQLIdentifier(tenantId);

    const query = `
      SELECT * FROM "${safeTenantId}".share_links
      WHERE resource_type = $1 AND resource_id = $2
      ORDER BY created_at DESC;
    `;

    const shareLinks = await sequelize.query(query, {
      bind: [resourceType, parseInt(resourceId)],
      type: QueryTypes.SELECT,
    }) as any[];

    logStructured('successful', `fetched ${shareLinks.length} share links`, 'getShareLinksForResource', 'shareLink.ctrl.ts');
    logger.debug(`✅ Fetched ${shareLinks.length} share links`);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const response = shareLinks.map(link => {
      const shareable_url = `${baseUrl}/shared/${link.resource_type}s/${link.share_token}`;
      const is_valid = link.is_enabled && (!link.expires_at || new Date() <= new Date(link.expires_at));

      return {
        id: link.id,
        share_token: link.share_token,
        resource_type: link.resource_type,
        resource_id: link.resource_id,
        settings: link.settings,
        is_enabled: link.is_enabled,
        expires_at: link.expires_at,
        created_at: link.created_at,
        updated_at: link.updated_at,
        shareable_url,
        is_valid,
      };
    });

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    logStructured('error', `unexpected error fetching share links`, 'getShareLinksForResource', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error fetching share links: ${(error as Error).message}`, req.userId!, tenantId);
    logger.error('❌ Error in getShareLinksForResource:', error);
    const safeMessage = sanitizeErrorMessage(error as Error, "Failed to fetch share links");
    return res.status(500).json(STATUS_CODE[500](safeMessage));
  }
};

/**
 * Get a share link by token (public endpoint - no auth required)
 * Searches across all tenant schemas to find the share link
 * GET /api/shares/token/:token
 */
export const getShareLinkByToken = async (req: Request, res: Response) => {
  const { token } = req.params;

  logStructured('processing', `fetching share link by token`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Fetching share link by token`);

  try {
    // Validate token format to prevent injection and enumeration
    if (!isValidShareToken(token)) {
      return res.status(400).json(STATUS_CODE[400]({ message: "Invalid share link format" }));
    }

    // Get all tenant schemas
    const schemasQuery = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
        AND schema_name NOT LIKE 'pg_%';
    `;

    const schemas = await sequelize.query(schemasQuery, {
      type: QueryTypes.SELECT,
    }) as { schema_name: string }[];

    let shareLink: any = null;
    let tenantSchema: string | null = null;

    // Search for the share link across all tenant schemas
    for (const schema of schemas) {
      const query = `
        SELECT * FROM "${schema.schema_name}".share_links
        WHERE share_token = $1
        LIMIT 1;
      `;

      const result = await sequelize.query(query, {
        bind: [token],
        type: QueryTypes.SELECT,
      }) as any[];

      if (result.length > 0) {
        shareLink = result[0];
        tenantSchema = schema.schema_name;
        break;
      }
    }

    if (!shareLink) {
      logStructured('error', `share link not found`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
      return res.status(404).json(STATUS_CODE[404]({ message: "Share link not found" }));
    }

    // Validate the share link
    const is_valid = shareLink.is_enabled && (!shareLink.expires_at || new Date() <= new Date(shareLink.expires_at));

    if (!is_valid) {
      logStructured('error', `share link is disabled or expired`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
      return res.status(403).json(STATUS_CODE[403]({ message: "Share link is disabled or expired" }));
    }

    logStructured('successful', `fetched share link ${shareLink.id}`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
    logger.debug(`✅ Fetched share link: ${shareLink.id} from tenant ${tenantSchema}`);

    const response = {
      id: shareLink.id,
      share_token: shareLink.share_token,
      resource_type: shareLink.resource_type,
      resource_id: shareLink.resource_id,
      settings: shareLink.settings,
      is_enabled: shareLink.is_enabled,
      expires_at: shareLink.expires_at,
      created_at: shareLink.created_at,
      updated_at: shareLink.updated_at,
      is_valid: true,
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    logStructured('error', `unexpected error fetching share link`, 'getShareLinkByToken', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error fetching share link: ${(error as Error).message}`, req.userId!, req.tenantId!);
    logger.error('❌ Error in getShareLinkByToken:', error);
    const safeMessage = sanitizeErrorMessage(error as Error, "An error occurred");
    return res.status(500).json(STATUS_CODE[500](safeMessage));
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
  const tenantId = req.tenantId!;

  logStructured('processing', `updating share link ${id} with body: ${JSON.stringify(req.body)}`, 'updateShareLink', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Updating share link: ${id} in tenant ${tenantId}`);
  console.log(`[UPDATE DEBUG] ID: ${id}, is_enabled: ${is_enabled} (type: ${typeof is_enabled}), settings: ${JSON.stringify(settings)}`);

  try {
    // Validate tenant hash format
    if (!isValidTenantHash(tenantId)) {
      await transaction.rollback();
      throw new ValidationException("Invalid tenant identifier");
    }

    const safeTenantId = safeSQLIdentifier(tenantId);

    // First, fetch the share link to verify ownership
    const selectQuery = `
      SELECT * FROM "${safeTenantId}".share_links
      WHERE id = $1
      LIMIT 1;
    `;

    const result = await sequelize.query(selectQuery, {
      bind: [parseInt(id)],
      transaction,
      type: QueryTypes.SELECT,
    }) as any[];

    if (result.length === 0) {
      await transaction.rollback();
      logStructured('error', `share link not found: ${id}`, 'updateShareLink', 'shareLink.ctrl.ts');
      return res.status(404).json(STATUS_CODE[404]({ message: "Share link not found" }));
    }

    const shareLink = result[0];
    console.log(`[UPDATE DEBUG] Current state before update - ID: ${shareLink.id}, is_enabled: ${shareLink.is_enabled}`);

    // Check if user owns this share link
    if (shareLink.created_by !== req.userId) {
      await transaction.rollback();
      logStructured('error', `unauthorized access to share link ${id}`, 'updateShareLink', 'shareLink.ctrl.ts');
      return res.status(403).json(STATUS_CODE[403]({ message: "Unauthorized" }));
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const binds: any[] = [];
    let bindIndex = 1;

    if (settings !== undefined) {
      updates.push(`settings = $${bindIndex++}`);
      binds.push(JSON.stringify(settings));
    }

    if (typeof is_enabled === 'boolean') {
      updates.push(`is_enabled = $${bindIndex++}`);
      binds.push(is_enabled);
    }

    if (expires_at !== undefined) {
      updates.push(`expires_at = $${bindIndex++}`);
      binds.push(expires_at ? new Date(expires_at) : null);
    }

    if (updates.length === 0) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]({ message: "No fields to update" }));
    }

    updates.push(`updated_at = NOW()`);
    binds.push(parseInt(id));

    const updateQuery = `
      UPDATE "${safeTenantId}".share_links
      SET ${updates.join(', ')}
      WHERE id = $${bindIndex}
      RETURNING *;
    `;

    const updateResult = await sequelize.query(updateQuery, {
      bind: binds,
      transaction,
      type: QueryTypes.UPDATE,
    }) as any;

    const updatedLink = updateResult[0][0];

    console.log(`[UPDATE DEBUG] After update - ID: ${updatedLink.id}, is_enabled: ${updatedLink.is_enabled} (type: ${typeof updatedLink.is_enabled})`);
    logStructured('successful', `updated share link ${id} - new is_enabled: ${updatedLink.is_enabled}`, 'updateShareLink', 'shareLink.ctrl.ts');
    logger.debug(`✅ Updated share link: ${id}`);

    await transaction.commit();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareable_url = `${baseUrl}/shared/${updatedLink.resource_type}s/${updatedLink.share_token}`;
    const is_valid = updatedLink.is_enabled && (!updatedLink.expires_at || new Date() <= new Date(updatedLink.expires_at));

    const response = {
      id: updatedLink.id,
      share_token: updatedLink.share_token,
      resource_type: updatedLink.resource_type,
      resource_id: updatedLink.resource_id,
      settings: updatedLink.settings,
      is_enabled: updatedLink.is_enabled,
      expires_at: updatedLink.expires_at,
      created_at: updatedLink.created_at,
      updated_at: updatedLink.updated_at,
      shareable_url,
      is_valid,
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    await transaction.rollback();
    logStructured('error', `unexpected error updating share link ${id}`, 'updateShareLink', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error updating share link: ${(error as Error).message}`, req.userId!, tenantId);
    logger.error('❌ Error in updateShareLink:', error);
    const safeMessage = sanitizeErrorMessage(error as Error, "An error occurred");
    return res.status(500).json(STATUS_CODE[500](safeMessage));
  }
};

/**
 * Delete a share link
 * DELETE /api/shares/:id
 */
export const deleteShareLink = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  const { id } = req.params;
  const tenantId = req.tenantId!;

  logStructured('processing', `deleting share link ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Deleting share link: ${id} in tenant ${tenantId}`);

  try {
    // Validate tenant hash format
    if (!isValidTenantHash(tenantId)) {
      await transaction.rollback();
      throw new ValidationException("Invalid tenant identifier");
    }

    const safeTenantId = safeSQLIdentifier(tenantId);

    // First, fetch the share link to verify ownership
    const selectQuery = `
      SELECT * FROM "${safeTenantId}".share_links
      WHERE id = $1
      LIMIT 1;
    `;

    const result = await sequelize.query(selectQuery, {
      bind: [parseInt(id)],
      transaction,
      type: QueryTypes.SELECT,
    }) as any[];

    if (result.length === 0) {
      await transaction.rollback();
      logStructured('error', `share link not found: ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
      return res.status(404).json(STATUS_CODE[404]({ message: "Share link not found" }));
    }

    const shareLink = result[0];

    // Check if user owns this share link
    if (shareLink.created_by !== req.userId) {
      await transaction.rollback();
      logStructured('error', `unauthorized access to share link ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
      return res.status(403).json(STATUS_CODE[403]({ message: "Unauthorized" }));
    }

    // Delete the share link
    const deleteQuery = `
      DELETE FROM "${safeTenantId}".share_links
      WHERE id = $1;
    `;

    await sequelize.query(deleteQuery, {
      bind: [parseInt(id)],
      transaction,
      type: QueryTypes.DELETE,
    });

    logStructured('successful', `deleted share link ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
    logger.debug(`✅ Deleted share link: ${id}`);

    await transaction.commit();
    return res.status(200).json(STATUS_CODE[200]({ message: "Share link deleted successfully" }));
  } catch (error) {
    await transaction.rollback();
    logStructured('error', `unexpected error deleting share link ${id}`, 'deleteShareLink', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error deleting share link: ${(error as Error).message}`, req.userId!, tenantId);
    logger.error('❌ Error in deleteShareLink:', error);
    const safeMessage = sanitizeErrorMessage(error as Error, "An error occurred");
    return res.status(500).json(STATUS_CODE[500](safeMessage));
  }
};

/**
 * Get shared data by token (public endpoint - no auth required)
 * Fetches the actual resource data with settings-based filtering
 * GET /api/shares/view/:token
 */
export const getSharedDataByToken = async (req: Request, res: Response) => {
  const { token } = req.params;

  logStructured('processing', `fetching shared data by token`, 'getSharedDataByToken', 'shareLink.ctrl.ts');
  logger.debug(`🛠️ Fetching shared data by token`);

  try {
    // First, get the share link metadata (reuse existing logic)
    const schemasQuery = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
        AND schema_name NOT LIKE 'pg_%';
    `;

    const schemas = await sequelize.query(schemasQuery, {
      type: QueryTypes.SELECT,
    }) as { schema_name: string }[];

    let shareLink: any = null;
    let tenantSchema: string | null = null;

    // Search for the share link across all tenant schemas
    for (const schema of schemas) {
      const query = `
        SELECT * FROM "${schema.schema_name}".share_links
        WHERE share_token = $1
        LIMIT 1;
      `;

      const result = await sequelize.query(query, {
        bind: [token],
        type: QueryTypes.SELECT,
      }) as any[];

      if (result.length > 0) {
        shareLink = result[0];
        tenantSchema = schema.schema_name;
        break;
      }
    }

    if (!shareLink) {
      logStructured('error', `share link not found`, 'getSharedDataByToken', 'shareLink.ctrl.ts');
      return res.status(404).json(STATUS_CODE[404]({ message: "Share link not found" }));
    }

    // Log share link details for debugging
    logStructured('processing', `validating share link: id=${shareLink.id}, is_enabled=${shareLink.is_enabled} (type: ${typeof shareLink.is_enabled}), expires_at=${shareLink.expires_at}`, 'getSharedDataByToken', 'shareLink.ctrl.ts');

    // Validate the share link
    const is_valid = shareLink.is_enabled && (!shareLink.expires_at || new Date() <= new Date(shareLink.expires_at));

    logStructured('processing', `validation result: is_valid=${is_valid}, is_enabled=${shareLink.is_enabled}, expires_check=${!shareLink.expires_at || new Date() <= new Date(shareLink.expires_at)}`, 'getSharedDataByToken', 'shareLink.ctrl.ts');

    if (!is_valid) {
      logStructured('error', `share link is disabled or expired`, 'getSharedDataByToken', 'shareLink.ctrl.ts');
      return res.status(403).json(STATUS_CODE[403]({ message: "Share link is disabled or expired" }));
    }

    // Fetch the actual resource data based on resource_type
    let resourceData: any = null;
    const resourceType = shareLink.resource_type;
    const resourceId = shareLink.resource_id;

    // Map resource types to table names
    const tableNameMap: { [key: string]: string } = {
      'model': 'model_inventories',
      'vendor': 'vendors',
      'project': 'projects',
      'policy': 'policies',
      'risk': 'projectrisks',
    };

    const tableName = tableNameMap[resourceType];

    if (!tableName) {
      logStructured('error', `unsupported resource type: ${resourceType}`, 'getSharedDataByToken', 'shareLink.ctrl.ts');
      return res.status(400).json(STATUS_CODE[400]({ message: `Unsupported resource type: ${resourceType}` }));
    }

    // Fetch the resource data
    let resourceQuery: string;
    let resourceResult: any[];

    // If resource_id is 0, fetch all records (table view)
    // Otherwise, fetch specific record
    if (resourceId === 0) {
      // For model_inventories, join with users table to get approver name
      if (resourceType === 'model') {
        resourceQuery = `
          SELECT
            mi.*,
            COALESCE(
              NULLIF(TRIM(CONCAT(COALESCE(u.name, ''), ' ', COALESCE(u.surname, ''))), ''),
              NULL
            ) as approver_name
          FROM "${tenantSchema}".${tableName} mi
          LEFT JOIN public.users u ON mi.approver = u.id
          ORDER BY mi.id DESC
          LIMIT 100;
        `;
      } else {
        resourceQuery = `
          SELECT * FROM "${tenantSchema}".${tableName}
          ORDER BY id DESC
          LIMIT 100;
        `;
      }

      resourceResult = await sequelize.query(resourceQuery, {
        type: QueryTypes.SELECT,
      }) as any[];

      // For table views, allow empty arrays (don't return 404)
      if (resourceResult.length === 0) {
        logStructured('successful', `no resources found for ${resourceType} table view, returning empty array`, 'getSharedDataByToken', 'shareLink.ctrl.ts');
      }

      resourceData = resourceResult; // Return array of records for table view (can be empty)
    } else {
      // Fetch single record
      resourceQuery = `
        SELECT * FROM "${tenantSchema}".${tableName}
        WHERE id = $1
        LIMIT 1;
      `;

      resourceResult = await sequelize.query(resourceQuery, {
        bind: [resourceId],
        type: QueryTypes.SELECT,
      }) as any[];

      if (resourceResult.length === 0) {
        logStructured('error', `resource not found: ${resourceType} ${resourceId}`, 'getSharedDataByToken', 'shareLink.ctrl.ts');
        return res.status(404).json(STATUS_CODE[404]({ message: "Resource not found" }));
      }

      resourceData = resourceResult[0]; // Return single record
    }

    // Apply settings-based filtering
    const settings = shareLink.settings || {};

    console.log(`[SHARE VIEW DEBUG] Settings from DB:`, JSON.stringify(settings));
    console.log(`[SHARE VIEW DEBUG] shareAllFields value:`, settings.shareAllFields, `(type: ${typeof settings.shareAllFields})`);
    console.log(`[SHARE VIEW DEBUG] Resource data sample (first record):`, Array.isArray(resourceData) && resourceData[0] ? Object.keys(resourceData[0]) : 'no data');

    // If shareAllFields is false, filter fields shown
    let filteredData;

    if (settings.shareAllFields === true) {
      // Show all fields
      console.log(`[SHARE VIEW DEBUG] Showing ALL fields (shareAllFields is true)`);
      filteredData = resourceData;
    } else {
      // Show only essential fields based on resource type
      console.log(`[SHARE VIEW DEBUG] Filtering to essential fields (shareAllFields is ${settings.shareAllFields})`);
      const getEssentialFields = (record: any, resourceType: string) => {
        // Resource-specific essential fields
        switch (resourceType) {
          case 'model':
            // Consolidate provider/model columns into a single display name
            // Use provider_model if available, otherwise construct from provider + model
            let modelName = record.provider_model;
            if (!modelName) {
              // Check if model already contains provider prefix (e.g., "OpenAI - gpt-3.5-turbo")
              const modelValue = record.model || '';
              const providerValue = record.provider || '';
              if (modelValue.includes(' - ') && modelValue.toLowerCase().includes(providerValue.toLowerCase())) {
                // Model already contains provider prefix, use as-is
                modelName = modelValue;
              } else if (providerValue && modelValue) {
                // Construct combined name
                modelName = `${providerValue} - ${modelValue}`;
              } else {
                // Fallback to whatever is available
                modelName = modelValue || providerValue || 'Unknown';
              }
            }
            return {
              id: record.id,
              model_name: modelName,
              version: record.version,
              status: record.status,
              created_at: record.created_at,
              updated_at: record.updated_at,
            };
          case 'vendor':
          case 'project':
          case 'policy':
          case 'risk':
          default:
            // Generic fallback for other resource types
            return {
              id: record.id,
              name: record.name || record.title || record.model_name,
              description: record.description,
              created_at: record.created_at,
              updated_at: record.updated_at,
            };
        }
      };

      if (Array.isArray(resourceData)) {
        // For table view (array of records), filter each record
        filteredData = resourceData.map(record => getEssentialFields(record, resourceType));
      } else {
        // For single record, filter fields
        filteredData = getEssentialFields(resourceData, resourceType);
      }
    }

    console.log(`[SHARE VIEW DEBUG] Filtered data sample (first record):`, Array.isArray(filteredData) && filteredData[0] ? Object.keys(filteredData[0]) : 'no data');
    console.log(`[SHARE VIEW DEBUG] Column count - Original: ${Array.isArray(resourceData) && resourceData[0] ? Object.keys(resourceData[0]).length : 0}, Filtered: ${Array.isArray(filteredData) && filteredData[0] ? Object.keys(filteredData[0]).length : 0}`);

    // Post-process: For models, consolidate provider_model and replace approver ID
    if (resourceType === 'model' && filteredData) {
      const processRecord = (record: any) => {
        let result = { ...record };

        // Consolidate provider_model: if empty, construct from provider + model
        if (!result.provider_model && (result.provider || result.model)) {
          const modelValue = result.model || '';
          const providerValue = result.provider || '';

          // Check if model already contains provider prefix (e.g., "OpenAI - gpt-3.5-turbo")
          if (modelValue.includes(' - ') && providerValue && modelValue.toLowerCase().includes(providerValue.toLowerCase())) {
            result.provider_model = modelValue;
          } else if (providerValue && modelValue) {
            result.provider_model = `${providerValue} ${modelValue}`;
          } else {
            result.provider_model = modelValue || providerValue || '';
          }
        }

        // Remove redundant provider and model columns when we have provider_model
        if (result.provider_model) {
          const { provider, model, ...rest } = result;
          result = { provider_model: result.provider_model, ...rest };
        }

        // If we have approver_name from the JOIN, use it; otherwise keep the ID
        if (result.approver_name !== undefined) {
          const { approver_name, approver, ...rest } = result;
          // Use the name if it exists, otherwise fallback to "User ID: {approver}"
          return { ...rest, approver: approver_name || `User ID: ${approver}` };
        }
        return result;
      };

      if (Array.isArray(filteredData)) {
        filteredData = filteredData.map(processRecord);
      } else {
        filteredData = processRecord(filteredData);
      }

      console.log(`[SHARE VIEW DEBUG] After approver name replacement, sample:`, Array.isArray(filteredData) && filteredData[0] ? filteredData[0] : filteredData);
    }

    logStructured('successful', `fetched shared data for ${resourceType} ${resourceId}`, 'getSharedDataByToken', 'shareLink.ctrl.ts');
    logger.debug(`✅ Fetched shared data from tenant ${tenantSchema}`);

    const response = {
      share_link: {
        resource_type: shareLink.resource_type,
        settings: shareLink.settings,
      },
      data: filteredData,
      permissions: {
        allowDataExport: settings.allowDataExport || false,
        allowViewersToOpenRecords: settings.allowViewersToOpenRecords || false,
      },
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    logStructured('error', `unexpected error fetching shared data`, 'getSharedDataByToken', 'shareLink.ctrl.ts');
    await logEvent('Error', `Unexpected error fetching shared data: ${(error as Error).message}`, req.userId!, req.tenantId!);
    logger.error('❌ Error in getSharedDataByToken:', error);
    const safeMessage = sanitizeErrorMessage(error as Error, "An error occurred");
    return res.status(500).json(STATUS_CODE[500](safeMessage));
  }
};
