/**
 * application-v2/use-cases/moderation — content-state dispatcher.
 *
 * Routes moderator actions (`hide_content` / `deactivate_content` /
 * `restrict_visibility`) to the corresponding source-domain public-api. Built
 * as a thin factory so the application use-case can compose only the
 * dispatchers it actually has services for — unwired targets stay
 * ACTION_PARTIAL truthfully.
 *
 * Source-domain wiring (Slice 20 P2):
 *  - friend_feed_post        → content-v2 friend-posts `moderatorDeactivatePost`
 *  - friend_feed_comment     → content-v2 friend-posts `moderatorDeactivateComment`
 *  - workplace_post          → content-v2 workplace-posts `moderatorDeactivatePost`
 *  - channel_post            → content-v2 channel-posts `moderatorDeactivate`
 */
import type {
  FriendPostsService,
} from "@server/domains-v2/content-v2/public-api";
import type {
  WorkplacePostsService,
} from "@server/domains-v2/content-v2/public-api";
import type {
  ChannelPostService,
} from "@server/domains-v2/content-v2/channel-posts/public-api";
import type {
  ModerationActionDispatcher,
  ModerationDispatchContext,
  ModerationDispatchOutcome,
} from "./service";

export interface ContentDispatcherDeps {
  friendPosts?: FriendPostsService;
  workplacePosts?: WorkplacePostsService;
  channelPosts?: ChannelPostService;
}

function notApplied(note: string): ModerationDispatchOutcome {
  return { ok: true, applied: false, note };
}

function fail(code: string, message: string): ModerationDispatchOutcome {
  return { ok: false, code, message };
}

export function createContentModerationDispatcher(
  deps: ContentDispatcherDeps,
): ModerationActionDispatcher {
  return {
    async dispatch(ctx: ModerationDispatchContext): Promise<ModerationDispatchOutcome> {
      // Only deactivate / hide_content / restrict_visibility map onto
      // source-domain mutations in Slice 20 P2. Other action types
      // (dismiss / mark_reviewed / restore_content / no_action) stay
      // local to the moderation record.
      if (
        ctx.actionType !== "deactivate_content" &&
        ctx.actionType !== "hide_content" &&
        ctx.actionType !== "restrict_visibility"
      ) {
        return notApplied(`Action ${ctx.actionType} does not map onto source content state.`);
      }
      switch (ctx.targetType) {
        case "friend_feed_post": {
          if (!deps.friendPosts) {
            return notApplied("friend-posts service not wired in this environment.");
          }
          const res = await deps.friendPosts.moderatorDeactivatePost({
            friendPostId: ctx.targetId,
            moderatorUserId: ctx.moderatorUserId,
            reasonNote: ctx.reasonNote,
          });
          if (!res.ok) return fail(res.error.code, res.error.message);
          return { ok: true, applied: true };
        }
        case "friend_feed_comment": {
          if (!deps.friendPosts) {
            return notApplied("friend-posts service not wired in this environment.");
          }
          const res = await deps.friendPosts.moderatorDeactivateComment({
            commentId: ctx.targetId,
            moderatorUserId: ctx.moderatorUserId,
            reasonNote: ctx.reasonNote,
          });
          if (!res.ok) return fail(res.error.code, res.error.message);
          return { ok: true, applied: true };
        }
        case "workplace_post": {
          if (!deps.workplacePosts) {
            return notApplied("workplace-posts service not wired in this environment.");
          }
          const res = await deps.workplacePosts.moderatorDeactivatePost({
            postId: ctx.targetId,
            moderatorUserId: ctx.moderatorUserId,
            reasonNote: ctx.reasonNote,
          });
          if (!res.ok) return fail(res.error.code, res.error.message);
          return { ok: true, applied: true };
        }
        case "channel_post": {
          if (!deps.channelPosts) {
            return notApplied("channel-posts service not wired in this environment.");
          }
          const res = await deps.channelPosts.moderatorDeactivate({
            postId: ctx.targetId,
            moderatorUserId: ctx.moderatorUserId,
            reasonNote: ctx.reasonNote,
          });
          if (!res.ok) return fail(res.error.code, res.error.message);
          return { ok: true, applied: true };
        }
        default:
          return notApplied(`Target ${ctx.targetType} not yet wired to a moderator-actor surface.`);
      }
    },
  };
}
