import type { NotificationCategoryUi, NotificationListFilterUi } from "./types";
import styles from "./NotificationsPage.module.css";

type Props = {
  active: NotificationListFilterUi;
  unreadTotal: number;
  unreadByCategory: Readonly<Record<NotificationCategoryUi, number>>;
  onSelect: (filter: NotificationListFilterUi) => void;
};

interface TabSpec {
  label: string;
  filter: NotificationListFilterUi;
  count: number;
}

function tabSpecs(props: Props): readonly TabSpec[] {
  const { unreadByCategory } = props;
  return [
    { label: "Wszystkie", filter: { kind: "all" }, count: 0 },
    { label: "Nieprzeczytane", filter: { kind: "unread" }, count: props.unreadTotal },
    { label: "Feed znajomych", filter: { kind: "category", category: "friend_feed" }, count: unreadByCategory.friend_feed },
    { label: "Społeczności", filter: { kind: "category", category: "communities" }, count: unreadByCategory.communities },
    { label: "Kanały", filter: { kind: "category", category: "channels" }, count: unreadByCategory.channels },
    { label: "Profil zawodowy", filter: { kind: "category", category: "professional" }, count: unreadByCategory.professional },
    { label: "Moduły", filter: { kind: "category", category: "modules" }, count: unreadByCategory.modules },
    { label: "System", filter: { kind: "category", category: "system" }, count: unreadByCategory.system },
  ];
}

function isSame(a: NotificationListFilterUi, b: NotificationListFilterUi): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "category" && b.kind === "category") return a.category === b.category;
  return true;
}

export function NotificationsFilterTabs(props: Props) {
  const tabs = tabSpecs(props);
  return (
    <nav className={styles.filterTabs} aria-label="Filtruj powiadomienia">
      {tabs.map((tab, idx) => {
        const active = isSame(tab.filter, props.active);
        return (
          <button
            key={`${tab.label}-${idx}`}
            type="button"
            className={`${styles.filterTab} ${active ? styles.filterTabActive : ""}`}
            aria-pressed={active}
            onClick={() => props.onSelect(tab.filter)}
          >
            <span>{tab.label}</span>
            {tab.count > 0 ? <span className={styles.filterCount}>{tab.count}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
