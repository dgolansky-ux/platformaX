/**
 * features-v2/communities-v2 / feeds / interactions / CommunityPostInteractions
 *
 * The interactions panel under one feed item card: action bar (reaction +
 * comments toggle) and the lazy-loaded comments thread (list + composer).
 * Owns the local UI state of one card; the source of truth lives in the
 * community-interactions mock adapter. NO fake counts — every number comes
 * from the adapter, every action hits a real mutation there.
 *
 * Permission gating: when the viewer cannot view the feed item (staff_only
 * for a plain member) this component is NOT rendered by the parent. Within
 * a viewable feed, viewer-without-comment-rights still sees the action bar
 * (read-only) and the composer shows a clear permission message.
 */
import { useCallback, useEffect, useState } from "react";
import type { CommunityFeedItemDTO } from "@shared/contracts/community-feeds";
import type {
  CommunityCommentDTO,
  CommunityCommentInteractionDTO,
  CommunityPostInteractionDTO,
} from "@shared/contracts/community-interactions";
import { communityInteractionsMockAdapter } from "../community-interactions-mock-adapter";
import { CommunityCommentComposer } from "./CommunityCommentComposer";
import { CommunityCommentsList, type CommentsListState } from "./CommunityCommentsList";
import { CommunityCommentsToggle } from "./CommunityCommentsToggle";
import { CommunityReactionButton } from "./CommunityReactionButton";
import styles from "./Interactions.module.css";

type Props = {
  item: CommunityFeedItemDTO;
  canComment: boolean;
  canReact: boolean;
  noPermissionMessage?: string;
};

export function CommunityPostInteractions({ item, canComment, canReact, noPermissionMessage }: Props) {
  const [summary, setSummary] = useState<CommunityPostInteractionDTO | null>(null);
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<CommentsListState>({ status: "loading" });
  const [busyAction, setBusyAction] = useState<null | "post-like" | "comment-create" | string>(null);

  const refreshSummary = useCallback(async () => {
    const res = await communityInteractionsMockAdapter.getPostInteractionSummaries([item.id]);
    if (res.ok && res.value.length > 0) setSummary(res.value[0]);
  }, [item.id]);

  useEffect(() => { void refreshSummary(); }, [refreshSummary]);

  const loadComments = useCallback(async () => {
    setThread({ status: "loading" });
    const res = await communityInteractionsMockAdapter.listComments(item.id);
    if (!res.ok) {
      setThread(res.error.code === "FORBIDDEN" ? { status: "forbidden", message: res.error.message } : { status: "error", message: res.error.message });
      return;
    }
    setThread({ status: "ready", items: res.value.items, reactions: res.value.reactions });
  }, [item.id]);

  const onToggleComments = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) void loadComments();
      return next;
    });
  }, [loadComments]);

  const onTogglePostLike = useCallback(async () => {
    if (!canReact) return;
    setBusyAction("post-like");
    const res = await communityInteractionsMockAdapter.reactToPost({ feedItemId: item.id, reactionType: "like", mode: "toggle" });
    setBusyAction(null);
    if (res.ok) setSummary(res.value);
  }, [canReact, item.id]);

  const onSubmitComment = useCallback(async (body: string) => {
    setBusyAction("comment-create");
    const res = await communityInteractionsMockAdapter.createComment({ feedItemId: item.id, body });
    setBusyAction(null);
    if (!res.ok) {
      return { ok: false as const, message: res.error.message ?? "Nie udało się dodać komentarza." };
    }
    await loadComments();
    await refreshSummary();
    return { ok: true as const };
  }, [item.id, loadComments, refreshSummary]);

  const onToggleCommentLike = useCallback(async (commentId: string) => {
    if (!canReact) return;
    setBusyAction(commentId);
    const res = await communityInteractionsMockAdapter.reactToComment({ feedItemId: item.id, commentId, reactionType: "like", mode: "toggle" });
    setBusyAction(null);
    if (!res.ok) return;
    if (thread.status !== "ready") return;
    const updatedReactions: CommunityCommentInteractionDTO[] = thread.reactions.map((r) =>
      r.commentId === commentId ? { commentId, reactions: res.value } : r,
    );
    setThread({ status: "ready", items: thread.items, reactions: updatedReactions });
  }, [canReact, item.id, thread]);

  const onDeleteComment = useCallback(async (commentId: string) => {
    setBusyAction(commentId);
    const res = await communityInteractionsMockAdapter.deleteComment({ feedItemId: item.id, commentId });
    setBusyAction(null);
    if (!res.ok) return;
    if (thread.status === "ready") {
      const replaced: CommunityCommentDTO[] = thread.items.map((c) => (c.id === commentId ? res.value : c));
      setThread({ status: "ready", items: replaced, reactions: thread.reactions });
    }
    await refreshSummary();
  }, [item.id, refreshSummary, thread]);

  const commentCount = summary?.commentCount ?? 0;
  const reactionSummary = summary?.reactions ?? { counts: { like: 0 }, total: 0, viewerActive: [] };
  const viewerLiked = reactionSummary.viewerActive.includes("like");

  return (
    <div data-testid={`interactions-${item.id}`}>
      <div className={styles.actionBar} role="group" aria-label="Akcje pod postem">
        <CommunityReactionButton
          active={viewerLiked}
          count={reactionSummary.counts.like}
          onToggle={() => void onTogglePostLike()}
          disabled={!canReact}
          busy={busyAction === "post-like"}
          ariaLabel={viewerLiked ? "Cofnij polubienie posta" : "Polub post"}
          testId={`reaction-${item.id}`}
        />
        <CommunityCommentsToggle count={commentCount} open={open} onToggle={onToggleComments} />
      </div>
      {open ? (
        <div className={styles.thread}>
          <CommunityCommentsList
            state={thread}
            canReact={canReact}
            busyCommentId={typeof busyAction === "string" && busyAction.startsWith("c-") ? busyAction : null}
            onToggleCommentLike={(id) => void onToggleCommentLike(id)}
            onDeleteComment={(id) => void onDeleteComment(id)}
          />
          <CommunityCommentComposer
            canComment={canComment}
            disabledReason={noPermissionMessage}
            onSubmit={onSubmitComment}
            busy={busyAction === "comment-create"}
          />
        </div>
      ) : null}
    </div>
  );
}
