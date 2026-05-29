import type { CommunityCardDTO } from "@shared/contracts/communities";
import { CommunityCard } from "./CommunityCard";
import styles from "./CommunitiesShell.module.css";

type CommunitiesListProps = {
  communities: readonly CommunityCardDTO[];
  emptyTitle: string;
  emptyBody: string;
};

export function CommunitiesList({
  communities,
  emptyTitle,
  emptyBody,
}: CommunitiesListProps) {
  if (communities.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon} aria-hidden="true">
          #
        </div>
        <h3>{emptyTitle}</h3>
        <p>{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {communities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  );
}
