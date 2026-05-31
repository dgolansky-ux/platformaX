import type React from "react";
import styles from "../styles/profile-sections.module.css";

type ProfilePersonalSectionsProps = {
  presentationPostCount: number;
  milestoneCount: number;
  isOwner: boolean;
};

type EmptyAccent = "green" | "yellow";

type EmptyBlockProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconAccent: EmptyAccent;
  ownerText: string;
  isOwner: boolean;
  count: number;
  total: number;
  addLabel: string;
  emptyTitle: string;
};

function SectionBlock({
  title,
  subtitle,
  icon,
  iconAccent,
  ownerText,
  isOwner,
  count,
  total,
  addLabel,
  emptyTitle,
}: EmptyBlockProps) {
  const iconClass =
    iconAccent === "green"
      ? `${styles.emptyIcon} ${styles.emptyIconGreen}`
      : `${styles.emptyIcon} ${styles.emptyIconYellow}`;

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <span className={styles.sectionSubtitle}>
            {count}/{total} {subtitle}
          </span>
        </div>
        {isOwner ? (
          <button
            type="button"
            className={styles.addButton}
            aria-label={addLabel}
            title={`${addLabel} — funkcja w przygotowaniu`}
            disabled
          >
            +
          </button>
        ) : null}
      </div>

      {count === 0 ? (
        <div className={styles.emptyState}>
          <div className={iconClass} aria-hidden="true">
            {icon}
          </div>
          <p className={styles.emptyTitle}>{emptyTitle}</p>
          <p className={styles.emptyText}>
            {isOwner ? ownerText : "Ten użytkownik nie dodał jeszcze żadnych treści."}
          </p>
        </div>
      ) : null}
    </section>
  );
}

/** Personal content sections — empty states only in this shell (no posts runtime). */
export function ProfilePersonalSections({
  presentationPostCount,
  milestoneCount,
  isOwner,
}: ProfilePersonalSectionsProps) {
  return (
    <>
      <SectionBlock
        title="Prezentacja profilu"
        subtitle="postów"
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>}
        iconAccent="green"
        emptyTitle="Brak postów"
        ownerText="Dodaj do 12 postów ze zdjęciami i filmami."
        isOwner={isOwner}
        count={presentationPostCount}
        total={12}
        addLabel="Dodaj post"
      />
      <SectionBlock
        title="Ważne wydarzenia"
        subtitle="wydarzeń"
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
        iconAccent="yellow"
        emptyTitle="Brak ważnych wydarzeń"
        ownerText="Dodaj ważne momenty ze swojego życia na osi czasu."
        isOwner={isOwner}
        count={milestoneCount}
        total={12}
        addLabel="Dodaj wydarzenie"
      />
    </>
  );
}
