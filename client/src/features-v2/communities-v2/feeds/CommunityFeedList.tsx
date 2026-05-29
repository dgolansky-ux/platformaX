/**
 * features-v2/communities-v2 / feeds / CommunityFeedList — feed body with
 * empty / loading / error / unauthorized states (legacy "Brak postów").
 *
 * Slice 6: passes per-card interaction permissions to CommunityFeedItemCard
 * so the action bar's composer/reaction reflect the viewer's rights for the
 * current feed (e.g. stranger sees a read-only action bar with permission
 * notice in the composer).
 */
import type { CommunityFeedItemDTO } from "@shared/contracts/community-feeds";
import { CommunityFeedItemCard } from "./CommunityFeedItemCard";
import styles from "./Feeds.module.css";

export type FeedListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "forbidden"; message: string }
  | { status: "ready"; items: readonly CommunityFeedItemDTO[] };

type Props = {
  state: FeedListState;
  canComment: boolean;
  canReact: boolean;
  noPermissionMessage?: string;
};

export function CommunityFeedList({ state, canComment, canReact, noPermissionMessage }: Props) {
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
        <CommunityFeedItemCard
          key={item.id}
          item={item}
          canComment={canComment}
          canReact={canReact}
          noPermissionMessage={noPermissionMessage}
        />
      ))}
    </div>
  );
}
