import CustomAxios from "./customAxios";

interface FairnessUploadPayload {
  model: File;
  data: File;
  target_column: string;
  sensitive_column: string;
}

export const fairnessService = {
  /**
   * Uploads model and dataset files to the fairness backend.
   */
  async uploadFairnessFiles(payload: FairnessUploadPayload): Promise<any> {
    const formData = new FormData();
    formData.append("model", payload.model);
    formData.append("data", payload.data);
    formData.append("target_column", payload.target_column);
    formData.append("sensitive_column", payload.sensitive_column);

    const response = await CustomAxios.post("/bias_and_fairness/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Fetches fairness metrics by ID.
   */
  async getFairnessMetrics(id: string): Promise<any> {
    const response = await CustomAxios.get(`/bias_and_fairness/metrics/${id}`);
    return response.data;
  },
};