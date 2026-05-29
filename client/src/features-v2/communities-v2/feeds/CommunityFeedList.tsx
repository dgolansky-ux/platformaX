/**
 * features-v2/communities-v2 / feeds / CommunityFeedList — feed body with
 * empty / loading / error / unauthorized states (legacy "Brak postów").
 */
import type { CommunityFeedItemDTO } from "@shared/contracts/community-feeds";
import { CommunityFeedItemCard } from "./CommunityFeedItemCard";
import styles from "./Feeds.module.css";

export type FeedListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "forbidden"; message: string }
  | { status: "ready"; items: readonly CommunityFeedItemDTO[] };

export function CommunityFeedList({ state }: { state: FeedListState }) {
  if (state.status === "loading") {
    return <div className={styles.state} aria-busy="true">Ładowanie feedu…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.errorState} role="alert">{state.message}</div>;
  }
  if (state.status === "forbidden") {
    return (
      <div className={styles.state} role="alert">
        <div className={styles.stateIcon} aria-hidden="true">🔒</div>
        <p>{state.message}</p>
      </div>
    );
  }
  if (state.items.length === 0) {
    return (
      <div className={styles.state}>
        <div className={styles.stateIcon} aria-hidden="true">💬</div>
        <p>Brak postów. Bądź pierwszy i napisz coś!</p>
      </div>
    );
  }
  return (
    <div className={styles.list}>
      {state.items.map((item) => (
        <CommunityFeedItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
