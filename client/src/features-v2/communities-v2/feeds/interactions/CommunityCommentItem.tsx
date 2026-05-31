/**
 * features-v2/communities-v2 / feeds / interactions / CommunityCommentItem
 *
 * One comment in the thread: avatar + author + date + body, with reaction
 * toggle and (for the author) delete affordance. Soft-deleted comments
 * render an italic "Komentarz usunięty" placeholder so the thread keeps its
 * shape without leaking the original body.
 */
import type { CommunityCommentDTO, CommunityReactionSummaryDTO } from "@shared/contracts/community-interactions";
import styles from "./Interactions.module.css";

type Props = {
  comment: CommunityCommentDTO;
  reactions: CommunityReactionSummaryDTO;
  canReact: boolean;
  onToggleLike: () => void;
  onDelete: () => void;
  busy?: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function CommunityCommentItem({ comment, reactions, canReact, onToggleLike, onDelete, busy }: Props) {
  const isDeleted = comment.status === "deleted";
  const active = reactions.viewerActive.includes("like");
  const count = reactions.counts.like;
  return (
    <div
      className={`${styles.commentRow} ${isDeleted ? styles.commentRowDeleted : ""}`}
      data-testid={`comment-${comment.id}`}
    >
      <span className={styles.commentAvatar} aria-hidden="true">
        {(comment.authorDisplayName || "?").charAt(0).toUpperCase()}
      </span>
      <div className={styles.commentBody}>
        <div className={styles.commentHead}>
          <p className={styles.commentAuthor}>{comment.authorDisplayName}</p>
          <p className={styles.commentDate}>{formatDate(comment.createdAt)}</p>
        </div>
        {isDeleted ? (
          <p className={styles.commentDeleted}>Komentarz usunięty</p>
        ) : (
          <p className={styles.commentText}>{comment.body}</p>
        )}
        {!isDeleted ? (
          <div className={styles.commentActions}>
            <button
              type="button"
              className={`${styles.commentAction} ${styles.commentReactionBtn}`}
              onClick={onToggleLike}
              disabled={!canReact || busy}
              data-active={active ? "true" : "false"}
              aria-pressed={active}
              aria-label={active ? "Cofnij polubienie komentarza" : "Polub komentarz"}
            >
              {active ? "♥" : "♡"} {count > 0 ? count : ""}
            </button>
            {comment.viewerIsAuthor ? (
              <button
                type="button"
                className={styles.commentAction}
                onClick={onDelete}
                disabled={busy}
                aria-label="Usuń komentarz"
              >
                Usuń
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
