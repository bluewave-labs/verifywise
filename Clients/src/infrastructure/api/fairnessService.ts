import { FairnessModel } from "../../presentation/pages/FairnessDashboard/FairnessDashboard";
import CustomAxios from "./customAxios";
import pako from "pako";

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
  async uploadFairnessFiles(payload: FairnessUploadPayload, setUploadedModels: React.Dispatch<React.SetStateAction<FairnessModel[]>>): Promise<any> {
    const formData = new FormData();

    // Gzip the file data before appending
    const arrayBuffer_Data = await payload.data.arrayBuffer();
    const compressedData_Data: Uint8Array = pako.gzip(new Uint8Array(arrayBuffer_Data));
    const safeData_Data = new Uint8Array(compressedData_Data); // clone to normal buffer
    const compressedBlob_Data = new Blob([safeData_Data], { type: "application/gzip" });

    // Gzip the file data before appending
    const arrayBuffer_Model = await payload.model.arrayBuffer();
    const compressedData_Model: Uint8Array = pako.gzip(new Uint8Array(arrayBuffer_Model));
    const safeData_Model = new Uint8Array(compressedData_Model); // clone to normal buffer
    const compressedBlob_Model = new Blob([safeData_Model], { type: "application/gzip" });

    // Append metadata and compressed file
    formData.append("model", compressedBlob_Model, `${payload.model.name}.gz`);
    formData.append("data", compressedBlob_Data, `${payload.data.name}.gz`);
    formData.append("target_column", payload.target_column);
    formData.append("sensitive_column", payload.sensitive_column);

    const response = await CustomAxios.post("/bias_and_fairness/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 150000, // 2.5 minutes timeout
    });

    setUploadedModels((prevModels) => [
      ...prevModels,
      {
        id: `###__${response.data.job_id}`,
        model: response.data.model_filename,
        dataset: response.data.data_filename,
        status: "In Progress",
      }]);
    await this.getFairnessUploadStatus(response.data.job_id, setUploadedModels);
  },

  async getFairnessUploadStatus(jobId: string, setUploadedModels: React.Dispatch<React.SetStateAction<FairnessModel[]>>, ctr: number = 1): Promise<any> {
    const response = await CustomAxios.get(`/bias_and_fairness/upload/status/${jobId}`);
    if (!response.data && ctr <= 5) {
      const delay = Math.pow(2, ctr) * 1000; // exponential: 2s, 4s, 8s, 16s, 32s
      setTimeout(() => {
        this.getFairnessUploadStatus(jobId, setUploadedModels, ctr + 1);
      }, delay);
    } else {
      setUploadedModels((prevModels) => {
        return prevModels.map((model) => {
          if (model.id === `###__${jobId}`) {
            if (response.data.status === "Failed") {
              setTimeout(() => {
                setUploadedModels((prevModels) => prevModels.filter((model) => model.id !== `###__${jobId}`));
              }, 60000);
            }
            return {
              id: response.data.status === "Failed" ? model.id : response.data.metrics_id,
              model: response.data.model_filename,
              dataset: response.data.data_filename,
              status: response.data.status,
            };
          }
          return model;
        });
      }
      );
    }
  },

  /**
   * Fetches fairness metrics by ID.
   */
  async getFairnessMetrics(id: string): Promise<any> {
    const response = await CustomAxios.get(`/bias_and_fairness/metrics/${id}`);

    // Parses stringified JSON if needed
    const raw = response.data;
    const parsed = typeof raw.metrics === "string" ? JSON.parse(raw.metrics) : raw.metrics;
    return parsed;
  },

  /**
   * Fetches all fairness metrics metadata.
   */
  async getAllFairnessMetrics(): Promise<any[]> {
    const response = await CustomAxios.get("/bias_and_fairness/metrics/all");
    return response.data;
  },

  /**
   * Deletes a fairness metric.
   * @param id number type representing metric id
   */
  async deleteFairnessCheck(id: number): Promise<void> {
    await CustomAxios.delete(`/bias_and_fairness/metrics/${id}`);
  }


};