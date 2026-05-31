/**
 * public-hub — contracts
 *
 * public-hub is a COMPOSITION_DOMAIN: it owns no source-of-truth data. It reads
 * already-public summaries through these resolver ports, which the application
 * layer implements on top of the owner domains' public-api (identity,
 * communities-v2, modules). Keeping them here (not in ports.ts) makes the
 * integration surface importable by the application layer.
 */
import type { HubOwnerSummary } from "./dto";

/** Resolves an already-public owner summary, or null if absent/not visible. */
export interface HubOwnerResolver {
  getProfileSummary(ownerId: string): Promise<HubOwnerSummary | null>;
  getCommunitySummary(ownerId: string): Promise<HubOwnerSummary | null>;
}

/** Resolves the enabled module keys for an owner. */
export interface HubModulesResolver {
  listEnabledModuleKeys(ownerType: "profile" | "community", ownerId: string): Promise<string[]>;
}
