/**
 * features-v2/publishing — MOCK_LOCAL_ONLY adapter.
 *
 * Mirrors the server-side publishing dispatcher in-memory so the UI has a
 * realistic transport without depending on `@server/*` or any HTTP wiring.
 * Idempotency is enforced; backend-not-ready targets return a truthful
 * partial result. No localStorage / sessionStorage. No fake save: every
 * call returns a real shaped envelope.
 */
import type {
  PublishingAdapter,
  PublishingCommandUi,
  PublishingPreviewUi,
  PublishingResultUi,
  PublishingTargetDefinitionUi,
  PublishingVisibilityUi,
} from "./types";

interface AdapterState {
  readonly targetsByViewer: Map<string, readonly PublishingTargetDefinitionUi[]>;
  readonly idempotencyCache: Map<string, PublishingResultUi>;
  postSequence: number;
}

const DEFAULT_TARGETS: readonly PublishingTargetDefinitionUi[] = [
  {
    targetType: "friend_feed",
    targetId: "viewer",
    label: "Twój feed znajomych",
    description: "Publikacja widoczna dla znajomych z Twojej sieci.",
    allowedContentTypes: ["text_post", "media_post"],
    allowedMediaTypes: ["image", "video", "document", "link"],
    visibilityOptions: ["friends_only", "public", "private"],
    defaultVisibility: "friends_only",
    maxBodyLength: 4000,
    maxMediaCount: 4,
    permissionsRequired: [],
    status: "available",
    routeTarget: "/friends-feed",
  },
  {
    targetType: "important_event",
    targetId: "viewer",
    label: "Ważne wydarzenie",
    description: "Specjalna karta na profilu — tytuł, data i opis.",
    allowedContentTypes: ["important_event"],
    allowedMediaTypes: ["image", "link"],
    visibilityOptions: ["public", "friends_only", "private"],
    defaultVisibility: "public",
    maxBodyLength: 4000,
    maxMediaCount: 4,
    permissionsRequired: ["profile_owner"],
    status: "partial",
    blockedReason: "backend_not_ready_v2",
    routeTarget: "/profile/me/important-events",
  },
  {
    targetType: "profile_presentation",
    targetId: "viewer",
    label: "Prezentacja profilu",
    description: "Edytorska sekcja na profilu — opis, media, widoczność.",
    allowedContentTypes: ["profile_presentation_item"],
    allowedMediaTypes: ["image", "video", "document", "link"],
    visibilityOptions: ["public", "friends_only", "private", "profile_owner_chosen"],
    defaultVisibility: "public",
    maxBodyLength: 6000,
    maxMediaCount: 6,
    permissionsRequired: ["profile_owner"],
    status: "partial",
    blockedReason: "backend_not_ready_v2",
    routeTarget: "/profile/me/presentation",
  },
];

export interface PublishingMockAdapterOptions {
  readonly targets?: readonly PublishingTargetDefinitionUi[];
}

export function createPublishingMockAdapter(options?: PublishingMockAdapterOptions): PublishingAdapter {
  const state: AdapterState = {
    targetsByViewer: new Map(),
    idempotencyCache: new Map(),
    postSequence: 0,
  };
  const targets = options?.targets ?? DEFAULT_TARGETS;
  return {
    async listAvailableTargets(viewerUserId) {
      let cached = state.targetsByViewer.get(viewerUserId);
      if (!cached) {
        cached = targets.map((t) => (t.targetId === "viewer" ? { ...t, targetId: viewerUserId } : t));
        state.targetsByViewer.set(viewerUserId, cached);
      }
      return cached;
    },
    async buildPreview(viewerUserId, command) {
      const all = await this.listAvailableTargets(viewerUserId);
      const target = all.find((t) => t.targetType === command.targetType && (t.targetId === command.targetId || (command.targetId === undefined && t.targetId === viewerUserId)));
      const preview: PublishingPreviewUi = {
        targetType: command.targetType,
        targetId: command.targetId ?? viewerUserId,
        targetLabel: target?.label ?? "(target niedostępny)",
        contentPreview: clip(command.body),
        mediaPreviewRefs: command.mediaRefs ?? [],
        visibilityLabel: visibilityLabel(command.visibility),
        expectedDestinations: target?.routeTarget ? [target.routeTarget] : [],
        warnings: buildWarnings(command, target),
        disabledReason: target?.blockedReason,
      };
      return preview;
    },
    async publish(viewerUserId, command) {
      const key = `${viewerUserId}|${command.idempotencyKey}`;
      const cached = state.idempotencyCache.get(key);
      if (cached) return cached;
      const result = buildResult(state, viewerUserId, command);
      state.idempotencyCache.set(key, result);
      return result;
    },
  };
}

function buildResult(state: AdapterState, _viewerUserId: string, command: PublishingCommandUi): PublishingResultUi {
  if (command.idempotencyKey.trim().length === 0) {
    return errorResult("INTERNAL_ERROR", "Brak idempotencyKey w komendzie publikacji.");
  }
  if (command.body.trim().length === 0 && command.targetType !== "important_event" && command.targetType !== "profile_presentation") {
    return errorResult("EMPTY_BODY", "Treść posta nie może być pusta.");
  }
  if (command.targetType === "important_event") {
    if (!command.title || command.title.trim().length === 0) return errorResult("TITLE_REQUIRED", "Ważne wydarzenie wymaga tytułu.");
    if (!command.date) return errorResult("DATE_REQUIRED", "Ważne wydarzenie wymaga daty.");
    return partialResult("Backend dla 'Ważnych wydarzeń' jest jeszcze w przygotowaniu.");
  }
  if (command.targetType === "profile_presentation") {
    return partialResult("Backend dla 'Prezentacji profilu' jest jeszcze w przygotowaniu.");
  }
  state.postSequence += 1;
  const id = `mock-${command.targetType}-${state.postSequence}`;
  return {
    status: "published",
    publishedEntity: {
      domain: "content-v2",
      entityType: `${command.targetType}_post`,
      entityId: id,
      routeTarget: routeFor(command),
    },
    feedEffects: {
      createdFriendFeedItem: command.targetType === "friend_feed",
      createdTeaser: command.targetType === "workplace",
      createdNotificationEvent: false,
      noFeedEffect: command.targetType === "channel",
    },
    warnings: [],
    errors: [],
  };
}

function routeFor(command: PublishingCommandUi): string {
  switch (command.targetType) {
    case "friend_feed":
      return "/friends-feed";
    case "community_feed":
      return `/communities/${command.targetId ?? ""}/feed`;
    case "community_staff_feed":
      return `/communities/${command.targetId ?? ""}/staff-feed`;
    case "community_relational_feed":
      return `/communities/${command.targetId ?? ""}/relational-feed`;
    case "channel":
      return `/channels/${command.targetId ?? ""}`;
    case "workplace":
      return `/workplace/${command.targetId ?? ""}`;
    case "important_event":
      return "/profile/me/important-events";
    case "profile_presentation":
      return "/profile/me/presentation";
  }
}

function errorResult(code: PublishingResultUi["errors"][number]["code"], message: string): PublishingResultUi {
  return {
    status: "blocked",
    publishedEntity: null,
    feedEffects: { createdFriendFeedItem: false, createdTeaser: false, createdNotificationEvent: false, noFeedEffect: true },
    warnings: [],
    errors: [{ code, message }],
  };
}

function partialResult(message: string): PublishingResultUi {
  return {
    status: "partial",
    publishedEntity: null,
    feedEffects: { createdFriendFeedItem: false, createdTeaser: false, createdNotificationEvent: false, noFeedEffect: true },
    warnings: [message],
    errors: [{ code: "TARGET_PARTIAL", message }],
  };
}

function buildWarnings(command: PublishingCommandUi, target: PublishingTargetDefinitionUi | undefined): readonly string[] {
  const warnings: string[] = [];
  if (!target) {
    warnings.push("Target publikacji nie jest dostępny dla bieżącego użytkownika.");
    return warnings;
  }
  if (command.body.trim().length === 0 && target.targetType !== "important_event" && target.targetType !== "profile_presentation") {
    warnings.push("Treść jest pusta.");
  }
  if (command.body.length > target.maxBodyLength) {
    warnings.push(`Treść przekracza limit ${target.maxBodyLength} znaków.`);
  }
  if ((command.mediaRefs?.length ?? 0) > target.maxMediaCount) {
    warnings.push(`Liczba mediów przekracza limit ${target.maxMediaCount}.`);
  }
  if (target.status !== "available") {
    warnings.push(`Target jest w stanie '${target.status}'.`);
  }
  return warnings;
}

function clip(s: string): string {
  const max = 400;
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function visibilityLabel(v: PublishingVisibilityUi): string {
  switch (v) {
    case "friends_only": return "Tylko znajomi";
    case "public": return "Publiczne";
    case "private": return "Prywatne";
    case "community_all": return "Cała społeczność";
    case "community_staff": return "Tylko kadra";
    case "community_relational": return "Relacyjne";
    case "channel_followers": return "Obserwujący kanał";
    case "workplace_public": return "Miejsce pracy — publiczne";
    case "workplace_friends_only": return "Miejsce pracy — znajomi";
    case "workplace_private": return "Miejsce pracy — prywatne";
    case "profile_owner_chosen": return "Wg ustawień profilu";
  }
}

export { DEFAULT_TARGETS as PUBLISHING_MOCK_DEFAULT_TARGETS };
