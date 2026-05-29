/**
 * identity — cross-domain contracts.
 *
 * Stable contract types shared with other domains (social, content-v2, …).
 * The canonical definitions live in `@shared/contracts/identity` so the client
 * sees the same shape without ever importing from `@server/*`. This file
 * re-exports them so existing `from "./contracts"` imports inside the identity
 * domain keep working without further indirection.
 *
 * Anything referenced here MUST be a type or a constant — never runtime
 * implementation. Implementation lives behind `public-api.ts`.
 */
export type {
  UserId,
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  UpdatePersonalStatusInput,
  IdentityResult,
  IdentityError,
  IdentityErrorCode,
} from "@shared/contracts/identity";
