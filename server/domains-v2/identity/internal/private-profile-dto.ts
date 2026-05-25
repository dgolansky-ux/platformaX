/**
 * identity — private profile DTO (owner-only, internal)
 *
 * This file deliberately lives under `/internal/` so the PII guard treats it as
 * a private context. It is exported through the identity domain's public API
 * ONLY as a return type of owner-gated use-cases (e.g. `getMyProfile`); other
 * domains must never branch on it directly.
 *
 * Private fields included here are never mapped into PublicProfileDTO.
 */
import type { MediaAssetRef, ProfileVisibility } from "../dto";

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
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};
