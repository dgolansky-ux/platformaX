/**
 * notifications-v2 — repository ports.
 *
 * In-memory adapter ships in `store.ts`; durable adapter is pending (see the
 * migration draft in the Slice-14 report). Both repositories own pagination
 * with cursor + bounded limit; the service is in charge of stable ordering.
 */
import type { NotificationCategory, NotificationRecord } from "./dto";
import type { NotificationSettingRecord } from "./settings-dto";

export interface NotificationRepository {
  insert(record: NotificationRecord): Promise<void>;
  update(record: NotificationRecord): Promise<void>;
  getById(id: string): Promise<NotificationRecord | null>;
  /** Returns notifications for a viewer in createdAt-desc, id-tie-break order. */
  listForViewer(
    viewerUserId: string,
    filter: NotificationRepositoryListFilter,
    cursor: string | null,
    limit: number,
  ): Promise<readonly NotificationRecord[]>;
  countUnreadByCategory(
    viewerUserId: string,
  ): Promise<Readonly<Record<NotificationCategory, number>>>;
  findByDedupeKey(
    recipientUserId: string,
    dedupeKey: string,
  ): Promise<NotificationRecord | null>;
  markAllReadForViewer(
    viewerUserId: string,
    category: NotificationCategory | null,
    now: string,
  ): Promise<number>;
}

export type NotificationRepositoryListFilter =
  | { kind: "all" }
  | { kind: "unread" }
  | { kind: "category"; category: NotificationCategory };

export interface NotificationSettingsRepository {
  upsert(record: NotificationSettingRecord): Promise<void>;
  getForUser(userId: string): Promise<readonly NotificationSettingRecord[]>;
  getForCategory(
    userId: string,
    category: NotificationCategory,
  ): Promise<NotificationSettingRecord | null>;
}
