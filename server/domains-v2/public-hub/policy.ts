/**
 * public-hub — domain policies
 *
 * Pure composition rules: which sections are visible given the owner type and
 * the set of enabled module keys. No data access, no side effects.
 */
import type { HubOwnerType, HubSectionKey } from "./dto";

const CHANNEL_MODULE_KEY = "channel_entry";

/**
 * Sections a hub exposes. "about" is always present. "modules" appears when any
 * module is enabled. "channels" is community-only and requires the channel_entry
 * module. "feed_preview" appears on profile hubs (presentation surface).
 */
export function visibleSections(
  ownerType: HubOwnerType,
  enabledModuleKeys: readonly string[],
): HubSectionKey[] {
  const sections: HubSectionKey[] = ["about"];
  if (enabledModuleKeys.length > 0) sections.push("modules");
  if (ownerType === "community" && enabledModuleKeys.includes(CHANNEL_MODULE_KEY)) {
    sections.push("channels");
  }
  if (ownerType === "profile") sections.push("feed_preview");
  return sections;
}
