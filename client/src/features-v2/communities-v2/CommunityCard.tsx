import type { CommunityCardDTO, CommunityVisibility } from "@shared/contracts/communities";
import styles from "./CommunitiesShell.module.css";

const VISIBILITY_LABEL: Record<CommunityVisibility, string> = {
  public: "Publiczna",
  private: "Prywatna",
  unlisted: "Niepubliczna",
};

type CommunityCardProps = {
  community: CommunityCardDTO;
};

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.kicker}>/{community.slug}</p>
          <h3 className={styles.cardTitle}>{community.name}</h3>
        </div>
        <span className={styles.visibility}>{VISIBILITY_LABEL[community.visibility]}</span>
      </div>
      <p className={styles.description}>{community.description}</p>
      <div className={styles.metaRow}>
        <span>{community.memberCount.toLocaleString("pl-PL")} członków</span>
        {community.viewerRole ? <span>Rola: {community.viewerRole}</span> : null}
      </div>
      <button
        type="button"
        className={styles.secondaryButton}
        disabled
        aria-label={`Otwórz ${community.name} — szczegóły społeczności wkrótce`}
      >
        Otwórz
      </button>
    </article>
  );
}
