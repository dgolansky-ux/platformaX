/**
 * Minimal nominal "brand" type helper.
 *
 * Rule: PX-ID-001 (ADR-012 — branded IDs at domain boundaries).
 * A `Brand<T, Name>` is structurally `T` at runtime but distinct at the type
 * level, so a `UserId` cannot be passed where a `MediaAssetId` is expected.
 * No runtime cost — the brand exists only in the type system.
 */

declare const __brand: unique symbol;

export type Brand<T, Name extends string> = T & {
  readonly [__brand]: Name;
};
