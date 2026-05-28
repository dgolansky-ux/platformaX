/**
 * features-v2/identity/profile — runtime adapter (thin re-export boundary).
 *
 * The actual composition (wiring identity + media + application service) lives
 * in `@shared/wiring/profile-wiring` — that is the only module allowed to
 * import `@server/*` factories. This file re-exports the public surface so
 * that `app-v2` never needs to reach into `@shared/wiring/` directly.
 *
 * When a real HTTP/RPC transport is wired, replace `@shared/wiring/profile-wiring`
 * with an HTTP client adapter; this re-export stays unchanged.
 */
export {
  createProfileAdapter,
  profileAdapter,
} from "@shared/wiring/profile-wiring";
export type { ProfileAdapterDeps } from "@shared/wiring/profile-wiring";
