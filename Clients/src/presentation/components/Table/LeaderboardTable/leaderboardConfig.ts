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

// Metric configuration with proper display names
export const METRIC_CONFIG: Record<string, MetricConfigItem> = {
  // VerifyWise Practical Leaderboard Suites
  instruction_following: { name: "Instruction Following", shortName: "Inst. Fol.", higherIsBetter: true },
  rag_grounded_qa: { name: "RAG Grounded QA", shortName: "RAG QA", higherIsBetter: true },
  coding_tasks: { name: "Coding Tasks", shortName: "Coding", higherIsBetter: true },
  agent_workflows: { name: "Agent Workflows", shortName: "Agent", higherIsBetter: true },
  safety_policy: { name: "Safety & Policy", shortName: "Safety", higherIsBetter: true },

  // Legacy DeepEval metrics
  completeness: { name: "Completeness", shortName: "Complete", higherIsBetter: true },
  correctness: { name: "Correctness", shortName: "Correct", higherIsBetter: true },
  relevance: { name: "Relevance", shortName: "Relevance", higherIsBetter: true },
  coherence: { name: "Coherence", shortName: "Coherent", higherIsBetter: true },
  faithfulness: { name: "Faithfulness", shortName: "Faithful", higherIsBetter: true },
  hallucination: { name: "Hallucination", shortName: "Halluc.", higherIsBetter: false },
  bias: { name: "Bias", shortName: "Bias", higherIsBetter: false },
  toxicity: { name: "Toxicity", shortName: "Toxicity", higherIsBetter: false },
  answerRelevancy: { name: "Answer Relevancy", shortName: "Ans. Rel.", higherIsBetter: true },
  contextualRelevancy: { name: "Contextual Relevancy", shortName: "Ctx. Rel.", higherIsBetter: true },
  knowledgeRetention: { name: "Knowledge Retention", shortName: "Know. Ret.", higherIsBetter: true },
  taskCompletion: { name: "Task Completion", shortName: "Task", higherIsBetter: true },
  instructionFollowing: { name: "Instruction Following (Legacy)", shortName: "Inst.", higherIsBetter: true },
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
