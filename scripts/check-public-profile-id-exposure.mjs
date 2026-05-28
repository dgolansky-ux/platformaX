// PX-SEC-001 / PX-DTO-001 — public profile id exposure.
//
// `PublicProfileView` / `PublicProfileDTO` must NOT carry an opaque `userId`
// field. Either:
//   - rename to `profileUserId` AND mark with
//     `PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET` (Option A), or
//   - remove the field entirely and use `profileSlug` / `publicProfileId`
//     (Option B).
//
// The guard fails when:
//   1. `shared/contracts/profile-view.ts` declares `PublicProfileView` with
//      a `userId:` field (Option A not adopted, Option B not adopted).
//   2. Option A is adopted but the marker
//      `PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET` is missing from the file.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = process.cwd();
const PROFILE_VIEW = join(ROOT, "shared/contracts/profile-view.ts");

function blockOf(src, typeName) {
  // Find `export type <typeName> = { ... };` body.
  const re = new RegExp(`export\\s+type\\s+${typeName}\\s*=\\s*\\{`);
  const m = src.match(re);
  if (!m) return null;
  const start = (m.index ?? 0) + m[0].length;
  let depth = 1;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i);
    }
  }
  return null;
}

function main() {
  const violations = [];

  if (!existsSync(PROFILE_VIEW)) {
    violations.push("shared/contracts/profile-view.ts is missing");
  } else {
    const src = readFileSync(PROFILE_VIEW, "utf-8");
    const publicBlock = blockOf(src, "PublicProfileView");
    if (publicBlock) {
      const hasRawUserId = /^\s*userId\s*:\s*string/m.test(publicBlock);
      const hasProfileUserId = /^\s*profileUserId\s*:\s*string/m.test(publicBlock);
      const hasMarker = /PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET/.test(src);
      if (hasRawUserId) {
        violations.push(
          "PublicProfileView still declares `userId: string` — rename to `profileUserId` and mark with `PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET`, or remove the field entirely.",
        );
      } else if (hasProfileUserId && !hasMarker) {
        violations.push(
          "PublicProfileView uses `profileUserId` but the marker `PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET` is missing from shared/contracts/profile-view.ts.",
        );
      }
    }
    const ownerBlock = blockOf(src, "OwnerProfileView");
    if (ownerBlock) {
      const hasRawUserId = /^\s*userId\s*:\s*string/m.test(ownerBlock);
      if (hasRawUserId) {
        violations.push(
          "OwnerProfileView still declares `userId: string` — rename to `profileUserId` for consistency with PublicProfileView.",
        );
      }
    }
  }

  if (violations.length > 0) {
    for (const v of violations) console.error(`PUBLIC_PROFILE_ID_EXPOSURE_VIOLATION: ${v}`);
    console.error(`\ncheck-public-profile-id-exposure: ${violations.length} violation(s)`);
    process.exit(1);
  }
  console.log("CHECK_PUBLIC_PROFILE_ID_EXPOSURE_PASS");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
