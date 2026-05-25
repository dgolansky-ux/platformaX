import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GUARDS = [
  "check-fake-done.mjs",
  "check-domain-status.mjs",
  "check-no-legacy-imports.mjs",
  "check-removed-product-areas.mjs",
  "audit-domain-boundaries.mjs",
  "check-test-env-safety.mjs",
  "check-env-safety.mjs",
  "check-public-dto-pii.mjs",
  "check-media-base64.mjs",
  "check-pagination.mjs",
  "check-file-complexity.mjs",
  "check-build-artifacts.mjs",
  "check-supabase-migrations-safety.mjs",
  "check-domain-registry.mjs",
  "check-domain-scaffold.mjs",
  "check-feature-registry.mjs",
  "check-secret-scan.mjs",
  "check-review-reports-index.mjs",
  "check-pre-commit-decision.mjs",
  "validate-bundle.mjs --smoke",
];

let failed = 0;
const results = [];

for (const guardCmd of GUARDS) {
  const parts = guardCmd.split(" ");
  const guardFile = parts[0];
  const args = parts.slice(1).join(" ");
  const script = join(__dirname, guardFile);
  const cmd = `node "${script}"${args ? " " + args : ""}`;

  try {
    const output = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    console.log(`  PASS  ${guardCmd}`);
    results.push({ guard: guardCmd, status: "PASS" });
  } catch (err) {
    console.error(`  FAIL  ${guardCmd}`);
    if (err.stderr) console.error(err.stderr);
    if (err.stdout) console.error(err.stdout);
    results.push({ guard: guardCmd, status: "FAIL" });
    failed++;
  }
}

console.log("");
if (failed > 0) {
  console.error(`rules-check: ${failed}/${GUARDS.length} guard(s) FAILED`);
  process.exit(1);
}

console.log("RULES_CHECK_PASS");
console.log("L2_GUARD_SCRIPTS_READY");
