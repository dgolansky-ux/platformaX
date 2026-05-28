/**
 * identity — private profile DTO (owner-only)
 *
 * This is the owner-only DTO returned by owner-gated use-cases (e.g. getMyProfile).
 * It is part of the identity public-api surface as a TYPE ONLY — other domains
 * MUST NOT branch on private fields. Public consumers should compose
 * PublicProfileDTO.
 *
 * Owner-only fields (dateOfBirth, phone) are never mapped into PublicProfileDTO.
 * The public-api guard explicitly allows this stable file (not internal/*).
 *
 * ALLOW_PRIVATE_DTO_PII — this DTO is the private owner-gated surface; the
 * public PII guard allowlists this file via the marker. The public mapper
 * (`toPublicProfileDTO` in mapper.ts) is covered by `public-mapper-no-pii`
 * tests and `check-public-dto-pii.mjs` (which scans dto.ts / public-api.ts).
 */
import type {
  CivilStatus,
  MediaAssetRef,
  PersonalStatusDTO,
  ProfileVisibility,
  SocialLinks,
} from "./dto";

export type PrivateProfileDTO = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  /** ISO date string (YYYY-MM-DD). Owner-only. */
  dateOfBirth: string | null;
  /** Owner-only contact field. Normalised to E.164-like format on write. */
  phone: string | null;
  avatarMediaRef: MediaAssetRef | null;
  bannerMediaRef: MediaAssetRef | null;
  bio: string | null;
  /** City / region — exposed publicly when profile visibility allows. */
  location: string | null;
  /** Public stable handle (unique). Owner can rotate, others see it. */
  profileSlug: string | null;
  civilStatus: CivilStatus | null;
  socialLinks: SocialLinks | null;
  /** Composed personal status; null when cleared. Owner always sees it raw. */
  personalStatus: PersonalStatusDTO | null;
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};
