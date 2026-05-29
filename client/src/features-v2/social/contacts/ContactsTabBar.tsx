import type { ReactElement } from "react";
import styles from "./ContactsTab.module.css";

export type ContactsTabKey =
  | "all"
  | "contacts"
  | "specialists"
  | "close_friend"
  | "distant_friend"
  | "close_family"
  | "distant_family"
  | "requests";

export const CONTACTS_TAB_ORDER: readonly ContactsTabKey[] = [
  "all",
  "contacts",
  "specialists",
  "close_friend",
  "distant_friend",
  "close_family",
  "distant_family",
  "requests",
];

export const CONTACTS_TAB_LABELS: Record<ContactsTabKey, string> = {
  all: "Wszyscy",
  contacts: "Kontakty",
  specialists: "Specjaliści",
  close_friend: "Bliżsi znajomi",
  distant_friend: "Dalsi znajomi",
  close_family: "Bliska rodzina",
  distant_family: "Dalsza rodzina",
  requests: "Prośby",
};

export function ContactsTabBar({
  activeTab,
  counts,
  onSelect,
}: {
  activeTab: ContactsTabKey;
  counts: Record<ContactsTabKey, number>;
  onSelect: (key: ContactsTabKey) => void;
}): ReactElement {
  return (
    <nav className={styles.tabs} role="tablist" aria-label="Sekcje kontaktów">
      {CONTACTS_TAB_ORDER.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={activeTab === key}
          className={
            activeTab === key ? `${styles.tab} ${styles.tabActive}` : styles.tab
          }
          onClick={() => onSelect(key)}
        >
          {CONTACTS_TAB_LABELS[key]}
          {counts[key] > 0 ? (
            <span className={styles.tabBadge}>{counts[key]}</span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
