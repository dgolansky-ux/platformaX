/**
 * modules — the whitelisted module definitions (reference data). These define
 * slots only; the real module data lives in the owner domains. No PII.
 */
import type { ModuleDefinitionDTO } from "./dto";

export const MODULE_DEFINITIONS: readonly ModuleDefinitionDTO[] = [
  { key: "topics", name: "Tematy", description: "Tematyczne sekcje treści.", allowedOwnerTypes: ["profile", "community"], status: "active", order: 1 },
  { key: "events", name: "Wydarzenia", description: "Wydarzenia i RSVP (bez płatności).", allowedOwnerTypes: ["community"], status: "active", order: 2 },
  { key: "integrations", name: "Integracje", description: "Proste linki/integracje zewnętrzne.", allowedOwnerTypes: ["profile", "community"], status: "active", order: 3 },
  { key: "newsletter_chat", name: "Newsletter / czat", description: "Kanał broadcast/newsletter.", allowedOwnerTypes: ["community"], status: "active", order: 4 },
  { key: "channel_entry", name: "Kanały", description: "Wejście do kanałów społeczności.", allowedOwnerTypes: ["community"], status: "active", order: 5 },
] as const;
