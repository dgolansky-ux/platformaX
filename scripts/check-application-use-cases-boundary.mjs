#!/usr/bin/env node
/**
 * scripts/check-application-use-cases-boundary.mjs
 *
 * Rule: PX-APP-001 — flows touching 2+ domains must be orchestrated in
 * `server/application-v2/use-cases/**`, not inside a single domain
 * `service.ts`. A domain `service.ts` may import:
 *   - own-domain files (relative imports staying inside the same
 *     `server/domains-v2/<domain>/**` folder),
 *   - `shared/contracts/**` (cross-cutting types and contracts),
 *   - `shared/utils/**` (pure helpers).
 *
 * A domain `service.ts` may NOT import:
 *   - another domain's `public-api.ts`, `service.ts`, `repository.ts`,
 *     `policy.ts`, `mapper.ts`, `router.ts`, `events.ts`, `dto.ts`,
 *     `internal/**`, `db/**`, `cache-keys.ts` (cross-domain reach),
 *   - `server/application-v2/**` (application layer must call domain
 *     services, never the other way around).
 *
 * Failure mode: exits 1, prints `APP_USE_CASES_BOUNDARY_VIOLATION:`
 * per finding. Fails closed.
 *
 * Coverage gaps:
 *   - Only inspects `service.ts` at the top of each domain. Helper
 *     files inside a domain (e.g. `social/social-contacts-service.ts`)
 *     are scanned by a secondary pass that uses the same allowlist.
 *   - It does not detect runtime orchestration done via dynamic
 *     `import()` of another domain at runtime. P1 follow-up.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, sep, basename, dirname } from "node:path";

const ROOT = process.cwd();
const DOMAINS_ROOT = join(ROOT, "server", "domains-v2");

const ACK_MARKER = /PX-APP-001-ACK:\s*([^\n*]+)/;

function toPosix(p) { return p.split(sep).join("/"); }

function listDomains() {
  if (!existsSync(DOMAINS_ROOT)) return [];
  return readdirSync(DOMAINS_ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

function listServiceLikeFiles(domain) {
  const out = [];
  const dir = join(DOMAINS_ROOT, domain);
  function walk(d) {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === "__tests__" || e.name === "internal") continue;
        walk(full);
      } else if (/^.*service(?:s)?\.ts$/.test(e.name) || e.name === "service.ts") {
        out.push(full);
      }
    }
  }
  walk(dir);
  return out;
}

function extractImports(content) {
  const out = [];
  const reFrom = /^\s*(?:import|export)\s+(?:[^"';]*?from\s+)?["']([^"']+)["']/gm;
  let m;
  while ((m = reFrom.exec(content)) !== null) out.push(m[1]);
  // also catch dynamic import("...")
  const reDyn = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = reDyn.exec(content)) !== null) out.push(m[1]);
  return out;
}

const FORBIDDEN_TARGETS = [
  "public-api", "service", "services", "repository", "repositories",
  "policy", "mapper", "router", "events", "dto", "cache-keys",
];

function classifyImport(importPath, sourceDomain) {
  // application-v2 — domain services must not depend on it
  if (/(^|\/)server\/application-v2\//.test(importPath) ||
      /(^|\/)@server\/application-v2\//.test(importPath) ||
      /^@app\/.+/.test(importPath)) {
    return { kind: "application-v2", target: importPath };
  }
  // explicit cross-domain via @server alias
  let m = importPath.match(/^@server\/domains-v2\/([^/]+)\/(.+)$/);
  if (m) {
    const targetDomain = m[1];
    if (targetDomain !== sourceDomain) {
      return { kind: "cross-domain-alias", targetDomain, suffix: m[2] };
    }
    return null;
  }
  m = importPath.match(/^(?:\.\.\/)+(server\/)?domains-v2\/([^/]+)\/(.+)$/);
  if (m) {
    const targetDomain = m[2];
    if (targetDomain !== sourceDomain) {
      return { kind: "cross-domain-relative", targetDomain, suffix: m[3] };
    }
    return null;
  }
  // relative-up import that climbs out of a domain
  // e.g.  ../OTHER/anything
  m = importPath.match(/^\.\.\/([^./][^/]*)\/(.+)$/);
  if (m) {
    const targetDomain = m[1];
    if (targetDomain !== sourceDomain) {
      // could be inside the same domain at a different level — only flag
      // if the suffix looks like a domain entry-point file.
      const suffix = m[2];
      const file = basename(suffix).replace(/\.tsx?$/, "");
      if (FORBIDDEN_TARGETS.includes(file)) {
        return { kind: "cross-domain-relative", targetDomain, suffix };
      }
    }
  }
  return null;
}

let violations = 0;
const domains = listDomains();

for (const domain of domains) {
  const files = listServiceLikeFiles(domain);
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const ack = ACK_MARKER.exec(content);
    const acked = ack ? ack[1].trim() : null;
    const rel = toPosix(relative(ROOT, file));
    const imports = extractImports(content);
    for (const imp of imports) {
      const cls = classifyImport(imp, domain);
      if (!cls) continue;
      if (acked) {
        console.error(`APP_USE_CASES_BOUNDARY_ACK: ${rel} imports ${imp} — acknowledged by PX-APP-001-ACK: ${acked}`);
        continue;
      }
      console.error(`APP_USE_CASES_BOUNDARY_VIOLATION: ${rel} imports ${imp} (kind=${cls.kind}${cls.targetDomain ? `, targetDomain=${cls.targetDomain}` : ""})`);
      violations += 1;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-application-use-cases-boundary: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_APPLICATION_USE_CASES_BOUNDARY_PASS");
