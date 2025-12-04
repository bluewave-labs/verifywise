/**
 * Type definitions for DeepEval Experiments Dashboard
 */

/**
 * DeepEval Project - A container for organizing evaluation runs
 * Simplified to only store name and description.
 * Model configs, datasets, and metrics are configured per evaluation run.
 */
export interface DeepEvalProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tenant?: string;
  // Project-level defaults/configuration
  useCase?: "chatbot" | "rag" | "agent";
  defaultDataset?: "chatbot" | "rag" | "agent" | "safety";
  orgId?: string;
}

export interface DeepEvalOrganization {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Experiment Run - A single evaluation run within a project
 * Contains model config, dataset, metrics, and results
 */
export interface ExperimentRun {
  id: string;
  projectId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: string;
  
  // Model configuration for this run
  model: {
    name: string;
    provider: "huggingface" | "openai" | "ollama";
    generation?: {
      maxTokens: number;
      temperature: number;
      topP: number;
    };
  };
  
  // Dataset configuration for this run
  dataset: {
    useBuiltin: boolean;
    categories?: string[];
    difficulties?: string[];
    limit?: number;
  };
  
  // Enabled metrics for this run
  enabledMetrics: {
    answerRelevancy: boolean;
    bias: boolean;
    toxicity: boolean;
    faithfulness: boolean;
    hallucination: boolean;
    contextualRelevancy: boolean;
  };
  
  // Metric thresholds for this run
  metricThresholds: {
    answerRelevancy: number;
    bias: number;
    toxicity: number;
    faithfulness: number;
    hallucination: number;
    contextualRelevancy: number;
  };
  
  // Results
  metrics: {
    answerRelevancy?: number;
    bias?: number;
    toxicity?: number;
    faithfulness?: number;
    hallucination?: number;
    contextualRelevancy?: number;
  };
  totalSamples: number;
  avgWordCount?: number;
  duration?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface ExperimentDetail {
  id: string;
  projectId: string;
  status: string;
  results: {
    model: string;
    dataset: string;
    totalSamples: number;
    timestamp: string;
    metricSummaries: Record<string, MetricSummary>;
    avgWordCount: number;
    avgResponseLength: number;
    detailedResults?: SampleResult[];
  };
}

export interface MetricSummary {
  averageScore: number;
  passRate: number;
  minScore: number;
  maxScore: number;
  totalEvaluated: number;
}

export interface SampleResult {
  sampleId: string;
  protectedAttributes: {
    category: string;
    difficulty: string;
  };
  input: string;
  actualOutput: string;
  expectedOutput: string;
  responseLength: number;
  wordCount: number;
  metricScores: Record<string, {
    score: number;
    passed: boolean;
    threshold: number;
    reason?: string;
  }>;
  timestamp: string;
}

export interface PerformanceHistory {
  projectId: string;
  experiments: Array<{
    id: string;
    timestamp: string;
    metrics: Record<string, number>;
  }>;
}

