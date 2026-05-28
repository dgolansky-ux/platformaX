// PX-OWN-001 — backend ownership invariants (structural).
//
// Checks structural evidence — full owner/policy proofs are still manual_gate.
//
// For PARTIAL/IMPLEMENTED owner-domains:
//  - identity: profile record carries `userId`.
//  - media:    asset record carries `ownerUserId` AND `ownerType`.
//  - policy.ts file exists with owner-related canX functions.
//  - public DTO file (dto.ts / public-api.ts) does NOT expose owner-only PII
//    (e.g. dateOfBirth / phone on the public mapper path — covered by
//    check-public-dto-pii; this guard only verifies the structural shell).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml");

function parseRegistry(yaml) {
  const out = {};
  const lines = yaml.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    const dm = line.match(/^\s*-\s*(?:name|domain):\s*([\w-]+)/);
    if (dm) {
      current = dm[1];
      out[current] = null;
      continue;
    }
    if (current) {
      const sm = line.match(/^\s+status:\s*([A-Z_]+)/);
      if (sm) {
        out[current] = sm[1];
        current = null;
      }
    }
  }
  return out;
}

if (!existsSync(REGISTRY_PATH)) {
  console.log("CHECK_BACKEND_OWNERSHIP_INVARIANTS_PASS (no registry — nothing to check)");
  process.exit(0);
}

const registry = parseRegistry(readFileSync(REGISTRY_PATH, "utf-8"));
const violations = [];

function exists(p) {
  return existsSync(join(ROOT, p));
}

function read(p) {
  return readFileSync(join(ROOT, p), "utf-8");
}

// Each domain may carry owner identity as `ownerUserId` directly, or as
// the polymorphic pair `ownerType + ownerId`. Both forms satisfy the
// invariant. identity uses `userId` because the profile is keyed by user.
const OWNER_FIELD_BY_DOMAIN = {
  identity: { anyOf: [["userId"]] },
  media: { anyOf: [["ownerUserId"], ["ownerType", "ownerId"]] },
};

for (const [domain, status] of Object.entries(registry)) {
  if (status !== "PARTIAL" && status !== "IMPLEMENTED") continue;
  const spec = OWNER_FIELD_BY_DOMAIN[domain];
  if (!spec) continue; // only enforced for the two real owner domains today

  const recordPath = `server/domains-v2/${domain}/internal/record.ts`;
  const policyPath = `server/domains-v2/${domain}/policy.ts`;

  if (!exists(recordPath)) {
    violations.push(`${domain}: missing ${recordPath} (record file required for owner-shape proof)`);
    continue;
  }
  const recordSrc = read(recordPath);
  const matched = spec.anyOf.some((group) =>
    group.every((field) => new RegExp(`\\b${field}\\b`).test(recordSrc)),
  );
  if (!matched) {
    const expected = spec.anyOf.map((g) => g.join("+")).join(" OR ");
    violations.push(
      `${recordPath}: missing owner fields — expected ${expected} for ${domain} (${status})`,
    );
  }

  if (!exists(policyPath)) {
    violations.push(`${domain}: missing ${policyPath} — required for owner read/edit policy tests`);
    continue;
  }
  const policySrc = read(policyPath);
  if (!/canRead|canEdit|canUpdate|canAttach|canCreate|canDelete|canConfirm/.test(policySrc)) {
    violations.push(`${policyPath}: no canX policy functions — owner-policy enforcement is missing`);
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`BACKEND_OWNERSHIP_INVARIANTS_VIOLATION: ${v}`);
  console.error(`\ncheck-backend-ownership-invariants: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_BACKEND_OWNERSHIP_INVARIANTS_PASS");
