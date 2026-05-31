/**
 * features-v2/communities-v2 / feeds / interactions / CommunityCommentsList
 *
 * Renders the comments thread for one feed item: empty / loading / error /
 * ready states. Stays flat (no reply rendering) — the model has
 * parentCommentId but UI threading is deferred.
 */
import type { CommunityCommentDTO, CommunityCommentInteractionDTO } from "@shared/contracts/community-interactions";
import { CommunityCommentItem } from "./CommunityCommentItem";
import styles from "./Interactions.module.css";

export type CommentsListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "forbidden"; message: string }
  | { status: "ready"; items: readonly CommunityCommentDTO[]; reactions: readonly CommunityCommentInteractionDTO[] };

type Props = {
  state: CommentsListState;
  canReact: boolean;
  busyCommentId: string | null;
  onToggleCommentLike: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
};

const EMPTY_SUMMARY = { counts: { like: 0 }, total: 0, viewerActive: [] as const };

export function CommunityCommentsList({ state, canReact, busyCommentId, onToggleCommentLike, onDeleteComment }: Props) {
  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładowanie komentarzy…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.errorState} role="alert">{state.message}</div>;
  }
  if (state.status === "forbidden") {
    return <div className={styles.permissionState} role="status">{state.message}</div>;
  }
  if (state.items.length === 0) {
    return <div className={styles.empty}>Brak komentarzy. Bądź pierwszy.</div>;
  }
  const reactionsById = new Map(state.reactions.map((r) => [r.commentId, r.reactions]));
  return (
    <div className={styles.list}>
      {state.items.map((c) => (
        <CommunityCommentItem
          key={c.id}
          comment={c}
          reactions={reactionsById.get(c.id) ?? EMPTY_SUMMARY}
          canReact={canReact}
          onToggleLike={() => onToggleCommentLike(c.id)}
          onDelete={() => onDeleteComment(c.id)}
          busy={busyCommentId === c.id}
        />
      ))}
    </div>
  );
}
