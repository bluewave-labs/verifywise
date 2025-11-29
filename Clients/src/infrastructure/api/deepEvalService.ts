/**
 * DeepEval API Service
 * 
 * Handles communication with the DeepEval backend API.
 */

import CustomAxios from './customAxios';

const BASE_URL = '/deepeval';

export interface DeepEvalConfig {
  model: {
    name: string;
    provider: 'huggingface' | 'openai' | 'ollama';
    generation: {
      maxTokens: number;
      temperature: number;
      topP: number;
    };
  };
  dataset: {
    useBuiltin: boolean;
    categories?: string[];
    difficulties?: string[];
    limit?: number;
  };
  metrics: {
    answerRelevancy: boolean;
    bias: boolean;
    toxicity: boolean;
    faithfulness: boolean;
    hallucination: boolean;
    contextualRelevancy: boolean;
  };
  metricThresholds: {
    answerRelevancy: number;
    bias: number;
    toxicity: number;
    faithfulness: number;
    hallucination: number;
    contextualRelevancy: number;
  };
}

export interface DeepEvalEvaluation {
  evalId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  model: string;
  totalSamples: number;
  createdAt: string;
  completedAt?: string;
  progress?: string;
}

export interface DeepEvalResults {
  evalId: string;
  status: string;
  results: {
    model: string;
    dataset: string;
    totalSamples: number;
    timestamp: string;
    metricSummaries: Record<string, any>;
    avgWordCount: number;
    avgResponseLength: number;
  };
}

export interface DatasetInfo {
  totalPrompts: number;
  categories: string[];
  difficulties: string[];
  categoryCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  categoryDetails: Record<string, any>;
}

export interface AvailableMetric {
  name: string;
  displayName: string;
  description: string;
  requiresContext: boolean;
  requiresOpenaiKey: boolean;
  scoreInterpretation: string;
}

class DeepEvalService {
  /**
   * Create and start a new DeepEval evaluation
   */
  async createEvaluation(config: DeepEvalConfig): Promise<{
    evalId: string;
    status: string;
    message: string;
    createdAt: string;
  }> {
    const response = await CustomAxios.post(`${BASE_URL}/evaluate`, config);
    return response.data;
  }

  /**
   * Get the status of an evaluation
   */
  async getEvaluationStatus(evalId: string): Promise<{
    evalId: string;
    status: string;
    progress: string;
    createdAt: string;
    updatedAt: string;
    error?: string;
  }> {
    const response = await CustomAxios.get(`${BASE_URL}/evaluate/status/${evalId}`);
    return response.data;
  }

  /**
   * Get the results of a completed evaluation
   */
  async getEvaluationResults(evalId: string): Promise<DeepEvalResults> {
    const response = await CustomAxios.get(`${BASE_URL}/evaluate/results/${evalId}`);
    return response.data;
  }

  /**
   * Get all evaluations for the current tenant
   */
  async getAllEvaluations(): Promise<{ evaluations: DeepEvalEvaluation[] }> {
    const response = await CustomAxios.get(`${BASE_URL}/evaluations`);
    return response.data;
  }

  /**
   * Delete an evaluation
   */
  async deleteEvaluation(evalId: string): Promise<{
    message: string;
    evalId: string;
  }> {
    const response = await CustomAxios.delete(`${BASE_URL}/evaluations/${evalId}`);
    return response.data;
  }

  /**
   * Get available DeepEval metrics
   */
  async getAvailableMetrics(): Promise<{ metrics: AvailableMetric[] }> {
    const response = await CustomAxios.get(`${BASE_URL}/metrics/available`);
    return response.data;
  }

  /**
   * Get information about the evaluation dataset
   */
  async getDatasetInfo(): Promise<DatasetInfo> {
    const response = await CustomAxios.get(`${BASE_URL}/dataset/info`);
    return response.data;
  }
}

export const deepEvalService = new DeepEvalService();

