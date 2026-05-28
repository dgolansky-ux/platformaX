/**
 * identity — repository port contracts (domain-root facade).
 *
 * The repository *interface* is a legitimate cross-boundary contract (the
 * application layer injects an implementation). The in-memory *implementation
 * factory* is NOT public. `public-api.ts` exports the interface types through
 * this module so it never has to export from `./repository` directly — the
 * boundary guard treats any `public-api.ts` export from `repository` as a leak.
 */
export type {
  IdentityProfileRepository,
  CreateProfileRecordInput,
  UpdateProfileRecordPatch,
} from "./repository";
