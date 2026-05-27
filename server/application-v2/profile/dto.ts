/**
 * application-v2/profile — composed view DTOs
 *
 * The canonical definitions live in the neutral wire contract
 * `@shared/contracts/profile-view` so the frontend can consume them without
 * importing `@server/*` (split-ready, PX-APP-001). This module re-exports them
 * for server-side composition; it intentionally adds no duplicate definitions.
 *
 * Privacy classification:
 *  - OwnerProfileView   — Private (owner-only): MAY include phone, dateOfBirth.
 *  - PublicProfileView  — Public (any viewer):  MUST NOT include PII.
 *  - ProfileMediaRefView — Public (any viewer): just assetId + optional URL.
 */
export type {
  ProfileVisibility,
  ProfileMediaRefView,
  PersonalStatusView,
  OwnerProfileView,
  PublicProfileView,
} from "@shared/contracts/profile-view";
