/**
 * application-v2/use-cases/publishing/preview — buildPublishingPreview (Slice 17).
 *
 * Builds the read-only preview the UI uses BEFORE the publish call goes out.
 * It re-uses the registry to find the matching target definition and
 * compounds a viewer-safe view model (no PII, no raw records).
 */
import type {
  PublishingCommand,
  PublishingPreview,
  PublishingRequestContext,
  PublishingTargetDefinition,
  PublishingVisibility,
} from "./contracts";
import type { PublishingTargetRegistry } from "./registry";

export interface BuildPreviewDeps {
  readonly registry: PublishingTargetRegistry;
}

const PREVIEW_BODY_MAX = 400;

export async function buildPublishingPreview(
  deps: BuildPreviewDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingPreview> {
  const targets = await deps.registry.getAvailablePublishingTargets(ctx);
  const matching = targets.find((t) => t.targetType === command.targetType && t.targetId === (command.targetId ?? null) || sameUserTarget(t, ctx, command));
  if (!matching) {
    return {
      targetType: command.targetType,
      targetId: command.targetId ?? null,
      targetLabel: "(target niedostępny)",
      contentPreview: clip(command.body),
      mediaPreviewRefs: command.mediaRefs ?? [],
      visibilityLabel: visibilityLabel(command.visibility),
      expectedDestinations: [],
      warnings: ["Target publikacji nie jest dostępny dla bieżącego użytkownika."],
      disabledReason: "permission_denied",
    };
  }

  const warnings: string[] = [];
  if (command.body.trim().length === 0) warnings.push("Treść jest pusta.");
  if (command.body.length > matching.maxBodyLength) {
    warnings.push(`Treść przekracza limit ${matching.maxBodyLength} znaków.`);
  }
  if ((command.mediaRefs?.length ?? 0) > matching.maxMediaCount) {
    warnings.push(`Liczba mediów przekracza limit ${matching.maxMediaCount}.`);
  }
  if (matching.status !== "available") {
    warnings.push(`Target jest w stanie '${matching.status}'.`);
  }

  return {
    targetType: matching.targetType,
    targetId: matching.targetId,
    targetLabel: matching.label,
    contentPreview: clip(command.body),
    mediaPreviewRefs: command.mediaRefs ?? [],
    visibilityLabel: visibilityLabel(command.visibility),
    expectedDestinations: describeDestinations(matching),
    warnings,
    disabledReason: matching.blockedReason,
  };
}

function sameUserTarget(t: PublishingTargetDefinition, ctx: PublishingRequestContext, command: PublishingCommand): boolean {
  if (t.targetType !== command.targetType) return false;
  if (t.targetType === "friend_feed" || t.targetType === "important_event" || t.targetType === "profile_presentation") {
    return t.targetId === ctx.viewerUserId;
  }
  return false;
}

function clip(s: string): string {
  if (s.length <= PREVIEW_BODY_MAX) return s;
  return s.slice(0, PREVIEW_BODY_MAX - 1) + "…";
}

function visibilityLabel(v: PublishingVisibility): string {
  switch (v) {
    case "friends_only":
      return "Tylko znajomi";
    case "public":
      return "Publiczne";
    case "private":
      return "Prywatne";
    case "community_all":
      return "Cała społeczność";
    case "community_staff":
      return "Tylko kadra";
    case "community_relational":
      return "Relacyjne";
    case "channel_followers":
      return "Obserwujący kanał";
    case "workplace_public":
      return "Miejsce pracy — publiczne";
    case "workplace_friends_only":
      return "Miejsce pracy — znajomi";
    case "workplace_private":
      return "Miejsce pracy — prywatne";
    case "profile_owner_chosen":
      return "Wg ustawień profilu";
  }
}

function describeDestinations(t: PublishingTargetDefinition): readonly string[] {
  switch (t.targetType) {
    case "friend_feed":
      return ["Feed znajomych"];
    case "community_feed":
      return ["Feed społeczności"];
    case "community_staff_feed":
      return ["Feed kadry"];
    case "community_relational_feed":
      return ["Feed relacyjny"];
    case "channel":
      return ["Kanał"];
    case "workplace":
      return ["Strona miejsca pracy", "Zajawka na feedzie znajomych"];
    case "important_event":
      return ["Sekcja Ważne wydarzenia na profilu"];
    case "profile_presentation":
      return ["Sekcja Prezentacja na profilu"];
  }
}
