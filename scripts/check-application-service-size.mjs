// PX-CODE-001 (application boundary) — application service size cap.
//
// Application services orchestrate flows; they accumulate cross-domain
// concerns fast and turn into god-services if not split. This guard caps
// `server/application-v2/**/service.ts` at 280 lines (soft limit) and fails
// when the cap is exceeded without an explicit `PLATFORMAX_EXCEPTION` block.
//
// The cap is tight on purpose: composition helpers (view composer, error
// mapper, request-context plumbing) belong in their own files. The 280-line
// cap means a fresh use-case forces the author to split rather than absorb.
//
// Exceptions:
//   - Include a `PLATFORMAX_EXCEPTION` block with Why / Risk / Removal plan
//     in the same file. The guard then passes for that file.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();
export const APPLICATION_SERVICE_LINE_CAP = 280;

export function evaluate(file, src) {
  const lines = src.split(/\r?\n/).length;
  if (lines <= APPLICATION_SERVICE_LINE_CAP) return null;
  const hasException = /PLATFORMAX_EXCEPTION/.test(src);
  if (hasException) return null;
  return `${file}: ${lines} lines (cap ${APPLICATION_SERVICE_LINE_CAP}) — split into composer / error-mapper / smaller use-case, or add a PLATFORMAX_EXCEPTION block`;
}

function main() {
  const files = listSourceFiles({
    cwd: ROOT,
    roots: ["server/application-v2"],
    extensions: [".ts"],
  }).filter((p) => /service\.ts$/.test(p) && !/__tests__\//.test(p));

  const violations = [];
  for (const file of files) {
    const src = readFileSync(file, "utf-8");
    const v = evaluate(file, src);
    if (v) violations.push(v);
  }

  if (violations.length > 0) {
    for (const v of violations) console.error(`APPLICATION_SERVICE_SIZE_VIOLATION: ${v}`);
    console.error(`\ncheck-application-service-size: ${violations.length} violation(s)`);
    process.exit(1);
  }
  console.log("CHECK_APPLICATION_SERVICE_SIZE_PASS");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
