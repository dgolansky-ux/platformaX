export const CHANNEL_POST_BODY_MAX = 4000;

export function normalizeChannelPostBody(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export function isChannelPostBodyTooLong(body: string): boolean {
  return body.length > CHANNEL_POST_BODY_MAX;
}

export function canAuthorMutatePost(args: {
  actorUserId: string;
  authorUserId: string;
  canManage: boolean;
}): boolean {
  return args.canManage || args.actorUserId === args.authorUserId;
}
