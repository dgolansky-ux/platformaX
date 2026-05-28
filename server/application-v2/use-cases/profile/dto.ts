/**
 * application-v2/use-cases/profile — composed view DTOs.
 *
 * Cross-boundary view shape lives in `@shared/contracts/profile` so the client
 * never needs to import from `@server/*`. This file re-exports the canonical
 * names so existing application-layer imports stay unchanged.
 *
 * Privacy classification:
 *  - OwnerProfileView   — Private (owner-only): MAY include phone, dateOfBirth.
 *  - PublicProfileView  — Public (any viewer):  MUST NOT include PII.
 *  - ProfileMediaRefView — Public (any viewer): just assetId + optional URL.
 *
 * `url` may be null while the storage backend is env-required — the UI must
 * surface "no image" instead of faking one.
 */
export type {
  ProfileVisibility,
  ProfileMediaRefView,
  PersonalStatusView,
  OwnerProfileView,
  PublicProfileView,
} from "@shared/contracts/profile";
