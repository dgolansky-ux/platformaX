import type { NotificationCategoryUi, NotificationUi } from "./types";
import styles from "./NotificationsPage.module.css";

type Props = {
  notification: NotificationUi;
  onOpen: (n: NotificationUi) => void;
  onMarkRead: (n: NotificationUi) => void;
  onArchive: (n: NotificationUi) => void;
};

const CATEGORY_LABEL: Record<NotificationCategoryUi, string> = {
  friend_feed: "Feed znajomych",
  communities: "Społeczności",
  channels: "Kanały",
  professional: "Profil zawodowy",
  modules: "Moduły",
  system: "System",
};

const CATEGORY_ICON: Record<NotificationCategoryUi, string> = {
  friend_feed: "👥",
  communities: "🏘️",
  channels: "📡",
  professional: "💼",
  modules: "🧩",
  system: "ℹ️",
};

const CATEGORY_ICON_CLASS: Record<NotificationCategoryUi, string> = {
  friend_feed: styles.cardIconFriendFeed,
  communities: styles.cardIconCommunities,
  channels: styles.cardIconChannels,
  professional: styles.cardIconProfessional,
  modules: styles.cardIconModules,
  system: styles.cardIconSystem,
};

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const diffMin = Math.max(0, Math.round((now - then) / 60_000));
  if (diffMin < 1) return "Przed chwilą";
  if (diffMin < 60) return `${diffMin} min temu`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} godz. temu`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD} dni temu`;
  return iso.slice(0, 10);
}

export function NotificationCard({ notification, onOpen, onMarkRead, onArchive }: Props) {
  const unread = notification.status === "unread";
  const categoryLabel = CATEGORY_LABEL[notification.category];
  const icon = CATEGORY_ICON[notification.category];
  const iconClass = CATEGORY_ICON_CLASS[notification.category];

  return (
    <li className={`${styles.card} ${unread ? styles.cardUnread : ""}`} data-testid="notification-card">
      <span className={`${styles.cardIcon} ${iconClass}`} aria-hidden="true">{icon}</span>
      <div className={styles.cardMain}>
        <div className={styles.cardTitleRow}>
          <button
            type="button"
            className={styles.cardTitleBtn}
            onClick={() => onOpen(notification)}
          >
            {notification.title}
          </button>
          <span className={styles.cardCategory}>{categoryLabel}</span>
        </div>
        <p className={styles.cardBody}>{notification.bodyPreview}</p>
        <div className={styles.cardMeta}>
          <p className={styles.cardTime}>{formatRelativeTime(notification.createdAt)}</p>
          <div className={styles.cardActions}>
            {unread ? (
              <button
                type="button"
                className={`${styles.cardActionBtn} ${styles.cardActionBtnPrimary}`}
                onClick={() => onMarkRead(notification)}
                aria-label="Oznacz jako przeczytane"
              >
                Oznacz jako przeczytane
              </button>
            ) : null}
            <button
              type="button"
              className={styles.cardActionBtn}
              onClick={() => onArchive(notification)}
              aria-label="Archiwizuj powiadomienie"
            >
              Archiwizuj
            </button>
          </div>
        </div>
      </div>
      {unread ? <span className={styles.cardUnreadDot} aria-label="Nieprzeczytane" /> : null}
    </li>
  );
}
