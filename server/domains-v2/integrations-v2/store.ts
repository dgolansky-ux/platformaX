/**
 * integrations-v2 — in-memory store. FOUNDATION_READY.
 */
import type { IntegrationDTO } from "./dto";

export interface IntegrationRepository {
  insert(integration: IntegrationDTO): Promise<void>;
  update(integration: IntegrationDTO): Promise<void>;
  getById(id: string): Promise<IntegrationDTO | null>;
  listForOwner(ownerType: string, ownerId: string): Promise<IntegrationDTO[]>;
}

export function createInMemoryIntegrationRepository(): IntegrationRepository {
  const byId = new Map<string, IntegrationDTO>();
  return {
    async insert(integration) {
      byId.set(integration.id, integration);
    },
    async update(integration) {
      byId.set(integration.id, integration);
    },
    async getById(id) {
      return byId.get(id) ?? null;
    },
    async listForOwner(ownerType, ownerId) {
      return [...byId.values()]
        .filter((i) => i.ownerType === ownerType && i.ownerId === ownerId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  };
}
