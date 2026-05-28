import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listSourceFiles } from "./lib/list-source-files.mjs";

let violations = 0;

const repoFiles = listSourceFiles({
  roots: ["scripts", "docs/governance"],
  extensions: [".mjs", ".md", ".yml"],
});

if (repoFiles.length === 0) {
  console.error("GUARD_PORTABILITY_VIOLATION: repo source scan returned zero files");
  violations++;
}

const tmp = mkdtempSync(join(tmpdir(), "px-guard-portability-"));
try {
  mkdirSync(join(tmp, "scripts"), { recursive: true });
  writeFileSync(join(tmp, "scripts/fake.mjs"), "export const ok = true;\n", "utf-8");

  const zipLikeFiles = listSourceFiles({
    cwd: tmp,
    roots: ["scripts"],
    extensions: [".mjs"],
  });

  if (!zipLikeFiles.includes("scripts/fake.mjs")) {
    console.error(
      "GUARD_PORTABILITY_VIOLATION: filesystem fallback failed in gitless fixture",
    );
    violations++;
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (violations > 0) {
  console.error(`\ncheck-guard-portability: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_GUARD_PORTABILITY_PASS");
