import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, test } from "vitest";

const ROOT = process.cwd();

// Tokens are assembled from parts so the forbidden literals never appear
// contiguously in this source file (which the env/secret guards also scan).
const SERVICE_ROLE_TOKEN = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");
const SERVICE_ROLE_LOWER = SERVICE_ROLE_TOKEN.toLowerCase();
const DB_URL_TOKEN = ["DATABASE", "URL"].join("_");
const PG_SCHEME = "postgresql" + "://";
const SDK_IMPORT = /(?:from|import)\s+["']@supabase\/supabase-js["']/;

const SUPABASE_CLIENT = "client/src/features-v2/identity/auth/supabase-client.ts";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function frontendSourceFiles(): string[] {
  return [
    ...walk(join(ROOT, "client/src/app-v2")),
    ...walk(join(ROOT, "client/src/features-v2")),
  ].map((f) => f.replace(/\\/g, "/"));
}

describe("frontend auth boundaries", () => {
  test("the Supabase SDK is imported only by the dedicated client module", () => {
    const offenders = frontendSourceFiles().filter((f) => {
      const rel = f.slice(f.indexOf("client/src/"));
      if (rel === SUPABASE_CLIENT) return false;
      return SDK_IMPORT.test(readFileSync(f, "utf-8"));
    });
    expect(offenders).toEqual([]);

    // sanity: the dedicated client really does import the SDK
    expect(SDK_IMPORT.test(readFileSync(join(ROOT, SUPABASE_CLIENT), "utf-8"))).toBe(true);
  });

  test("app-v2 auth screens never import the Supabase SDK directly", () => {
    const authScreens = frontendSourceFiles().filter((f) =>
      f.includes("client/src/app-v2/auth/") && f.endsWith(".tsx"),
    );
    expect(authScreens.length).toBeGreaterThan(0);
    for (const f of authScreens) {
      expect(SDK_IMPORT.test(readFileSync(f, "utf-8"))).toBe(false);
    }
  });

  test("no service-role key or database URL is referenced anywhere in the frontend", () => {
    for (const f of frontendSourceFiles()) {
      const content = readFileSync(f, "utf-8");
      expect(content.includes(SERVICE_ROLE_TOKEN)).toBe(false);
      expect(content.includes(SERVICE_ROLE_LOWER)).toBe(false);
      expect(content.includes(DB_URL_TOKEN)).toBe(false);
      expect(content.includes(PG_SCHEME)).toBe(false);
    }
  });

  test("the Supabase client reads only VITE_ public env vars", () => {
    const content = readFileSync(join(ROOT, SUPABASE_CLIENT), "utf-8");
    const envRefs = [...content.matchAll(/import\.meta\.env\.([A-Z0-9_]+)/g)].map(
      (m) => m[1],
    );
    expect(envRefs.length).toBeGreaterThan(0);
    for (const ref of envRefs) {
      expect(ref.startsWith("VITE_")).toBe(true);
    }
  });
});
