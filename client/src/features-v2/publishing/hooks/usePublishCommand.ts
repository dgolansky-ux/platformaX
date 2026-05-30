/**
 * features-v2/publishing — usePublishCommand.
 *
 * Owns the submit lifecycle. Generates a per-attempt idempotency key so the
 * server can dedupe accidental double-submits.
 */
import { useCallback, useState } from "react";
import type {
  PublishingAdapter,
  PublishingCommandUi,
  PublishingResultUi,
} from "../types";

interface State {
  result: PublishingResultUi | null;
  isSubmitting: boolean;
  error: string | null;
}

export interface UsePublishCommandReturn extends State {
  publish(command: Omit<PublishingCommandUi, "idempotencyKey"> & { idempotencyKey?: string }): Promise<PublishingResultUi>;
  reset(): void;
}

function nextKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function usePublishCommand(adapter: PublishingAdapter, viewerUserId: string): UsePublishCommandReturn {
  const [state, setState] = useState<State>({ result: null, isSubmitting: false, error: null });

  const publish = useCallback<UsePublishCommandReturn["publish"]>(async (command) => {
    const finalCommand: PublishingCommandUi = {
      ...command,
      idempotencyKey: command.idempotencyKey ?? nextKey(),
    };
    setState({ result: null, isSubmitting: true, error: null });
    try {
      const result = await adapter.publish(viewerUserId, finalCommand);
      setState({ result, isSubmitting: false, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publikacja nieudana.";
      setState({ result: null, isSubmitting: false, error: message });
      throw err;
    }
  }, [adapter, viewerUserId]);

  const reset = useCallback(() => {
    setState({ result: null, isSubmitting: false, error: null });
  }, []);

  return { ...state, publish, reset };
}
