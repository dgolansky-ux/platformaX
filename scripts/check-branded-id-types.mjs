// PX-ID-001 — branded ID types guard.
//
// Rules:
//  1. shared/contracts/ids.ts must declare UserId/MediaAssetId/etc as `Brand<...>`,
//     not raw string aliases.
//  2. server/domains-v2/**/contracts.ts must not redeclare `export type <Name>Id = string`.
//     Allowed: re-exports of branded IDs from @shared/contracts/ids.
//  3. DTO/transport types (`id: string` field syntax) remain allowed — only
//     top-level `export type <Name>Id = string` aliases are flagged.

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();

const violations = [];

// Rule 1 — shared/contracts/ids.ts uses Brand<>
const idsPath = join(ROOT, "shared/contracts/ids.ts");
if (!existsSync(idsPath)) {
  violations.push("shared/contracts/ids.ts is missing");
} else {
  const src = readFileSync(idsPath, "utf-8");
  const aliasRe = /export\s+type\s+(\w+Id)\s*=\s*string(?:\s*;|$)/gm;
  let m;
  while ((m = aliasRe.exec(src)) !== null) {
    violations.push(`shared/contracts/ids.ts: "${m[1]}" is declared as raw string alias, must use Brand<string, "${m[1]}">`);
  }
  if (!/Brand</.test(src)) {
    violations.push("shared/contracts/ids.ts: no Brand<> usage detected — branded ids missing");
  }
}

// Rule 2 — domain contracts must not redeclare *Id as raw string alias
let files = [];
try {
  const out = execSync("git ls-files server/domains-v2", { cwd: ROOT, encoding: "utf-8" });
  files = out.split(/\r?\n/).filter((p) => p && /contracts\.ts$/.test(p));
} catch {
  // ignore
}

const ALLOW = new Set([
  // Transport DTOs that intentionally accept plain string ids at the boundary
  // can stay typed as `string`. The guard only inspects top-level *Id aliases.
]);

for (const file of files) {
  const src = readFileSync(join(ROOT, file), "utf-8");
  const aliasRe = /^\s*export\s+type\s+(\w+Id)\s*=\s*string\s*;?\s*$/gm;
  let m;
  while ((m = aliasRe.exec(src)) !== null) {
    const name = m[1];
    if (ALLOW.has(name)) continue;
    violations.push(
      `${file}: "export type ${name} = string" — redeclares an ID as raw string. Re-export from @shared/contracts/ids or use the branded type.`,
    );
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`BRANDED_ID_TYPES_VIOLATION: ${v}`);
  console.error(`\ncheck-branded-id-types: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_BRANDED_ID_TYPES_PASS");
