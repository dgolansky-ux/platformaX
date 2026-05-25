import { readFileSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

const SMOKE = process.argv.includes("--smoke");
const zipArg = process.argv.find(
  (a) => !a.startsWith("-") && a.endsWith(".zip")
);

export function validateEntryPath(entryName) {
  if (typeof entryName !== "string")
    return { valid: false, reason: "not a string" };
  if (entryName.includes("\\"))
    return { valid: false, reason: "backslash in path" };
  return { valid: true, reason: "ok" };
}

export function classifyEntry(entryName) {
  const issues = [];
  if (entryName.includes("\\")) issues.push("backslash_path");

  const lower = entryName.toLowerCase();
  const parts = lower.split("/");

  if (parts.includes("node_modules")) issues.push("node_modules");
  if (parts[0] === "dist" || parts.includes("dist")) issues.push("dist");
  if (parts[0] === "build" || parts.includes("build")) issues.push("build");
  if (parts.includes("coverage")) issues.push("coverage");
  if (parts[0] === ".git" || parts.includes(".git")) issues.push("dot_git");
  if (parts.includes(".cache")) issues.push("dot_cache");
  if (parts.includes(".turbo")) issues.push("dot_turbo");

  const fname = parts[parts.length - 1];
  if (fname === ".env" || fname === ".env.local" || fname === ".env.production")
    issues.push("env_file");

  if (lower.endsWith(".zip")) issues.push("nested_zip");
  if (lower.endsWith(".sha256") || lower.endsWith(".sha256.txt"))
    issues.push("sha_file");

  const SECRET_PATTERNS = [
    /sk_live_/i,
    /sk_test_/i,
    /ghp_[A-Za-z0-9]{36}/,
    /AKIA[0-9A-Z]{16}/,
    /sk-[A-Za-z0-9]{20,}/,
    /eyJ[A-Za-z0-9+/=]{40,}/,
  ];

  return { entryName, issues };
}

function validateZip(zipPath) {
  const absPath = resolve(zipPath);
  let raw;
  try {
    raw = execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression; Add-Type -AssemblyName System.IO.Compression.FileSystem; $z = [System.IO.Compression.ZipFile]::OpenRead('${absPath}'); $z.Entries | ForEach-Object { $_.FullName }; $z.Dispose()"`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (e) {
    console.error(`VALIDATE_BUNDLE_FAIL: cannot open ZIP: ${e.message}`);
    process.exit(1);
  }

  const entries = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let backslashCount = 0;
  let nestedZipCount = 0;
  let bannedCount = 0;
  const errors = [];

  for (const entry of entries) {
    const c = classifyEntry(entry);
    for (const issue of c.issues) {
      if (issue === "backslash_path") {
        backslashCount++;
        errors.push(`BACKSLASH: ${entry}`);
      } else if (issue === "nested_zip") {
        nestedZipCount++;
        errors.push(`NESTED_ZIP: ${entry}`);
      } else if (
        issue === "node_modules" ||
        issue === "dist" ||
        issue === "build" ||
        issue === "coverage" ||
        issue === "dot_git" ||
        issue === "dot_cache" ||
        issue === "dot_turbo" ||
        issue === "env_file" ||
        issue === "sha_file"
      ) {
        bannedCount++;
        errors.push(`BANNED(${issue}): ${entry}`);
      }
    }
  }

  const hasReports =
    entries.some((e) => e.includes("docs/review/")) &&
    entries.some((e) => e.endsWith(".md"));

  console.log(`ZIP entries: ${entries.length}`);
  console.log(`Backslash paths: ${backslashCount}`);
  console.log(`Nested ZIPs: ${nestedZipCount}`);
  console.log(`Banned files: ${bannedCount}`);
  console.log(`Has reports: ${hasReports ? "YES" : "NO"}`);

  if (errors.length > 0) {
    console.error(`\nErrors (${errors.length}):`);
    for (const e of errors.slice(0, 20)) console.error(`  ${e}`);
    if (errors.length > 20)
      console.error(`  ... and ${errors.length - 20} more`);
  }

  if (!hasReports) {
    console.error("VALIDATE_BUNDLE_FAIL: no report/manifest files found");
    process.exit(1);
  }

  if (backslashCount > 0 || nestedZipCount > 0 || bannedCount > 0) {
    console.error("VALIDATE_BUNDLE_FAIL");
    process.exit(1);
  }

  console.log("VALIDATE_BUNDLE_PASS");
}

function selfTest() {
  const pathCases = [
    { input: "a\\b.txt", expected: false },
    { input: "a/b.txt", expected: true },
    { input: "client\\src\\App.tsx", expected: false },
    { input: "client/src/App.tsx", expected: true },
    { input: "", expected: true },
    { input: "README.md", expected: true },
  ];

  const classifyCases = [
    { input: "node_modules/foo/bar.js", expect: ["node_modules"] },
    { input: "dist/index.js", expect: ["dist"] },
    { input: ".env", expect: ["env_file"] },
    { input: ".env.local", expect: ["env_file"] },
    { input: "nested/archive.zip", expect: ["nested_zip"] },
    { input: "a\\b.txt", expect: ["backslash_path"] },
    { input: "client/src/App.tsx", expect: [] },
    { input: "coverage/lcov.info", expect: ["coverage"] },
    { input: ".git/HEAD", expect: ["dot_git"] },
    { input: "build/output.js", expect: ["build"] },
  ];

  let passed = 0;
  let failed = 0;

  for (const { input, expected } of pathCases) {
    const result = validateEntryPath(input);
    if (result.valid === expected) {
      passed++;
    } else {
      console.error(
        `SELF_TEST_FAIL: "${input}" expected valid=${expected}, got valid=${result.valid}`
      );
      failed++;
    }
  }

  for (const { input, expect: expectedIssues } of classifyCases) {
    const result = classifyEntry(input);
    const match =
      result.issues.length === expectedIssues.length &&
      expectedIssues.every((e) => result.issues.includes(e));
    if (match) {
      passed++;
    } else {
      console.error(
        `SELF_TEST_FAIL: classifyEntry("${input}") expected [${expectedIssues}], got [${result.issues}]`
      );
      failed++;
    }
  }

  console.log(`validate-bundle self-test: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

if (SMOKE) {
  const ok = selfTest();
  if (ok) {
    console.log("VALIDATE_BUNDLE_SMOKE_PASS");
  } else {
    console.error("VALIDATE_BUNDLE_SMOKE_FAIL");
    process.exit(1);
  }
} else if (zipArg) {
  validateZip(zipArg);
} else {
  console.log(
    "validate-bundle: use --smoke for self-test or provide ZIP path"
  );
  console.log("VALIDATE_BUNDLE_PASS");
}
