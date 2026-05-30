import type { NotificationUi } from "./types";
import { NotificationCard } from "./NotificationCard";
import styles from "./NotificationsPage.module.css";

type Props = {
  items: readonly NotificationUi[];
  onOpen: (n: NotificationUi) => void;
  onMarkRead: (n: NotificationUi) => void;
  onArchive: (n: NotificationUi) => void;
};

export function NotificationsList({ items, onOpen, onMarkRead, onArchive }: Props) {
  if (items.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        Nic do pokazania w tym widoku. Wróć później.
      </div>
    );
  }
  return (
    <ul className={styles.list} aria-label="Lista powiadomień">
      {items.map((n) => (
        <NotificationCard
          key={n.id}
          notification={n}
          onOpen={onOpen}
          onMarkRead={onMarkRead}
          onArchive={onArchive}
        />
      ))}
    </ul>
  );
}
