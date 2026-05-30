/**
 * application-v2/use-cases/publishing/targets/profile-presentation — Slice 17.
 *
 * Profile presentation items do not yet have a V2 domain. Same truthful
 * partial-envelope contract as `important-event.ts`.
 */
import type {
  PublishingCommand,
  PublishingRequestContext,
  PublishingResult,
} from "../contracts";
import { buildEmptyFeedEffects } from "../contracts";

export async function publishProfilePresentationItem(
  _ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  if (command.targetType !== "profile_presentation") {
    return {
      status: "blocked",
      publishedEntity: null,
      feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
      warnings: [],
      errors: [{ code: "UNSUPPORTED_TARGET", message: "Niezgodny typ targetu publikacji." }],
    };
  }
  return {
    status: "partial",
    publishedEntity: null,
    feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
    warnings: [
      "Backend dla 'Prezentacji profilu' jest jeszcze w przygotowaniu. Wpis nie został zapisany.",
    ],
    errors: [
      {
        code: "TARGET_PARTIAL",
        message: "Prezentacja profilu będzie dostępna po wdrożeniu domeny w V2.",
      },
    ],
  };
}
