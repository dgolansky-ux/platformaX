// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

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
