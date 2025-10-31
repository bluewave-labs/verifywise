import { EvidentlyConfigModel } from "../domain.layer/models/evidently/evidentlyConfig.model";
import { EvidentlyModelModel } from "../domain.layer/models/evidently/evidentlyModel.model";
import {
  NotFoundException,
  ValidationException,
} from "../domain.layer/exceptions/custom.exception";

/**
 * Get Evidently configuration by organization ID
 */
export async function getEvidentlyConfigByOrganizationId(
  organizationId: number
): Promise<EvidentlyConfigModel | null> {
  if (!organizationId) {
    throw new ValidationException("Organization ID is required");
  }

  const config = await EvidentlyConfigModel.findOne({
    where: { organization_id: organizationId },
  });

  return config;
}

/**
 * Get Evidently configuration by user ID
 */
export async function getEvidentlyConfigByUserId(
  userId: number
): Promise<EvidentlyConfigModel | null> {
  if (!userId) {
    throw new ValidationException("User ID is required");
  }

  const config = await EvidentlyConfigModel.findOne({
    where: { user_id: userId },
  });

  return config;
}

/**
 * Create new Evidently configuration
 */
export async function createEvidentlyConfig(data: {
  user_id: number;
  organization_id: number;
  evidently_url: string;
  api_token_encrypted: string;
  api_token_iv: string;
  is_configured: boolean;
}): Promise<EvidentlyConfigModel> {
  // Validate required fields
  if (!data.user_id || !data.organization_id || !data.api_token_encrypted) {
    throw new ValidationException(
      "user_id, organization_id, and api_token_encrypted are required"
    );
  }

  // Check if config already exists for this organization
  const existing = await EvidentlyConfigModel.findOne({
    where: { organization_id: data.organization_id },
  });

  if (existing) {
    throw new ValidationException(
      "Configuration already exists for this organization. Use update instead."
    );
  }

  const config = await EvidentlyConfigModel.create(data as any);
  return config;
}

/**
 * Update existing Evidently configuration
 */
export async function updateEvidentlyConfig(
  organizationId: number,
  data: {
    evidently_url?: string;
    api_token_encrypted?: string;
    api_token_iv?: string;
    is_configured?: boolean;
    last_test_date?: Date;
  }
): Promise<EvidentlyConfigModel> {
  if (!organizationId) {
    throw new ValidationException("Organization ID is required");
  }

  const config = await EvidentlyConfigModel.findOne({
    where: { organization_id: organizationId },
  });

  if (!config) {
    throw new NotFoundException(
      "Configuration not found for this organization"
    );
  }

  await config.update(data);
  return config;
}

/**
 * Delete Evidently configuration
 */
export async function deleteEvidentlyConfig(
  organizationId: number
): Promise<boolean> {
  if (!organizationId) {
    throw new ValidationException("Organization ID is required");
  }

  const config = await EvidentlyConfigModel.findOne({
    where: { organization_id: organizationId },
  });

  if (!config) {
    throw new NotFoundException(
      "Configuration not found for this organization"
    );
  }

  await config.destroy();
  return true;
}

/**
 * Get all monitored models for an organization
 */
export async function getMonitoredModels(
  organizationId: number
): Promise<EvidentlyModelModel[]> {
  if (!organizationId) {
    throw new ValidationException("Organization ID is required");
  }

  const models = await EvidentlyModelModel.findAll({
    where: { organization_id: organizationId },
    order: [["created_at", "DESC"]],
  });

  return models;
}
