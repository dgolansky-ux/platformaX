import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_GUARDS = [
  "check-diff-safety.mjs",
  "check-fake-done.mjs",
  "check-no-legacy-imports.mjs",
  "check-removed-product-areas.mjs",
  "check-env-safety.mjs",
  "check-test-env-safety.mjs",
];

const PNPM_COMMANDS = [
  "pnpm check",
  "pnpm lint",
  "pnpm test",
  "pnpm build",
];

let failed = 0;

for (const guard of SCRIPT_GUARDS) {
  const script = join(__dirname, guard);
  try {
    execSync(`node "${script}"`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    console.log(`  PASS  ${guard}`);
  } catch (err) {
    console.error(`  FAIL  ${guard}`);
    if (err.stderr) console.error(err.stderr);
    failed++;
  }
}

for (const cmd of PNPM_COMMANDS) {
  try {
    execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], cwd: process.cwd() });
    console.log(`  PASS  ${cmd}`);
  } catch (err) {
    console.error(`  FAIL  ${cmd}`);
    if (err.stderr) console.error(err.stderr);
    failed++;
  }
}

console.log("");
if (failed > 0) {
  console.error(`COMMIT_BLOCKED (${failed} gate(s) failed)`);
  process.exit(1);
}

console.log("COMMIT_ALLOWED");
