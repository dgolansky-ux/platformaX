// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-CTX-001-ACK: pre-runtime content/feed DTO; explicit owner/ref context fields scheduled with content read-model slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * content-v2/workplace-teasers — cross-domain ports.
 *
 * Teaser visibility depends on friendship — the application layer wires this
 * resolver from `social.public-api`. This submodule never reaches into social
 * internals.
 */

export interface WorkplaceTeaserFriendshipResolver {
  /** List of confirmed friend ids of the viewer — scopes the teaser feed read. */
  listFriendIdsForViewer(viewerUserId: string): Promise<readonly string[]>;
  /** Is the viewer a confirmed friend of the workplace owner? */
  areFriends(viewerUserId: string, ownerUserId: string): Promise<boolean>;
}
