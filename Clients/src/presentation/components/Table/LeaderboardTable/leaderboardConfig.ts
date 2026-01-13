/**
 * Leaderboard Configuration
 * 
 * Shared constants and types for the leaderboard table component.
 */

export interface MetricConfigItem {
  name: string;
  shortName: string;
  higherIsBetter: boolean;
}

// Metric configuration
export const METRIC_CONFIG: Record<string, MetricConfigItem> = {
  completeness: { name: "Completeness", shortName: "Completeness", higherIsBetter: true },
  correctness: { name: "Correctness", shortName: "Correctness", higherIsBetter: true },
  relevance: { name: "Relevance", shortName: "Relevance", higherIsBetter: true },
  coherence: { name: "Coherence", shortName: "Coherence", higherIsBetter: true },
  faithfulness: { name: "Faithfulness", shortName: "Faithfulness", higherIsBetter: true },
  hallucination: { name: "Hallucination", shortName: "Hallucination", higherIsBetter: false },
  bias: { name: "Bias", shortName: "Bias", higherIsBetter: false },
  toxicity: { name: "Toxicity", shortName: "Toxicity", higherIsBetter: false },
  answerRelevancy: { name: "Answer Relevancy", shortName: "Ans. Relevancy", higherIsBetter: true },
  contextualRelevancy: { name: "Contextual Relevancy", shortName: "Ctx. Relevancy", higherIsBetter: true },
  knowledgeRetention: { name: "Knowledge Retention", shortName: "Knowledge Ret.", higherIsBetter: true },
  taskCompletion: { name: "Task Completion", shortName: "Task Comp.", higherIsBetter: true },
  instructionFollowing: { name: "Instruction Following", shortName: "Inst. Following", higherIsBetter: true },
};

export interface LeaderboardEntry {
  rank: number;
  model: string;
  provider?: string;
  score: number;
  metricScores: Record<string, number>;
  experimentCount: number;
  lastEvaluated: string;
}
