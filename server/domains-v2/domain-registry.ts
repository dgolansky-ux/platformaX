/**
 * PlatformaX V2 — Domain Registry (code)
 *
 * Source of truth for known V2 domains.
 * Guards use this to validate domain folders and status.
 */

export type DomainType =
  | "OWNER_DOMAIN"
  | "COMPOSITION_DOMAIN"
  | "OPERATIONAL_DOMAIN";

export type DomainStatus =
  | "NOT_STARTED"
  | "SCAFFOLD_ONLY"
  | "UI_SHELL_ONLY"
  | "MOCK_LOCAL_ONLY"
  | "PARTIAL"
  | "IMPLEMENTED"
  | "BLOCKED"
  | "MANUAL_REVIEW_REQUIRED";

export interface DomainEntry {
  name: string;
  type: DomainType;
  status: DomainStatus;
  owns: string;
  doesNotOwn: string;
}

export const DOMAIN_REGISTRY: DomainEntry[] = [
  { name: "identity", type: "OWNER_DOMAIN", status: "PARTIAL", owns: "profile, auth subject, public/private profile DTO, professions", doesNotOwn: "feed, friendships, communities, posts" },
  { name: "social", type: "OWNER_DOMAIN", status: "PARTIAL", owns: "friends/contact graph, relationship state, contact access", doesNotOwn: "profile PII, posts, feed engine" },
  { name: "communities-v2", type: "OWNER_DOMAIN", status: "PARTIAL", owns: "community profile, members, roles, settings, invites, join requests, feed settings", doesNotOwn: "posts, comments, chat, events, modules" },
  { name: "content-v2", type: "OWNER_DOMAIN", status: "SCAFFOLD_ONLY", owns: "posts, feeds, comments, reactions, topics, read-models", doesNotOwn: "memberships, roles, profiles, friendships" },
  { name: "channels", type: "OWNER_DOMAIN", status: "PARTIAL", owns: "channel definitions, follows, settings", doesNotOwn: "messages, chat history, community roles, community membership" },
  { name: "chat", type: "OWNER_DOMAIN", status: "SCAFFOLD_ONLY", owns: "messages, conversations, read state, typing indicators", doesNotOwn: "channels, community roles, profiles" },
  { name: "events", type: "OWNER_DOMAIN", status: "SCAFFOLD_ONLY", owns: "event definitions, RSVPs, event lifecycle, visibility", doesNotOwn: "community membership, profiles, posts" },
  { name: "modules", type: "OWNER_DOMAIN", status: "PARTIAL", owns: "ModuleDefinition, registry, enablement", doesNotOwn: "actual module business data" },
  { name: "media", type: "OWNER_DOMAIN", status: "PARTIAL", owns: "media assets, upload contracts, validation, refs", doesNotOwn: "inline-encoded payloads (see ADR-006)" },
  { name: "public-hub", type: "COMPOSITION_DOMAIN", status: "SCAFFOLD_ONLY", owns: "composition/read view", doesNotOwn: "source-of-truth data" },
  { name: "notifications", type: "OPERATIONAL_DOMAIN", status: "SCAFFOLD_ONLY", owns: "notification delivery, templates, preferences", doesNotOwn: "content creation, profiles" },
  { name: "search", type: "OPERATIONAL_DOMAIN", status: "SCAFFOLD_ONLY", owns: "search indexing, query engine, relevance", doesNotOwn: "source data" },
  { name: "moderation", type: "OPERATIONAL_DOMAIN", status: "SCAFFOLD_ONLY", owns: "moderation rules, reports, actions, queues", doesNotOwn: "content creation" },
  { name: "audit", type: "OPERATIONAL_DOMAIN", status: "SCAFFOLD_ONLY", owns: "audit log, trail, events", doesNotOwn: "business logic" },
  { name: "system", type: "OPERATIONAL_DOMAIN", status: "SCAFFOLD_ONLY", owns: "health, config, feature flags, maintenance", doesNotOwn: "domain data" },
];

export const KNOWN_DOMAIN_NAMES = DOMAIN_REGISTRY.map((d) => d.name);
