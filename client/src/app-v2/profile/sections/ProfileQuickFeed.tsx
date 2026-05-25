import { useEffect, useRef, useState } from "react";
import type { QuickFeedItem } from "../types";
import styles from "../styles/profile-feed-preview.module.css";

type ProfileQuickFeedProps = {
  items: ReadonlyArray<QuickFeedItem>;
};

/**
 * "Ostatnie posty" expandable preview (visual shell, blueprint §15). Open/closed
 * is local component state — legacy used localStorage for last-opened, which is
 * intentionally NOT replicated. A short skeleton shimmer plays on first open,
 * then a grid of tiles; clicking a tile opens a local post-detail sheet. No feed
 * runtime, no real reactions/comments.
 */
export function ProfileQuickFeed({ items }: ProfileQuickFeedProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (!open || loadedOnce.current) return;
    loadedOnce.current = true;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [open]);

  const stack = items.slice(0, 3);
  const openPost = items.find((i) => i.id === openPostId) ?? null;

  return (
    <section aria-label="Ostatnie posty kontaktów" className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.toggle} ${open ? styles.toggleOpen : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.left}>
          <span aria-hidden="true">🕒</span> Ostatnie posty
          {stack.length > 0 ? (
            <span className={styles.stack} aria-hidden="true">
              {stack.map((s) => (
                <span key={s.id} className={styles.stackAvatar}>
                  {s.authorInitial}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        <span className={styles.right}>
          {open ? null : <span className={styles.liveDot} aria-hidden="true" />}
          <span>{open ? "Zwiń" : "LIVE"}</span>
          <span aria-hidden="true">{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open ? (
        <div className={styles.panel}>
          {loading ? (
            <div className={styles.grid} aria-hidden="true">
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
            </div>
          ) : items.length > 0 ? (
            <div className={styles.grid}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.tile}
                  onClick={() => setOpenPostId(item.id)}
                >
                  <span className={styles.tileAuthor}>{item.authorName}</span>
                  <span className={styles.tileBody}>dodał(a) nowy post</span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Brak postów kontaktów</p>
          )}
        </div>
      ) : null}

      {openPost ? (
        <div className={styles.sheet} role="dialog" aria-label="Podgląd posta">
          <div className={styles.sheetHeader}>
            <span className={styles.sheetTitle}>{openPost.authorName}</span>
            <button
              type="button"
              className={styles.sheetClose}
              aria-label="Zamknij"
              onClick={() => setOpenPostId(null)}
            >
              ×
            </button>
          </div>
          <div className={styles.sheetBody}>
            Podgląd posta jest wizualnym szkieletem — pełny feed pojawi się po
            podłączeniu domen content/social.
          </div>
          <div className={styles.sheetActions}>
            <span className={styles.sheetAction} aria-disabled="true">👍 Reakcja</span>
            <span className={styles.sheetAction} aria-disabled="true">💬 Komentarz</span>
            <span className={styles.sheetAction} aria-disabled="true">↗ Udostępnij</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
