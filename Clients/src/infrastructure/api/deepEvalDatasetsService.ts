import CustomAxios from "./customAxios";

export interface UploadDatasetResponse {
  message: string;
  path: string; // relative to EvaluationModule (e.g., data/uploads/{tenant}/{file}.json)
  filename: string;
  size: number;
  tenant: string;
}

class DeepEvalDatasetsService {
  async uploadDataset(file: File): Promise<UploadDatasetResponse> {
    const form = new FormData();
    form.append("dataset", file);
    const res = await CustomAxios.post("/deepeval/datasets/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as UploadDatasetResponse;
  }
}

export const deepEvalDatasetsService = new DeepEvalDatasetsService();


