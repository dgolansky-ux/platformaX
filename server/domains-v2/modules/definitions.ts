/**
 * modules — the whitelisted module definitions (reference data). These define
 * slots only; the real module data lives in the owner domains. No PII.
 *
 * allowedOwnerTypes deliberately stays broad — slice 10 may later recommend
 * restricting a module to one owner type, but enforcement happens via the
 * policy + service layer, not by removing entries here.
 */
import type { ModuleDefinitionDTO } from "./dto";

export const MODULE_DEFINITIONS: readonly ModuleDefinitionDTO[] = [
  {
    key: "topics",
    name: "Tematy",
    description: "Tematyczne sekcje treści.",
    allowedOwnerTypes: ["profile", "community"],
    status: "active",
    order: 1,
    category: "content",
    icon: "topics",
    defaultEnabled: false,
    visibilitySupport: ["public", "members_only", "private"],
  },
  {
    key: "events",
    name: "Wydarzenia",
    description: "Wydarzenia własne i wspólne (bez płatności).",
    allowedOwnerTypes: ["profile", "community"],
    status: "active",
    order: 2,
    category: "events",
    icon: "events",
    defaultEnabled: false,
    visibilitySupport: ["public", "members_only", "private"],
  },
  {
    key: "integrations",
    name: "Integracje",
    description: "Proste linki i odnośniki do zasobów zewnętrznych.",
    allowedOwnerTypes: ["profile", "community"],
    status: "active",
    order: 3,
    category: "integrations",
    icon: "integrations",
    defaultEnabled: false,
    visibilitySupport: ["public", "members_only", "private"],
  },
  {
    key: "newsletter_chat",
    name: "Newsletter chatowy",
    description: "Broadcast w stylu czatu — od właściciela do subskrybentów.",
    allowedOwnerTypes: ["profile", "community"],
    status: "active",
    order: 4,
    category: "broadcast",
    icon: "newsletter",
    defaultEnabled: false,
    visibilitySupport: ["public", "members_only", "private"],
  },
  {
    key: "channel_entry",
    name: "Kanały",
    description: "Wejście do kanałów społeczności.",
    allowedOwnerTypes: ["community"],
    status: "active",
    order: 5,
    category: "social",
    icon: "channels",
    defaultEnabled: false,
    visibilitySupport: ["public", "members_only"],
  },
] as const;
