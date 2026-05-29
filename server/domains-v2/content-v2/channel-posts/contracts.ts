import type { ChannelFeedItemDTO, ChannelPostDTO } from "./dto";

export type ChannelPostErrorCode =
  | "EMPTY_BODY"
  | "BODY_TOO_LONG"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "DEACTIVATED";

export type ChannelPostResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ChannelPostErrorCode; message: string } };

export type ChannelFeedPage = {
  pinnedPost: ChannelFeedItemDTO | null;
  items: readonly ChannelFeedItemDTO[];
  nextCursor: string | null;
};

export type ChannelPostCreatedValue = { post: ChannelPostDTO };
export type ChannelPostUpdatedValue = { post: ChannelPostDTO };
export type ChannelPostDeactivatedValue = { postId: string; deactivated: true };
