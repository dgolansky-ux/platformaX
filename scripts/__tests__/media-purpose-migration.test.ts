import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

function codePurposes(): Set<string> {
  const dto = readFileSync(join(ROOT, "server/domains-v2/media/dto.ts"), "utf-8");
  const m = dto.match(/MediaPurpose\s*=\s*([^;]+);/);
  return new Set([...(m?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]));
}

function sqlPurposes(): Set<string> {
  const dir = join(ROOT, "supabase/migrations");
  const values = new Set<string>();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".sql")) continue;
    const content = readFileSync(join(dir, f), "utf-8");
    const m = content.match(/CHECK\s*\(\s*purpose\s+IN\s*\(([^)]*)\)/i);
    if (!m) continue;
    for (const v of m[1].matchAll(/'([^']+)'/g)) values.add(v[1]);
  }
  return values;
}

describe("media purpose vs migration CHECK", () => {
  it("PASS: MediaPurpose union matches the media_assets purpose CHECK", () => {
    const code = [...codePurposes()].sort();
    const sql = [...sqlPurposes()].sort();
    expect(code).toEqual(sql);
  });

  it("PASS: statusPhoto is present in both code and SQL", () => {
    expect(codePurposes().has("statusPhoto")).toBe(true);
    expect(sqlPurposes().has("statusPhoto")).toBe(true);
  });

  it("FAIL: a missing SQL value is detectable as drift", () => {
    const code = new Set(["avatar", "banner", "statusPhoto"]);
    const sql = new Set(["avatar", "banner"]);
    const missingInSql = [...code].filter((v) => !sql.has(v));
    expect(missingInSql).toContain("statusPhoto");
  });
});
