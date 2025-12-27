/**
 * MLflow Plugin for VerifyWise
 *
 * This plugin provides MLflow integration for tracking and managing
 * machine learning experiments, models, and deployments.
 */

// Type declaration for Node.js Buffer global
declare const Buffer: {
  from(str: string): { toString(encoding: string): string };
};

// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any;
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;
}

interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;
}

interface ConfigureResult {
  success: boolean;
  message: string;
  configuredAt: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface TestConnectionResult {
  success: boolean;
  message: string;
  serverVersion: string;
  testedAt: string;
}

interface SyncResult {
  success: boolean;
  modelCount: number;
  syncedAt: string;
  status: string;
}

interface MLflowConfig {
  tracking_server_url?: string;
  auth_method?: 'none' | 'basic' | 'token';
  username?: string;
  password?: string;
  api_token?: string;
  verify_ssl?: boolean;
  timeout?: number;
}

// ========== PLUGIN LIFECYCLE METHODS ==========

/**
 * Install the MLflow plugin
 * Called when a user installs the plugin
 * Creates mlflow_model_records table (matches existing integration)
 */
export async function install(
  _userId: number,
  tenantId: string,
  config: MLflowConfig,
  context: PluginContext
): Promise<InstallResult> {
  try {
    const { sequelize } = context;

    // Create mlflow_integrations table if it doesn't exist (for compatibility with old integration system)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantId}".mlflow_integrations (
        id SERIAL PRIMARY KEY,
        tracking_server_url VARCHAR(255) NOT NULL,
        auth_method VARCHAR(10) NOT NULL DEFAULT 'none' CHECK (auth_method IN ('none', 'basic', 'token')),
        username VARCHAR(255),
        username_iv VARCHAR(255),
        password VARCHAR(255),
        password_iv VARCHAR(255),
        api_token VARCHAR(255),
        api_token_iv VARCHAR(255),
        verify_ssl BOOLEAN NOT NULL DEFAULT TRUE,
        timeout INTEGER NOT NULL DEFAULT 30,
        last_tested_at TIMESTAMP,
        last_test_status VARCHAR(10) CHECK (last_test_status IN ('success', 'error')),
        last_test_message TEXT,
        last_successful_test_at TIMESTAMP,
        last_failed_test_at TIMESTAMP,
        last_failed_test_message TEXT,
        last_synced_at TIMESTAMP,
        last_sync_status VARCHAR(20) CHECK (last_sync_status IN ('success', 'error', 'in_progress')),
        last_sync_message TEXT,
        updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create mlflow_model_records table (same structure as integration)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantId}".mlflow_model_records (
        id SERIAL PRIMARY KEY,
        model_name VARCHAR(255) NOT NULL,
        version VARCHAR(255) NOT NULL,
        lifecycle_stage VARCHAR(255),
        run_id VARCHAR(255),
        description TEXT,
        source VARCHAR(255),
        status VARCHAR(255),
        tags JSONB NOT NULL DEFAULT '{}'::jsonb,
        metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
        parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
        experiment_id VARCHAR(255),
        experiment_name VARCHAR(255),
        artifact_location TEXT,
        training_status VARCHAR(255),
        training_started_at TIMESTAMP,
        training_ended_at TIMESTAMP,
        source_version VARCHAR(255),
        model_created_at TIMESTAMP,
        model_updated_at TIMESTAMP,
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT mlflow_model_records_org_model_version_unique UNIQUE (model_name, version)
      )
    `);

    // Test connection and perform initial sync if config provided
    if (config && config.tracking_server_url) {
      const testResult = await testConnection(config);
      if (!testResult.success) {
        throw new Error(`Initial connection test failed: ${testResult.message}`);
      }

      const syncResult = await syncModels(tenantId, config, context);
      if (!syncResult.success) {
        throw new Error(`Initial sync failed: ${syncResult.status}`);
      }

      return {
        success: true,
        message: `MLflow plugin installed successfully. Synced ${syncResult.modelCount} models from your MLflow server.`,
        installedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: "MLflow plugin installed successfully. Configure your tracking server to start syncing models.",
      installedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Installation failed: ${error.message}`);
  }
}

/**
 * Uninstall the MLflow plugin
 * Called when a user uninstalls the plugin
 * Drops mlflow_model_records table
 */
export async function uninstall(
  _userId: number,
  tenantId: string,
  context: PluginContext
): Promise<UninstallResult> {
  try {
    const { sequelize } = context;

    // Count records before deletion
    const modelsCount: any = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${tenantId}".mlflow_model_records`
    );

    const totalRecords = parseInt(modelsCount[0][0].count);

    // Drop mlflow_model_records table
    await sequelize.query(`DROP TABLE IF EXISTS "${tenantId}".mlflow_model_records CASCADE`);

    return {
      success: true,
      message: `MLflow plugin uninstalled successfully. Removed ${totalRecords} model records.`,
      uninstalledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Uninstallation failed: ${error.message}`);
  }
}

/**
 * Configure the MLflow plugin
 * Called when a user saves plugin configuration
 * Configuration is stored in plugin_installations.configuration by PluginService
 */
export async function configure(
  _userId: number,
  tenantId: string,
  config: MLflowConfig,
  context: PluginContext
): Promise<ConfigureResult> {
  try {
    const { sequelize } = context;

    // Validate configuration
    const validation = validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    // Test connection with new configuration
    const testResult = await testConnection(config);
    if (!testResult.success) {
      throw new Error(`Connection test failed: ${testResult.message}`);
    }

    // Store configuration in mlflow_integrations table (for compatibility with old integration system)
    const now = new Date();

    // Check if configuration record exists
    const existingRecord = await sequelize.query(`
      SELECT id FROM "${tenantId}".mlflow_integrations LIMIT 1
    `);

    if (existingRecord[0] && existingRecord[0].length > 0) {
      // Update existing record
      await sequelize.query(`
        UPDATE "${tenantId}".mlflow_integrations
        SET tracking_server_url = :tracking_server_url,
            auth_method = :auth_method,
            verify_ssl = :verify_ssl,
            timeout = :timeout,
            last_tested_at = :tested_at,
            last_test_status = 'success',
            last_test_message = :test_message,
            last_successful_test_at = :tested_at,
            updated_at = :now
        WHERE id = (SELECT id FROM "${tenantId}".mlflow_integrations LIMIT 1)
      `, {
        replacements: {
          tracking_server_url: config.tracking_server_url,
          auth_method: config.auth_method || 'none',
          verify_ssl: config.verify_ssl !== false,
          timeout: config.timeout || 30,
          tested_at: now,
          test_message: testResult.message,
          now: now
        }
      });
    } else {
      // Insert new record
      await sequelize.query(`
        INSERT INTO "${tenantId}".mlflow_integrations (
          tracking_server_url,
          auth_method,
          verify_ssl,
          timeout,
          last_tested_at,
          last_test_status,
          last_test_message,
          last_successful_test_at,
          updated_at
        ) VALUES (
          :tracking_server_url,
          :auth_method,
          :verify_ssl,
          :timeout,
          :tested_at,
          'success',
          :test_message,
          :tested_at,
          :now
        )
      `, {
        replacements: {
          tracking_server_url: config.tracking_server_url,
          auth_method: config.auth_method || 'none',
          verify_ssl: config.verify_ssl !== false,
          timeout: config.timeout || 30,
          tested_at: now,
          test_message: testResult.message,
          now: now
        }
      });
    }

    // Trigger sync with the new configuration
    const syncResult = await syncModels(tenantId, config, context);
    if (!syncResult.success) {
      throw new Error(`Sync failed: ${syncResult.status}`);
    }

    // Update sync status in mlflow_integrations table
    await sequelize.query(`
      UPDATE "${tenantId}".mlflow_integrations
      SET last_synced_at = :synced_at,
          last_sync_status = 'success',
          last_sync_message = :sync_message,
          updated_at = :now
      WHERE id = (SELECT id FROM "${tenantId}".mlflow_integrations LIMIT 1)
    `, {
      replacements: {
        synced_at: new Date(syncResult.syncedAt),
        sync_message: `Synced ${syncResult.modelCount} models`,
        now: new Date()
      }
    });

    return {
      success: true,
      message: `MLflow plugin configured successfully. Connected to ${config.tracking_server_url} and synced ${syncResult.modelCount} models.`,
      configuredAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Configuration failed: ${error.message}`);
  }
}

// ========== VALIDATION METHODS ==========

/**
 * Validate plugin configuration
 * Matches the validation from MLflow integration service
 */
export function validateConfig(config: MLflowConfig): ValidationResult {
  const errors: string[] = [];

  // Validation logic
  if (!config) {
    errors.push("Configuration is required");
    return { valid: false, errors };
  }

  // Required: Tracking server URL
  if (!config.tracking_server_url) {
    errors.push("Tracking server URL is required");
  }

  // Required: Authentication method
  if (!config.auth_method) {
    errors.push("Authentication method is required");
  }

  // Validate auth credentials based on method
  if (config.auth_method === "basic") {
    if (!config.username || !config.password) {
      errors.push("Username and password required for basic authentication");
    }
  }

  if (config.auth_method === "token") {
    if (!config.api_token) {
      errors.push("API token required for token authentication");
    }
  }

  // Optional fields with defaults
  if (config.timeout && (config.timeout < 1 || config.timeout > 300)) {
    errors.push("Timeout must be between 1 and 300 seconds");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ========== INTEGRATION METHODS ==========

/**
 * Test connection to MLflow server
 */
export async function testConnection(
  config: MLflowConfig
): Promise<TestConnectionResult> {
  try {
    if (!config.tracking_server_url) {
      throw new Error("Tracking server URL is required");
    }

    const headers = buildHeaders(config);
    // Remove trailing slash from URL to prevent double slashes
    const baseUrl = config.tracking_server_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/2.0/mlflow/experiments/search`;

    // Test connection by fetching experiments
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ max_results: 1 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText || 'No error details provided'}`);
    }

    await response.json();

    return {
      success: true,
      message: "Successfully connected to MLflow server",
      serverVersion: "2.0+",
      testedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      serverVersion: "unknown",
      testedAt: new Date().toISOString(),
    };
  }
}

/**
 * Sync models from MLflow server
 * Matches the logic from MLFlowService.getModels()
 * Fetches experiments and runs, transforms runs into models
 */
export async function syncModels(
  tenantId: string,
  config: MLflowConfig,
  context: PluginContext
): Promise<SyncResult> {
  try {
    if (!config.tracking_server_url) {
      throw new Error("Tracking server URL is required");
    }

    const { sequelize } = context;
    const headers = buildHeaders(config);
    // Remove trailing slash from URL to prevent double slashes
    const baseUrl = config.tracking_server_url.replace(/\/$/, '');

    // 1. Fetch experiments
    const experimentsResponse = await fetch(
      `${baseUrl}/api/2.0/mlflow/experiments/search`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ max_results: 1000 }),
      }
    );

    if (!experimentsResponse.ok) {
      throw new Error(`Failed to fetch experiments: ${experimentsResponse.status}`);
    }

    const experimentsData = await experimentsResponse.json();
    const experiments = experimentsData.experiments || [];

    // Create experiments map for quick lookup
    const experimentsMap = new Map<string, { name?: string; artifact_location?: string }>();
    experiments.forEach((exp: any) => {
      experimentsMap.set(exp.experiment_id, {
        name: exp.name,
        artifact_location: exp.artifact_location,
      });
    });

    const experimentIds = experiments.length > 0
      ? experiments.map((exp: any) => exp.experiment_id)
      : ["0"];

    // 2. Fetch runs for all experiments (in chunks of 50)
    const allRuns: any[] = [];
    const chunkSize = 50;

    for (let i = 0; i < experimentIds.length; i += chunkSize) {
      const chunk = experimentIds.slice(i, i + chunkSize);

      const runsResponse = await fetch(
        `${baseUrl}/api/2.0/mlflow/runs/search`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            experiment_ids: chunk,
            max_results: 1000,
          }),
        }
      );

      if (runsResponse.ok) {
        const runsData = await runsResponse.json();
        if (runsData.runs?.length) {
          allRuns.push(...runsData.runs);
        }
      }
    }

    // 3. Transform runs into models and deduplicate
    const modelsMap = new Map<string, any>();

    allRuns.forEach((run) => {
      const model = transformRunToModel(run, experimentsMap);
      if (!model) return;

      const key = `${model.name}:${model.lifecycle_stage}`;
      const existing = modelsMap.get(key);

      // Keep the most recently trained model
      if (!existing || (model.training_ended_at || 0) > (existing.training_ended_at || 0)) {
        modelsMap.set(key, model);
      }
    });

    const models = Array.from(modelsMap.values());

    if (!models.length) {
      throw new Error("MLflow returned no runs");
    }

    // 4. Persist to mlflow_model_records
    await persistModelRecords(models, tenantId, sequelize);

    return {
      success: true,
      modelCount: models.length,
      syncedAt: new Date().toISOString(),
      status: "success",
    };
  } catch (error: any) {
    return {
      success: false,
      modelCount: 0,
      syncedAt: new Date().toISOString(),
      status: `failed: ${error.message}`,
    };
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Transform MLflow run into model format
 * Matches MLFlowService.transformRunToModel()
 */
function transformRunToModel(
  run: any,
  experimentsMap: Map<string, { name?: string; artifact_location?: string }>
): any | null {
  const runInfo = run.info || {};
  const runData = run.data || {};
  const tagsArray = runData.tags || [];

  // Convert tags array to object
  const tags: Record<string, string> = {};
  tagsArray.forEach((tag: any) => {
    if (tag.key && tag.value !== undefined) {
      tags[tag.key] = String(tag.value);
    }
  });

  // Get model name from tags
  const modelName =
    tags["mlflow.runName"] ||
    tags["model_name"] ||
    tags["mlflow.project.entryPoint"] ||
    runInfo.run_name ||
    runInfo.run_id;

  if (!modelName) {
    return null;
  }

  // Get lifecycle stage
  const lifecycleStage = tags["mlflow.lifecycleStage"] || tags["stage"] || "None";

  // Get metrics
  const metricsArray = runData.metrics || [];
  const metrics: Record<string, number> = {};
  metricsArray.forEach((metric: any) => {
    if (metric.key && metric.value !== undefined) {
      metrics[metric.key] = Number(metric.value);
    }
  });

  // Get parameters
  const paramsArray = runData.params || [];
  const parameters: Record<string, string> = {};
  paramsArray.forEach((param: any) => {
    if (param.key && param.value !== undefined) {
      parameters[param.key] = String(param.value);
    }
  });

  // Get experiment info
  const experimentInfo = experimentsMap.get(runInfo.experiment_id);

  return {
    name: modelName,
    version: tags["version"] || runInfo.run_id?.substring(0, 8) || "1",
    lifecycle_stage: lifecycleStage,
    run_id: runInfo.run_id,
    description: tags["mlflow.note.content"] || null,
    source: tags["mlflow.source.name"] || runInfo.artifact_uri,
    status: runInfo.status || "UNKNOWN",
    tags,
    metrics,
    parameters,
    experiment_info: experimentInfo
      ? {
          experiment_id: runInfo.experiment_id,
          experiment_name: experimentInfo.name,
          artifact_location: experimentInfo.artifact_location,
        }
      : null,
    training_status: runInfo.status,
    training_started_at: runInfo.start_time || null,
    training_ended_at: runInfo.end_time || null,
    source_version: tags["mlflow.source.git.commit"] || null,
    creation_timestamp: runInfo.start_time || null,
    last_updated_timestamp: runInfo.end_time || null,
  };
}

/**
 * Persist model records to database
 * Matches MLFlowService.persistModelRecords()
 */
async function persistModelRecords(
  models: any[],
  tenantId: string,
  sequelize: any
): Promise<void> {
  if (!models.length) {
    return;
  }

  const now = new Date();
  const records = models.map((model) => {
    // Convert parameters to string values
    const parameterPayload: Record<string, string> = {};
    const params = model.parameters || {};
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const value = params[key];
        parameterPayload[key] = value !== undefined && value !== null ? String(value) : "";
      }
    }

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
      training_started_at: model.training_started_at ? new Date(model.training_started_at) : null,
      training_ended_at: model.training_ended_at ? new Date(model.training_ended_at) : null,
      source_version: model.source_version || null,
      model_created_at: model.creation_timestamp ? new Date(model.creation_timestamp) : null,
      model_updated_at: model.last_updated_timestamp ? new Date(model.last_updated_timestamp) : null,
      last_synced_at: now,
    };
  });

  const keys = Object.keys(records[0]);
  const placeholders = records.map((_, index) => {
    const valuePlaceholders = keys.map((key) => `:${key}_${index}`).join(", ");
    return `(${valuePlaceholders})`;
  });

  const replacements: Record<string, any> = {};
  records.forEach((record, index) => {
    keys.forEach((key) => {
      const value = (record as any)[key];
      // Serialize JSONB fields
      if (key === 'tags' || key === 'metrics' || key === 'parameters') {
        replacements[`${key}_${index}`] = JSON.stringify(value);
      } else {
        replacements[`${key}_${index}`] = value;
      }
    });
  });

  const updateColumns = keys.filter((k) => k !== "model_name" && k !== "version");

  await sequelize.query(
    `INSERT INTO "${tenantId}".mlflow_model_records (${keys.join(", ")})
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (model_name, version) DO UPDATE
     SET ${updateColumns.map((k) => `${k} = EXCLUDED.${k}`).join(", ")}`,
    { replacements }
  );
}

/**
 * Build authentication headers
 */
function buildHeaders(config: MLflowConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.auth_method === "basic" && config.username && config.password) {
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
  } else if (config.auth_method === "token" && config.api_token) {
    headers["Authorization"] = `Bearer ${config.api_token}`;
  }

  return headers;
}

/**
 * Fetch registered models from MLflow
 */
export async function getRegisteredModels(
  config: MLflowConfig,
  maxResults: number = 100
): Promise<any[]> {
  if (!config.tracking_server_url) {
    throw new Error("Tracking server URL is required");
  }

  const headers = buildHeaders(config);
  const baseUrl = config.tracking_server_url.replace(/\/$/, '');

  const response = await fetch(
    `${baseUrl}/api/2.0/mlflow/registered-models/search`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ max_results: maxResults }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch registered models: ${response.status}`);
  }

  const data = await response.json();
  return data.registered_models || [];
}

/**
 * Get model versions for a specific model
 */
export async function getModelVersions(
  config: MLflowConfig,
  modelName: string
): Promise<any[]> {
  if (!config.tracking_server_url) {
    throw new Error("Tracking server URL is required");
  }

  const headers = buildHeaders(config);
  const baseUrl = config.tracking_server_url.replace(/\/$/, '');

  const response = await fetch(
    `${baseUrl}/api/2.0/mlflow/model-versions/search`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        filter: `name='${modelName}'`,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch model versions: ${response.status}`);
  }

  const data = await response.json();
  return data.model_versions || [];
}

/**
 * Get run details by ID
 */
export async function getRunDetails(
  config: MLflowConfig,
  runId: string
): Promise<any> {
  if (!config.tracking_server_url) {
    throw new Error("Tracking server URL is required");
  }

  const headers = buildHeaders(config);
  const baseUrl = config.tracking_server_url.replace(/\/$/, '');

  const response = await fetch(
    `${baseUrl}/api/2.0/mlflow/runs/get?run_id=${runId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch run details: ${response.status}`);
  }

  const data = await response.json();
  return data.run;
}

// ========== PLUGIN METADATA ==========

export const metadata: PluginMetadata = {
  name: "MLflow",
  version: "1.0.0",
  author: "VerifyWise",
  description: "MLflow integration for ML model tracking",
};
