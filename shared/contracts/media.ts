/**
 * shared/contracts/media — canonical media contract types.
 *
 * QUALITY_STRUCTURE_EXCEPTION: Slice 18 colocates the 21-purpose union, the
 * 8 owner-type values, asset/variant DTOs, upload intent + adapter contract
 * and validation error DTO in a single contract file as the single source
 * of truth for both client and server. Splitting would create circular
 * imports between owner types ↔ purpose unions ↔ adapter input/result types
 * which all reference each other. Tracked as EXC-009 in
 * docs/governance/EXCEPTIONS_REGISTER.md.
 *
 * Single source of truth for cross-boundary media types used across V2:
 * profile (avatar/banner/bio/presentation/important-event), friend feed,
 * communities, channels, workplaces, events and the newsletter chat. Both
 * `client/**` and `server/**` import from here; the server-side media domain
 * re-exports the same names so callers see one shape.
 *
 * `shared/contracts/*` MUST NOT import from `@server/*` — these types are
 * independent definitions, not a mirror that pulls server runtime paths into
 * the client bundle graph. The runtime `MediaService` interface (methods +
 * dependencies) is server-side and is NOT re-exposed here; clients depend on
 * the `MediaUploadAdapter` contract instead.
 */

/* ============================================================================
 * Purpose registry — every surface a media asset can serve.
 *
 * Backward-compat note: V1 only recognised `avatar | banner | statusPhoto`.
 * Those legacy names are gone — call-sites use the V2 explicit names below
 * (profile_avatar, profile_banner, profile_bio_media respectively).
 * ============================================================================ */

export type ProfileMediaPurpose =
  | "profile_avatar"
  | "profile_banner"
  | "profile_bio_media"
  | "profile_presentation_media"
  | "profile_important_event_media";

export type FriendFeedMediaPurpose = "friend_feed_post_media";

export type CommunityMediaPurpose =
  | "community_avatar"
  | "community_banner"
  | "community_post_media"
  | "community_staff_post_media"
  | "community_relational_post_media";

export type ChannelMediaPurpose =
  | "channel_avatar"
  | "channel_banner"
  | "channel_post_media";

export type WorkplaceMediaPurpose =
  | "workplace_logo"
  | "workplace_banner"
  | "workplace_post_media"
  | "workplace_teaser_media";

export type EventMediaPurpose = "event_cover" | "event_gallery";

export type NewsletterMediaPurpose = "newsletter_message_media";

/** Union of every supported V2 media purpose. */
export type MediaPurpose =
  | ProfileMediaPurpose
  | FriendFeedMediaPurpose
  | CommunityMediaPurpose
  | ChannelMediaPurpose
  | WorkplaceMediaPurpose
  | EventMediaPurpose
  | NewsletterMediaPurpose;

/* ============================================================================
 * Owner types — what entity a media asset is attached to.
 * ============================================================================ */

export type MediaOwnerType =
  | "user_profile"
  | "community"
  | "channel"
  | "workplace"
  | "event"
  | "post"
  | "profile_presentation"
  | "important_event";

/** Stable reference to the owning entity. */
export type MediaOwnerRefDTO = {
  ownerType: MediaOwnerType;
  ownerId: string;
};

/* ============================================================================
 * Asset lifecycle, visibility, variants.
 * ============================================================================ */

/** Lifecycle of an asset. `ready` means a public URL/variant is resolvable. */
export type MediaAssetStatus =
  | "upload_intent_created"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "deleted";

export type MediaVisibility =
  | "public"
  | "friends_only"
  | "members_only"
  | "owner_only";

export type MediaVariantType =
  | "original"
  | "thumbnail"
  | "small"
  | "medium"
  | "large"
  | "avatar"
  | "banner"
  | "preview";

/**
 * Variant status. `processing_skeleton` means the variant slot is declared by
 * the purpose policy but no real image processing pipeline has materialised
 * the bytes yet — surfaces fall back to the best available variant.
 */
export type MediaVariantStatus =
  | "processing_skeleton"
  | "processing"
  | "ready"
  | "failed";

export type MediaVariantDTO = {
  variantType: MediaVariantType;
  status: MediaVariantStatus;
  url: string | null;
  width: number | null;
  height: number | null;
};

/* ============================================================================
 * Refs + asset DTOs (public-safe — no PII, no storage internals).
 * ============================================================================ */

/** Stable, opaque reference other domains store instead of the asset itself. */
export type MediaRefDTO = {
  assetId: string;
};

/** Opaque reference other domains persist instead of an asset. */
export type MediaAssetRef = {
  assetId: string;
};

/**
 * Public-safe projection of an asset. Never includes the storage key, owner id,
 * byte size or storage backend identity. Variants are included so display kit
 * surfaces can pick the right size without round-trips.
 */
export type MediaAssetDTO = {
  assetId: string;
  purpose: MediaPurpose;
  ownerType: MediaOwnerType;
  status: MediaAssetStatus;
  visibility: MediaVisibility;
  /** Public URL of the original/best when the asset is `ready`; null otherwise. */
  url: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  variants: readonly MediaVariantDTO[];
};

/* ============================================================================
 * Upload intent + file meta.
 * ============================================================================ */

/** Honest transport state of the upload destination. */
export type UploadTransportState = "READY" | "ENV_REQUIRED";

/**
 * Instruction the client uses to push bytes directly to storage (presigned-style).
 * `uploadUrl` is null and `transport` is `ENV_REQUIRED` while no storage backend
 * is wired — the UI MUST surface that instead of faking a successful upload.
 */
export type UploadIntentDTO = {
  intentId: string;
  assetId: string;
  purpose: MediaPurpose;
  ownerType: MediaOwnerType;
  ownerId: string;
  uploadUrl: string | null;
  method: "PUT" | "POST";
  storageKey: string;
  maxBytes: number;
  maxFiles: number;
  allowedMimeTypes: readonly string[];
  mimeType: string;
  transport: UploadTransportState;
  expiresAt: string | null;
};

/**
 * Metadata describing a file the client wants to upload. The client computes
 * this from the selected `File` (type + size, optional intrinsic dimensions).
 * The raw bytes never cross this boundary — there is no inline payload field.
 */
export type UploadFileMeta = {
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  /**
   * Optional client-proposed source URI. Inline `data:` scheme refs are
   * rejected by validation — uploads go through a storage target, not inline.
   */
  sourceUri?: string | null;
};

/* ============================================================================
 * Purpose definition (frontend can render limits/policies without round-trip).
 * ============================================================================ */

export type MediaPurposeDefinitionDTO = {
  purpose: MediaPurpose;
  allowedOwnerTypes: readonly MediaOwnerType[];
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
  maxFiles: number;
  variantPolicy: readonly MediaVariantType[];
  defaultVisibility: MediaVisibility;
  canBePublic: boolean;
  requiresOwnershipCheck: boolean;
  recommendedWidth: number | null;
  recommendedHeight: number | null;
};

/* ============================================================================
 * Errors.
 * ============================================================================ */

export type MediaErrorCode =
  | "INVALID_INPUT"
  | "INVALID_PURPOSE"
  | "INVALID_OWNER_TYPE"
  | "UNSUPPORTED_TYPE"
  | "TOO_LARGE"
  | "TOO_MANY_FILES"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "NOT_READY"
  | "INTENT_EXPIRED"
  | "INTENT_ALREADY_USED"
  | "STORAGE_UNAVAILABLE";

export type MediaError = {
  code: MediaErrorCode;
  message: string;
  /** Optional field-level validation map. Safe for UI display. */
  fields?: Record<string, string>;
};

export type MediaValidationErrorDTO = {
  field:
    | "mimeType"
    | "sizeBytes"
    | "purpose"
    | "ownerType"
    | "ownerId"
    | "maxFiles"
    | "sourceUri";
  message: string;
};

/** Discriminated result for owner-gated media use-cases. */
export type MediaResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: MediaError };

/* ============================================================================
 * Adapter contract — client + server agree on this shape.
 *
 * One generic `createUploadIntent` powers every surface. The convenience
 * wrappers (`createProfileAvatarUploadIntent`, etc.) are intentionally NOT
 * part of the adapter contract — surface-level use-cases live in
 * `server/application-v2/use-cases/media` and call this generic adapter.
 * ============================================================================ */

export type CreateUploadIntentInput = {
  actorUserId: string;
  ownerRef: MediaOwnerRefDTO;
  purpose: MediaPurpose;
  fileMeta: UploadFileMeta;
  idempotencyKey: string;
};

export type CompleteUploadInput = {
  actorUserId: string;
  intentId: string;
  assetId: string;
};

export type CreateUploadIntentResult = MediaResult<UploadIntentDTO>;
export type ConfirmUploadResult = MediaResult<MediaAssetDTO>;
export type GetMediaUrlResult = MediaResult<MediaAssetDTO>;
export type ListOwnerAssetsResult = MediaResult<readonly MediaAssetDTO[]>;

/**
 * Adapter contract the client UI depends on. Both the client-side mock adapter
 * (MOCK_LOCAL_ONLY, BACKEND_NOT_STARTED) and the future HTTP transport adapter
 * implement this same shape. `isStorageConnected()` answers honestly — `false`
 * while no real storage backend is wired — so the UI can surface that rather
 * than pretending bytes were stored.
 */
export type MediaUploadAdapter = {
  isStorageConnected(): boolean;
  getPurposeDefinition(purpose: MediaPurpose): MediaPurposeDefinitionDTO;
  createUploadIntent(input: CreateUploadIntentInput): Promise<CreateUploadIntentResult>;
  completeUpload(input: CompleteUploadInput): Promise<ConfirmUploadResult>;
  getPublicMediaUrl(ref: MediaRefDTO): Promise<GetMediaUrlResult>;
  listAssetsForOwner(ownerRef: MediaOwnerRefDTO): Promise<ListOwnerAssetsResult>;
};
