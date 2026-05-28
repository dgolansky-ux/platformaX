/**
 * Architecture tests — PlatformaX V2
 *
 * Runs PARALLEL_WITH_TOOLING with the custom regex guards
 * (audit-domain-boundaries.mjs, check-architecture-import-graph.mjs,
 * check-no-legacy-imports.mjs). These tests express the same invariants as
 * executable Vitest specs so a refactor that breaks an architectural rule
 * fails the test suite — not just the regex guard CI step.
 *
 * The tool surface is intentionally minimal: we walk the working tree and
 * parse `import` / `from "…"` statements with a small regex helper, so the
 * test file is self-contained and survives toolchain drift. tsarch is
 * available in devDependencies but its Jest matcher integration does not
 * round-trip cleanly to Vitest — we keep tsarch reserved for cycle / slice
 * exploration via the spike's dependency-cruiser graph instead.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

function walk(dir: string, ext: RegExp): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "coverage", "__tests__"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, ext));
    else if (ext.test(entry.name)) out.push(full);
  }
  return out;
}

function readImports(file: string): string[] {
  const content = readFileSync(file, "utf-8");
  const out: string[] = [];
  const re = /\b(?:import|export)\b[^;]*?\bfrom\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content)) !== null) out.push(m[1]);
  // dynamic import("...")
  const dyn = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dyn.exec(content)) !== null) out.push(m[1]);
  // side-effect import "..." (no `from`) — must not be silently skipped,
  // otherwise `import "../../../server/..."` would bypass the gate.
  const side = /^\s*import\s+["']([^"']+)["']\s*;?\s*$/gm;
  while ((m = side.exec(content)) !== null) out.push(m[1]);
  return out;
}

const toPosix = (p: string) => p.replace(/\\/g, "/");
const isRelative = (s: string) => s.startsWith(".") || s.startsWith("/");

const DOMAINS_ROOT = "server/domains-v2";

function domainOfFile(rel: string): string | null {
  const p = toPosix(rel);
  const m = p.match(/^server\/domains-v2\/([^/]+)\//);
  return m ? m[1] : null;
}

function domainOfSpec(rel: string): string | null {
  const m = rel.match(/^server\/domains-v2\/([^/]+)\//);
  return m ? m[1] : null;
}

describe("architecture: V2 invariants", () => {
  it("client/* never imports server/* (PX-ARCH-001 / PX-ARCH-009)", () => {
    const offenders: string[] = [];
    for (const file of walk(join(ROOT, "client/src"), /\.(ts|tsx)$/)) {
      const rel = toPosix(relative(ROOT, file));
      for (const spec of readImports(file)) {
        if (spec.startsWith("@server/") || spec.startsWith("server/")) {
          offenders.push(`${rel} -> ${spec}`);
        }
        if (isRelative(spec)) {
          const resolved = toPosix(join(rel, "..", spec));
          if (/(^|\/)server\//.test(resolved)) offenders.push(`${rel} -> ${spec}`);
        }
      }
    }
    expect(offenders, `client -> server runtime imports:\n${offenders.join("\n")}`).toHaveLength(0);
  });

  it("server domains never reach another domain's internal modules (PX-ARCH-003 / PX-ARCH-004 / PX-DB-004)", () => {
    const violations: string[] = [];
    // Match both `…/repository.ts` and the extensionless import form
    // (`from "../media/repository"`) — TypeScript resolves both shapes.
    const INTERNAL_FILES = /\/(repository|service|policy|router|mapper|cache-keys)(\.ts)?$|\/internal\//;
    for (const file of walk(join(ROOT, DOMAINS_ROOT), /\.(ts|tsx)$/)) {
      const rel = toPosix(relative(ROOT, file));
      const fromDomain = domainOfFile(rel);
      if (!fromDomain) continue;
      for (const spec of readImports(file)) {
        if (!isRelative(spec)) continue;
        const target = toPosix(join(rel, "..", spec));
        const toDomain = domainOfSpec(target);
        if (!toDomain || toDomain === fromDomain) continue;
        if (INTERNAL_FILES.test(target)) {
          violations.push(`${rel} -> ${spec} (cross-domain into ${toDomain}'s internals)`);
        }
      }
    }
    expect(violations, `cross-domain internal imports:\n${violations.join("\n")}`).toHaveLength(0);
  });

  it("application-v2 is the only place that orchestrates 2+ domains (PX-APP-001)", () => {
    // Heuristic: a single domain's service should not import another domain's
    // public-api directly — that's an orchestration smell and belongs in
    // application-v2/use-cases. Reading another domain's contracts/events/dto
    // (type-only references) remains allowed.
    const violations: string[] = [];
    for (const file of walk(join(ROOT, DOMAINS_ROOT), /\.(ts|tsx)$/)) {
      const rel = toPosix(relative(ROOT, file));
      const fromDomain = domainOfFile(rel);
      if (!fromDomain) continue;
      // Only flag service.ts / repository.ts — README, public-api re-exports
      // and DTO mappers may reference cross-domain types without orchestrating.
      if (!/\/(service|repository)\.ts$/.test(rel)) continue;
      for (const spec of readImports(file)) {
        if (!isRelative(spec)) continue;
        const target = toPosix(join(rel, "..", spec));
        const toDomain = domainOfSpec(target);
        if (!toDomain || toDomain === fromDomain) continue;
        if (/\/public-api(\.ts)?$/.test(target)) {
          violations.push(`${rel} -> ${spec} (cross-domain public-api call from inside a domain — move to application-v2)`);
        }
      }
    }
    expect(violations, `cross-domain orchestration leaks:\n${violations.join("\n")}`).toHaveLength(0);
  });

  it("public-api.ts is the documented stable surface — domains expose it (PX-ARCH-003)", () => {
    const root = join(ROOT, DOMAINS_ROOT);
    if (!existsSync(root)) return;
    const missing: string[] = [];
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const publicApi = join(root, entry.name, "public-api.ts");
      if (!existsSync(publicApi)) missing.push(`${entry.name} has no public-api.ts`);
    }
    expect(missing, `missing public-api surfaces:\n${missing.join("\n")}`).toHaveLength(0);
  });

  it("shared/* is pure and does not import runtime (client or server) (PX-DTO-001)", () => {
    const offenders: string[] = [];
    for (const file of walk(join(ROOT, "shared"), /\.(ts|tsx)$/)) {
      const rel = toPosix(relative(ROOT, file));
      for (const spec of readImports(file)) {
        if (spec.startsWith("@client/") || spec.startsWith("@server/")) {
          offenders.push(`${rel} -> ${spec}`);
        }
        if (isRelative(spec)) {
          const target = toPosix(join(rel, "..", spec));
          if (/(^|\/)(client|server)\//.test(target)) {
            offenders.push(`${rel} -> ${spec}`);
          }
        }
      }
    }
    expect(offenders, `shared -> runtime imports:\n${offenders.join("\n")}`).toHaveLength(0);
  });

  it("no active code imports the legacy folders (PX-ARCH-001 / PX-ARCH-002)", () => {
    const offenders: string[] = [];
    const LEGACY = /(^|\/)(features|pages|components)\//;
    for (const file of [
      ...walk(join(ROOT, "client/src/app-v2"), /\.(ts|tsx)$/),
      ...walk(join(ROOT, "client/src/features-v2"), /\.(ts|tsx)$/),
      ...walk(join(ROOT, DOMAINS_ROOT), /\.(ts|tsx)$/),
      ...walk(join(ROOT, "server/application-v2"), /\.(ts|tsx)$/),
    ]) {
      const rel = toPosix(relative(ROOT, file));
      for (const spec of readImports(file)) {
        if (LEGACY.test(spec)) offenders.push(`${rel} -> ${spec}`);
      }
    }
    expect(offenders, `active V2 code reaching legacy folders:\n${offenders.join("\n")}`).toHaveLength(0);
  });
});
