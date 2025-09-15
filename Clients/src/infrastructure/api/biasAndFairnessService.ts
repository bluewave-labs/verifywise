import CustomAxios from "./customAxios";

interface BiasAndFairnessEvaluationPayload {
  modelFile: File;
  datasetFile: File;
  targetColumn: string;
  sensitiveColumns: string[];
  evaluationMetrics: string[];
  fairnessThreshold: number;
  biasDetectionMethods: string[];
}

interface BiasAndFairnessConfigPayload {
  dataset: {
    name: string;
    source: string;
    split: string;
    platform: string;
    protected_attributes?: string[];
    target_column?: string;
  };
  model: {
    model_id: string;
    model_task: string;
    label_behavior: string;
  };
  metrics: {
    // Accept either array or object shape
    fairness: any;
    performance: any;
  };
  post_processing?: {
    binary_mapping?: {
      favorable_outcome: string;
      unfavorable_outcome: string;
    };
    attribute_groups?: Record<string, {
      privileged: string[];
      unprivileged: string[];
    }>;
  };
  sampling?: {
    enabled: boolean;
    n_samples: number;
    random_seed: number;
  };
}

interface EvaluationResponse {
  evaluationId: string;
  status: string;
  message: string;
  config_path?: string;
  eval_id?: string;
}

interface EvaluationStatus {
  evaluationId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  results?: any;
  error?: string;
}

export const biasAndFairnessService = {
  /**
   * Starts a new bias and fairness evaluation
   */
  async startEvaluation(payload: BiasAndFairnessEvaluationPayload): Promise<EvaluationResponse> {
    const formData = new FormData();
    
    // Append files
    formData.append("model", payload.modelFile);
    formData.append("dataset", payload.datasetFile);
    
    // Append configuration
    formData.append("target_column", payload.targetColumn);
    formData.append("sensitive_columns", JSON.stringify(payload.sensitiveColumns));
    formData.append("evaluation_metrics", JSON.stringify(payload.evaluationMetrics));
    formData.append("fairness_threshold", payload.fairnessThreshold.toString());
    formData.append("bias_detection_methods", JSON.stringify(payload.biasDetectionMethods));

    const response = await CustomAxios.post("/bias_and_fairness/evaluate", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 minutes timeout
    });

    return response.data;
  },

  /**
   * Creates config and runs bias and fairness evaluation
   */
  async createConfigAndEvaluate(payload: BiasAndFairnessConfigPayload): Promise<EvaluationResponse> {
    const response = await CustomAxios.post("/bias_and_fairness/evaluate/config", payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 300000, // 5 minutes timeout
    });

    return response.data;
  },

  /**
   * Gets all bias and fairness evaluations
   */
  async getAllBiasFairnessEvaluations(): Promise<any[]> {
    const response = await CustomAxios.get("/bias_and_fairness/evaluations", {
      timeout: 60000, // 1 minute timeout
    });
    return response.data;
  },

  /**
   * Gets a specific bias and fairness evaluation by eval_id
   */
  async getBiasFairnessEvaluation(evalId: string): Promise<any> {
    const response = await CustomAxios.get(`/bias_and_fairness/evaluations/${evalId}`);
    return response.data;
  },

  /**
   * Deletes a bias and fairness evaluation
   */
  async deleteBiasFairnessEvaluation(evalId: string): Promise<void> {
    await CustomAxios.delete(`/bias_and_fairness/evaluations/${evalId}`);
  },

  /**
   * Gets the status of an evaluation
   */
  async getEvaluationStatus(evaluationId: string): Promise<EvaluationStatus> {
    const response = await CustomAxios.get(`/bias_and_fairness/evaluate/status/${evaluationId}`, {
      timeout: 60000, // 1 minute timeout
    });
    return response.data;
  },

  /**
   * Gets the results of a completed evaluation
   */
  async getEvaluationResults(evaluationId: string): Promise<any> {
    const response = await CustomAxios.get(`/bias_and_fairness/evaluate/results/${evaluationId}`, {
      timeout: 60000, // 1 minute timeout
    });
    return response.data;
  },

  /**
   * Gets all evaluations for the current user/organization
   */
  async getAllEvaluations(): Promise<EvaluationStatus[]> {
    const response = await CustomAxios.get("/bias_and_fairness/evaluate/all");
    return response.data;
  },

  /**
   * Cancels a running evaluation
   */
  async cancelEvaluation(evaluationId: string): Promise<void> {
    await CustomAxios.delete(`/bias_and_fairness/evaluate/${evaluationId}`);
  },

  /**
   * Gets available evaluation metrics
   */
  async getAvailableMetrics(): Promise<string[]> {
    const response = await CustomAxios.get("/bias_and_fairness/metrics/available");
    return response.data;
  },

  /**
   * Gets available bias detection methods
   */
  async getAvailableBiasMethods(): Promise<string[]> {
    const response = await CustomAxios.get("/bias_and_fairness/bias-methods/available");
    return response.data;
  },

  /**
   * Polls evaluation status until completion or failure
   */
  async pollEvaluationStatus(
    evaluationId: string, 
    onProgress?: (status: EvaluationStatus) => void,
    maxAttempts: number = 60 // 5 minutes with 5-second intervals
  ): Promise<EvaluationStatus> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getEvaluationStatus(evaluationId);
        
        if (onProgress) {
          onProgress(status);
        }
        
        if (status.status === "completed" || status.status === "failed") {
          return status;
        }
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error("Error polling evaluation status:", error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error("Failed to get evaluation status after maximum attempts");
        }
      }
    }
    
    throw new Error("Evaluation polling timed out");
  }
};
