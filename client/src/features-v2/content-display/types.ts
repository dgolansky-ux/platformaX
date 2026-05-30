/**
 * features-v2/content-display — Post Display Kit view models (Slice 17).
 *
 * Display Kit consumes already-safe view models. Permissions / privacy are
 * resolved upstream (application-v2), so this layer NEVER calls
 * source-of-truth.
 */

export type PostDisplayType =
  | "friend_post"
  | "community_post"
  | "staff_post"
  | "relational_post"
  | "channel_post"
  | "workplace_post"
  | "workplace_teaser"
  | "important_event"
  | "profile_presentation";

export type PostDisplayStatus = "published" | "edited" | "deactivated" | "partial" | "blocked";

export type PostDisplayVisibility =
  | "public"
  | "friends_only"
  | "private"
  | "community_all"
  | "community_staff"
  | "community_relational"
  | "channel_followers"
  | "workplace_public"
  | "workplace_friends_only"
  | "workplace_private";

export interface PostDisplayAuthor {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
}

export interface PostDisplaySourceContext {
  sourceLabel: string;
  sourceHref?: string;
}

export interface PostDisplayMediaRef {
  refId: string;
  mediaType: "image" | "video" | "document" | "link";
  altText?: string;
}

export interface PostDisplayInteractionSummary {
  likeCount: number;
  commentCount: number;
  viewerLiked: boolean;
  viewerCanReact: boolean;
  viewerCanComment: boolean;
}

export interface PostDisplayBadge {
  label: string;
  tone: "neutral" | "info" | "warning" | "success";
}

export interface PostDisplayActionBarConfig {
  showReact: boolean;
  showComment: boolean;
  showShare: boolean;
  showOpen: boolean;
}

/** Stable view model the Display Kit consumes. No PII, no raw records. */
export interface PostDisplayViewModel {
  id: string;
  displayType: PostDisplayType;
  author: PostDisplayAuthor;
  sourceContext: PostDisplaySourceContext | null;
  title: string | null;
  bodyPreview: string;
  /** Optional full body — never set on teasers. */
  bodyFull?: string | null;
  /** Optional date — primarily used by important_event. */
  date?: string | null;
  mediaRefs: readonly PostDisplayMediaRef[];
  createdAt: string;
  updatedAt: string;
  badges: readonly PostDisplayBadge[];
  visibility: PostDisplayVisibility;
  routeTarget: string;
  interactionSummary?: PostDisplayInteractionSummary;
  actions: PostDisplayActionBarConfig;
  status: PostDisplayStatus;
}
