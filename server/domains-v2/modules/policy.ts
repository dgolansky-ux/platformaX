/**
 * modules — pure policy. Whitelist + owner-type + visibility validation only.
 */
import {
  MODULE_KEYS,
  MODULE_VISIBILITIES,
  type ModuleKey,
  type ModuleOwnerType,
  type ModuleVisibility,
} from "./dto";
import { MODULE_DEFINITIONS } from "./definitions";

export function isWhitelistedModuleKey(key: string): key is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(key);
}

export function isModuleVisibility(value: string): value is ModuleVisibility {
  return (MODULE_VISIBILITIES as readonly string[]).includes(value);
}

export function definitionFor(key: ModuleKey) {
  return MODULE_DEFINITIONS.find((d) => d.key === key) ?? null;
}

/** A module may be enabled for an owner only if its definition allows that owner type. */
export function canEnableForOwnerType(key: ModuleKey, ownerType: ModuleOwnerType): boolean {
  const def = definitionFor(key);
  return !!def && def.status === "active" && def.allowedOwnerTypes.includes(ownerType);
}

/** Visibility must be one the module's definition declares supported. */
export function isVisibilitySupported(key: ModuleKey, visibility: ModuleVisibility): boolean {
  const def = definitionFor(key);
  return !!def && def.visibilitySupport.includes(visibility);
}

export function defaultVisibilityFor(key: ModuleKey): ModuleVisibility {
  const def = definitionFor(key);
  return def?.visibilitySupport[0] ?? "public";
}
