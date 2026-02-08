/**
 * Model Lifecycle Hooks
 *
 * React hooks for fetching and managing model lifecycle data.
 */

import { useState, useEffect, useCallback } from "react";
import {
  LifecyclePhase,
  LifecycleProgress,
} from "../../domain/interfaces/i.modelLifecycle";
import {
  getModelLifecycle,
  getLifecycleConfig,
  getLifecycleProgress,
} from "../repository/modelLifecycle.repository";

interface UseModelLifecycleResult {
  phases: LifecyclePhase[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches full lifecycle data for a specific model (phases + items + values).
 */
export function useModelLifecycle(modelId: number | null): UseModelLifecycleResult {
  const [phases, setPhases] = useState<LifecyclePhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!modelId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getModelLifecycle(modelId);
      setPhases(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load lifecycle data");
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { phases, loading, error, refresh: fetchData };
}

interface UseLifecycleConfigResult {
  phases: LifecyclePhase[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches the lifecycle configuration (phases + items, without model values).
 */
export function useLifecycleConfig(
  includeInactive = false
): UseLifecycleConfigResult {
  const [phases, setPhases] = useState<LifecyclePhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLifecycleConfig(includeInactive);
      setPhases(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load lifecycle config");
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { phases, loading, error, refresh: fetchData };
}

interface UseLifecycleProgressResult {
  progress: LifecycleProgress | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches lifecycle completion progress for a specific model.
 */
export function useLifecycleProgress(
  modelId: number | null
): UseLifecycleProgressResult {
  const [progress, setProgress] = useState<LifecycleProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!modelId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLifecycleProgress(modelId);
      setProgress(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load lifecycle progress");
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { progress, loading, error, refresh: fetchData };
}
