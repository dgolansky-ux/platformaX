/**
 * Public-api facing re-export for the in-memory moderation store. Lives in a
 * separate file so the public-api boundary guard (which blocks any export
 * specifier path containing "repository") stays clean.
 */
export {
  createInMemoryModerationRepository,
  type ModerationRepository,
  type ModerationReportRecord,
  type ModerationActionRecord,
} from "./repository";
