/**
 * ModelLifecycleContent - Standalone plugin component for the lifecycle slot.
 *
 * Receives modelId via slot props and internally wires up all lifecycle hooks.
 */

import { useCallback } from "react";
import { useModelLifecycle, useLifecycleProgress } from "../../../../application/hooks/useModelLifecycle";
import LifecycleStepperLayout from "../components/LifecycleStepperLayout";

interface ModelLifecycleContentProps {
  modelId: number;
}

export default function ModelLifecycleContent({ modelId }: ModelLifecycleContentProps) {
  const { phases, loading, refresh } = useModelLifecycle(modelId);
  const { progress, refresh: refreshProgress } = useLifecycleProgress(modelId);

  const handleValueChanged = useCallback(() => {
    refresh();
    refreshProgress();
  }, [refresh, refreshProgress]);

  return (
    <LifecycleStepperLayout
      phases={phases}
      progress={progress}
      modelId={modelId}
      loading={loading}
      onValueChanged={handleValueChanged}
    />
  );
}
