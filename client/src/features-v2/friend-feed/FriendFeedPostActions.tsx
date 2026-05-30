import styles from "./FriendFeed.module.css";

export function FriendFeedReactionButton({
  viewerLiked,
  likeCount,
  disabled,
  busy,
  onReact,
}: {
  viewerLiked: boolean;
  likeCount: number;
  disabled: boolean;
  busy: boolean;
  onReact: () => void;
}) {
  return (
    <button
      type="button"
      className={viewerLiked ? `${styles.actionButton} ${styles.actionButtonActive}` : styles.actionButton}
      onClick={onReact}
      disabled={disabled || busy}
      aria-pressed={viewerLiked}
    >
      {viewerLiked ? "Lubię to" : "Polub"} · {likeCount}
    </button>
  );
}

export function FriendFeedReactionSummary({ likeCount }: { likeCount: number }) {
  return <span className={styles.actionSummary}>{likeCount === 1 ? "1 reakcja" : `${likeCount} reakcji`}</span>;
}

export function FriendFeedCommentsToggle({
  commentsOpen,
  commentCount,
  onToggle,
}: {
  commentsOpen: boolean;
  commentCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.actionButton}
      onClick={onToggle}
      aria-expanded={commentsOpen}
    >
      Komentarze · {commentCount}
    </button>
  );
}

export function FriendFeedPostActionBar({
  viewerLiked,
  likeCount,
  commentCount,
  commentsOpen,
  viewerCanReact,
  busy,
  onReact,
  onToggleComments,
}: {
  viewerLiked: boolean;
  likeCount: number;
  commentCount: number;
  commentsOpen: boolean;
  viewerCanReact: boolean;
  busy: boolean;
  onReact: () => void;
  onToggleComments: () => void;
}) {
  return (
    <div className={styles.actionBar}>
      <FriendFeedReactionButton
        viewerLiked={viewerLiked}
        likeCount={likeCount}
        disabled={!viewerCanReact}
        busy={busy}
        onReact={onReact}
      />
      <FriendFeedCommentsToggle commentsOpen={commentsOpen} commentCount={commentCount} onToggle={onToggleComments} />
      <FriendFeedReactionSummary likeCount={likeCount} />
      <span className={styles.actionSpacer} />
    </div>
  );
}
