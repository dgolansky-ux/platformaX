import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { validateAuditZipEntries } from "../validate-audit-zip.mjs";

function baseOkEntries() {
  return [
    ".claude/settings.example.json",
    ".env.test.example",
    "docs/governance/README.md",
    "docs/architecture/PlatformaX-V2-coding-standards.md",
    "server/domains-v2/identity/public-api.ts",
    "server/application-v2/README.md",
    "shared/contracts/request-context.ts",
    "scripts/create-evidence-zip.mjs",
  ];
}

describe("validate-audit-zip: entry validation", () => {
  it("FAIL: backslash path", () => {
    const ok = validateAuditZipEntries(
      [...baseOkEntries(), "docs\\governance\\README.md"],
      { requireEnvTestExample: true },
    );
    expect(ok).toBe(false);
  });

  it("FAIL: contains .claude/settings.local.json", () => {
    const ok = validateAuditZipEntries(
      [...baseOkEntries(), ".claude/settings.local.json"],
      { requireEnvTestExample: true },
    );
    expect(ok).toBe(false);
  });

  it("PASS: contains .claude/settings.example.json", () => {
    const ok = validateAuditZipEntries(baseOkEntries(), {
      requireEnvTestExample: true,
    });
    expect(ok).toBe(true);
  });

  it("FAIL: contains real .env", () => {
    const ok = validateAuditZipEntries([...baseOkEntries(), ".env"], {
      requireEnvTestExample: true,
    });
    expect(ok).toBe(false);
  });

  it("PASS: contains .env.test.example", () => {
    const ok = validateAuditZipEntries(baseOkEntries(), {
      requireEnvTestExample: true,
    });
    expect(ok).toBe(true);
  });

  it("FAIL: missing docs/governance", () => {
    const entries = baseOkEntries().filter((e) => !e.startsWith("docs/governance/"));
    const ok = validateAuditZipEntries(entries, { requireEnvTestExample: true });
    expect(ok).toBe(false);
  });
});

describe("validate-audit-zip: synthetic zip smoke", () => {
  it("PASS: validates entry names extracted from a zip", () => {
    const zip = new AdmZip();
    for (const name of baseOkEntries()) {
      zip.addFile(name, Buffer.from("x"));
    }

    const entryNames = zip.getEntries().map((e) => e.entryName);
    expect(
      validateAuditZipEntries(entryNames, { requireEnvTestExample: true }),
    ).toBe(true);
  });
});

