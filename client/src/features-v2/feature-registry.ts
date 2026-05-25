/**
 * PlatformaX V2 — Feature Registry (code)
 *
 * Source of truth for known V2 frontend feature domains.
 * Guards use this to validate feature folders.
 */

export interface FeatureEntry {
  name: string;
  status: string;
  hasDomainLogic: boolean;
}

export const FEATURE_REGISTRY: FeatureEntry[] = [
  { name: "identity", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "social", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "communities-v2", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "content-v2", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "channels", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "chat", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "events", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "modules", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "public-hub", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "notifications", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "media", status: "PARTIAL", hasDomainLogic: true },
  { name: "search", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "moderation", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "audit", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "system", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
  { name: "shared-ui", status: "SCAFFOLD_ONLY", hasDomainLogic: false },
];

export const KNOWN_FEATURE_NAMES = FEATURE_REGISTRY.map((f) => f.name);
