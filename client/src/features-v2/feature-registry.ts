/**
 * PlatformaX V2 — Feature Registry (code)
 *
 * Source of truth for known V2 frontend feature domains.
 * Guards use this to validate feature folders.
 *
 * Status taxonomy (Slice 22A precision pass):
 *  - SCAFFOLD_ONLY    — folder placeholder, no UI, no adapter.
 *  - UI_SHELL_ONLY    — UI components exist but no mock/real adapter.
 *  - MOCK_LOCAL_ONLY  — full UI + complete in-memory mock adapter, no transport.
 *  - PARTIAL_RUNTIME  — some real boundary wired (e.g. Supabase Auth), rest mock.
 *  - BACKEND_PARTIAL  — server-side begun but incomplete.
 *  - DOC_ONLY         — only documentation in the repo.
 *  - GAP              — missing entirely.
 *  - BROKEN / DEAD_CODE — present but unusable / unused.
 *  - PASS             — production-ready end-to-end (reserved; nothing here yet).
 *
 * IMPORTANT: PASS is reserved for features with verified production runtime.
 * No V2 feature currently qualifies because no Supabase transport is wired.
 */

export interface FeatureEntry {
  name: string;
  status: string;
  hasDomainLogic: boolean;
}

export const FEATURE_REGISTRY: FeatureEntry[] = [
  // identity carries the Supabase Auth adapter (real boundary, env-gated) AND
  // the profile/onboarding adapter (in-memory, isPersistent:false) — see
  // client/src/features-v2/identity/README.md for the runtime breakdown.
  { name: "identity", status: "PARTIAL_RUNTIME", hasDomainLogic: true },
  // social: scaffolding for friends/contacts ports; contacts feature mounts
  // its own mock adapter under features-v2/social/contacts (treated as
  // MOCK_LOCAL_ONLY at the consumer surface).
  { name: "social", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "communities-v2", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  { name: "content-v2", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "channels", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  { name: "chat", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "events", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "modules", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  { name: "public-hub", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  { name: "notifications", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "notifications-v2", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  // media exposes the typed upload-intent adapter; storage backend is
  // env-required, so live uploads remain disabled by policy.
  { name: "media", status: "PARTIAL_RUNTIME", hasDomainLogic: true },
  { name: "search", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "moderation", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  { name: "audit", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "system", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "shared-ui", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "friend-feed", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  { name: "professional-profile", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  { name: "personal-profile", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  // Slice 17 — unified publishing system + post display kit.
  { name: "publishing", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  { name: "content-display", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
  // Slice 21 — central account management dashboard (13 sections).
  { name: "manage", status: "MOCK_LOCAL_ONLY", hasDomainLogic: false },
];

export const KNOWN_FEATURE_NAMES = FEATURE_REGISTRY.map((f) => f.name);
