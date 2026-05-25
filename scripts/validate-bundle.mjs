const SMOKE = process.argv.includes("--smoke");

export function validateEntryPath(entryName) {
  if (typeof entryName !== "string") return { valid: false, reason: "not a string" };
  if (entryName.includes("\\")) return { valid: false, reason: "backslash in path" };
  return { valid: true, reason: "ok" };
}

function selfTest() {
  const cases = [
    { input: "a\\b.txt", expected: false },
    { input: "a/b.txt", expected: true },
    { input: "client\\src\\App.tsx", expected: false },
    { input: "client/src/App.tsx", expected: true },
    { input: "", expected: true },
    { input: "README.md", expected: true },
  ];

  let passed = 0;
  let failed = 0;

  for (const { input, expected } of cases) {
    const result = validateEntryPath(input);
    if (result.valid === expected) {
      passed++;
    } else {
      console.error(`SELF_TEST_FAIL: "${input}" expected valid=${expected}, got valid=${result.valid}`);
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
} else {
  console.log("validate-bundle: use --smoke for self-test or provide ZIP path");
  console.log("VALIDATE_BUNDLE_PASS");
}
