#!/usr/bin/env node
/**
 * scripts/audit/validate-audit-zip.mjs — standalone ZIP validator.
 *
 * Usage: node scripts/audit/validate-audit-zip.mjs <path-to-zip>
 */
import AdmZip from "adm-zip";
import { existsSync, statSync } from "node:fs";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/audit/validate-audit-zip.mjs <path-to-zip>");
  process.exit(2);
}

if (!existsSync(arg)) {
  console.error(`ZIP not found: ${arg}`);
  process.exit(1);
}

const size = statSync(arg).size;
if (size === 0) {
  console.error("ZIP is empty.");
  process.exit(1);
}

const zip = new AdmZip(arg);
const entries = zip.getEntries().map((e) => e.entryName);

const checks = {
  exists: true,
  nonEmpty: size > 0,
  forwardSlashOnly: entries.every((e) => !e.includes("\\")),
  noGit: entries.every((e) => !e.startsWith(".git/") && !e.includes("/.git/")),
  noNodeModules: entries.every((e) => !e.includes("node_modules/")),
  noEnvFiles: entries.every((e) => {
    const m = /(^|\/)\.env(\.(.+))?$/.exec(e);
    if (!m) return true;
    const suffix = m[3] || "";
    return suffix === "example" || suffix === "test.example";
  }),
  noSecrets: entries.every((e) => !e.startsWith("secrets/") && !e.includes("/secrets/")),
  noClaudeLocal: entries.every((e) => !e.startsWith(".claude/")),
  hasEnvExample: entries.some((e) => e === ".env.example"),
  hasEnvTestExample: entries.some((e) => e === ".env.test.example"),
  hasGovernance: entries.some((e) => e.startsWith("docs/governance/")),
  hasArchitecture: entries.some((e) => e.startsWith("docs/architecture/")),
  hasReview: entries.some((e) => e.startsWith("docs/review/")),
  hasSource: entries.some((e) => e.startsWith("client/src/")) && entries.some((e) => e.startsWith("server/")),
};

const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

const result = {
  zip: arg,
  zipSizeBytes: size,
  entriesCount: entries.length,
  checks,
  failedChecks: failed,
  status: failed.length === 0 ? "PASS" : "FAIL",
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) process.exit(1);
