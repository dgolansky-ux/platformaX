/**
 * Branded domain ID types and constructors.
 *
 * Rule: PX-ID-001 (ADR-012). These are type-level brands only — constructors
 * are identity casts with no runtime validation or transformation. Validation
 * belongs at the transport boundary, not here.
 */
import type { Brand } from "./brand";

export type UserId = Brand<string, "UserId">;
/** Profile records are keyed by the owning user id. */
export type ProfileUserId = UserId;
export type MediaAssetId = Brand<string, "MediaAssetId">;
export type PostId = Brand<string, "PostId">;
export type CommunityId = Brand<string, "CommunityId">;
export type OutboxMessageId = Brand<string, "OutboxMessageId">;
export type IdempotencyKey = Brand<string, "IdempotencyKey">;

export const asUserId = (value: string): UserId => value as UserId;
export const asMediaAssetId = (value: string): MediaAssetId =>
  value as MediaAssetId;
export const asPostId = (value: string): PostId => value as PostId;
export const asCommunityId = (value: string): CommunityId =>
  value as CommunityId;
export const asOutboxMessageId = (value: string): OutboxMessageId =>
  value as OutboxMessageId;
export const asIdempotencyKey = (value: string): IdempotencyKey =>
  value as IdempotencyKey;
