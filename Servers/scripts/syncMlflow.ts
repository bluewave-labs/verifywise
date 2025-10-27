#!/usr/bin/env node
import dotenv from "dotenv";
import { sequelize } from "../database/db";
import { MLFlowService, MLFlowModel } from "../src/services/mlflow.service";

dotenv.config();

type SyncedModel = Pick<
  MLFlowModel,
  "name" | "lifecycle_stage" | "metrics" | "tags" | "training_ended_at" | "run_id"
>;

const parseOrganizationId = (): number => {
  const arg = process.argv.find(
    (value: string) =>
      value.startsWith("--org=") || value.startsWith("--organization="),
  );
  if (arg) {
    const [, raw] = arg.split("=");
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1;
};

(async () => {
  const organizationId = parseOrganizationId();
  const service = new MLFlowService();
  try {
    await sequelize.authenticate();
    const models: SyncedModel[] = await service.getModels(organizationId);
    await service.recordSyncResult(
      organizationId,
      "success",
      `Synced ${models.length} model(s) via CLI`,
    );
    console.table(
      models.map((model: SyncedModel) => ({
        model_name: model.name,
        stage: model.lifecycle_stage,
        key_metric: Object.entries(model.metrics || {})[0]?.join(": ") || "-",
        owner: model.tags?.["mlflow.user"] || "n/a",
        last_trained: model.training_ended_at
          ? new Date(model.training_ended_at).toISOString()
          : "n/a",
        run_id: model.run_id,
      })),
    );
    console.log(
      `✅ Synced ${models.length} model(s) from MLFlow for organization ${organizationId}`,
    );
  } catch (error) {
    console.error("❌ Failed to sync MLFlow models:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    await service.recordSyncResult(organizationId, "error", message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
