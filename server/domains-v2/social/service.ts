/**
 * social / service — runtime barrel.
 *
 * The social domain is currently composed of focused per-feature service
 * files (currently: `social-contacts-service.ts` for the Kontakty slice).
 * This `service.ts` exists as the runtime entry point so the runtime
 * readiness guard (`check-runtime-readiness-status.mjs`) sees the
 * canonical `service.ts` for a PARTIAL domain. Future per-feature
 * services join here as named re-exports.
 */
export {
  createSocialContactsService,
  type SocialContactsService,
  type SocialContactsServiceDeps,
  type SocialContactsError,
  type SocialContactsErrorCode,
  type SocialContactsResult,
  type SocialContactsClock,
  type SocialContactsIdGenerator,
} from "./social-contacts-service";
