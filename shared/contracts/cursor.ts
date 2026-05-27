/**
 * Opaque cursor standard for runtime list/feed/search pagination.
 *
 * Rule: PX-CURSOR-001 (ADR-013). Hot paths use opaque cursors carrying a stable
 * sort key + tie-breaker id — never offset pagination. base64url, no dependency.
 */
import type { DomainError, Result } from "./result";
import { err, ok } from "./result";

export interface OpaqueCursorPayload {
  /** Tie-breaker id of the last returned row (stable order). */
  lastId: string;
  /** Primary sort rank of the last returned row. */
  lastRank: string | number;
}

export type InvalidCursorError = DomainError<"INVALID_CURSOR">;

type Base64Globals = {
  Buffer?: {
    from(data: string, encoding: string): { toString(encoding: string): string };
  };
  btoa?: (data: string) => string;
  atob?: (data: string) => string;
};

function base64UrlEncode(input: string): string {
  const g = globalThis as Base64Globals;
  if (g.Buffer) {
    return g.Buffer.from(input, "utf-8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = g.btoa ? g.btoa(binary) : "";
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const g = globalThis as Base64Globals;
  if (g.Buffer) {
    return g.Buffer.from(input, "base64url").toString("utf-8");
  }
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = g.atob ? g.atob(b64) : "";
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeOpaqueCursor(payload: OpaqueCursorPayload): string {
  return base64UrlEncode(
    JSON.stringify({ lastId: payload.lastId, lastRank: payload.lastRank }),
  );
}

export function decodeOpaqueCursor(
  cursor: string,
): Result<OpaqueCursorPayload, InvalidCursorError> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecode(cursor));
  } catch {
    return err({ code: "INVALID_CURSOR", message: "Cursor is not decodable" });
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as OpaqueCursorPayload).lastId !== "string"
  ) {
    return err({ code: "INVALID_CURSOR", message: "Cursor payload is malformed" });
  }

  const rank = (parsed as OpaqueCursorPayload).lastRank;
  if (typeof rank !== "string" && typeof rank !== "number") {
    return err({ code: "INVALID_CURSOR", message: "Cursor rank is malformed" });
  }

  return ok({ lastId: (parsed as OpaqueCursorPayload).lastId, lastRank: rank });
}
