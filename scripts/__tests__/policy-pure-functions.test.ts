import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const FORBIDDEN_IMPORT_TOKENS = ["repository", "service", "router", "supabase"];
const FORBIDDEN_RUNTIME = [
  /\bfetch\s*\(/,
  /\bDate\.now\s*\(/,
  /\bnew\s+Date\s*\(/,
  /\bMath\.random\s*\(/,
  /\bprocess\.env\b/,
];

describe("policy purity", () => {
  it("PASS: the guard reports all policies pure", () => {
    const result = execSync(
      `node "${join(ROOT, "scripts/check-policy-pure-functions.mjs")}"`,
      { encoding: "utf-8" },
    );
    expect(result).toContain("CHECK_POLICY_PURE_FUNCTIONS_PASS");
  });

  it("identity + media policy.ts import no persistence/transport and do no IO", () => {
    for (const rel of [
      "server/domains-v2/identity/policy.ts",
      "server/domains-v2/media/policy.ts",
    ]) {
      const content = readFileSync(join(ROOT, rel), "utf-8");
      const imports = [...content.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
      for (const spec of imports) {
        for (const token of FORBIDDEN_IMPORT_TOKENS) {
          expect(spec.includes(token), `${rel} imports ${spec}`).toBe(false);
        }
      }
      for (const re of FORBIDDEN_RUNTIME) {
        expect(re.test(content), `${rel} performs IO`).toBe(false);
      }
    }
  });
});
