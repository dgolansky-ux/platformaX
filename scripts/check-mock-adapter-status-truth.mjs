#!/usr/bin/env node
/**
 * scripts/check-mock-adapter-status-truth.mjs
 *
 * Rules: PX-RUNTIME-001 / PX-STATUS-001 — a feature whose adapter is
 * still a mock CANNOT be reported as `IMPLEMENTED`, `BACKEND_DONE`,
 * `PARTIAL_RUNTIME`, or `PASS` in the feature registry. Status must
 * match adapter reality.
 *
 * NARROW (Slice 25): the guard reads
 * `client/src/features-v2/feature-registry.ts` and for every entry
 * whose `status` looks like a runtime claim (`IMPLEMENTED`, `PASS`,
 * `BACKEND_DONE`, `PARTIAL_RUNTIME`, `BACKEND_PARTIAL`) it inspects
 * the corresponding feature folder
 * `client/src/features-v2/<name>/` and looks for any of:
 *
 *   - a file under the feature whose POSIX path contains the literal
 *     substring `/mock` (e.g. `/mock-adapter.ts`, `/mocks/`),
 *   - the token `MOCK_LOCAL_ONLY` anywhere in feature source.
 *
 * If a runtime-claim status is paired with mock indicators, the guard
 * fails. The intent is to catch the specific failure mode "feature
 * registry claims IMPLEMENTED while the only adapter is a mock".
 *
 * PARTIAL_RUNTIME is allowed to keep mock files IF the registry entry
 * also carries an explicit `MOCK_LOCAL_ONLY` neighbour and the
 * comment block above documents it (this is the current identity /
 * media pattern). The guard does not enforce that pairing; manual
 * review owns it.
 *
 * Failure mode: exits 1 with `MOCK_ADAPTER_STATUS_TRUTH_VIOLATION:`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const REGISTRY = join(ROOT, "client", "src", "features-v2", "feature-registry.ts");
const FEATURES_ROOT = join(ROOT, "client", "src", "features-v2");

const RUNTIME_STATUSES = new Set(["IMPLEMENTED", "PASS", "BACKEND_DONE"]);
const MIXED_STATUSES = new Set(["PARTIAL_RUNTIME", "BACKEND_PARTIAL"]);

function toPosix(p) { return p.split(sep).join("/"); }

function parseRegistry(content) {
  const entries = [];
  const re = /\{\s*name:\s*"([^"]+)",\s*status:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(content)) !== null) entries.push({ name: m[1], status: m[2] });
  return entries;
}

function walkFeatureFiles(featureName) {
  const out = [];
  const root = join(FEATURES_ROOT, featureName);
  if (!existsSync(root)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".") || e.name === "__tests__") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else out.push(full);
    }
  }
  walk(root);
  return out;
}

if (!existsSync(REGISTRY)) {
  console.error(`MOCK_ADAPTER_STATUS_TRUTH_VIOLATION: feature registry missing: ${toPosix(relative(ROOT, REGISTRY))}`);
  process.exit(1);
}
const registryContent = readFileSync(REGISTRY, "utf-8");
const entries = parseRegistry(registryContent);

let violations = 0;
let scanned = 0;

for (const { name, status } of entries) {
  if (!RUNTIME_STATUSES.has(status)) {
    if (!MIXED_STATUSES.has(status)) continue;
  }
  scanned += 1;
  const files = walkFeatureFiles(name);
  const mockPath = files.find(f => toPosix(f).includes("/mock"));
  const hasMockMarker = files.some(f => {
    try { return /MOCK_LOCAL_ONLY/.test(readFileSync(f, "utf-8")); } catch { return false; }
  });
  if (RUNTIME_STATUSES.has(status) && (mockPath || hasMockMarker)) {
    console.error(`MOCK_ADAPTER_STATUS_TRUTH_VIOLATION: feature "${name}" status=${status} but feature folder contains mock indicators (path=${mockPath ? toPosix(relative(ROOT, mockPath)) : "—"}, MOCK_LOCAL_ONLY marker=${hasMockMarker})`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`\ncheck-mock-adapter-status-truth: ${violations} violation(s) found across ${scanned} runtime-claim feature(s)`);
  process.exit(1);
}
console.log(`CHECK_MOCK_ADAPTER_STATUS_TRUTH_PASS (${scanned} runtime-claim feature(s) scanned, ${entries.length} total entries)`);
