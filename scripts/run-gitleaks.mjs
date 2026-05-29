/**
 * run-gitleaks — wrapper around the gitleaks CLI with two modes.
 *
 * Why a wrapper:
 *   - gitleaks is a Go binary that is NOT bundled with npm/pnpm. Developers
 *     install it once via Homebrew / a release download / `apt`, and CI
 *     installs it via the gitleaks/gitleaks-action step.
 *
 * Modes:
 *   - **Dev mode (default)**: if the binary is missing, log
 *     `GITLEAKS_BINARY_NOT_INSTALLED` loudly and exit 0. Lets a developer
 *     without the binary keep working — they are NOT covered by gitleaks,
 *     but the project-specific secret guards (`check-secret-scan.mjs`,
 *     `check-local-secret-scan.mjs`, `check-env-safety.mjs`,
 *     `check-diff-safety.mjs`) still scan their commits.
 *   - **Required mode**: pass `--required` or set `GITLEAKS_REQUIRED=1`.
 *     A missing binary BLOCKS with `GITLEAKS_REQUIRED_BUT_MISSING` and
 *     exit 2. CI's deep gate uses this mode so the report cannot claim
 *     PASS unless gitleaks actually ran. `pnpm tooling:redcase` also
 *     opts in to required mode.
 *
 * Either way, when the binary is on PATH it runs
 *   `gitleaks detect --config .gitleaks.toml --no-banner --redact --source .`
 * and exits with the binary's status — exit 1 on a finding fails the
 * build exactly like the custom regex guards do.
 *
 * Custom guards stay in place — see .gitleaks.toml header for the split.
 */
import { execSync, spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const REQUIRED =
  process.argv.includes("--required") ||
  process.env.GITLEAKS_REQUIRED === "1" ||
  process.env.GITLEAKS_REQUIRED === "true";

function hasBinary(name) {
  try {
    execSync(`${isWindows ? "where" : "which"} ${name}`, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

if (!hasBinary("gitleaks")) {
  if (REQUIRED) {
    console.error("GITLEAKS_REQUIRED_BUT_MISSING");
    console.error(
      "Required-mode is on (GITLEAKS_REQUIRED=1 or --required) but the gitleaks binary is not on PATH.",
    );
    console.error("Install gitleaks before running this gate:");
    console.error("  macOS:   brew install gitleaks");
    console.error("  Linux:   https://github.com/gitleaks/gitleaks/releases");
    console.error("  Windows: scoop install gitleaks   (or choco install gitleaks)");
    console.error("  CI:      uses the gitleaks/gitleaks-action step.");
    process.exit(2);
  }
  console.log("GITLEAKS_BINARY_NOT_INSTALLED");
  console.log(
    "gitleaks is not on PATH — local DEV gate skipped. Re-run with `--required` (or GITLEAKS_REQUIRED=1) to make this BLOCK instead of skip.",
  );
  console.log("Install locally:");
  console.log("  macOS:   brew install gitleaks");
  console.log("  Linux:   https://github.com/gitleaks/gitleaks/releases");
  console.log("  Windows: scoop install gitleaks   (or choco install gitleaks)");
  console.log(
    "The PlatformaX-specific secret guards (check-secret-scan.mjs, check-local-secret-scan.mjs, check-env-safety.mjs) still run from rules:check / pre-push.",
  );
  process.exit(0);
}

const result = spawnSync(
  "gitleaks",
  [
    "detect",
    "--config",
    ".gitleaks.toml",
    "--no-banner",
    "--redact",
    "--source",
    ".",
  ],
  { stdio: "inherit" },
);

if (result.status === 0) {
  console.log("GITLEAKS_PASS");
  process.exit(0);
}
console.error(`GITLEAKS_FAIL (exit ${result.status})`);
process.exit(result.status ?? 1);
