import { useState } from "react";
import type { CSSProperties } from "react";
import type { ContactCategory, ProfileContact } from "../types";
import sec from "../styles/profile-sections.module.css";
import styles from "../styles/profile-contacts.module.css";

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
  { id: "all", label: "Wszyscy", color: "#1E4FD8", bg: "#EEF2FF" },
  { id: "close", label: "Bliscy", color: "#1E4FD8", bg: "#EEF2FF" },
  { id: "family_close", label: "Rodzina bliska", color: "#1E4FD8", bg: "#EEF2FF" },
  { id: "family_extended", label: "Rodzina dalsza", color: "#1E4FD8", bg: "#EEF2FF" },
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
    <section className={sec.section} aria-label="Kontakty">
      <div className={styles.contactsHeader}>
        <span className={styles.contactsIcon} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </span>
        <h2 className={styles.contactsTitle}>Kontakty</h2>
        <label className={styles.contactsSearch}>
          <span aria-hidden="true" className={styles.contactsSearchIcon}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            className={styles.contactsSearchInput}
            placeholder="Szukaj..."
            aria-label="Szukaj kontaktów"
            disabled
            title="Wyszukiwarka kontaktów dostępna po podłączeniu domeny social"
          />
        </label>
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
        <p className={sec.emptyInline}>Brak kontaktów w tej kategorii</p>
      )}
    </section>
  );
}
