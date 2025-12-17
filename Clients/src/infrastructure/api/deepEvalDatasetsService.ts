import CustomAxios from "./customAxios";

export interface UploadDatasetResponse {
  message: string;
  path: string; // relative to EvaluationModule (e.g., data/uploads/{tenant}/{file}.json)
  filename: string;
  size: number;
  tenant: string;
  datasetType?: "chatbot" | "rag" | "agent";
}

export interface ListedDataset {
  key: string;
  name: string;
  path: string;
  use_case: "chatbot" | "rag" | "agent" | "safety";
}

export type DatasetType = "chatbot" | "rag" | "agent";

export interface DatasetPromptRecord {
  id: string;
  category: string;
  prompt: string;
  expected_output: string;
  expected_keywords?: string[];
  difficulty?: string;
  retrieval_context?: string[];
}

class DeepEvalDatasetsService {
  async uploadDataset(file: File, datasetType: DatasetType = "chatbot"): Promise<UploadDatasetResponse> {
    const form = new FormData();
    form.append("dataset", file);
    form.append("dataset_type", datasetType);
    const res = await CustomAxios.post("/deepeval/datasets/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as UploadDatasetResponse;
  }

  async list(): Promise<Record<"chatbot" | "rag" | "agent" | "safety", ListedDataset[]>> {
    const res = await CustomAxios.get("/deepeval/datasets/list");
    return res.data.datasets as Record<"chatbot" | "rag" | "agent" | "safety", ListedDataset[]>;
  }

  async read(path: string): Promise<{ path: string; prompts: DatasetPromptRecord[] }> {
    const res = await CustomAxios.get("/deepeval/datasets/read", { params: { path } });
    return res.data as { path: string; prompts: DatasetPromptRecord[] };
  }

  async listUploads(): Promise<{ uploads: { name: string; path: string; size: number; modifiedAt: number }[] }> {
    const res = await CustomAxios.get("/deepeval/datasets/uploads");
    return res.data as { uploads: { name: string; path: string; size: number; modifiedAt: number }[] };
  }

  async listMy(): Promise<{ datasets: { id: number; name: string; path: string; size: number; createdAt: string; datasetType?: DatasetType }[] }> {
    const res = await CustomAxios.get("/deepeval/datasets/user");
    return res.data as { datasets: { id: number; name: string; path: string; size: number; createdAt: string; datasetType?: DatasetType }[] };
  }

  async deleteDatasets(paths: string[]): Promise<{ message: string; deleted: number }> {
    const res = await CustomAxios.delete("/deepeval/datasets/user", { data: { paths } });
    return res.data as { message: string; deleted: number };
  }
}

export const deepEvalDatasetsService = new DeepEvalDatasetsService();
