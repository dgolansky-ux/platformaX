/**
 * features-v2/friend-feed / FriendFeedPostCard — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * One post card: author block, body, action bar (reaction + comments toggle).
 * Comments and the inline comment composer are rendered when the user expands.
 * No `@server/*` imports.
 */
import { useCallback, useEffect, useState } from "react";
import type { FriendFeedItemUi, FriendPostCommentUi } from "./types";
import { friendFeedMockAdapter } from "./mock-adapter";
import { FriendFeedComments } from "./FriendFeedComments";
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
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [viewerLiked, setViewerLiked] = useState(item.viewerLiked);
  const [commentCount, setCommentCount] = useState(item.commentCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<readonly FriendPostCommentUi[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadComments = useCallback(async () => {
    const res = await friendFeedMockAdapter.listComments(viewerUserId, item.postId);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }
    setComments(res.value);
    setCommentCount(res.value.filter((c) => c.status === "active").length);
  }, [viewerUserId, item.postId]);

  useEffect(() => {
    if (commentsOpen) void loadComments();
  }, [commentsOpen, loadComments]);

  async function handleReact() {
    if (!item.viewerCanReact || busy) return;
    setBusy(true);
    const res = await friendFeedMockAdapter.toggleReaction({ viewerUserId, postId: item.postId });
    setBusy(false);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }
    setLikeCount(res.value.likeCount);
    setViewerLiked(res.value.viewerLiked);
  }

  async function handleSubmitComment() {
    if (!commentDraft.trim() || busy) return;
    setActionError(null);
    setBusy(true);
    const res = await friendFeedMockAdapter.createComment({
      viewerUserId,
      postId: item.postId,
      body: commentDraft,
    });
    setBusy(false);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }
    setCommentDraft("");
    await loadComments();
  }

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

      <div className={styles.actionBar}>
        <button
          type="button"
          className={viewerLiked ? `${styles.actionButton} ${styles.actionButtonActive}` : styles.actionButton}
          onClick={handleReact}
          disabled={!item.viewerCanReact || busy}
          aria-pressed={viewerLiked}
        >
          {viewerLiked ? "Lubię to" : "Polub"} · {likeCount}
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setCommentsOpen((open) => !open)}
          aria-expanded={commentsOpen}
        >
          Komentarze · {commentCount}
        </button>
        <span className={styles.actionSpacer} />
      </div>

      {actionError ? <p className={styles.errorBanner} role="alert">{actionError}</p> : null}

      {commentsOpen ? (
        <FriendFeedComments
          comments={comments}
          commentDraft={commentDraft}
          busy={busy}
          viewerCanComment={item.viewerCanComment}
          onDraftChange={setCommentDraft}
          onSubmitComment={() => void handleSubmitComment()}
        />
      ) : null}
    </li>
  );
}
