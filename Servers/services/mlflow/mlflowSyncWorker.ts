import { Job, Worker } from "bullmq";
import redisClient from "../../database/redis";
import logger from "../../utils/logger/fileLogger";
import { MLFlowService } from "../../src/services/mlflow.service";
import { MLFlowIntegrationModel } from "../../domain.layer/models/mlflowIntegration/mlflowIntegration.model";
import { ValidationException } from "../../domain.layer/exceptions/custom.exception";
import { getTenantHash } from "../../tools/getTenantHash";
import { getAllOrganizationsQuery } from "../../utils/organization.utils";

type SyncJobResult = {
  organizationId: number;
  modelCount: number;
  success: boolean;
  error?: string;
};

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const createMlflowSyncWorker = () => {
  const service = new MLFlowService();

  const syncOrganization = async (
    organizationId: number,
    tenant: string,
  ): Promise<SyncJobResult> => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const models = await service.getModels(tenant);
        const modelCount = models.length;
        logger.info(
          `Synced ${modelCount} MLFlow model(s) for organization ${tenant}`,
        );
        return {
          organizationId,
          modelCount,
          success: true,
        };
      } catch (error) {
        const isValidationError = error instanceof ValidationException;
        const message =
          error instanceof Error ? error.message : "Unknown error";

        if (isValidationError) {
          logger.warn(
            `Skipping MLFlow sync for org ${organizationId}: ${message}`,
          );
          return {
            organizationId,
            modelCount: 0,
            success: false,
            error: message,
          };
        }

        logger.error(
          `MLFlow sync attempt ${attempt} failed for org ${organizationId}: ${message}`,
        );

        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
          logger.debug(
            `Retrying MLFlow sync for org ${organizationId} in ${delay}ms`,
          );
          await sleep(delay);
          continue;
        }

        return {
          organizationId,
          modelCount: 0,
          success: false,
          error: message,
        };
      }
    }

    return {
      organizationId,
      modelCount: 0,
      success: false,
      error: "Unknown error",
    };
  };

  return new Worker(
    "mlflow-sync",
    // async (job: Job): Promise<SyncJobResult[]> => {
    async (job: Job) => {
      logger.debug(`Processing MLFlow sync job ${job.id}...`);
      const organizations = await getAllOrganizationsQuery();
      for (let org of organizations) {
        const tenantHash = getTenantHash(org.id!);
        const integrations = await MLFlowIntegrationModel.findAll({
          attributes: ["organization_id", "last_test_status"],
        });

        if (!integrations.length) {
          logger.info("No MLFlow integrations configured. Skipping sync.");
          return [];
        }

        const results: SyncJobResult[] = [];
        for (const integration of integrations) {
          if (integration.last_test_status !== "success") {
            const reason =
              integration.last_test_status === "error"
                ? "Scheduled sync skipped: last connection test failed"
                : "Scheduled sync skipped: run a successful connection test.";
            logger.info(
              `Skipping MLFlow sync for org ${org.id!} until a successful connection test is recorded.`,
            );
            await service.recordSyncResult("error", tenantHash, reason);
            results.push({
              organizationId: org.id!,
              modelCount: 0,
              success: false,
              error: reason,
            });
            continue;
          }
          const result = await syncOrganization(org.id!, tenantHash);
          const syncMessage = result.success
            ? `Synced ${result.modelCount} model(s) via scheduled job`
            : result.error || "Failed to sync MLFlow models via scheduled job";
          await service.recordSyncResult(
            result.success ? "success" : "error",
            tenantHash,
            syncMessage,
          );
          results.push(result);
        }

        // return results;
      }
    },
    {
      connection: redisClient,
      concurrency: 1,
    },
  );
};
