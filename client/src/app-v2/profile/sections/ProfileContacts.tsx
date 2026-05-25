import { useState } from "react";
import type { ContactCategory, ProfileContact } from "../types";
import styles from "../profile.module.css";

type ProfileContactsProps = {
  contacts: ReadonlyArray<ProfileContact>;
};

const TABS: ReadonlyArray<{ id: ContactCategory; label: string }> = [
  { id: "all", label: "Wszyscy" },
  { id: "close", label: "Bliscy" },
  { id: "family_close", label: "Rodzina bliska" },
  { id: "family_extended", label: "Rodzina dalsza" },
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
        <h2 className={styles.sectionTitle}>Kontakty</h2>
      </div>

      <div className={styles.contactsTabs} role="tablist" aria-label="Kategorie kontaktów">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`${styles.contactTab} ${active === tab.id ? styles.contactTabActive : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
            <span className={styles.contactTabCount}>{countFor(contacts, tab.id)}</span>
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className={styles.carousel}>
          {visible.map((c) => (
            <button key={c.id} type="button" className={styles.contactCard}>
              <span className={styles.contactAvatar} aria-hidden="true">
                {c.initial}
                {c.online ? <span className={styles.contactOnline} /> : null}
              </span>
              <span className={styles.contactFirst}>{c.firstName}</span>
              <span className={styles.contactLast}>{c.lastName}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.contactsEmpty}>Brak kontaktów w tej kategorii</p>
      )}
    </section>
  );
}
