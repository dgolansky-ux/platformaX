/**
 * public-hub — mapper. Assembles the composed HubViewModel from an owner summary
 * and the resolved enabled module keys. No PII passes through (owner summary is
 * already public).
 */
import type { HubModuleSummary, HubOwnerSummary, HubViewModel } from "./dto";
import { visibleSections } from "./policy";

export function toHubViewModel(
  owner: HubOwnerSummary,
  enabledModuleKeys: readonly string[],
): HubViewModel {
  const modules: HubModuleSummary[] = enabledModuleKeys.map((key) => ({ key, enabled: true }));
  return {
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
    owner,
    modules,
    sections: visibleSections(owner.ownerType, enabledModuleKeys),
  };
}
