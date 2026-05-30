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
  onDraftChange: (value: string) => void;
  onSubmitComment: () => void;
};

export function FriendFeedComments({
  comments,
  commentDraft,
  busy,
  viewerCanComment,
  onDraftChange,
  onSubmitComment,
}: Props) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmitComment();
  }

  return (
    <section className={styles.commentSection} aria-label="Komentarze">
      <ul className={styles.commentList}>
        {comments.length === 0 ? (
          <li className={styles.commentRow}>
            <p className={styles.commentBody}>Brak komentarzy. Bądź pierwszy.</p>
          </li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className={styles.commentRow}>
              <span className={styles.commentAuthor}>{c.author.displayName}</span>
              {c.status === "deleted" ? (
                <p className={`${styles.commentBody} ${styles.commentDeleted}`}>[komentarz usunięty]</p>
              ) : (
                <p className={styles.commentBody}>{c.body}</p>
              )}
            </li>
          ))
        )}
      </ul>

      {viewerCanComment ? (
        <form className={styles.commentComposer} onSubmit={handleSubmit}>
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
      ) : (
        <p className={sharedStyles.permissionState}>Aby komentować, musisz być znajomym autora.</p>
      )}
    </section>
  );
}
