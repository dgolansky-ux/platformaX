import { useState } from "react";
import type { ChannelCommentDTO } from "@shared/contracts/channel-interactions";
import { channelsMockAdapter } from "./channels-mock-adapter";
import baseStyles from "./Channels.module.css";
import styles from "./ChannelInteractions.module.css";

export function ChannelCommentEmptyState() {
  return <div className={styles.commentState}>Nie ma jeszcze komentarzy pod tym wpisem.</div>;
}

export function ChannelCommentLoadingState() {
  return <div className={styles.commentState} aria-busy="true">Ładowanie komentarzy…</div>;
}

export function ChannelCommentErrorState({ message }: { message: string }) {
  return <div className={styles.commentError} role="alert">{message}</div>;
}

export function ChannelCommentPermissionState({ message }: { message: string }) {
  return <div className={styles.commentState}>{message}</div>;
}

export function ChannelCommentModerationActions({ comment, onDeactivate }: { comment: ChannelCommentDTO; onDeactivate: () => void }) {
  if (!comment.viewerCanDeactivate) return null;
  return (
    <button type="button" className={styles.commentAction} onClick={onDeactivate}>
      {comment.viewerCanModerate ? "Ukryj" : "Usuń"}
    </button>
  );
}

export function ChannelCommentItem({
  channelSlug,
  comment,
  onChanged,
}: {
  channelSlug: string;
  comment: ChannelCommentDTO;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);

  async function save() {
    await channelsMockAdapter.updateChannelComment({ channelSlug, postId: comment.channelPostId, commentId: comment.id, body });
    setEditing(false);
    await onChanged();
  }

  async function deactivate() {
    await channelsMockAdapter.deactivateChannelComment({ channelSlug, postId: comment.channelPostId, commentId: comment.id, moderationReason: "moderated" });
    await onChanged();
  }

  return (
    <article className={styles.commentItem}>
      <div className={styles.commentAvatar} aria-hidden="true">{comment.author?.displayName.charAt(0).toUpperCase() ?? "?"}</div>
      <div className={styles.commentBody}>
        <div className={styles.commentHead}>
          <strong>{comment.author?.displayName ?? "Użytkownik"}</strong>
          <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}</time>
          {comment.status === "edited" ? <span className={styles.commentBadge}>edytowany</span> : null}
        </div>
        {comment.status === "deactivated" ? (
          <p className={styles.commentMuted}>Komentarz został ukryty.</p>
        ) : editing ? (
          <div className={styles.commentEdit}>
            <textarea className={baseStyles.composerInput} value={body} onChange={(event) => setBody(event.target.value)} />
            <button type="button" className={baseStyles.secondaryBtn} onClick={() => void save()}>Zapisz</button>
          </div>
        ) : (
          <p>{comment.body}</p>
        )}
        <div className={styles.commentActions}>
          {comment.viewerCanEdit && comment.status !== "deactivated" ? (
            <button type="button" className={styles.commentAction} onClick={() => setEditing(true)}>Edytuj</button>
          ) : null}
          <ChannelCommentModerationActions comment={comment} onDeactivate={() => void deactivate()} />
        </div>
      </div>
    </article>
  );
}

export function ChannelCommentComposer({
  channelSlug,
  postId,
  canComment,
  permissionMessage,
  onCreated,
}: {
  channelSlug: string;
  postId: string;
  canComment: boolean;
  permissionMessage: string | null;
  onCreated: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canComment) return <ChannelCommentPermissionState message={permissionMessage ?? "Nie możesz komentować tego wpisu."} />;

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await channelsMockAdapter.createChannelComment({ channelSlug, postId, body });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setBody("");
    await onCreated();
  }

  return (
    <div className={styles.commentComposer}>
      <textarea className={styles.commentComposerInput} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Napisz krótki komentarz…" rows={2} />
      <div className={styles.commentComposerActions}>
        <button type="button" className={baseStyles.secondaryBtn} onClick={() => void submit()} disabled={busy || body.trim().length === 0}>
          Dodaj komentarz
        </button>
        {error ? <span className={baseStyles.formError}>{error}</span> : null}
      </div>
    </div>
  );
}
