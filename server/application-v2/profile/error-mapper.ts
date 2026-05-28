/**
 * application-v2/profile — error mapping.
 *
 * Translates raw `IdentityError` / `MediaError` shapes into the small,
 * frontend-safe `ProfileApplicationError` code-set. Lives in its own module
 * so `service.ts` stays focused on orchestration and the size guard
 * (`check-application-service-size.mjs`, 280-line cap) does not need a
 * special-case for application services.
 *
 * No domain raw error message is forwarded to the UI — only the safe Polish
 * message embedded in `makeProfileError` is exposed.
 */
import type { IdentityError } from "@server/domains-v2/identity/public-api";
import type { MediaError } from "@server/domains-v2/media/public-api";
import { makeProfileError } from "./errors";
import type { ProfileApplicationError } from "./errors";

export function unauthError(): ProfileApplicationError {
  return makeProfileError("UNAUTHENTICATED", "Wymagane zalogowanie.");
}

export function mapIdentityError(err: IdentityError): ProfileApplicationError {
  switch (err.code) {
    case "NOT_FOUND":
      return makeProfileError("PROFILE_NOT_FOUND", "Profil nie istnieje.");
    case "FORBIDDEN":
      return makeProfileError(
        "PROFILE_FORBIDDEN",
        "Brak uprawnień do tego profilu.",
      );
    case "INVALID_INPUT":
      return makeProfileError(
        "PROFILE_VALIDATION_FAILED",
        "Niepoprawne dane profilu.",
        err.fields,
      );
    case "ALREADY_COMPLETED":
      return makeProfileError(
        "ONBOARDING_ALREADY_COMPLETED",
        "Onboarding został już ukończony.",
      );
  }
}

export function mapMediaError(err: MediaError): ProfileApplicationError {
  switch (err.code) {
    case "NOT_FOUND":
      return makeProfileError("MEDIA_ASSET_NOT_FOUND", "Zasób nie istnieje.");
    case "FORBIDDEN":
      return makeProfileError(
        "MEDIA_ASSET_FORBIDDEN",
        "Brak uprawnień do zasobu.",
      );
    case "INVALID_INPUT":
    case "UNSUPPORTED_TYPE":
      return makeProfileError(
        "MEDIA_ASSET_TYPE_MISMATCH",
        "Typ zasobu nie pasuje do żądanej referencji.",
      );
    case "NOT_READY":
    case "STORAGE_UNAVAILABLE":
    case "TOO_LARGE":
      return makeProfileError(
        "MEDIA_ASSET_NOT_READY",
        "Zasób nie jest jeszcze gotowy do podpięcia.",
      );
  }
}
