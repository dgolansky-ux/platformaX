/**
 * integrations-v2 — DTOs. Status: FOUNDATION_READY (in-memory).
 *
 * privacy classification: Public DTO — integration metadata + safe URLs.
 * No secrets, no tokens, no PII. createdBy is reference id, not display id.
 */

export type IntegrationOwnerType = "profile" | "community";
export type IntegrationVisibility = "public" | "private" | "members_only";
export type IntegrationStatus = "active" | "disabled";
export type IntegrationKind =
  | "external_link"
  | "website"
  | "social"
  | "embed_placeholder";

export interface IntegrationDTO {
  id: string;
  ownerType: IntegrationOwnerType;
  ownerId: string;
  kind: IntegrationKind;
  name: string;
  url: string;
  description: string | null;
  visibility: IntegrationVisibility;
  status: IntegrationStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationPublicDTO {
  id: string;
  ownerType: IntegrationOwnerType;
  ownerId: string;
  kind: IntegrationKind;
  name: string;
  url: string;
  description: string | null;
  visibility: IntegrationVisibility;
  status: IntegrationStatus;
  updatedAt: string;
}

export interface CreateIntegrationInput {
  ownerType: IntegrationOwnerType;
  ownerId: string;
  kind: IntegrationKind;
  name: string;
  url: string;
  description?: string | null;
  visibility: IntegrationVisibility;
  createdByUserId: string;
}

export interface UpdateIntegrationInput {
  integrationId: string;
  actorUserId: string;
  name?: string;
  url?: string;
  description?: string | null;
  visibility?: IntegrationVisibility;
}

export const INTEGRATION_NAME_MAX = 80;
export const INTEGRATION_DESCRIPTION_MAX = 280;
export const INTEGRATION_URL_MAX = 2048;
