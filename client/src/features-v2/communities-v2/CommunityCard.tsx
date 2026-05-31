import { Link } from "react-router-dom";
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

function relationLabel(community: CommunityCardDTO): { label: string; cta: string } {
  if (community.viewerRelation === "founder") return { label: "Jesteś founderem", cta: "Otwórz" };
  if (community.viewerRelation === "admin") return { label: "Jesteś adminem", cta: "Otwórz" };
  if (community.viewerRelation === "moderator") return { label: "Jesteś moderatorem", cta: "Otwórz" };
  if (community.viewerRelation === "member") return { label: "Jesteś członkiem", cta: "Otwórz" };
  if (community.viewerRelation === "requested") return { label: "Zgłoszenie wysłane", cta: "Zobacz" };
  if (community.visibility === "public") return { label: "Otwarta społeczność", cta: "Dołącz" };
  return { label: "Wymaga zaproszenia", cta: "Poproś o dołączenie" };
}

export function CommunityCard({ community }: CommunityCardProps) {
  const { label, cta } = relationLabel(community);
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
        <span>{label}</span>
      </div>
      <Link
        to={`/communities/${community.slug}`}
        className={styles.secondaryButton}
        aria-label={`${cta} — ${community.name}`}
      >
        {cta}
      </Link>
    </article>
  );
}
