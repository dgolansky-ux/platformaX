/**
 * features-v2/publishing — PublishingResultBlock.
 *
 * Small block that renders the right state (success / partial / blocked /
 * error) given the publish-hook output. Keeps PublishingComposerCore inside
 * the code-quality component-size guard.
 */
import {
  PublishingBlockedState,
  PublishingErrorState,
  PublishingPartialState,
  PublishingSuccessState,
} from "./PublishingStates";
import type { PublishingResultUi } from "./types";

interface Props {
  result: PublishingResultUi | null;
  error: string | null;
}

export function PublishingResultBlock({ result, error }: Props) {
  return (
    <>
      {error && <PublishingErrorState message={error} />}
      {result?.status === "published" && <PublishingSuccessState result={result} />}
      {result?.status === "partial" && <PublishingPartialState result={result} />}
      {result?.status === "blocked" && <PublishingBlockedState result={result} />}
    </>
  );
}
