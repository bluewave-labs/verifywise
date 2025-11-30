import CustomAxios from "./customAxios";

export type ScorerType = "llm" | "builtin" | "custom";

export interface DeepEvalScorer {
  id: string;
  projectId?: string | null;
  name: string;
  description?: string | null;
  type: ScorerType;
  metricKey: string;
  config: Record<string, any>;
  enabled: boolean;
  defaultThreshold?: number | null;
  weight?: number | null;
  tenant?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
}

export interface ListScorersResponse {
  scorers: DeepEvalScorer[];
}

class DeepEvalScorersService {
  async list(params?: { project_id?: string }): Promise<ListScorersResponse> {
    const res = await CustomAxios.get("/deepeval/scorers", { params });
    return res.data as ListScorersResponse;
  }

  async create(payload: Partial<DeepEvalScorer> & { name: string; metricKey: string }): Promise<DeepEvalScorer> {
    const res = await CustomAxios.post("/deepeval/scorers", payload);
    return res.data as DeepEvalScorer;
  }

  async update(id: string, payload: Partial<DeepEvalScorer>): Promise<DeepEvalScorer> {
    const res = await CustomAxios.put(`/deepeval/scorers/${id}`, payload);
    return res.data as DeepEvalScorer;
  }

  async delete(id: string): Promise<{ message: string; id: string }> {
    const res = await CustomAxios.delete(`/deepeval/scorers/${id}`);
    return res.data as { message: string; id: string };
  }
}

export const deepEvalScorersService = new DeepEvalScorersService();


