/**
 * features-v2/media — runtime adapter (thin re-export boundary).
 *
 * The actual composition (wiring media service + in-memory repo + env-required
 * storage) lives in `@shared/wiring/media-wiring` — that is the only module
 * allowed to import `@server/*` factories. This file re-exports the public
 * surface so that `app-v2` never needs to reach into `@shared/wiring/` directly.
 *
 * When a real HTTP/RPC transport is wired, replace `@shared/wiring/media-wiring`
 * with an HTTP client adapter; this re-export stays unchanged.
 */
export {
  createMediaAdapter,
  mediaAdapter,
} from "@shared/wiring/media-wiring";
export type { MediaAdapterDeps } from "@shared/wiring/media-wiring";
