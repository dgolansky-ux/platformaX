/**
 * content-v2/friend-posts — cross-domain ports.
 *
 * The friend-posts service never imports `social` or `identity` internals.
 * The application layer wires these resolver ports.
 */

export interface FriendshipResolver {
  /** Is the viewer a confirmed friend of the author? */
  areFriends(viewerUserId: string, authorUserId: string): Promise<boolean>;
  /** List of confirmed friend ids of the viewer — used to scope the feed read. */
  listFriendIdsForViewer(viewerUserId: string): Promise<readonly string[]>;
}
