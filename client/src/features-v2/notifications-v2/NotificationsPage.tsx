/**
 * features-v2/notifications-v2 / NotificationsPage — Activity Center.
 *
 * UI_SHELL_ONLY + MOCK_LOCAL_ONLY. Composes header + mark-all-read CTA +
 * filter tabs + notification list + the settings foundation panel. Reads
 * directly from `notificationsMockAdapter`; no `@server/*` imports.
 */
import { useCallback, useEffect, useState } from "react";
import { notificationsMockAdapter } from "./mock-adapter";
import type {
  NotificationCategoryUi,
  NotificationListFilterUi,
  NotificationListUi,
  NotificationSettingsUi,
  NotificationUi,
  NotificationUnreadCountUi,
} from "./types";
import { NotificationsFilterTabs } from "./NotificationsFilterTabs";
import { NotificationsList } from "./NotificationsList";
import { NotificationSettingsPanel } from "./NotificationSettingsPanel";
import styles from "./NotificationsPage.module.css";

type Props = {
  viewerUserId: string;
  onNavigate?: (route: string) => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: NotificationListUi; unread: NotificationUnreadCountUi; settings: NotificationSettingsUi };

const LIMIT = 30;

export function NotificationsPage({ viewerUserId, onNavigate }: Props) {
  const [filter, setFilter] = useState<NotificationListFilterUi>({ kind: "all" });
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async (): Promise<void> => {
    setState({ status: "loading" });
    const [pageRes, unreadRes, settingsRes] = await Promise.all([
      notificationsMockAdapter.list({ viewerUserId, filter, limit: LIMIT }),
      notificationsMockAdapter.getUnreadCount(viewerUserId),
      notificationsMockAdapter.getSettings(viewerUserId),
    ]);
    if (!pageRes.ok) return setState({ status: "error", message: pageRes.error.message });
    if (!unreadRes.ok) return setState({ status: "error", message: unreadRes.error.message });
    if (!settingsRes.ok) return setState({ status: "error", message: settingsRes.error.message });
    setState({ status: "ready", page: pageRes.value, unread: unreadRes.value, settings: settingsRes.value });
  }, [viewerUserId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpen = useCallback(
    (n: NotificationUi) => {
      void notificationsMockAdapter.markRead({ viewerUserId, notificationId: n.id }).then(() => {
        if (onNavigate) onNavigate(n.source.routeTarget);
        else if (typeof window !== "undefined") window.location.assign(n.source.routeTarget);
        void load();
      });
    },
    [viewerUserId, onNavigate, load],
  );

  const handleMarkRead = useCallback(
    async (n: NotificationUi): Promise<void> => {
      await notificationsMockAdapter.markRead({ viewerUserId, notificationId: n.id });
      void load();
    },
    [viewerUserId, load],
  );

  const handleArchive = useCallback(
    async (n: NotificationUi): Promise<void> => {
      await notificationsMockAdapter.archive({ viewerUserId, notificationId: n.id });
      void load();
    },
    [viewerUserId, load],
  );

  const handleMarkAll = useCallback(async (): Promise<void> => {
    const scope = filter.kind === "category"
      ? { viewerUserId, category: filter.category }
      : { viewerUserId };
    await notificationsMockAdapter.markAllRead(scope);
    void load();
  }, [filter, viewerUserId, load]);

  const handleToggleSetting = useCallback(
    async (category: NotificationCategoryUi, nextEnabled: boolean): Promise<void> => {
      await notificationsMockAdapter.updateSetting({ viewerUserId, category, inAppEnabled: nextEnabled });
      void load();
    },
    [viewerUserId, load],
  );

  const total = state.status === "ready" ? state.unread.total : 0;

  return (
    <section className={styles.root} aria-labelledby="notifications-heading">
      <header className={styles.header}>
        <p className={styles.headerKicker}>Centrum aktywności</p>
        <div className={styles.headerTopRow}>
          <div className={styles.headerTitleRow}>
            <h1 id="notifications-heading" className={styles.headerTitle}>Powiadomienia</h1>
            {total > 0 ? (
              <span className={styles.headerCountChip} aria-label={`Nieprzeczytane: ${total}`}>{total}</span>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.markAllBtn}
            onClick={() => void handleMarkAll()}
            disabled={state.status !== "ready" || total === 0}
          >
            Oznacz wszystkie jako przeczytane
          </button>
        </div>
        <p className={styles.headerSubtitle}>
          Zobacz, co wydarzyło się w Twoich społecznościach, kanałach i profilu.
        </p>
      </header>

      {state.status === "loading" ? (
        <div className={styles.loading} aria-busy="true">Ładuję powiadomienia…</div>
      ) : null}

      {state.status === "error" ? (
        <div className={styles.errorBanner} role="alert">
          Nie udało się załadować powiadomień: {state.message}
        </div>
      ) : null}

      {state.status === "ready" ? (
        <>
          <NotificationsFilterTabs
            active={filter}
            unreadTotal={state.unread.total}
            unreadByCategory={state.unread.byCategory}
            onSelect={setFilter}
          />
          <NotificationsList
            items={state.page.items}
            onOpen={handleOpen}
            onMarkRead={(n) => void handleMarkRead(n)}
            onArchive={(n) => void handleArchive(n)}
          />
          <NotificationSettingsPanel
            settings={state.settings}
            onToggle={(c, n) => void handleToggleSetting(c, n)}
          />
        </>
      ) : null}
    </section>
  );
}
