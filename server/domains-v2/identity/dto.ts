/**
 * identity — public data transfer objects.
 *
 * Cross-boundary types (visibility enums, social links, personal status,
 * media-ref shape) live in `@shared/contracts/identity` so the client never
 * needs to reach into `@server/*`. This file re-exports them under the same
 * names the identity domain has always used (e.g. `MediaAssetRef`), and adds
 * the domain-owned `PublicProfileDTO` that is identity-internal.
 *
 * Private DTOs (owner-only) live in `./internal/private-profile-dto.ts` so the
 * PII guard (`scripts/check-public-dto-pii.mjs`) can keep public DTOs strict.
 */
import type { IdentityMediaAssetRef } from "@shared/contracts/identity";

export type {
  ProfileVisibility,
  PersonalStatusVisibility,
  CivilStatus,
  SocialLinkKind,
  SocialLinks,
  PersonalStatusDTO,
} from "@shared/contracts/identity";

/**
 * Domain-local alias matching the historical identity-domain name; the canonical
 * shape lives in `@shared/contracts/identity` so client and server share it.
 */
export type MediaAssetRef = IdentityMediaAssetRef;

import type {
  CivilStatus as _CivilStatus,
  PersonalStatusDTO as _PersonalStatusDTO,
  ProfileVisibility as _ProfileVisibility,
  SocialLinks as _SocialLinks,
} from "@shared/contracts/identity";

/**
 * Public profile summary. Anything visible to non-owners.
 * Must not contain private contact info or auth metadata.
 *
 * Fields whose presence depends on viewer role + visibility are filtered by
 * the mapper before reaching here (e.g. `personalStatus` is omitted when the
 * status visibility forbids the current viewer).
 */
export type PublicProfileDTO = {
  userId: string;
  profileSlug: string | null;
  displayName: string;
  avatarMediaRef: IdentityMediaAssetRef | null;
  bannerMediaRef: IdentityMediaAssetRef | null;
  bio: string | null;
  /** City / region only — never a precise address. */
  location: string | null;
  civilStatus: _CivilStatus | null;
  socialLinks: _SocialLinks | null;
  personalStatus: _PersonalStatusDTO | null;
  visibility: _ProfileVisibility;
  onboardingCompleted: boolean;
};
