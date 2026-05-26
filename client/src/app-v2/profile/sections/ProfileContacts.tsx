import { useState } from "react";
import type { CSSProperties } from "react";
import type { ContactCategory, ProfileContact } from "../types";
import styles from "../styles/profile-sections.module.css";

type ProfileContactsProps = {
  contacts: ReadonlyArray<ProfileContact>;
};

type Tab = {
  id: ContactCategory;
  label: string;
  color: string;
  bg: string;
};

// Per-tab color scheme mirrors legacy FriendsSection 1:1.
const TABS: ReadonlyArray<Tab> = [
  { id: "all", label: "Wszyscy", color: "#2563EB", bg: "#EFF6FF" },
  { id: "close", label: "Bliscy", color: "#7C3AED", bg: "#F5F3FF" },
  { id: "family_close", label: "Rodzina bliska", color: "#EC4899", bg: "#FDF2F8" },
  { id: "family_extended", label: "Rodzina dalsza", color: "#8B5CF6", bg: "#F5F3FF" },
];

function countFor(contacts: ReadonlyArray<ProfileContact>, id: ContactCategory) {
  if (id === "all") return contacts.length;
  return contacts.filter((c) => c.category === id).length;
}

export function ProfileContacts({ contacts }: ProfileContactsProps) {
  const [active, setActive] = useState<ContactCategory>("all");
  const visible =
    active === "all" ? contacts : contacts.filter((c) => c.category === active);

  return (
    <section className={styles.section} aria-label="Kontakty">
      <div className={styles.contactsHeader}>
        <span className={styles.contactsIcon} aria-hidden="true">👥</span>
        <h2 className={styles.contactsTitle}>Kontakty</h2>
        <span className={styles.contactsSearch} aria-hidden="true">
          🔍 Szukaj...
        </span>
      </div>

      <div className={styles.contactsTabs} role="tablist" aria-label="Kategorie kontaktów">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const tabStyle: CSSProperties = isActive
            ? { borderColor: tab.color, background: tab.bg, color: tab.color, fontWeight: 700 }
            : {};
          const countStyle: CSSProperties = isActive
            ? { color: tab.color, background: `${tab.color}18` }
            : {};
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={styles.contactTab}
              style={tabStyle}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
              <span className={styles.contactTabCount} style={countStyle}>
                {countFor(contacts, tab.id)}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <div className={styles.carousel}>
          {visible.map((c) => (
            <button
              key={c.id}
              type="button"
              className={styles.contactCard}
              disabled
              aria-disabled="true"
              title={`${c.firstName} ${c.lastName} — profile kontaktów dostępne po podłączeniu domeny social`}
            >
              <span className={styles.contactAvatar} aria-hidden="true">
                {c.initial}
                {c.online ? <span className={styles.contactOnline} /> : null}
              </span>
              <span className={styles.contactName}>
                <span className={styles.contactFirst}>{c.firstName}</span>
                <span className={styles.contactLast}>{c.lastName}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.emptyInline}>Brak kontaktów w tej kategorii</p>
      )}
    </section>
  );
}
