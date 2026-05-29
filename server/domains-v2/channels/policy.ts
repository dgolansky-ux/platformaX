/**
 * channels — pure policy. A channel MUST be owned by a community; following a
 * channel is a separate relation from community membership (different store,
 * never inferred from membership).
 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidChannelSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function hasCommunityOwner(ownerType: string, ownerId: string): boolean {
  return ownerType === "community" && ownerId.trim().length > 0;
}
