/**
 * features-v2/publishing — usePublishingPreview.
 *
 * Debounced preview build. The hook fires a fresh preview when the command
 * changes; the adapter is idempotent so re-renders never publish.
 */
import { useEffect, useRef, useState } from "react";
import type {
  PublishingAdapter,
  PublishingCommandUi,
  PublishingPreviewUi,
} from "../types";

interface State {
  preview: PublishingPreviewUi | null;
  isLoading: boolean;
  error: string | null;
}

export function usePublishingPreview(
  adapter: PublishingAdapter,
  viewerUserId: string,
  command: PublishingCommandUi | null,
  debounceMs = 200,
): State {
  const [state, setState] = useState<State>({ preview: null, isLoading: false, error: null });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!command) {
      setState({ preview: null, isLoading: false, error: null });
      return;
    }
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    timerRef.current = window.setTimeout(() => {
      adapter
        .buildPreview(viewerUserId, command)
        .then((preview) => setState({ preview, isLoading: false, error: null }))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Nie udało się zbudować podglądu.";
          setState({ preview: null, isLoading: false, error: message });
        });
    }, debounceMs);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [adapter, viewerUserId, command, debounceMs]);

  return state;
}
