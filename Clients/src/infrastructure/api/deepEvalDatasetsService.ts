import CustomAxios from "./customAxios";

export interface UploadDatasetResponse {
  message: string;
  path: string; // relative to EvaluationModule (e.g., data/uploads/{tenant}/{file}.json)
  filename: string;
  size: number;
  tenant: string;
}

export interface ListedDataset {
  key: string;
  name: string;
  path: string;
  use_case: "chatbot" | "rag" | "agent" | "safety";
}

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
  async uploadDataset(file: File): Promise<UploadDatasetResponse> {
    const form = new FormData();
    form.append("dataset", file);
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
}

export const deepEvalDatasetsService = new DeepEvalDatasetsService();


