/**
 * Result / DomainError boundary contract.
 *
 * Rule: PX-ERROR-001 (ADR-012 — branded IDs and Result boundary).
 * Domain public boundaries return a typed Result for expected failures instead
 * of throwing. No runtime dependencies.
 */

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface DomainError<Code extends string = string> {
  code: Code;
  message: string;
  /** Optional field-level validation map. Safe for UI display (no PII). */
  fields?: Record<string, string>;
}

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function err<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { ok: true; value: T } {
  return result.ok;
}
