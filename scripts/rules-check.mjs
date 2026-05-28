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
  "check-file-size-limits.mjs",
  "check-build-artifacts.mjs",
  "check-supabase-migrations-safety.mjs",
  "check-domain-registry.mjs",
  "check-domain-scaffold.mjs",
  "check-feature-registry.mjs",
  "check-secret-scan.mjs",
  "check-review-reports-index.mjs",
  "check-pre-commit-decision.mjs",
  "check-self-audit-evidence.mjs",
  "validate-bundle.mjs --smoke",
  "check-code-quality-structure.mjs",
  "check-scalability-patterns.mjs",
  "check-frontend-performance-patterns.mjs",
  "check-status-truth-consistency.mjs",
  "check-dependency-discipline.mjs",
  "check-logging-pii-security.mjs",
  "check-governance-registry.mjs",
  "check-guards-registry.mjs",
  "check-rules-to-guards-coverage.mjs",
  "check-domain-status-registry.mjs",
  "check-ai-agent-permissions.mjs",
  "check-architecture-import-graph.mjs",
  "check-runtime-readiness-status.mjs",
  "check-migration-safety.mjs",
  "check-dependency-change-policy.mjs",
  "check-exception-expiry.mjs",
  "check-adr-required.mjs",
  "check-observability-logging.mjs",
  "check-dto-privacy-classification.mjs",
  "check-scalability-hot-paths.mjs",
  "check-governance-drift.mjs",
  // Runtime invariants code-alignment guards (step-50). Required + run in
  // pre-push/ci — must execute through rules-check so CI actually enforces them.
  "check-client-server-boundary.mjs",
  "check-presentational-container-boundary.mjs",
  "check-policy-pure-functions.mjs",
  "check-design-tokens.mjs",
  "check-media-purpose-migration.mjs",
  "check-deterministic-seeds.mjs",
  "check-event-envelope-contract.mjs",
  // Documentation guard for the mandatory successful-task finalization policy.
  "check-successful-task-finalization-docs.mjs",
  // Step-52 governance-map-enforcement guards (structural skeleton checks).
  "check-public-api-surface.mjs",
  "check-application-use-cases-boundary.mjs",
  "check-public-dto-contract-tests.mjs",
  "check-branded-id-types.mjs",
  "check-correlation-id-boundary.mjs",
  "check-backend-ownership-invariants.mjs",
  "check-read-model-single-owner.mjs",
  "check-idempotency-flows.mjs",
  "check-no-unsafe-randomness.mjs",
  // Hard architecture / domain-compliance guards (Opus pass).
  "check-service-boundary-branded-ids.mjs",
  "check-owner-viewer-authority-boundary.mjs",
  "check-owner-upload-intent-classification.mjs",
  "check-public-profile-id-exposure.mjs",
  "check-application-service-size.mjs",
  "check-no-placeholder-tests.mjs",
  "check-coding-standards-consistency.mjs",
  "validate-audit-zip.mjs --help",
  "check-guard-portability.mjs",
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
