/**
 * features-v2/publishing — usePublishingTargets.
 */
import { useEffect, useState } from "react";
import type { PublishingAdapter, PublishingTargetDefinitionUi } from "../types";

interface State {
  targets: readonly PublishingTargetDefinitionUi[];
  isLoading: boolean;
  error: string | null;
}

export function usePublishingTargets(adapter: PublishingAdapter, viewerUserId: string): State {
  const [state, setState] = useState<State>({ targets: [], isLoading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    setState({ targets: [], isLoading: true, error: null });
    adapter
      .listAvailableTargets(viewerUserId)
      .then((targets) => {
        if (cancelled) return;
        setState({ targets, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Nie udało się wczytać listy targetów.";
        setState({ targets: [], isLoading: false, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, viewerUserId]);
  return state;
}
