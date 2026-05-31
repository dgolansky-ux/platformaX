/**
 * application-v2/use-cases/publishing/targets/important-event — Slice 17.
 *
 * Important Events do not yet have a V2 domain. Until that backend lands,
 * the dispatcher must still recognize the target and respond with a truthful
 * `partial` envelope (status `partial`, error `TARGET_PARTIAL`,
 * `blockedReason backend_not_ready_v2`) — no fake save, no fake counters,
 * no silent drop.
 */
import type {
  PublishingCommand,
  PublishingRequestContext,
  PublishingResult,
} from "../contracts";
import { buildEmptyFeedEffects } from "../contracts";

export async function publishImportantEvent(
  _ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  if (command.targetType !== "important_event") {
    return {
      status: "blocked",
      publishedEntity: null,
      feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
      warnings: [],
      errors: [{ code: "UNSUPPORTED_TARGET", message: "Niezgodny typ targetu publikacji." }],
    };
  }
  const warnings: string[] = [];
  if (!command.title || command.title.trim().length === 0) {
    warnings.push("Pole 'title' jest wymagane dla ważnego wydarzenia.");
  }
  if (!command.date) {
    warnings.push("Pole 'date' jest wymagane dla ważnego wydarzenia.");
  }
  return {
    status: "partial",
    publishedEntity: null,
    feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
    warnings: [
      "Backend dla 'Ważnych wydarzeń' jest jeszcze w przygotowaniu. Wpis nie został zapisany.",
      ...warnings,
    ],
    errors: [
      {
        code: "TARGET_PARTIAL",
        message: "Ważne wydarzenia będą dostępne po wdrożeniu domeny w V2.",
      },
    ],
  };
}
