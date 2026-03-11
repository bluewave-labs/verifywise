import { useRef, useEffect, useCallback } from "react";

/**
 * Configuration for the auto-save hook.
 *
 * @template TData - The shape of the form data being auto-saved.
 */
interface UseAutoSaveConfig<TData> {
  /** The entity ID that must be truthy before saves are dispatched. */
  entityId: number | string | undefined | null;
  /** Debounce delay in milliseconds. Defaults to 800. */
  delay?: number;
  /**
   * Build the request body (typically FormData) from the current form state
   * plus any field-level overrides provided at call time.
   */
  buildPayload: (
    currentData: TData,
    overrides?: Record<string, string>
  ) => FormData;
  /**
   * Execute the actual API call. Receives the FormData produced by
   * `buildPayload`.
   */
  saveFn: (payload: FormData, signal: AbortSignal) => Promise<unknown>;
}

interface UseAutoSaveReturn {
  /** Trigger a debounced auto-save with optional field-level overrides. */
  triggerAutoSave: (overrides?: Record<string, string>) => void;
  /** Convenience wrapper: triggers auto-save for a single field. */
  autoSaveField: (field: string, value: string | boolean) => void;
}

/**
 * Shared debounced auto-save hook for framework drawer dialogs.
 *
 * Handles:
 * - Debouncing with configurable delay (default 800 ms)
 * - Timer cleanup on unmount
 * - Abort of in-flight requests on unmount or when a new save fires
 * - Silent failure so manual Save button remains usable
 */
export function useAutoSave<TData>(
  formData: TData,
  config: UseAutoSaveConfig<TData>
): UseAutoSaveReturn {
  const { entityId, delay = 800, buildPayload, saveFn } = config;

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Clean up timer and in-flight request on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const triggerAutoSave = useCallback(
    (overrides?: Record<string, string>) => {
      if (!entityId) return;

      // Cancel any pending debounce timer
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        // Abort any previous in-flight request
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        try {
          const payload = buildPayload(formDataRef.current, overrides);
          await saveFn(payload, abortRef.current.signal);
        } catch {
          // Silent fail for auto-save — user can still use the manual Save button
        }
      }, delay);
    },
    [entityId, delay, buildPayload, saveFn]
  );

  const autoSaveField = useCallback(
    (field: string, value: string | boolean) => {
      triggerAutoSave({ [field]: String(value) });
    },
    [triggerAutoSave]
  );

  return { triggerAutoSave, autoSaveField };
}
