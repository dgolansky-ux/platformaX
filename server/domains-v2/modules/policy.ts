/**
 * modules — pure policy. Whitelist + owner-type validation only.
 */
import { MODULE_KEYS, type ModuleKey, type ModuleOwnerType } from "./dto";
import { MODULE_DEFINITIONS } from "./definitions";

export function isWhitelistedModuleKey(key: string): key is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(key);
}

export function definitionFor(key: ModuleKey) {
  return MODULE_DEFINITIONS.find((d) => d.key === key) ?? null;
}

/** A module may be enabled for an owner only if its definition allows that owner type. */
export function canEnableForOwnerType(key: ModuleKey, ownerType: ModuleOwnerType): boolean {
  const def = definitionFor(key);
  return !!def && def.status === "active" && def.allowedOwnerTypes.includes(ownerType);
}
