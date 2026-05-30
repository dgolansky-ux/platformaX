/**
 * features-v2/friend-feed / FriendFeedPostCard — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * One post card: author block, body, action bar (reaction + comments toggle).
 * Comments and the inline comment composer are rendered when the user expands.
 * No `@server/*` imports.
 */
import type { FriendFeedItemUi } from "./types";
import { FriendFeedComments } from "./FriendFeedComments";
import { useFriendFeedPostCardState } from "./useFriendFeedPostCardState";
import { FriendFeedPostCard as DisplayFriendFeedPostCard } from "../content-display";
import { friendFeedItemToPostDisplay } from "./post-display-mappers";
import {
  ReportButton,
  moderationMockAdapter,
  type UiModerationViewer,
} from "../moderation";
import styles from "./FriendFeed.module.css";

type Props = {
  viewerUserId: string;
  item: FriendFeedItemUi;
};

export function FriendFeedPostCard({ viewerUserId, item }: Props) {
  const card = useFriendFeedPostCardState(viewerUserId, item);
  const { state } = card;
  const vm = friendFeedItemToPostDisplay({
    ...item,
    likeCount: state.likeCount,
    commentCount: state.commentCount,
    viewerLiked: state.viewerLiked,
  });
  const moderationViewer: UiModerationViewer = {
    userId: viewerUserId,
    role: "user",
  };
  const isOwner = viewerUserId === item.author.userId;

  return (
    <li className={styles.card}>
      <DisplayFriendFeedPostCard
        vm={vm}
        onReact={() => void card.reactToPost()}
        onComment={card.toggleComments}
        moreMenuSlot={
          <ReportButton
            viewer={moderationViewer}
            adapter={moderationMockAdapter}
            targetType="friend_feed_post"
            targetId={item.postId}
            targetOwnerUserId={item.author.userId}
            disabledForSelf={isOwner}
          />
        }
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
