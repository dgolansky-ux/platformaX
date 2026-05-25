import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GUARDS = [
  "audit-domain-boundaries.mjs",
  "check-no-legacy-imports.mjs",
  "check-removed-product-areas.mjs",
  "check-public-dto-pii.mjs",
  "check-media-base64.mjs",
  "check-pagination.mjs",
  "check-domain-registry.mjs",
  "check-domain-scaffold.mjs",
  "check-feature-registry.mjs",
];

let failed = 0;
const results = [];

for (const guard of GUARDS) {
  const script = join(__dirname, guard);
  try {
    const output = execSync(`node "${script}"`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    console.log(`  PASS  ${guard}`);
    results.push({ guard, status: "PASS" });
  } catch (err) {
    console.error(`  FAIL  ${guard}`);
    if (err.stderr) console.error(err.stderr);
    if (err.stdout) console.error(err.stdout);
    results.push({ guard, status: "FAIL" });
    failed++;
  }
}

console.log("");
if (failed > 0) {
  console.error(`arch-check-v2: ${failed}/${GUARDS.length} guard(s) FAILED`);
  process.exit(1);
}

console.log("ARCH_CHECK_V2_PASS");
