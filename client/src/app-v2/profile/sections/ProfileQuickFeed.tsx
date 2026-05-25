import { useState } from "react";
import type { QuickFeedItem } from "../types";
import styles from "../profile.module.css";

type ProfileQuickFeedProps = {
  items: ReadonlyArray<QuickFeedItem>;
};

/**
 * "Ostatnie posty" expandable preview. Open/closed is local component state.
 * Legacy used localStorage for last-opened — intentionally NOT replicated.
 */
export function ProfileQuickFeed({ items }: ProfileQuickFeedProps) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Ostatnie posty kontaktów">
      <button
        type="button"
        className={`${styles.quickFeedToggle} ${open ? styles.quickFeedToggleOpen : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.quickFeedLeft}>
          <span aria-hidden="true">🕒</span> Ostatnie posty
        </span>
        <span className={styles.quickFeedRight}>
          <span>{open ? "Zwiń" : "LIVE"}</span>
          <span aria-hidden="true">{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open ? (
        <div className={styles.quickFeedPanel}>
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className={styles.quickFeedTile}>
                <strong>{item.authorName}</strong> dodał(a) nowy post
              </div>
            ))
          ) : (
            <p className={styles.quickFeedEmpty}>Brak postów kontaktów</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
