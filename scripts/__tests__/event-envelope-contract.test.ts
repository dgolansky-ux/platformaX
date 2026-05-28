import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = process.cwd();
const GUARD = join(ROOT, "scripts/check-event-envelope-contract.mjs");

function runGuard(cwd: string) {
  try {
    const stdout = execSync(`node "${GUARD}"`, {
      encoding: "utf-8",
      cwd,
    });
    return { exitCode: 0, stdout, stderr: "" };
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string };
    return { exitCode: err.status, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

/** Stage a self-contained repo skeleton in tmp with a fake domain + status registry. */
function stageRepo(opts: {
  domainName: string;
  domainStatus: string;
  eventsSource: string;
}): string {
  const root = mkdtempSync(join(tmpdir(), "ev-contract-"));
  mkdirSync(join(root, `server/domains-v2/${opts.domainName}`), { recursive: true });
  mkdirSync(join(root, "docs/governance"), { recursive: true });
  writeFileSync(
    join(root, `server/domains-v2/${opts.domainName}/events.ts`),
    opts.eventsSource,
    "utf-8",
  );
  writeFileSync(
    join(root, "docs/governance/DOMAIN_STATUS_REGISTRY.yml"),
    [
      "domains:",
      "",
      `  - name: ${opts.domainName}`,
      `    type: OWNER_DOMAIN`,
      `    status: ${opts.domainStatus}`,
      "",
    ].join("\n"),
    "utf-8",
  );
  return root;
}

const GOOD_EVENT_SRC = `
import type { EventEnvelope } from "@shared/contracts/event-envelope";
import { createEventEnvelope } from "@shared/contracts/event-envelope";

export type FooPayload = { userId: string };

export type FooEvent = EventEnvelope<"identity.profile.public_summary_changed", FooPayload>;

export function fooEvent() {
  return createEventEnvelope({
    type: "identity.profile.public_summary_changed",
    actorId: null,
    payload: { userId: "u-1" },
  });
}
`;

describe("event-envelope contract guard", () => {
  it("PASS: real codebase satisfies the envelope contract", () => {
    const result = runGuard(ROOT);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_EVENT_ENVELOPE_CONTRACT_PASS");
  });

  it("SKIP: SCAFFOLD_ONLY domain is exempt", () => {
    const tmp = stageRepo({
      domainName: "ghost",
      domainStatus: "SCAFFOLD_ONLY",
      eventsSource: 'export const broken = { type: "bare", at: "now" };',
    });
    try {
      const result = runGuard(tmp);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("CHECK_EVENT_ENVELOPE_CONTRACT_PASS");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("FAIL: PARTIAL domain that does not import EventEnvelope", () => {
    const tmp = stageRepo({
      domainName: "thing",
      domainStatus: "PARTIAL",
      eventsSource: 'export const broken = { type: "thing.x.y" };',
    });
    try {
      const result = runGuard(tmp);
      expect(result.exitCode).toBe(1);
      expect(result.stderr + result.stdout).toContain(
        "does not import @shared/contracts/event-envelope",
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("FAIL: payload key carries PII", () => {
    const tmp = stageRepo({
      domainName: "leaky",
      domainStatus: "PARTIAL",
      eventsSource: GOOD_EVENT_SRC.replace(
        "export type FooPayload = { userId: string };",
        "export type FooPayload = { userId: string; email: string };",
      ),
    });
    try {
      const result = runGuard(tmp);
      expect(result.exitCode).toBe(1);
      expect(result.stderr + result.stdout).toContain('forbidden key "email"');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("FAIL: event type literal is not dot-namespaced", () => {
    const tmp = stageRepo({
      domainName: "naive",
      domainStatus: "PARTIAL",
      eventsSource: GOOD_EVENT_SRC.replace(
        /"identity\.profile\.public_summary_changed"/g,
        '"thing_happened"',
      ),
    });
    try {
      const result = runGuard(tmp);
      expect(result.exitCode).toBe(1);
      expect(result.stderr + result.stdout).toContain("non-namespaced event type");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("FAIL: payload exposes bare `at` field", () => {
    const tmp = stageRepo({
      domainName: "legacy",
      domainStatus: "PARTIAL",
      eventsSource: `
import type { EventEnvelope } from "@shared/contracts/event-envelope";
import { createEventEnvelope } from "@shared/contracts/event-envelope";

export type FooPayload = { userId: string; at: string };

export type FooEvent = EventEnvelope<"identity.profile.changed", FooPayload>;
`,
    });
    try {
      const result = runGuard(tmp);
      expect(result.exitCode).toBe(1);
      expect(result.stderr + result.stdout).toContain("bare `at` field");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
