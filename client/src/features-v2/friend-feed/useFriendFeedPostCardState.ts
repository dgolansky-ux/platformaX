import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { friendFeedMockAdapter } from "./mock-adapter";
import type { FriendFeedItemUi, FriendPostCommentUi } from "./types";

type CardState = {
  likeCount: number;
  viewerLiked: boolean;
  commentCount: number;
  commentsOpen: boolean;
  comments: readonly FriendPostCommentUi[];
  commentDraft: string;
  editingCommentId: string | null;
  actionError: string | null;
  commentsLoading: boolean;
  busy: boolean;
};

type SetCardState = Dispatch<SetStateAction<CardState>>;

function activeCommentCount(comments: readonly FriendPostCommentUi[]): number {
  return comments.filter((c) => c.status !== "deactivated").length;
}

function applyComments(setState: SetCardState, comments: readonly FriendPostCommentUi[]) {
  setState((s) => ({ ...s, comments, commentCount: activeCommentCount(comments) }));
}

async function saveComment(viewerUserId: string, item: FriendFeedItemUi, state: CardState) {
  if (state.editingCommentId) {
    return friendFeedMockAdapter.updateComment({
      viewerUserId,
      postId: item.postId,
      commentId: state.editingCommentId,
      body: state.commentDraft,
    });
  }
  return friendFeedMockAdapter.createComment({ viewerUserId, postId: item.postId, body: state.commentDraft });
}

function makeCardActions(
  state: CardState,
  setState: SetCardState,
  loadComments: () => Promise<void>,
  viewerUserId: string,
  item: FriendFeedItemUi,
) {
  async function reactToPost() {
    if (!item.viewerCanReact || state.busy) return;
    setState((s) => ({ ...s, busy: true }));
    const res = await friendFeedMockAdapter.toggleReaction({ viewerUserId, postId: item.postId });
    if (!res.ok) return setState((s) => ({ ...s, busy: false, actionError: res.error.message }));
    setState((s) => ({ ...s, busy: false, likeCount: res.value.likeCount, viewerLiked: res.value.viewerLiked }));
  }

  async function submitComment() {
    if (!state.commentDraft.trim() || state.busy) return;
    setState((s) => ({ ...s, actionError: null, busy: true }));
    const res = await saveComment(viewerUserId, item, state);
    if (!res.ok) return setState((s) => ({ ...s, busy: false, actionError: res.error.message }));
    setState((s) => ({ ...s, busy: false, commentDraft: "", editingCommentId: null }));
    await loadComments();
  }

  async function reactToComment(commentId: string) {
    const res = await friendFeedMockAdapter.toggleReaction({ viewerUserId, targetType: "friend_post_comment", commentId });
    if (!res.ok) return setState((s) => ({ ...s, actionError: res.error.message }));
    await loadComments();
  }

  async function deleteComment(commentId: string) {
    const res = await friendFeedMockAdapter.deleteComment({ viewerUserId, postId: item.postId, commentId });
    if (!res.ok) return setState((s) => ({ ...s, actionError: res.error.message }));
    applyComments(setState, res.value);
  }

  return { reactToPost, submitComment, reactToComment, deleteComment };
}

export function useFriendFeedPostCardState(viewerUserId: string, item: FriendFeedItemUi) {
  const [state, setState] = useState<CardState>({
    likeCount: item.likeCount,
    viewerLiked: item.viewerLiked,
    commentCount: item.commentCount,
    commentsOpen: false,
    comments: [],
    commentDraft: "",
    editingCommentId: null,
    actionError: null,
    commentsLoading: false,
    busy: false,
  });

  const loadComments = useCallback(async () => {
    setState((s) => ({ ...s, commentsLoading: true }));
    const res = await friendFeedMockAdapter.listComments(viewerUserId, item.postId);
    if (!res.ok) {
      setState((s) => ({ ...s, commentsLoading: false, actionError: res.error.message }));
      return;
    }
    setState((s) => ({
      ...s,
      commentsLoading: false,
      comments: res.value,
      commentCount: res.value.filter((c) => c.status !== "deactivated").length,
    }));
  }, [viewerUserId, item.postId]);

  useEffect(() => {
    if (state.commentsOpen) void loadComments();
  }, [state.commentsOpen, loadComments]);

  const actions = makeCardActions(state, setState, loadComments, viewerUserId, item);

  return {
    state,
    setCommentDraft: (commentDraft: string) => setState((s) => ({ ...s, commentDraft })),
    toggleComments: () => setState((s) => ({ ...s, commentsOpen: !s.commentsOpen })),
    startEdit: (comment: FriendPostCommentUi) =>
      setState((s) => ({ ...s, editingCommentId: comment.id, commentDraft: comment.body })),
    ...actions,
  };
}
