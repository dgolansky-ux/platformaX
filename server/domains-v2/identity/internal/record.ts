/**
 * identity — internal persistence record
 *
 * The shape repositories store. Kept in /internal/ so it is invisible to the
 * PII guard (this is where private fields legitimately live) and unreachable
 * to other domains.
 */
import type { ProfileVisibility } from "../dto";

export type PrivateProfileRecord = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  /** ISO date YYYY-MM-DD. */
  dateOfBirth: string | null;
  phone: string | null;
  avatarAssetId: string | null;
  bannerAssetId: string | null;
  bio: string | null;
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};
