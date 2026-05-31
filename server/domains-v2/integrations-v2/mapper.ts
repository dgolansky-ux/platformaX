/**
 * integrations-v2 — mapper. Internal DTO → public projection. No createdBy.
 */
import type { IntegrationDTO, IntegrationPublicDTO } from "./dto";

export function toIntegrationPublic(integration: IntegrationDTO): IntegrationPublicDTO {
  return {
    id: integration.id,
    ownerType: integration.ownerType,
    ownerId: integration.ownerId,
    kind: integration.kind,
    name: integration.name,
    url: integration.url,
    description: integration.description,
    visibility: integration.visibility,
    status: integration.status,
    updatedAt: integration.updatedAt,
  };
}
