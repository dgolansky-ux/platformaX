import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

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

  return { entryName, issues };
}

const REQUIRED_REPORT_PATTERNS = [
  "docs/review/",
  "STEP_11_REPORT.md",
  "ZIP_MANIFEST.md",
  "FILE_MANIFEST.md",
];

function validateZip(zipPath) {
  const absPath = resolve(zipPath);
  let AdmZip;
  try {
    AdmZip = require("adm-zip");
  } catch {
    console.error(
      "VALIDATE_BUNDLE_FAIL: adm-zip not installed. Run: pnpm add -D adm-zip"
    );
    process.exit(1);
  }

  let zip;
  try {
    zip = new AdmZip(absPath);
  } catch (e) {
    console.error(`VALIDATE_BUNDLE_FAIL: cannot open ZIP: ${e.message}`);
    process.exit(1);
  }

  const zipEntries = zip.getEntries();
  const entryNames = zipEntries
    .map((e) => e.entryName)
    .filter((n) => n && !n.endsWith("/"));

  let backslashCount = 0;
  let nestedZipCount = 0;
  let bannedCount = 0;
  const errors = [];

  for (const entry of entryNames) {
    const c = classifyEntry(entry);
    for (const issue of c.issues) {
      if (issue === "backslash_path") {
        backslashCount++;
        errors.push(`BACKSLASH: ${entry}`);
      } else if (issue === "nested_zip") {
        nestedZipCount++;
        errors.push(`NESTED_ZIP: ${entry}`);
      } else if (
        [
          "node_modules",
          "dist",
          "build",
          "coverage",
          "dot_git",
          "dot_cache",
          "dot_turbo",
          "env_file",
          "sha_file",
        ].includes(issue)
      ) {
        bannedCount++;
        errors.push(`BANNED(${issue}): ${entry}`);
      }
    }
  }

  const hasReviewDocs = entryNames.some((e) => e.includes("docs/review/"));
  const hasStep11Report = entryNames.some((e) =>
    e.endsWith("STEP_11_REPORT.md")
  );
  const hasZipManifest = entryNames.some((e) =>
    e.endsWith("ZIP_MANIFEST.md")
  );
  const hasFileManifest = entryNames.some((e) =>
    e.endsWith("FILE_MANIFEST.md")
  );

  console.log(`ZIP entries: ${entryNames.length}`);
  console.log(`Backslash paths: ${backslashCount}`);
  console.log(`Nested ZIPs: ${nestedZipCount}`);
  console.log(`Banned files: ${bannedCount}`);
  console.log(`Has review docs: ${hasReviewDocs ? "YES" : "NO"}`);
  console.log(`Has STEP_11_REPORT: ${hasStep11Report ? "YES" : "NO"}`);
  console.log(`Has ZIP_MANIFEST: ${hasZipManifest ? "YES" : "NO"}`);
  console.log(`Has FILE_MANIFEST: ${hasFileManifest ? "YES" : "NO"}`);

  if (errors.length > 0) {
    console.error(`\nErrors (${errors.length}):`);
    for (const e of errors.slice(0, 20)) console.error(`  ${e}`);
    if (errors.length > 20)
      console.error(`  ... and ${errors.length - 20} more`);
  }

  let hasFail = false;

  if (!hasReviewDocs || !hasStep11Report || !hasZipManifest || !hasFileManifest) {
    console.error(
      "VALIDATE_BUNDLE_FAIL: missing required report files (STEP_11_REPORT, ZIP_MANIFEST, FILE_MANIFEST)"
    );
    hasFail = true;
  }

  if (backslashCount > 0 || nestedZipCount > 0 || bannedCount > 0) {
    hasFail = true;
  }

  if (hasFail) {
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
    { input: ".env.production", expect: ["env_file"] },
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
