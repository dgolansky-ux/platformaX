// PX-ID-001 — service boundary branded IDs (extension of check-branded-id-types).
//
// `check-branded-id-types.mjs` covers type aliases. This guard additionally
// inspects public service signatures in the server boundary and fails when an
// authority/owner/asset id is declared as raw `string` (or `string | null`)
// without using the branded `UserId` / `MediaAssetId` types from
// `@shared/contracts/ids`.
//
// Scope:
//   - server/domains-v2/<domain>/service.ts
//   - server/application-v2/**/service.ts (application boundary)
//
// Inside `export interface <Name>Service { ... }`, every parameter whose name
// matches a known authority pattern (currentUserId, ownerUserId, viewerUserId,
// profileUserId, actorId, assetId, mediaAssetId) MUST be typed with a branded
// type or `<Brand> | null`, not raw `string` / `string | null`.
//
// Exemptions:
//   - server/application-v2/**/service.ts may accept raw `string` because it
//     is the transport boundary (asUserId/asMediaAssetId casts happen inside).
//     The guard reports such files as ADVISORY but does not fail.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();

// Names that semantically refer to a UserId.
const USER_ID_NAMES = new Set([
  "currentUserId",
  "ownerUserId",
  "viewerUserId",
  "profileUserId",
  "actorId",
  "userId",
]);

// Names that semantically refer to a MediaAssetId.
const MEDIA_ASSET_ID_NAMES = new Set(["assetId", "mediaAssetId"]);

const PARAM_RE = /(\w+)\s*:\s*((?:string|null|\s|\|)+)/g;

export function scanInterfaceBlock(blockSrc) {
  const violations = [];
  let m;
  while ((m = PARAM_RE.exec(blockSrc)) !== null) {
    const name = m[1];
    const type = m[2].replace(/\s+/g, " ").trim();
    if (USER_ID_NAMES.has(name)) {
      // Must be UserId or UserId | null — raw string/string|null is forbidden.
      if (type === "string" || type === "string | null" || type === "string|null") {
        violations.push({ name, type, expected: "UserId" });
      }
    } else if (MEDIA_ASSET_ID_NAMES.has(name)) {
      if (type === "string" || type === "string | null" || type === "string|null") {
        violations.push({ name, type, expected: "MediaAssetId" });
      }
    }
  }
  return violations;
}

function extractInterfaceBodies(src) {
  // Find `export interface <Name> { ... }` blocks (balanced braces).
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

function main() {
  const files = listSourceFiles({
    cwd: ROOT,
    roots: ["server/domains-v2", "server/application-v2"],
    extensions: [".ts"],
  }).filter((p) => /service\.ts$/.test(p));

  const violations = [];
  for (const file of files) {
    const isApplication = file.startsWith("server/application-v2/");
    const src = readFileSync(file, "utf-8");
    const bodies = extractInterfaceBodies(src);
    for (const { name, body } of bodies) {
      const found = scanInterfaceBlock(body);
      if (found.length === 0) continue;
      for (const v of found) {
        const message = `${file} :: interface ${name} :: "${v.name}: ${v.type}" — expected branded "${v.expected}" (PX-ID-001)`;
        if (isApplication) {
          // Application boundary is the transport edge; raw string is allowed.
          // Still report as advisory so reviewers see the boundary, but do not
          // fail the gate.
          console.warn(`SERVICE_BOUNDARY_BRANDED_IDS_ADVISORY: ${message}`);
        } else {
          violations.push(message);
        }
      }
    }
  }

  if (violations.length > 0) {
    for (const v of violations) console.error(`SERVICE_BOUNDARY_BRANDED_IDS_VIOLATION: ${v}`);
    console.error(`\ncheck-service-boundary-branded-ids: ${violations.length} violation(s)`);
    process.exit(1);
  }
  console.log("CHECK_SERVICE_BOUNDARY_BRANDED_IDS_PASS");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
