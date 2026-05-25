import styles from "../profile.module.css";

type ProfilePersonalSectionsProps = {
  presentationPostCount: number;
  milestoneCount: number;
  isOwner: boolean;
};

type EmptyBlockProps = {
  title: string;
  subtitle: string;
  icon: string;
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
  ownerText,
  isOwner,
  count,
  total,
  addLabel,
  emptyTitle,
}: EmptyBlockProps) {
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
            title={`${addLabel} — wkrótce`}
            disabled
          >
            +
          </button>
        ) : null}
      </div>

      {count === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
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
        icon="📷"
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
        icon="⭐"
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
