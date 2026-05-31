export const CHANNEL_COMMENT_BODY_MAX = 2000;

export function normalizeChannelCommentBody(body: string): string {
  return body.trim();
}

export function isChannelCommentBodyTooLong(body: string): boolean {
  return body.length > CHANNEL_COMMENT_BODY_MAX;
}

export function canMutateChannelComment(args: {
  actorUserId: string;
  authorUserId: string;
  canModerate: boolean;
}): boolean {
  return args.actorUserId === args.authorUserId || args.canModerate;
}
