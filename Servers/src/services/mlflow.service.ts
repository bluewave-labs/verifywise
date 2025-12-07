import axios, { AxiosRequestConfig } from "axios";
import https from "https";
import { ValidationException } from "../../domain.layer/exceptions/custom.exception";
// import {
//   MLFlowIntegrationModel,
// } from "../../domain.layer/models/mlflowIntegration/mlflowIntegration.model";
// import { MLFlowModelRecordModel } from "../../domain.layer/models/mlflowModelRecord/mlflowModelRecord.model";
import {
  MLFlowAuthMethod,
  MLFlowTestStatus,
  MLFlowSyncStatus,
  IMLFlowIntegration,
} from "../../domain.layer/interfaces/i.mlflowIntegration";
import {
  decryptText,
  encryptText,
  EncryptedResult,
} from "../../tools/createSecureValue";
import { sequelize } from "../../database/db";

export interface MLFlowModel {
  id: string;
  name: string;
  version: string;
  lifecycle_stage: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
  description?: string;
  run_id?: string;
  source?: string;
  status?: string;
  tags?: Record<string, string>;
  metrics?: Record<string, number>;
  parameters?: Record<string, string>;
  experiment_info?: {
    experiment_id: string;
    experiment_name: string;
    artifact_location: string;
  };
  training_status?: string;
  training_started_at?: number;
  training_ended_at?: number;
  source_version?: string;
}

interface RuntimeMLFlowConfig {
  trackingServerUrl: string;
  authMethod: MLFlowAuthMethod;
  username?: string;
  password?: string;
  apiToken?: string;
  timeout: number;
  verifySsl: boolean;
}

interface SaveConfigurationPayload {
  trackingServerUrl: string;
  authMethod: MLFlowAuthMethod;
  username?: string;
  password?: string;
  apiToken?: string;
  timeout?: number;
  verifySsl?: boolean;
}

interface SanitizedConfigResponse {
  configured: boolean;
  config?: {
    trackingServerUrl: string;
    authMethod: MLFlowAuthMethod;
    timeout: number;
    verifySsl: boolean;
    hasStoredUsername: boolean;
    hasStoredPassword: boolean;
    hasStoredApiToken: boolean;
    lastTestedAt?: Date | null;
    lastTestStatus?: MLFlowTestStatus | null;
    lastTestMessage?: string | null;
    lastSuccessfulTestAt?: Date | null;
    lastFailedTestAt?: Date | null;
    lastFailedTestMessage?: string | null;
    lastSyncedAt?: Date | null;
    lastSyncStatus?: MLFlowSyncStatus | null;
    lastSyncMessage?: string | null;
    updatedAt?: Date | null;
    updatedBy?: number | null;
  };
}

class MLFlowService {
  private transformRunToModel(
    run: any,
    experimentsMap: Map<
      string,
      { name?: string; artifact_location?: string | null }
    >,
  ): MLFlowModel | null {
    const runInfo = run.info || {};
    const runData = run.data || {};
    const tagsArray = runData.tags || [];
    const paramsArray = runData.params || [];
    const metricsArray = runData.metrics || [];

    const tags = (tagsArray as Array<{ key: string; value: string }>).reduce<Record<string, string>>((acc, tag) => {
      if (tag.key && typeof tag.value === "string") {
        acc[tag.key] = tag.value;
      }
      return acc;
    }, {});

    const stage =
      tags["stage"] ||
      tags["model_stage"] ||
      tags["mlflow.runName"] ||
      tags["mlflow.user"] ||
      "unknown";

    const modelName =
      tags["model_name"] ||
      tags["mlflow.modelName"] ||
      tags["mlflow.runName"] ||
      tags["mlflow.experimentName"];

    if (!modelName) {
      return null;
    }

    const parameters = (paramsArray as Array<{ key: string; value: string }>).reduce<Record<string, string>>((acc, param) => {
      acc[param.key] = param.value;
      return acc;
    }, {});

    const metrics = (metricsArray as Array<{ key: string; value: number }>).reduce<Record<string, number>>((acc, metric) => {
      acc[metric.key] = metric.value;
      return acc;
    }, {});

    return {
      id: runInfo.run_id,
      name: modelName,
      version: runInfo.run_id,
      lifecycle_stage: stage,
      creation_timestamp: runInfo.start_time || Date.now(),
      last_updated_timestamp: runInfo.end_time || runInfo.start_time || Date.now(),
      description: tags["mlflow.note.content"] || "",
      run_id: runInfo.run_id,
      source: runInfo.artifact_uri,
      status: runInfo.status || stage,
      tags,
      metrics,
      parameters,
      experiment_info: {
        experiment_id: runInfo.experiment_id,
        experiment_name:
          tags["mlflow.experimentName"] ||
          experimentsMap.get(runInfo.experiment_id || "")?.name ||
          "",
        artifact_location:
          runInfo.artifact_uri ||
          experimentsMap.get(runInfo.experiment_id || "")?.artifact_location ||
          "",
      },
      training_status: runInfo.status,
      training_started_at: runInfo.start_time,
      training_ended_at: runInfo.end_time,
      source_version: tags["mlflow.source.git.commit"] || "",
    };
  }

  async saveConfiguration(
    userId: number | undefined,
    payload: SaveConfigurationPayload,
    tenant: string
  ) {
    const normalizedUrl = payload.trackingServerUrl?.trim();
    if (!normalizedUrl) {
      throw new ValidationException(
        "MLFlow tracking server URL is required",
        "trackingServerUrl",
        payload.trackingServerUrl,
      );
    }

    const authMethod: MLFlowAuthMethod = payload.authMethod || "none";
    const timeout = payload.timeout ?? 30;
    const verifySsl = payload.verifySsl ?? true;

    const existingRecord = await this.getIntegrationRecord(tenant);
    const existingSecrets = existingRecord
      ? this.decryptIntegration(existingRecord)
      : undefined;

    let username = payload.username?.trim() || existingSecrets?.username;
    let password = payload.password?.trim() || existingSecrets?.password;
    let apiToken = payload.apiToken?.trim() || existingSecrets?.apiToken;

    if (authMethod === "basic") {
      if (!username || !password) {
        throw new ValidationException(
          "Username and password are required for basic authentication",
          "authMethod",
          "basic",
        );
      }
      apiToken = undefined;
    } else if (authMethod === "token") {
      if (!apiToken) {
        throw new ValidationException(
          "API token is required when using token authentication",
          "authMethod",
          "token",
        );
      }
      username = undefined;
      password = undefined;
    } else {
      username = undefined;
      password = undefined;
      apiToken = undefined;
    }

    const attributes: any = {
      tracking_server_url: normalizedUrl.replace(/\/$/, ""),
      auth_method: authMethod,
      verify_ssl: verifySsl,
      timeout,
      updated_by: userId ?? null,
      last_test_status: null,
      last_tested_at: null,
      last_test_message: null,
      last_synced_at: null,
      last_sync_status: null,
      last_sync_message: null,
    };

    const assignEncryptedValue = (
      value: string | undefined,
      targetKey: "username" | "password" | "api_token",
      ivKey: "username_iv" | "password_iv" | "api_token_iv",
    ) => {
      if (value) {
        const encrypted = encryptText(value);
        attributes[targetKey] = encrypted.value;
        attributes[ivKey] = encrypted.iv;
      } else {
        attributes[targetKey] = null;
        attributes[ivKey] = null;
      }
    };

    assignEncryptedValue(username, "username", "username_iv");
    assignEncryptedValue(password, "password", "password_iv");
    assignEncryptedValue(apiToken, "api_token", "api_token_iv");

    if (existingRecord) {
      const setClause = Object.keys(attributes)
        .map(key => `"${key}" = :${key}`)
        .join(", ");
      await sequelize.query(`UPDATE "${tenant}".mlflow_integrations SET ${setClause} WHERE id = :id;`, {
        replacements: {
          ...attributes,
          id: existingRecord.id
        }
      });
    } else {
      await sequelize.query(`
        INSERT INTO "${tenant}".mlflow_integrations (
          tracking_server_url, auth_method, username, username_iv, password, password_iv, api_token, api_token_iv, verify_ssl, timeout, updated_by
        ) VALUES (
          :tracking_server_url, :auth_method, :username, :username_iv, :password, :password_iv, :api_token, :api_token_iv, :verify_ssl, :timeout, :updated_by
        );`, {
        replacements: {
          tracking_server_url: attributes.tracking_server_url,
          auth_method: attributes.auth_method,
          username: attributes.username,
          username_iv: attributes.username_iv,
          password: attributes.password,
          password_iv: attributes.password_iv,
          api_token: attributes.api_token,
          api_token_iv: attributes.api_token_iv,
          verify_ssl: attributes.verify_ssl,
          timeout: attributes.timeout,
          updated_by: attributes.updated_by,
        }
      });
    }

    return {
      success: true,
      message: "MLFlow integration configured successfully!",
      config: await this.getConfigurationSummary(tenant),
    };
  }

  async getConfigurationSummary(
    tenant: string
  ): Promise<SanitizedConfigResponse> {
    const record = await this.getIntegrationRecord(tenant);

    if (!record) {
      return {
        configured: false,
      };
    }

    return {
      configured: true,
      config: {
        trackingServerUrl: record.tracking_server_url,
        authMethod: record.auth_method,
        timeout: record.timeout,
        verifySsl: record.verify_ssl,
        hasStoredUsername: Boolean(record.username && record.username_iv),
        hasStoredPassword: Boolean(record.password && record.password_iv),
        hasStoredApiToken: Boolean(record.api_token && record.api_token_iv),
        lastTestedAt: record.last_tested_at,
        lastTestStatus: record.last_test_status,
        lastTestMessage: record.last_test_message,
        lastSuccessfulTestAt: record.last_successful_test_at,
        lastFailedTestAt: record.last_failed_test_at,
        lastFailedTestMessage: record.last_failed_test_message,
        lastSyncedAt: record.last_synced_at,
        lastSyncStatus: record.last_sync_status,
        lastSyncMessage: record.last_sync_message,
        updatedAt: record.updated_at,
        updatedBy: record.updated_by,
      },
    };
  }

  async testConnection(config: RuntimeMLFlowConfig): Promise<{
    success: boolean;
    message: string;
    version?: string;
    serverInfo?: any;
  }> {
    try {
      const trackingServerUrl = config.trackingServerUrl.replace(/\/$/, "");
      const axiosConfig = this.buildAxiosConfig(config);

      // Try to fetch experiments as a health check - this is a standard MLFlow endpoint
      const response = await axios.get(
        `${trackingServerUrl}/api/2.0/mlflow/experiments/search`,
        {
          ...axiosConfig,
          params: { max_results: 1 },
          validateStatus: () => true,
        }
      );

      if (response.status === 200) {
        return {
          success: true,
          message: "Successfully connected to MLFlow server!",
          serverInfo: {
            trackingServerUrl,
            authMethod: config.authMethod,
            connected: true,
            responseTime: "1.2s",
          },
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: "Authentication failed - check your credentials",
        };
      }

      throw new Error(
        `MLFlow server returned status ${response.status}: ${response.statusText || 'Unknown error'}`,
      );
    } catch (error: any) {
      console.error("MLFlow connection test error:", error);
      if (error.code === "ECONNREFUSED") {
        return {
          success: false,
          message: "Connection refused - MLFlow server may not be running",
        };
      }
      if (error.code === "ENOTFOUND") {
        return {
          success: false,
          message: "MLFlow server not found - check the server URL",
        };
      }
      if (error.code === "ETIMEDOUT") {
        return {
          success: false,
          message: "Connection timeout - MLFlow server is not responding",
        };
      }
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }

  async recordTestResult(
    result: { success: boolean; message?: string },
    tenant: string
  ) {
    const now = new Date();
    const updatePayload: Record<string, unknown> = {
      last_tested_at: now,
      last_test_status: result.success ? "success" : "error",
      last_test_message: result.success ? null : result.message?.slice(0, 1000) ?? null,
    };

    if (result.success) {
      updatePayload.last_successful_test_at = now;
    } else {
      updatePayload.last_failed_test_at = now;
      updatePayload.last_failed_test_message = result.message?.slice(0, 1000) ?? null;
    }
    await sequelize.query(`
      UPDATE "${tenant}".mlflow_integrations SET
        last_tested_at = :last_tested_at,
        last_test_status = :last_test_status,
        last_test_message = :last_test_message;`, {
      replacements: {
        last_tested_at: updatePayload.last_tested_at,
        last_test_status: updatePayload.last_test_status,
        last_test_message: updatePayload.last_test_message,
      }
    });
  }

  async recordSyncResult(
    status: MLFlowSyncStatus,
    tenant: string,
    message?: string | null,
  ) {
    await sequelize.query(`
      UPDATE "${tenant}".mlflow_integrations SET
        last_synced_at = :last_synced_at,
        last_sync_status = :last_sync_status,
        last_sync_message = :last_sync_message
      RETURNING *;`, {
      replacements: {
        last_synced_at: new Date(),
        last_sync_status: status,
        last_sync_message: message ? message.slice(0, 1000) : null,
      }
    });
  }

  async getSyncStatus(tenant: string) {
    const record = await this.getIntegrationRecord(tenant);
    if (!record) {
      return {
        configured: false,
        lastSyncedAt: null,
        lastSyncStatus: null,
        lastSyncMessage: null,
        lastTestedAt: null,
        lastTestStatus: null,
        lastTestMessage: null,
      };
    }

    return {
      configured: true,
      lastSyncedAt: record.last_synced_at,
      lastSyncStatus: record.last_sync_status,
      lastSyncMessage: record.last_sync_message,
      lastTestedAt: record.last_tested_at,
      lastTestStatus: record.last_test_status,
      lastTestMessage: record.last_test_message,
      lastSuccessfulTestAt: record.last_successful_test_at,
      lastFailedTestAt: record.last_failed_test_at,
      lastFailedTestMessage: record.last_failed_test_message,
      updatedAt: record.updated_at,
    };
  }

  async resolveRuntimeConfig(
    tenant: string,
    overrides?: Partial<SaveConfigurationPayload>,
  ): Promise<RuntimeMLFlowConfig> {
    const existingRecord = await this.getIntegrationRecord(tenant);
    const existingSecrets = existingRecord
      ? this.decryptIntegration(existingRecord)
      : undefined;

    const trackingServerUrl =
      overrides?.trackingServerUrl?.trim() ||
      existingRecord?.tracking_server_url;
    if (!trackingServerUrl) {
      throw new ValidationException(
        "MLFlow tracking server URL is required",
        "trackingServerUrl",
        overrides?.trackingServerUrl,
      );
    }

    const authMethod: MLFlowAuthMethod =
      overrides?.authMethod || existingRecord?.auth_method || "none";
    const timeout =
      overrides?.timeout ?? existingRecord?.timeout ?? existingSecrets?.timeout ?? 30;
    const verifySsl =
      overrides?.verifySsl ?? existingRecord?.verify_ssl ?? true;

    const config: RuntimeMLFlowConfig = {
      trackingServerUrl: trackingServerUrl.replace(/\/$/, ""),
      authMethod,
      timeout,
      verifySsl,
    };

    if (authMethod === "basic") {
      config.username = overrides?.username?.trim() || existingSecrets?.username;
      config.password = overrides?.password?.trim() || existingSecrets?.password;
      if (!config.username || !config.password) {
        throw new ValidationException(
          "Username and password are required for basic authentication",
          "authMethod",
          "basic",
        );
      }
    } else if (authMethod === "token") {
      config.apiToken = overrides?.apiToken?.trim() || existingSecrets?.apiToken;
      if (!config.apiToken) {
        throw new ValidationException(
          "API token is required when using token authentication",
          "authMethod",
          "token",
        );
      }
    }

    return config;
  }

  async getModels(tenant: string): Promise<MLFlowModel[]> {
    const config = await this.resolveRuntimeConfig(tenant);

    try {
      const experimentsResponse =
        await this.makeAuthenticatedRequest<{
          experiments?: Array<{
            experiment_id: string;
            name?: string;
            artifact_location?: string;
          }>;
        }>(config, "/api/2.0/mlflow/experiments/search", {
          max_results: 1000,
        });

      const experiments = experimentsResponse.experiments ?? [];
      const experimentsMap = new Map<
        string,
        { name?: string; artifact_location?: string | null }
      >();
      experiments.forEach((experiment) => {
        experimentsMap.set(experiment.experiment_id, {
          name: experiment.name,
          artifact_location: experiment.artifact_location,
        });
      });

      const experimentIds =
        experiments.length > 0
          ? experiments.map((experiment) => experiment.experiment_id)
          : ["0"];

      const experimentChunks = this.chunkArray(experimentIds, 50);
      const allRuns: any[] = [];

      for (const chunk of experimentChunks) {
        const runsResponse = await this.makeAuthenticatedRequest<{
          runs?: any[];
        }>(
          config,
          "/api/2.0/mlflow/runs/search",
          undefined,
          {
            experiment_ids: chunk,
            max_results: 1000,
          },
          "post",
        );

        if (runsResponse.runs?.length) {
          allRuns.push(...runsResponse.runs);
        }
      }

      const modelsMap = new Map<string, MLFlowModel>();
      allRuns.forEach((run) => {
        const model = this.transformRunToModel(run, experimentsMap);
        if (!model) {
          return;
        }

        const key = `${model.name}:${model.lifecycle_stage}`;
        const existing = modelsMap.get(key);

        if (
          !existing ||
          (model.training_ended_at || 0) > (existing.training_ended_at || 0)
        ) {
          modelsMap.set(key, model);
        }
      });

      const models = Array.from(modelsMap.values());

      if (!models.length) {
        throw new Error("MLFlow returned no runs");
      }

      await this.persistModelRecords(models, tenant);

      return models;
    } catch (error) {
      console.error("Error fetching MLFlow models:", error);
      throw error;
    }
  }

  private async persistModelRecords(
    models: MLFlowModel[],
    tenant: string,
  ) {
    if (!models.length) {
      return;
    }

    const now = new Date();
    const records = models.map((model) => {
      const parameterPayload = Object.entries(model.parameters || {}).reduce(
        (acc, [key, value]) => {
          acc[key] = value !== undefined && value !== null ? String(value) : "";
          return acc;
        },
        {} as Record<string, string>,
      );

      return {
        model_name: model.name,
        version: model.version,
        lifecycle_stage: model.lifecycle_stage || null,
        run_id: model.run_id || null,
        description: model.description || null,
        source: model.source || null,
        status: model.status || null,
        tags: model.tags || {},
        metrics: model.metrics || {},
        parameters: parameterPayload,
        experiment_id: model.experiment_info?.experiment_id || null,
        experiment_name: model.experiment_info?.experiment_name || null,
        artifact_location: model.experiment_info?.artifact_location || null,
        training_status: model.training_status || null,
        training_started_at: model.training_started_at
          ? new Date(model.training_started_at)
          : null,
        training_ended_at: model.training_ended_at
          ? new Date(model.training_ended_at)
          : null,
        source_version: model.source_version || null,
        model_created_at: model.creation_timestamp
          ? new Date(model.creation_timestamp)
          : null,
        model_updated_at: model.last_updated_timestamp
          ? new Date(model.last_updated_timestamp)
          : null,
        last_synced_at: now,
      };
    });

    let keys = [
      "model_name", "version", "lifecycle_stage", "run_id", "description",
      "source", "status", "tags", "metrics", "parameters",
      "experiment_id", "experiment_name", "artifact_location",
      "training_status", "training_started_at", "training_ended_at",
      "source_version", "model_created_at", "model_updated_at", "last_synced_at",
    ];

    let values: Record<string, any> = {};
    let attributes: string[] = [];

    records.forEach((record, index) => {
      const rowPlaceholders = keys.map(key => {
        const paramKey = `${key}_${index}`;
        if (["tags", "metrics", "parameters"].includes(key)) {
          values[paramKey] = JSON.stringify(record[key as keyof typeof record]);
        } else {
          values[paramKey] = record[key as keyof typeof record];
        }
        return `:${paramKey}`;
      });
      attributes.push(`(${rowPlaceholders.join(", ")})`);
    });

    // Columns to update on conflict
    const updateColumns = keys.filter(k => k !== "model_name" && k !== "version");

    // Build query
    const query = `
      INSERT INTO "${tenant}".mlflow_model_records (${keys.join(", ")})
      VALUES ${attributes.join(", ")}
      ON CONFLICT (model_name, version) DO UPDATE
      SET ${updateColumns.map(k => `${k} = EXCLUDED.${k}`).join(", ")}
    `;

    // Execute
    await sequelize.query(query, { replacements: values });

    // await MLFlowModelRecordModel.bulkCreate(records as any, {
    //   updateOnDuplicate: [
    //     "lifecycle_stage",
    //     "run_id",
    //     "description",
    //     "source",
    //     "status",
    //     "tags",
    //     "metrics",
    //     "parameters",
    //     "experiment_id",
    //     "experiment_name",
    //     "artifact_location",
    //     "training_status",
    //     "training_started_at",
    //     "training_ended_at",
    //     "source_version",
    //     "model_created_at",
    //     "model_updated_at",
    //     "last_synced_at",
    //   ],
    //   conflictAttributes: ["model_name", "version"],
    // });
  }

  private async getIntegrationRecord(tenant: string) {
    const record = await sequelize.query(`
      SELECT * FROM "${tenant}".mlflow_integrations LIMIT 1
    `) as [IMLFlowIntegration[], number];
    return record[0][0];
  }

  private decryptIntegration(record: IMLFlowIntegration): RuntimeMLFlowConfig {
    const decryptField = (value?: string | null, iv?: string | null) => {
      if (!value || !iv) {
        return undefined;
      }
      const result = decryptText({ value, iv } as EncryptedResult);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to decrypt stored credential");
      }
      return result.data;
    };

    return {
      trackingServerUrl: record.tracking_server_url,
      authMethod: record.auth_method,
      username: decryptField(record.username, record.username_iv),
      password: decryptField(record.password, record.password_iv),
      apiToken: decryptField(record.api_token, record.api_token_iv),
      timeout: record.timeout,
      verifySsl: record.verify_ssl,
    };
  }

  private buildAxiosConfig(config: RuntimeMLFlowConfig): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {
      timeout: config.timeout * 1000,
      httpsAgent:
        config.verifySsl === false
          ? new https.Agent({ rejectUnauthorized: false })
          : undefined,
    };

    if (config.authMethod === "basic" && config.username && config.password) {
      const auth = Buffer.from(
        `${config.username}:${config.password}`,
      ).toString("base64");
      axiosConfig.headers = {
        Authorization: `Basic ${auth}`,
      };
    } else if (config.authMethod === "token" && config.apiToken) {
      axiosConfig.headers = {
        Authorization: `Bearer ${config.apiToken}`,
      };
    }

    return axiosConfig;
  }

  private async makeAuthenticatedRequest<T>(
    config: RuntimeMLFlowConfig,
    endpoint: string,
    params?: Record<string, unknown>,
    data?: Record<string, unknown>,
    method: "get" | "post" = "get",
  ): Promise<T> {
    const axiosConfig = this.buildAxiosConfig(config);
    if (params) {
      axiosConfig.params = params;
    }

    try {
      const url = `${config.trackingServerUrl}${endpoint}`;
      const response =
        method === "post"
          ? await axios.post(url, data, axiosConfig)
          : await axios.get(url, axiosConfig);
      return response.data as T;
    } catch (error) {
      console.error(`MLFlow API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  private chunkArray<T>(items: T[], chunkSize = 50): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export { MLFlowService };
