/**
 * features-v2/friend-feed / FriendFeedComments — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Expanded comments area for a single friend-feed post card.
 */
import type { FormEvent } from "react";
import type { FriendPostCommentUi } from "./types";
import styles from "./FriendFeedComments.module.css";
import sharedStyles from "./FriendFeed.module.css";

type Props = {
  comments: readonly FriendPostCommentUi[];
  commentDraft: string;
  busy: boolean;
  viewerCanComment: boolean;
  loading?: boolean;
  error?: string | null;
  onDraftChange: (value: string) => void;
  onSubmitComment: () => void;
  onToggleCommentReaction: (commentId: string) => void;
  onStartEdit: (comment: FriendPostCommentUi) => void;
  onDeleteComment: (commentId: string) => void;
};

export function FriendFeedComments({
  comments,
  commentDraft,
  busy,
  viewerCanComment,
  loading = false,
  error = null,
  onDraftChange,
  onSubmitComment,
  onToggleCommentReaction,
  onStartEdit,
  onDeleteComment,
}: Props) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmitComment();
  }

  return (
    <section className={styles.commentSection} aria-label="Komentarze">
      {loading ? <FriendFeedCommentLoadingState /> : null}
      {error ? <FriendFeedCommentErrorState message={error} /> : null}
      {!loading && !error ? (
        <FriendFeedCommentsList
          comments={comments}
          onToggleCommentReaction={onToggleCommentReaction}
          onStartEdit={onStartEdit}
          onDeleteComment={onDeleteComment}
        />
      ) : null}

      {viewerCanComment ? (
        <FriendFeedCommentComposer
          commentDraft={commentDraft}
          busy={busy}
          onDraftChange={onDraftChange}
          onSubmit={handleSubmit}
        />
      ) : (
        <FriendFeedCommentPermissionState />
      )}
    </section>
  );
}

export function FriendFeedCommentsList({
  comments,
  onToggleCommentReaction,
  onStartEdit,
  onDeleteComment,
}: Pick<Props, "comments" | "onToggleCommentReaction" | "onStartEdit" | "onDeleteComment">) {
  if (comments.length === 0) return <FriendFeedCommentEmptyState />;
  return (
    <ul className={styles.commentList}>
      {comments.map((comment) => (
        <FriendFeedCommentItem
          key={comment.id}
          comment={comment}
          onToggleReaction={() => onToggleCommentReaction(comment.id)}
          onStartEdit={() => onStartEdit(comment)}
          onDelete={() => onDeleteComment(comment.id)}
        />
      ))}
    </ul>
  );
}

export function FriendFeedCommentItem({
  comment,
  onToggleReaction,
  onStartEdit,
  onDelete,
}: {
  comment: FriendPostCommentUi;
  onToggleReaction: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className={styles.commentRow}>
      <div className={styles.commentMeta}>
        <span className={styles.commentAuthor}>{comment.author.displayName}</span>
        {comment.status === "edited" ? <span className={styles.commentBadge}>edytowano</span> : null}
      </div>
      {comment.status === "deactivated" ? (
        <p className={`${styles.commentBody} ${styles.commentDeleted}`}>Komentarz usunięty</p>
      ) : (
        <p className={styles.commentBody}>{comment.body}</p>
      )}
      <div className={styles.commentActions}>
        <button type="button" className={styles.commentActionButton} onClick={onToggleReaction} aria-pressed={comment.viewerLiked}>
          {comment.viewerLiked ? "Lubię to" : "Polub"} · {comment.likeCount}
        </button>
        {comment.viewerCanEdit ? (
          <button type="button" className={styles.commentActionButton} onClick={onStartEdit}>Edytuj</button>
        ) : null}
        {comment.viewerCanDelete ? (
          <button type="button" className={styles.commentActionButton} onClick={onDelete}>Usuń</button>
        ) : null}
      </div>
    </li>
  );
}

export function FriendFeedCommentComposer({
  commentDraft,
  busy,
  onDraftChange,
  onSubmit,
}: {
  commentDraft: string;
  busy: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className={styles.commentComposer} onSubmit={onSubmit}>
      <input
        type="text"
        className={styles.commentInput}
        placeholder="Napisz komentarz…"
        value={commentDraft}
        onChange={(e) => onDraftChange(e.target.value)}
        aria-label="Treść komentarza"
      />
      <button type="submit" className={styles.commentButton} disabled={busy || commentDraft.trim().length === 0}>
        Wyślij
      </button>
    </form>
  );
}

export function FriendFeedCommentEmptyState() {
  return (
    <ul className={styles.commentList}>
      <li className={styles.commentRow}>
        <p className={styles.commentBody}>Brak komentarzy. Bądź pierwszy.</p>
      </li>
    </ul>
  );
}

export function FriendFeedCommentLoadingState() {
  return <p className={styles.commentState} role="status">Ładuję komentarze…</p>;
}

export function FriendFeedCommentErrorState({ message }: { message: string }) {
  return <p className={styles.commentError} role="alert">{message}</p>;
}

export function FriendFeedCommentPermissionState() {
  return <p className={sharedStyles.permissionState}>Aby komentować, musisz być znajomym autora.</p>;
}
