/**
 * shared/contracts/branded-ids — branded ID types for domain boundary safety.
 *
 * ADR-012 / PX-ID-001: raw `string` IDs at domain boundaries let a caller pass
 * the wrong identifier (e.g. a media asset id where a user id is expected) with
 * no compiler help. These branded aliases give nominal typing so the wrong id
 * is at least visible at call sites that opt in.
 *
 * The brand is intentionally OPTIONAL so existing `string` call sites keep
 * compiling during the incremental migration — a plain string remains assignable
 * to a branded id and vice versa. Use the `toX` constructors at trust boundaries
 * (auth layer, repository reads, test factories) to document where a raw string
 * becomes a typed id.
 */
declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]?: B };

export type UserId = Brand<string, "UserId">;
export type MediaAssetId = Brand<string, "MediaAssetId">;

/** Tag a raw string as a UserId at a trust boundary. */
export function toUserId(id: string): UserId {
  return id as UserId;
}

/** Tag a raw string as a MediaAssetId at a trust boundary. */
export function toMediaAssetId(id: string): MediaAssetId {
  return id as MediaAssetId;
}
