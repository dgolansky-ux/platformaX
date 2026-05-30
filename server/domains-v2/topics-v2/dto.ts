/**
 * topics-v2 — DTOs. Status: FOUNDATION_READY (in-memory).
 *
 * privacy classification: Public DTO — topic metadata. No PII. createdBy is a
 * stable user id (reference identifier), not a display identifier.
 */

export type TopicOwnerType = "profile" | "community";
export type TopicVisibility = "public" | "private" | "members_only";
export type TopicStatus = "active" | "archived";

export interface TopicDTO {
  id: string;
  ownerType: TopicOwnerType;
  ownerId: string;
  title: string;
  description: string;
  slug: string;
  visibility: TopicVisibility;
  status: TopicStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** Already-public projection. No createdBy / no internal fields. */
export interface TopicPublicDTO {
  id: string;
  ownerType: TopicOwnerType;
  ownerId: string;
  title: string;
  description: string;
  slug: string;
  visibility: TopicVisibility;
  status: TopicStatus;
  updatedAt: string;
}

export interface CreateTopicInput {
  ownerType: TopicOwnerType;
  ownerId: string;
  title: string;
  description: string;
  slug: string;
  visibility: TopicVisibility;
  createdByUserId: string;
}

export interface UpdateTopicInput {
  topicId: string;
  actorUserId: string;
  title?: string;
  description?: string;
  visibility?: TopicVisibility;
}

export const TOPIC_TITLE_MAX = 80;
export const TOPIC_DESCRIPTION_MAX = 280;
export const TOPIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TOPIC_SLUG_MAX = 40;
