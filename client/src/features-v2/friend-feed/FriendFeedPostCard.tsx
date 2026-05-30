/**
 * features-v2/friend-feed / FriendFeedPostCard — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * One post card: author block, body, action bar (reaction + comments toggle).
 * Comments and the inline comment composer are rendered when the user expands.
 * No `@server/*` imports.
 */
import type { FriendFeedItemUi } from "./types";
import { FriendFeedComments } from "./FriendFeedComments";
import { FriendFeedPostActionBar } from "./FriendFeedPostActions";
import { useFriendFeedPostCardState } from "./useFriendFeedPostCardState";
import styles from "./FriendFeed.module.css";

type Props = {
  viewerUserId: string;
  item: FriendFeedItemUi;
};

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function initials(displayName: string): string {
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const PRIVACY_LABEL: Record<FriendFeedItemUi["visibility"], string> = {
  friends_only: "Znajomi",
  private: "Tylko Ty",
  public: "Publiczny",
};

export function FriendFeedPostCard({ viewerUserId, item }: Props) {
  const card = useFriendFeedPostCardState(viewerUserId, item);
  const { state } = card;

  const privacyClass = item.visibility === "private"
    ? `${styles.privacyChip} ${styles.privacyChipPrivate}`
    : item.visibility === "public"
      ? `${styles.privacyChip} ${styles.privacyChipPublic}`
      : styles.privacyChip;

  return (
    <li className={styles.card}>
      <header className={styles.cardHeader}>
        <span className={styles.avatar} aria-hidden="true">{initials(item.author.displayName)}</span>
        <div className={styles.cardAuthor}>
          <p className={styles.cardAuthorName}>{item.author.displayName}</p>
          <p className={styles.cardAuthorMeta}>
            {item.author.handle ? `@${item.author.handle} · ` : ""}
            {formatRelative(item.createdAt)}
            {item.status === "edited" ? " · edytowano" : ""}
          </p>
        </div>
        <span className={privacyClass}>{PRIVACY_LABEL[item.visibility]}</span>
      </header>

      <p className={styles.cardBody}>{item.body}</p>

      <FriendFeedPostActionBar
        viewerLiked={state.viewerLiked}
        likeCount={state.likeCount}
        commentCount={state.commentCount}
        commentsOpen={state.commentsOpen}
        viewerCanReact={item.viewerCanReact}
        busy={state.busy}
        onReact={() => void card.reactToPost()}
        onToggleComments={card.toggleComments}
      />

      {state.actionError ? <p className={styles.errorBanner} role="alert">{state.actionError}</p> : null}

      {state.commentsOpen ? (
        <FriendFeedComments
          comments={state.comments}
          commentDraft={state.commentDraft}
          busy={state.busy}
          viewerCanComment={item.viewerCanComment}
          loading={state.commentsLoading}
          error={null}
          onDraftChange={card.setCommentDraft}
          onSubmitComment={() => void card.submitComment()}
          onToggleCommentReaction={(commentId) => void card.reactToComment(commentId)}
          onStartEdit={card.startEdit}
          onDeleteComment={(commentId) => void card.deleteComment(commentId)}
        />
      ) : null}
    </li>
  );
}
