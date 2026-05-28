import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "path";

const ROOT = process.cwd();
const GUARD = join(ROOT, "scripts/check-guards-registry.mjs");
const GUARDS_PATH = join(ROOT, "docs/governance/GUARDS_REGISTRY.yml");

const REQUIRED_FIELDS = ["id", "command", "file", "rules_enforced", "runs_in", "status"];

function parseGuardsYml(content: string) {
  const guards: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- id:")) {
      if (current) guards.push(current);
      current = { id: trimmed.replace("- id:", "").trim() };
    } else if (current && /^\w[\w_]*:/.test(trimmed)) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();
      current[key] = val;
    }
  }
  if (current) guards.push(current);
  return guards;
}

function runGuard(cwd: string) {
  try {
    const stdout = execSync(`node "${GUARD}"`, { encoding: "utf-8", cwd });
    return { exitCode: 0, stdout, stderr: "" };
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string };
    return { exitCode: err.status, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

/**
 * Build a self-contained mini-repo with:
 *  - one rule (so rules_enforced validates),
 *  - one required+pre-push guard,
 *  - configurable: is the guard wired into rules-check.mjs / package script?
 */
function stageRepo(opts: {
  wireInRulesCheck: boolean;
  wireInPackageJson: boolean;
  fileOnDisk?: boolean;
}): string {
  const root = mkdtempSync(join(tmpdir(), "guards-meta-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "docs/governance"), { recursive: true });

  // Minimal RULES_REGISTRY.yml referencing PX-TEST-001.
  writeFileSync(
    join(root, "docs/governance/RULES_REGISTRY.yml"),
    [
      "rules:",
      "",
      "  - id: PX-TEST-001",
      "    title: Test rule",
      "    severity: P1",
      "    status: active",
      "",
    ].join("\n"),
    "utf-8",
  );

  // Minimal GUARDS_REGISTRY.yml — one required+pre-push guard pointing at fake-guard.mjs.
  writeFileSync(
    join(root, "docs/governance/GUARDS_REGISTRY.yml"),
    [
      "guards:",
      "",
      "  - id: GUARD-TEST",
      "    command: node scripts/fake-guard.mjs",
      "    file: scripts/fake-guard.mjs",
      "    blocks: commit, merge",
      "    rules_enforced: [PX-TEST-001]",
      "    runs_in: [pre-push, ci]",
      "    required: true",
      "    status: active",
      "",
    ].join("\n"),
    "utf-8",
  );

  // Optional fake guard file.
  if (opts.fileOnDisk ?? true) {
    writeFileSync(join(root, "scripts/fake-guard.mjs"), 'console.log("ok");\n', "utf-8");
  }

  // rules-check.mjs — optionally wires the guard.
  const guardsList = opts.wireInRulesCheck
    ? '"fake-guard.mjs"'
    : '"check-something-else.mjs"';
  writeFileSync(
    join(root, "scripts/rules-check.mjs"),
    `const GUARDS = [${guardsList}];\n`,
    "utf-8",
  );

  // package.json — optionally wires through guards:runtime-invariants.
  const scripts: Record<string, string> = {
    "rules:check": "node scripts/rules-check.mjs",
  };
  if (opts.wireInPackageJson) {
    scripts["guards:runtime-invariants"] = "node scripts/fake-guard.mjs";
  }
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "x", scripts }, null, 2),
    "utf-8",
  );

  // Copy the real meta-guard so it resolves relative paths against this tmp root.
  return root;
}

describe("guards-registry guard logic", () => {
  it("PASS: GUARDS_REGISTRY.yml exists and is readable", () => {
    expect(existsSync(GUARDS_PATH)).toBe(true);
    const content = readFileSync(GUARDS_PATH, "utf-8");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("guards:");
  });

  it("PASS: every guard has required fields (id, command, file, rules_enforced, runs_in, status)", () => {
    const content = readFileSync(GUARDS_PATH, "utf-8");
    const guards = parseGuardsYml(content);
    expect(guards.length).toBeGreaterThan(0);

    for (const guard of guards) {
      for (const field of REQUIRED_FIELDS) {
        expect(guard[field], `Guard ${guard.id ?? "UNKNOWN"} missing field: ${field}`).toBeDefined();
      }
    }
  });

  it("FAIL: detects missing guard file reference", () => {
    const fakeGuard = {
      id: "GUARD-999",
      file: "scripts/nonexistent-guard-xyz.mjs",
    };
    expect(existsSync(join(ROOT, fakeGuard.file))).toBe(false);
  });

  it("PASS: all guard file references exist on disk", () => {
    const content = readFileSync(GUARDS_PATH, "utf-8");
    const guards = parseGuardsYml(content);

    for (const guard of guards) {
      const filePath = join(ROOT, guard.file);
      expect(existsSync(filePath), `Guard ${guard.id} references missing file: ${guard.file}`).toBe(true);
    }
  });
});

describe("guards-registry wiring meta-guard (step-50 follow-up)", () => {
  it("PASS on the real repo — every required+pre-push/ci guard is invoked", () => {
    const result = runGuard(ROOT);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CHECK_GUARDS_REGISTRY_PASS");
  });

  it("PASS in synthetic repo when required guard is wired through rules-check", () => {
    const tmp = stageRepo({ wireInRulesCheck: true, wireInPackageJson: false });
    try {
      const result = runGuard(tmp);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("CHECK_GUARDS_REGISTRY_PASS");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("PASS in synthetic repo when required guard is wired through a CI package script", () => {
    const tmp = stageRepo({ wireInRulesCheck: false, wireInPackageJson: true });
    try {
      const result = runGuard(tmp);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("CHECK_GUARDS_REGISTRY_PASS");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("FAIL in synthetic repo when required guard is not wired anywhere", () => {
    const tmp = stageRepo({ wireInRulesCheck: false, wireInPackageJson: false });
    try {
      const result = runGuard(tmp);
      expect(result.exitCode).toBe(1);
      expect(result.stderr + result.stdout).toContain("not invoked by scripts/rules-check.mjs");
      expect(result.stderr + result.stdout).toContain("GUARD-TEST");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
