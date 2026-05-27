/**
 * identity — internal persistence record
 *
 * The shape repositories store. Kept in /internal/ so it is invisible to the
 * PII guard (this is where private fields legitimately live) and unreachable
 * to other domains.
 */
import type {
  CivilStatus,
  PersonalStatusVisibility,
  ProfileVisibility,
  SocialLinks,
} from "../dto";

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
  /** City / region — public-safe summary, never an exact address. */
  location: string | null;
  /** Public stable handle (unique). Null while not set. */
  profileSlug: string | null;
  /** Personal status fields. All null when status is cleared. */
  statusText: string | null;
  statusEmoji: string | null;
  statusDescription: string | null;
  statusVisibility: PersonalStatusVisibility | null;
  statusPhotoAssetId: string | null;
  civilStatus: CivilStatus | null;
  socialLinks: SocialLinks | null;
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};
