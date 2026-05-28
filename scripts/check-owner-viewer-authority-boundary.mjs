// PX-OWN-001 / PX-OWN-002 — owner / viewer / authority boundary.
//
// Public service signatures in the server domain boundary must name their
// parameters so that the authority and the viewer can never be confused:
//
//   * Owner-gated write commands take a non-null `currentUserId` / `actorId`
//     / `ownerUserId` — never an opaque `userId: string` field.
//   * Public read paths take `viewerUserId: UserId | null` (anonymous viewer
//     allowed), NEVER `viewerUserId: string` without the `| null` union.
//
// Scope: `server/domains-v2/**/service.ts` only. Application-v2 services are
// the transport edge (asUserId/asMediaAssetId casts happen inside) and stay
// out of scope.
//
// Exemptions:
//   - DTO transport types (`id: string` field syntax in `dto.ts`) — different
//     guard (PX-DTO-001).
//   - Tests (`__tests__/`).
//
// Failure modes (any of these makes the guard fail closed):
//   1. A public service method with `userId: string` and no `currentUserId`,
//      `actorId`, or `ownerUserId` companion name.
//   2. A `viewerId: string` parameter without the `| null` union — viewer
//      reads must be honest about anonymous access.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();

const PARAM_RE = /(\w+)\s*:\s*((?:[A-Za-z0-9_<>\s]|\|)+?)(?=[,)\n])/g;

const OWNER_AUTHORITY_NAMES = new Set([
  "currentUserId",
  "actorId",
  "ownerUserId",
  "profileUserId",
]);

function extractInterfaceBodies(src) {
  const bodies = [];
  const re = /export\s+interface\s+(\w+Service)\s*\{/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const name = m[1];
    const start = m.index + m[0].length;
    let depth = 1;
    let end = start;
    for (let i = start; i < src.length; i++) {
      const ch = src[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (depth === 0) bodies.push({ name, body: src.slice(start, end) });
  }
  return bodies;
}

export function evaluateBlock(blockSrc) {
  const violations = [];
  let m;
  const re = new RegExp(PARAM_RE.source, "g");
  while ((m = re.exec(blockSrc)) !== null) {
    const name = m[1];
    const type = m[2].replace(/\s+/g, " ").trim();

    // 1. Anonymous `userId: string` (or `string | null`) without an authority
    //    name. Names like currentUserId / actorId / ownerUserId / profileUserId
    //    make the role explicit.
    if (
      name === "userId" &&
      !OWNER_AUTHORITY_NAMES.has(name) &&
      (type === "string" || type === "string | null")
    ) {
      violations.push(
        `anonymous parameter "userId: ${type}" — rename to currentUserId / actorId / ownerUserId / profileUserId`,
      );
    }

    // 2. Viewer reads must be honest about anonymous viewers.
    if (
      (name === "viewerId" || name === "viewerUserId") &&
      type === "string" // missing `| null`
    ) {
      violations.push(
        `viewer parameter "${name}: string" — must be "UserId | null" (anonymous viewer is a real case)`,
      );
    }
  }
  return violations;
}

function main() {
  const files = listSourceFiles({
    cwd: ROOT,
    roots: ["server/domains-v2"],
    extensions: [".ts"],
  }).filter((p) => /service\.ts$/.test(p) && !/__tests__\//.test(p));

  const allViolations = [];
  for (const file of files) {
    const src = readFileSync(file, "utf-8");
    const bodies = extractInterfaceBodies(src);
    for (const { name, body } of bodies) {
      const issues = evaluateBlock(body);
      for (const issue of issues) {
        allViolations.push(`${file} :: ${name} :: ${issue}`);
      }
    }
  }

  if (allViolations.length > 0) {
    for (const v of allViolations) console.error(`OWNER_VIEWER_AUTHORITY_VIOLATION: ${v}`);
    console.error(`\ncheck-owner-viewer-authority-boundary: ${allViolations.length} violation(s)`);
    process.exit(1);
  }
  console.log("CHECK_OWNER_VIEWER_AUTHORITY_BOUNDARY_PASS");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
