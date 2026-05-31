import { useEffect, useState } from "react";
import type { ChannelPostDTO } from "@shared/contracts/channel-posts";
import type { ChannelCommentListDTO } from "@shared/contracts/channel-interactions";
import {
  ChannelCommentComposer,
  ChannelCommentEmptyState,
  ChannelCommentErrorState,
  ChannelCommentItem,
  ChannelCommentLoadingState,
} from "./ChannelCommentComponents";
import { channelsMockAdapter } from "./channels-mock-adapter";
import styles from "./ChannelInteractions.module.css";

type Props = {
  channelSlug: string;
  post: ChannelPostDTO;
  onChanged: () => Promise<void>;
};

type CommentsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ChannelCommentListDTO };

export function ChannelReactionButton({ channelSlug, post, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await channelsMockAdapter.reactToChannelTarget({
      channelSlug,
      postId: post.id,
      targetType: "channel_post",
      targetId: post.id,
      reactionType: "like",
      mode: "toggle",
    });
    setBusy(false);
    await onChanged();
  }
  return (
    <button
      type="button"
      className={`${styles.reactionBtn} ${post.interactions.viewerLiked ? styles.reactionBtnActive : ""}`}
      onClick={() => void toggle()}
      disabled={busy || !post.interactions.canReact}
      aria-pressed={post.interactions.viewerLiked}
    >
      Lubię to <span>{post.interactions.reactionCount}</span>
    </button>
  );
}

export function ChannelReactionSummary({ post }: { post: ChannelPostDTO }) {
  return <span className={styles.interactionSummary}>{post.interactions.reactionCount} reakcji</span>;
}

export function ChannelCommentsToggle({ open, count, onToggle }: { open: boolean; count: number; onToggle: () => void }) {
  return (
    <button type="button" className={styles.commentsToggle} onClick={onToggle} aria-expanded={open}>
      {open ? "Ukryj komentarze" : "Komentarze"} <span>{count}</span>
    </button>
  );
}

export function ChannelCommentsList({ channelSlug, post, onChanged }: Props) {
  const [state, setState] = useState<CommentsState>({ status: "idle" });

  async function load() {
    setState({ status: "loading" });
    const res = await channelsMockAdapter.listChannelComments(channelSlug, post.id);
    if (!res.ok) {
      setState({ status: "error", message: res.error.message });
      return;
    }
    setState({ status: "ready", data: res.value });
  }

  useEffect(() => { void load(); }, [channelSlug, post.id]);

  async function refresh() {
    await load();
    await onChanged();
  }

  if (state.status === "loading" || state.status === "idle") return <ChannelCommentLoadingState />;
  if (state.status === "error") return <ChannelCommentErrorState message={state.message} />;

  return (
    <div className={styles.commentsPanel}>
      <ChannelCommentComposer
        channelSlug={channelSlug}
        postId={post.id}
        canComment={state.data.canComment}
        permissionMessage={state.data.permissionMessage}
        onCreated={refresh}
      />
      {state.data.items.length === 0 ? (
        <ChannelCommentEmptyState />
      ) : (
        <div className={styles.commentList}>
          {state.data.items.map((comment) => (
            <ChannelCommentItem key={comment.id} channelSlug={channelSlug} comment={comment} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChannelPostActionBar({ channelSlug, post, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.interactions}>
      <div className={styles.actionBar}>
        <ChannelReactionButton channelSlug={channelSlug} post={post} onChanged={onChanged} />
        <ChannelCommentsToggle open={open} count={post.interactions.commentCount} onToggle={() => setOpen((v) => !v)} />
        <ChannelReactionSummary post={post} />
      </div>
      {!post.interactions.reactionsEnabled ? <div className={styles.commentState}>Reakcje są wyłączone.</div> : null}
      {open ? <ChannelCommentsList channelSlug={channelSlug} post={post} onChanged={onChanged} /> : null}
    </div>
  );
}
