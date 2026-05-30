/**
 * notifications-v2 — service (BACKEND_PARTIAL).
 *
 * Owns notification create / list / markRead / markAll / archive / unread
 * count. Settings live in `service-settings.ts`; small internal helpers in
 * `service-helpers.ts`. Domain does NOT import other domains' internals;
 * application-v2/use-cases/notifications wires source events to creates.
 *
 * Idempotency: a create with a dedupeKey that already exists for the same
 * recipient returns `{created:false, reason:"duplicate"}`. actor === recipient
 * short-circuits before the dedupe check. A disabled in-app category gates
 * creation (settings act as a creation gate; existing notifications stay
 * visible).
 */
import type {
  ArchiveNotificationInput,
  CreateNotificationInput,
  CreateNotificationOutcome,
  ListNotificationsQuery,
  MarkAllNotificationsReadInput,
  MarkNotificationReadInput,
} from "./commands";
import type {
  NotificationDTO,
  NotificationListDTO,
  NotificationRecord,
  NotificationUnreadCountDTO,
} from "./dto";
import type {
  NotificationSettingsDTO,
  UpdateNotificationSettingsInput,
} from "./settings-dto";
import type {
  NotificationRepository,
  NotificationSettingsRepository,
} from "./ports";
import { toNotificationDTO, toUnreadCountDTO } from "./mapper";
import {
  canViewNotification,
  isNotificationCategory,
  isNotificationType,
  validateBodyPreview,
  validateRouteTarget,
  validateTitle,
} from "./policy";
import {
  categoryEnabled,
  clampLimit,
  fail,
  toRepoFilter,
  type NotificationsClock,
  type NotificationsErrorCode,
  type NotificationsIdGen,
  type NotificationsResult,
} from "./service-helpers";
import {
  getSettingsForViewer,
  updateSettingsForViewer,
} from "./service-settings";

export interface NotificationsServiceDeps {
  notifications: NotificationRepository;
  settings: NotificationSettingsRepository;
  clock: NotificationsClock;
  ids: NotificationsIdGen;
}

export interface MarkAllReadOutcome {
  affected: number;
}

export type { NotificationsErrorCode, NotificationsResult };

export interface NotificationsService {
  createNotification(input: CreateNotificationInput): Promise<NotificationsResult<CreateNotificationOutcome>>;
  listForViewer(query: ListNotificationsQuery): Promise<NotificationsResult<NotificationListDTO>>;
  getUnreadCount(viewerUserId: string): Promise<NotificationsResult<NotificationUnreadCountDTO>>;
  markRead(input: MarkNotificationReadInput): Promise<NotificationsResult<NotificationDTO>>;
  markAllRead(input: MarkAllNotificationsReadInput): Promise<NotificationsResult<MarkAllReadOutcome>>;
  archive(input: ArchiveNotificationInput): Promise<NotificationsResult<NotificationDTO>>;
  getSettings(viewerUserId: string): Promise<NotificationsResult<NotificationSettingsDTO>>;
  updateSettings(input: UpdateNotificationSettingsInput): Promise<NotificationsResult<NotificationSettingsDTO>>;
}

async function createNotification(
  deps: NotificationsServiceDeps,
  input: CreateNotificationInput,
): Promise<NotificationsResult<CreateNotificationOutcome>> {
  if (input.recipientUserId.trim().length === 0) return fail("VALIDATION_FAILED", "RECIPIENT_REQUIRED");
  if (!isNotificationCategory(input.category)) return fail("VALIDATION_FAILED", "CATEGORY_INVALID");
  if (!isNotificationType(input.type)) return fail("VALIDATION_FAILED", "TYPE_INVALID");
  const titleErr = validateTitle(input.title);
  if (titleErr) return fail("VALIDATION_FAILED", titleErr);
  const bodyErr = validateBodyPreview(input.bodyPreview);
  if (bodyErr) return fail("VALIDATION_FAILED", bodyErr);
  const routeErr = validateRouteTarget(input.source.routeTarget);
  if (routeErr) return fail("VALIDATION_FAILED", routeErr);
  if (input.source.sourceId.trim().length === 0) return fail("VALIDATION_FAILED", "SOURCE_REQUIRED");

  if (input.actorUserId !== null && input.actorUserId === input.recipientUserId) {
    return { ok: true, value: { created: false, reason: "actor_is_recipient" } };
  }

  if (input.dedupeKey) {
    const existing = await deps.notifications.findByDedupeKey(input.recipientUserId, input.dedupeKey);
    if (existing) return { ok: true, value: { created: false, reason: "duplicate" } };
  }

  const enabled = await categoryEnabled(deps.settings, input.recipientUserId, input.category);
  if (!enabled) return { ok: true, value: { created: false, reason: "category_disabled" } };

  const now = deps.clock.now().toISOString();
  const record: NotificationRecord = {
    id: deps.ids.next(),
    recipientUserId: input.recipientUserId,
    actorUserId: input.actorUserId,
    type: input.type,
    category: input.category,
    title: input.title.trim(),
    bodyPreview: input.bodyPreview.trim(),
    source: { ...input.source, routeTarget: input.source.routeTarget.trim() },
    status: "unread",
    deliveryChannel: "in_app",
    dedupeKey: input.dedupeKey ?? null,
    correlationId: input.correlationId ?? null,
    createdAt: now,
    readAt: null,
    archivedAt: null,
  };
  await deps.notifications.insert(record);
  return { ok: true, value: { created: true, notification: toNotificationDTO(record) } };
}

async function listForViewer(
  deps: NotificationsServiceDeps,
  query: ListNotificationsQuery,
): Promise<NotificationsResult<NotificationListDTO>> {
  if (query.viewerUserId.trim().length === 0) return fail("FORBIDDEN", "VIEWER_REQUIRED");
  if (query.filter && query.filter.kind === "category" && !isNotificationCategory(query.filter.category)) {
    return fail("VALIDATION_FAILED", "CATEGORY_INVALID");
  }
  const limit = clampLimit(query.limit);
  // SCALABILITY_HOT_PATH_EXCEPTION: stable createdAt-desc, id tie-break order pinned by store.
  const records = await deps.notifications.listForViewer(
    query.viewerUserId,
    toRepoFilter(query.filter),
    query.cursor ?? null,
    limit,
  );
  const items = records.map(toNotificationDTO);
  const nextCursor = records.length === limit ? records[records.length - 1].id : null;
  return { ok: true, value: { items, nextCursor } };
}

async function getUnreadCount(
  deps: NotificationsServiceDeps,
  viewerUserId: string,
): Promise<NotificationsResult<NotificationUnreadCountDTO>> {
  if (viewerUserId.trim().length === 0) return fail("FORBIDDEN", "VIEWER_REQUIRED");
  const counts = await deps.notifications.countUnreadByCategory(viewerUserId);
  return { ok: true, value: toUnreadCountDTO(counts) };
}

async function markRead(
  deps: NotificationsServiceDeps,
  input: MarkNotificationReadInput,
): Promise<NotificationsResult<NotificationDTO>> {
  const existing = await deps.notifications.getById(input.notificationId);
  if (!existing) return fail("NOT_FOUND", "Notification not found.");
  if (!canViewNotification(existing, input.viewerUserId)) {
    return fail("FORBIDDEN", "Only the recipient can update notification status.");
  }
  if (existing.status === "read" || existing.status === "archived") {
    return { ok: true, value: toNotificationDTO(existing) };
  }
  const now = deps.clock.now().toISOString();
  const updated: NotificationRecord = { ...existing, status: "read", readAt: now };
  await deps.notifications.update(updated);
  return { ok: true, value: toNotificationDTO(updated) };
}

async function markAllRead(
  deps: NotificationsServiceDeps,
  input: MarkAllNotificationsReadInput,
): Promise<NotificationsResult<MarkAllReadOutcome>> {
  if (input.viewerUserId.trim().length === 0) return fail("FORBIDDEN", "VIEWER_REQUIRED");
  if (input.category !== undefined && !isNotificationCategory(input.category)) {
    return fail("VALIDATION_FAILED", "CATEGORY_INVALID");
  }
  const now = deps.clock.now().toISOString();
  const affected = await deps.notifications.markAllReadForViewer(
    input.viewerUserId,
    input.category ?? null,
    now,
  );
  return { ok: true, value: { affected } };
}

async function archive(
  deps: NotificationsServiceDeps,
  input: ArchiveNotificationInput,
): Promise<NotificationsResult<NotificationDTO>> {
  const existing = await deps.notifications.getById(input.notificationId);
  if (!existing) return fail("NOT_FOUND", "Notification not found.");
  if (!canViewNotification(existing, input.viewerUserId)) {
    return fail("FORBIDDEN", "Only the recipient can archive a notification.");
  }
  if (existing.status === "archived") return { ok: true, value: toNotificationDTO(existing) };
  const now = deps.clock.now().toISOString();
  const updated: NotificationRecord = {
    ...existing,
    status: "archived",
    archivedAt: now,
    readAt: existing.readAt ?? now,
  };
  await deps.notifications.update(updated);
  return { ok: true, value: toNotificationDTO(updated) };
}

export function createNotificationsService(deps: NotificationsServiceDeps): NotificationsService {
  return {
    createNotification: (input) => createNotification(deps, input),
    listForViewer: (query) => listForViewer(deps, query),
    getUnreadCount: (viewerId) => getUnreadCount(deps, viewerId),
    markRead: (input) => markRead(deps, input),
    markAllRead: (input) => markAllRead(deps, input),
    archive: (input) => archive(deps, input),
    getSettings: (viewerId) => getSettingsForViewer(deps.settings, deps.clock, viewerId),
    updateSettings: (input) => updateSettingsForViewer(deps.settings, deps.clock, input),
  };
}
